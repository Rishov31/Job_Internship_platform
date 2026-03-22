import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { getMyChatRooms, getMessages, sendMessage } from "../../api/mentorApi";
import { getMentorNavBase } from "../../utils/mentorNavBase";

/** API may return { id } or { user: { _id } } */
function extractUserId(data) {
  if (!data) return null;
  if (data.id != null) return String(data.id);
  if (data._id != null) return String(data._id);
  if (data.user) {
    const u = data.user;
    if (u._id != null) return String(u._id);
    if (u.id != null) return String(u.id);
  }
  return null;
}

function userIdFromRef(ref) {
  if (ref == null) return "";
  if (typeof ref === "string" || typeof ref === "number") return String(ref);
  if (ref._id != null) return String(ref._id);
  return String(ref);
}

export default function JobSeekerMentorChats() {
  const navBase = getMentorNavBase();
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);

  const getOtherUser = useCallback(
    (room) => {
      if (!room) return null;
      const jid = userIdFromRef(room.jobseeker);
      const mid = userIdFromRef(room.mentor);
      const uid = currentUserId ? String(currentUserId) : "";
      if (!uid) {
        return room.jobseeker || room.mentor;
      }
      if (jid && jid === uid) return room.mentor;
      if (mid && mid === uid) return room.jobseeker;
      return room.jobseeker || room.mentor;
    },
    [currentUserId]
  );

  /** True when logged-in user is the mentor side of the room (founder / platform mentor / investor) */
  const isMentorSide = useCallback(
    (room) => {
      if (!room || !currentUserId) return false;
      return userIdFromRef(room.mentor) === String(currentUserId);
    },
    [currentUserId]
  );

  const myUnreadKey = useCallback(
    (room) => {
      if (!room || !currentUserId) return 0;
      return isMentorSide(room) ? room.unreadCountMentor : room.unreadCountJobseeker;
    },
    [currentUserId, isMentorSide]
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    (async () => {
      try {
        setLoading(true);
        let id = null;
        const meRes = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.ok) {
          id = extractUserId(await meRes.json());
        }
        if (!id) {
          const authRes = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (authRes.ok) id = extractUserId(await authRes.json());
        }
        if (id) setCurrentUserId(id);

        const data = await getMyChatRooms();
        setChatRooms(data.chatRooms || []);
        if (data.chatRooms?.length) setSelectedRoom(data.chatRooms[0]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom._id);
      const interval = setInterval(() => {
        fetchMessages(selectedRoom._id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChatRooms = async () => {
    try {
      const data = await getMyChatRooms();
      setChatRooms(data.chatRooms || []);
      if (data.chatRooms && data.chatRooms.length > 0 && !selectedRoom) {
        setSelectedRoom(data.chatRooms[0]);
      }
    } catch (e) {
      console.error("Failed to fetch chat rooms:", e);
    }
  };

  const fetchMessages = async (roomId) => {
    try {
      const data = await getMessages(roomId);
      setMessages(data.messages || []);
    } catch (e) {
      console.error("Failed to fetch messages:", e);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      await sendMessage(selectedRoom._id, newMessage);
      setNewMessage("");
      await fetchMessages(selectedRoom._id);
      await fetchChatRooms();
    } catch (err) {
      alert(err.message || "Failed to send message");
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const senderId = (msg) => {
    const s = msg.sender;
    if (!s) return "";
    if (typeof s === "string" || typeof s === "number") return String(s);
    return String(s._id || s.id || "");
  };

  const isMyMessage = (msg) => {
    if (!currentUserId) return false;
    return senderId(msg) === String(currentUserId);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#050818] items-center justify-center text-slate-400 text-sm">
        Loading chats…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050818] text-slate-100">
      {/* Rooms list */}
      <div className="w-80 md:w-96 flex flex-col border-r border-slate-800/80 bg-[#050818]">
        <div className="p-4 border-b border-slate-800/80">
          <h2 className="text-sm font-semibold text-slate-50 tracking-tight">Mentor chats</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {currentUserId ? "Conversations" : "Loading profile…"}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chatRooms.length === 0 ? (
            <div className="p-6 text-center text-[11px] text-slate-500">
              No conversations yet. Book a session and complete payment to open chat.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {chatRooms.map((room) => {
                const otherUser = getOtherUser(room);
                const isSelected = selectedRoom?._id === room._id;
                const unread = myUnreadKey(room);
                return (
                  <button
                    key={room._id}
                    type="button"
                    onClick={() => setSelectedRoom(room)}
                    className={`w-full p-4 text-left transition ${
                      isSelected
                        ? "bg-slate-900/90 border-l-4 border-sky-500"
                        : "hover:bg-slate-900/60 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white shadow-lg shadow-sky-500/20">
                        {otherUser?.avatarUrl ? (
                          <img
                            src={otherUser.avatarUrl}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span>
                            {(otherUser?.fullName || "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-100 text-sm truncate">
                          {otherUser?.fullName || "Unknown"}
                        </div>
                        {room.lastMessage && (
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {room.lastMessage.content}
                          </div>
                        )}
                        {room.lastMessageAt && (
                          <div className="text-[10px] text-slate-600 mt-1">
                            {formatTime(room.lastMessageAt)}
                          </div>
                        )}
                      </div>
                      {unread > 0 && (
                        <div className="bg-sky-500 text-white text-[10px] font-semibold rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center flex-shrink-0">
                          {unread}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#050818] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),transparent_50%)]">
        {selectedRoom ? (
          <>
            <div className="border-b border-slate-800/80 px-4 py-3 bg-slate-900/50 backdrop-blur shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-sm font-semibold text-white shrink-0">
                    {getOtherUser(selectedRoom)?.avatarUrl ? (
                      <img
                        src={getOtherUser(selectedRoom).avatarUrl}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span>
                        {(getOtherUser(selectedRoom)?.fullName || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-50 truncate text-sm">
                      {getOtherUser(selectedRoom)?.fullName || "Unknown"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isMentorSide(selectedRoom) ? "Student" : "Mentor"}
                    </div>
                  </div>
                </div>
                <Link
                  to={`${navBase}/video-call?room=${selectedRoom._id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600/90 text-white text-xs font-semibold hover:bg-emerald-500 shrink-0 shadow-lg shadow-emerald-900/30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Video
                </Link>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-[11px] text-slate-500 mt-12">
                  No messages yet. Say hello below.
                </div>
              ) : (
                messages.map((msg) => {
                  const mine = isMyMessage(msg);
                  return (
                    <div
                      key={msg._id}
                      className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-md px-3 py-2 rounded-2xl text-sm ${
                          mine
                            ? "bg-gradient-to-br from-sky-600 to-indigo-600 text-white rounded-br-md shadow-lg shadow-sky-900/40"
                            : "bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-bl-md"
                        }`}
                      >
                        <div className="break-words">{msg.content}</div>
                        <div
                          className={`text-[10px] mt-1 ${
                            mine ? "text-sky-100/80" : "text-slate-500"
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-slate-800/80 p-3 bg-slate-900/80 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-500 transition-colors shadow-lg shadow-sky-900/40"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-slate-500 text-sm max-w-xs">
              Select a conversation or book a mentoring session to start.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
