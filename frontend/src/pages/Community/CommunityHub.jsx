import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { io } from "socket.io-client";
import { me } from "../../api/authApi";
import {
  fetchCommunityMessages,
  postCommunityMessage,
  reactToMessage,
  fetchDmConversations,
  getOrCreateDm,
  fetchDmMessages,
  sendDmMessage,
} from "../../api/communityApi";

function formatTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function CommunityHub() {
  const navigate = useNavigate();
  const outlet = useOutletContext();
  const [authUser, setAuthUser] = useState(outlet?.authUser || null);
  const [loadingAuth, setLoadingAuth] = useState(!outlet?.authUser);

  const [tab, setTab] = useState("community");
  const [messages, setMessages] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadMoreBusy, setLoadMoreBusy] = useState(false);
  const [text, setText] = useState("");
  const [asIdea, setAsIdea] = useState(false);
  const [error, setError] = useState("");

  const [dmList, setDmList] = useState([]);
  const [dmLoading, setDmLoading] = useState(false);
  const [activeDmId, setActiveDmId] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [dmText, setDmText] = useState("");

  const socketRef = useRef(null);
  const activeDmIdRef = useRef(null);
  const bottomRef = useRef(null);
  const dmBottomRef = useRef(null);

  activeDmIdRef.current = activeDmId;

  const role = authUser?.role;
  const isStudent = role === "jobseeker";
  const isStartup = role === "employer";

  useEffect(() => {
    if (outlet?.authUser) {
      setAuthUser(outlet.authUser);
      setLoadingAuth(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const u = await me();
      if (cancelled) return;
      if (!u) {
        navigate("/login");
        return;
      }
      if (u.role !== "jobseeker" && u.role !== "employer") {
        navigate("/");
        return;
      }
      setAuthUser(u);
      setLoadingAuth(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, outlet?.authUser]);

  const loadCommunity = useCallback(async (before) => {
    setError("");
    const data = await fetchCommunityMessages(before);
    const incoming = data.messages || [];
    if (before) {
      setMessages((prev) => [...incoming, ...prev]);
    } else {
      setMessages(incoming);
    }
  }, []);

  useEffect(() => {
    if (!authUser || loadingAuth) return;
    setLoadingFeed(true);
    loadCommunity()
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoadingFeed(false));
  }, [authUser, loadingAuth, loadCommunity]);

  useEffect(() => {
    if (!authUser?.id) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io("/community", {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("community-message", ({ message: m }) => {
      if (!m?._id) return;
      setMessages((prev) => {
        if (prev.some((x) => x._id === m._id)) return prev;
        return [...prev, m];
      });
    });

    socket.on("community-reaction", ({ message: m }) => {
      if (!m?._id) return;
      setMessages((prev) =>
        prev.map((x) => (x._id === m._id ? { ...m, reactionSummary: m.reactionSummary } : x))
      );
    });

    socket.on("dm-message", ({ message: m, conversationId }) => {
      if (!m?._id) return;
      const cid = String(conversationId);
      setDmMessages((prev) => {
        if (cid !== String(activeDmIdRef.current)) return prev;
        if (prev.some((x) => x._id === m._id)) return prev;
        return [...prev, m];
      });
      setDmList((list) =>
        list.map((c) =>
          String(c._id) === cid
            ? { ...c, lastMessage: m, lastMessageAt: m.createdAt }
            : c
        )
      );
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [authUser?.id]);

  useEffect(() => {
    const s = socketRef.current;
    if (!s || !activeDmId) return;
    s.emit("join-dm", String(activeDmId));
    return () => {
      s.emit("leave-dm", String(activeDmId));
    };
  }, [activeDmId]);

  useEffect(() => {
    if (tab !== "dm" || !authUser) return;
    setDmLoading(true);
    fetchDmConversations()
      .then((d) => setDmList(d.conversations || []))
      .catch((e) => setError(e.message))
      .finally(() => setDmLoading(false));
  }, [tab, authUser]);

  useEffect(() => {
    if (!activeDmId) {
      setDmMessages([]);
      return;
    }
    fetchDmMessages(activeDmId)
      .then((d) => setDmMessages(d.messages || []))
      .catch((e) => setError(e.message));
  }, [activeDmId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    dmBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dmMessages.length, activeDmId]);

  const oldestTs = useMemo(() => {
    if (!messages.length) return null;
    return messages[0]?.createdAt;
  }, [messages]);

  const mergeReactionSummary = (msg) => {
    if (msg.reactionSummary) return msg;
    const like = [];
    const love = [];
    for (const r of msg.reactions || []) {
      const id = r.user?._id?.toString?.() || r.user?.toString?.() || String(r.user);
      if (r.type === "like") like.push(id);
      if (r.type === "love") love.push(id);
    }
    return { ...msg, reactionSummary: { like, love } };
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const data = await postCommunityMessage(text.trim(), isStudent && asIdea);
      const m = data?.message;
      if (m?._id) {
        setMessages((prev) =>
          prev.some((x) => x._id === m._id) ? prev : [...prev, mergeReactionSummary(m)]
        );
      }
      setText("");
      setAsIdea(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReact = async (messageId, type) => {
    try {
      const { message: m } = await reactToMessage(messageId, type);
      const merged = mergeReactionSummary(m);
      setMessages((prev) => prev.map((x) => (x._id === merged._id ? merged : x)));
    } catch (err) {
      setError(err.message);
    }
  };

  const openDmWith = async (peerId) => {
    try {
      setError("");
      const { conversation } = await getOrCreateDm(peerId);
      setTab("dm");
      setActiveDmId(conversation._id);
      const list = await fetchDmConversations();
      setDmList(list.conversations || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendDm = async (e) => {
    e.preventDefault();
    if (!activeDmId || !dmText.trim()) return;
    try {
      const data = await sendDmMessage(activeDmId, dmText.trim());
      setDmText("");
      const m = data?.message;
      if (m?._id) {
        setDmMessages((prev) =>
          prev.some((x) => x._id === m._id) ? prev : [...prev, m]
        );
      } else {
        const d = await fetchDmMessages(activeDmId);
        setDmMessages(d.messages || []);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadOlder = async () => {
    if (!oldestTs || loadMoreBusy) return;
    setLoadMoreBusy(true);
    try {
      await loadCommunity(oldestTs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadMoreBusy(false);
    }
  };

  if (loadingAuth || !authUser) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  const myId = authUser.id;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Community</h1>
        <p className="text-sm text-slate-400 mt-1">
          Share ideas with students and startups, react to messages, and chat privately
          one-to-one between a startup and a student.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setTab("community")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === "community"
              ? "bg-indigo-600 text-white"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800"
          }`}
        >
          General chat
        </button>
        <button
          type="button"
          onClick={() => setTab("dm")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === "dm"
              ? "bg-indigo-600 text-white"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800"
          }`}
        >
          Direct messages
        </button>
      </div>

      {tab === "community" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-2xl border border-slate-700/80 bg-slate-900/60 flex flex-col min-h-[480px] max-h-[70vh]">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-100">Startup ideas & discussion</p>
                <p className="text-[11px] text-slate-500">Visible to all students and startups</p>
              </div>
              {oldestTs && (
                <button
                  type="button"
                  onClick={loadOlder}
                  disabled={loadMoreBusy}
                  className="text-xs text-indigo-300 hover:text-indigo-200 disabled:opacity-50"
                >
                  {loadMoreBusy ? "Loading…" : "Load older"}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {loadingFeed && (
                <p className="text-sm text-slate-500 text-center py-8">Loading messages…</p>
              )}
              {!loadingFeed && messages.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">
                  No messages yet — say hello and share an idea.
                </p>
              )}
              {messages.map((m) => {
                const merged = mergeReactionSummary(m);
                const sender = m.sender;
                const sid = sender?._id?.toString?.() || sender;
                const isSelf = sid === myId;
                const rs = merged.reactionSummary || { like: [], love: [] };
                const liked = rs.like?.includes(myId);
                const loved = rs.love?.includes(myId);

                return (
                  <div
                    key={m._id}
                    className={`rounded-xl px-3 py-2 border ${
                      m.isIdea
                        ? "border-amber-500/35 bg-amber-500/5"
                        : "border-slate-700/60 bg-slate-950/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-100">
                            {sender?.fullName || "User"}
                          </span>
                          <span className="text-[10px] uppercase tracking-wide text-slate-500">
                            {sender?.role === "employer" ? "Startup" : "Student"}
                          </span>
                          {m.isIdea && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200">
                              Idea
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{formatTime(m.createdAt)}</p>
                      </div>
                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => openDmWith(sid)}
                          className="shrink-0 text-[11px] px-2 py-1 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                          {isStartup && sender?.role === "jobseeker"
                            ? "Message student"
                            : isStudent && sender?.role === "employer"
                              ? "Message startup"
                              : "Private chat"}
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-200 whitespace-pre-wrap mt-2">{m.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => handleReact(m._id, "like")}
                        className={`text-xs flex items-center gap-1 ${
                          liked ? "text-sky-300" : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <span>👍</span>
                        <span>{rs.like?.length || 0}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReact(m._id, "love")}
                        className={`text-xs flex items-center gap-1 ${
                          loved ? "text-pink-300" : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <span>❤️</span>
                        <span>{rs.love?.length || 0}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="p-4 border-t border-slate-800 space-y-2"
            >
              {isStudent && (
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={asIdea}
                    onChange={(e) => setAsIdea(e.target.checked)}
                    className="rounded border-slate-600"
                  />
                  Mark as startup idea (students only)
                </label>
              )}
              <div className="flex gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write a message…"
                  rows={2}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <button
                  type="submit"
                  className="self-end px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500"
                >
                  Send
                </button>
              </div>
            </form>
          </section>

          <aside className="rounded-2xl border border-slate-700/80 bg-slate-900/40 p-4 h-fit">
            <p className="text-sm font-semibold text-slate-100">How it works</p>
            <ul className="mt-3 text-xs text-slate-400 space-y-2 list-disc list-inside">
              <li>Everyone in this room is a verified student or startup on the platform.</li>
              <li>Students can tag posts as an “idea” to highlight pitches.</li>
              <li>Use Like and Love on any message — tap again to remove your reaction.</li>
              <li>
                Use “Message student” or “Message startup” to open a private chat with that
                person.
              </li>
            </ul>
          </aside>
        </div>
      )}

      {tab === "dm" && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-h-[420px] max-h-[70vh]">
          <div className="md:col-span-2 rounded-2xl border border-slate-700/80 bg-slate-900/60 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-800 text-sm font-medium text-slate-200">
              Conversations
            </div>
            <div className="flex-1 overflow-y-auto">
              {dmLoading && (
                <p className="text-xs text-slate-500 p-3">Loading…</p>
              )}
              {!dmLoading && dmList.length === 0 && (
                <p className="text-xs text-slate-500 p-3">
                  No direct threads yet. Open one from the general chat using “Message student” or
                  “Message startup”.
                </p>
              )}
              {dmList.map((c) => {
                const other =
                  isStartup
                    ? c.student
                    : c.startup;
                const active = String(c._id) === String(activeDmId);
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => setActiveDmId(c._id)}
                    className={`w-full text-left px-3 py-2 border-b border-slate-800/80 hover:bg-slate-800/50 ${
                      active ? "bg-slate-800/70" : ""
                    }`}
                  >
                    <p className="text-sm text-slate-100 truncate">
                      {other?.fullName || "Chat"}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {c.lastMessage?.content || "No messages yet"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-3 rounded-2xl border border-slate-700/80 bg-slate-900/60 flex flex-col">
            {!activeDmId && (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-500 p-6">
                Select a conversation or start one from the general chat.
              </div>
            )}
            {activeDmId && (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                  {dmMessages.map((m) => {
                    const sid = m.sender?._id?.toString?.() || m.sender;
                    const self = sid === myId;
                    return (
                      <div
                        key={m._id}
                        className={`flex ${self ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                            self
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-800 text-slate-100 border border-slate-700"
                          }`}
                        >
                          {!self && (
                            <p className="text-[10px] opacity-80 mb-1">
                              {m.sender?.fullName}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              self ? "text-indigo-100" : "text-slate-500"
                            }`}
                          >
                            {formatTime(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={dmBottomRef} />
                </div>
                <form onSubmit={handleSendDm} className="p-3 border-t border-slate-800 flex gap-2">
                  <input
                    value={dmText}
                    onChange={(e) => setDmText(e.target.value)}
                    placeholder="Type a direct message…"
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-100"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium"
                  >
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
