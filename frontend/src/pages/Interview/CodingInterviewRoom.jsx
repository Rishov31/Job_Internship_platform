import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";
import VideoCall from "../../components/VideoCall";
import { getInterviewSession, updateInterviewSessionStatus } from "../../api/interviewApi";

const DEFAULT_CODE = `// Collaborative coding interview\nfunction solve() {\n  return 0;\n}\n`;

/**
 * Run user JavaScript in-browser with a stubbed console (no network/fs).
 * If `solve` is defined, it is invoked once and the return value is logged.
 */
function runJavaScriptInBrowser(src) {
  const lines = [];
  const capture = (...args) => {
    lines.push(
      args
        .map((a) => {
          try {
            if (typeof a === "object" && a !== null) return JSON.stringify(a);
            return String(a);
          } catch {
            return String(a);
          }
        })
        .join(" ")
    );
  };
  const fakeConsole = {
    log: capture,
    error: (...a) => capture("[error]", ...a),
    warn: (...a) => capture("[warn]", ...a),
    info: capture,
  };
  const tail =
    "\n;if (typeof solve === 'function') { try { console.log(solve()); } catch (e) { console.error(e.message); } }";
  try {
    const fn = new Function("console", `"use strict";\n${src}${tail}`);
    fn(fakeConsole);
  } catch (e) {
    lines.push(`Error: ${e.message}`);
  }
  return lines.length ? lines.join("\n") : "(no output)";
}

export default function CodingInterviewRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState("javascript");
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [terminalOutput, setTerminalOutput] = useState("");
  const socketRef = useRef(null);
  const ignoreRemoteRef = useRef(false);
  const debounceRef = useRef(null);
  const currentUserId = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u.id || "";
    } catch {
      return "";
    }
  }, []);
  const displayName = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u.fullName || "User";
    } catch {
      return "User";
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getInterviewSession(sessionId);
        if (cancelled) return;
        setSession(data.session);
        await updateInterviewSessionStatus(sessionId, "in_progress").catch(() => {});
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load interview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    const socket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-interview-room", sessionId);
    });

    socket.on("interview-editor-remote", (payload) => {
      if (!payload || typeof payload !== "object") return;
      if (payload.fromUserId === currentUserId) return;
      ignoreRemoteRef.current = true;
      if (payload.code != null) setCode(payload.code);
      if (payload.language) setLanguage(payload.language);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        ignoreRemoteRef.current = false;
      }, 50);
    });

    socket.on("interview-chat-broadcast", (msg) => {
      if (!msg) return;
      setChat((c) => [...c, msg]);
    });

    socket.on("interview-terminal-remote", ({ output, fromName }) => {
      if (output == null) return;
      setTerminalOutput(
        (prev) =>
          `${prev ? `${prev}\n\n` : ""}— ${fromName || "Partner"} ran —\n${output}`
      );
    });

    return () => {
      socket.emit("leave-interview-room", sessionId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId, currentUserId]);

  const broadcastCode = useCallback(
    (nextCode, lang) => {
      const s = socketRef.current;
      if (!s || !sessionId) return;
      s.emit("interview-editor-change", {
        roomId: sessionId,
        payload: {
          code: nextCode,
          language: lang,
          fromUserId: currentUserId,
        },
      });
    },
    [sessionId, currentUserId]
  );

  const handleEditorChange = useCallback(
    (value) => {
      const v = value ?? "";
      if (ignoreRemoteRef.current) return;
      setCode(v);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        broadcastCode(v, language);
      }, 120);
    },
    [broadcastCode, language]
  );

  const handleRunCode = useCallback(() => {
    let out = "";
    if (language === "javascript" || language === "typescript") {
      if (language === "typescript") {
        out =
          "// Note: TypeScript is executed as JavaScript here (types are not checked).\n\n" +
          runJavaScriptInBrowser(code);
      } else {
        out = runJavaScriptInBrowser(code);
      }
    } else {
      out =
        "In-browser Run supports JavaScript (and TypeScript as loose JS).\n" +
        "Switch the language to JavaScript to execute here, or run Python/Java/C++ in your local IDE.";
    }
    setTerminalOutput((prev) => (prev ? `${prev}\n\n— You ran —\n${out}` : `— You ran —\n${out}`));
    const s = socketRef.current;
    if (s && sessionId) {
      s.emit("interview-terminal-run", {
        roomId: sessionId,
        output: out,
        fromName: displayName,
      });
    }
  }, [code, language, sessionId, displayName]);

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text || !socketRef.current || !sessionId) return;
    const msg = {
      text,
      userId: currentUserId,
      name: displayName,
      ts: Date.now(),
    };
    socketRef.current.emit("interview-chat", { roomId: sessionId, message: msg });
    setChatInput("");
  };

  const handleCallEnd = async () => {
    try {
      await updateInterviewSessionStatus(sessionId, "completed");
    } catch {
      /* ignore */
    }
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050818] flex items-center justify-center text-slate-400">
        Loading interview…
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#050818] flex flex-col items-center justify-center text-slate-300 px-4">
        <p className="text-red-400 mb-4">{error || "Session not found"}</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sky-400 underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const job = session.job;
  const otherUser =
    session.employer?._id?.toString() === currentUserId
      ? session.student
      : session.employer;

  return (
    <div className="h-screen flex flex-col bg-[#050818] text-slate-100 overflow-hidden">
      <header className="shrink-0 border-b border-slate-800 px-4 py-2 flex items-center justify-between bg-slate-950/90">
        <div>
          <p className="text-xs text-slate-500">Coding interview</p>
          <p className="text-sm font-semibold text-slate-100">
            {job?.title || "Job"} · {job?.company || ""}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCallEnd}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          Leave & exit
        </button>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Video ~2/3 */}
        <div className="w-2/3 min-w-0 border-r border-slate-800 relative min-h-0">
          <div className="absolute inset-0">
            <VideoCall
              roomId={sessionId}
              onCallEnd={handleCallEnd}
              currentUserId={currentUserId}
              otherUser={otherUser}
            />
          </div>
        </div>

        {/* Editor + terminal + chat ~1/3 — editor gets most vertical space */}
        <div className="w-1/3 flex flex-col min-w-0 min-h-0 bg-slate-950 h-full">
          <div className="shrink-0 flex flex-wrap items-center gap-2 px-2 py-1.5 border-b border-slate-800/80">
            <select
              value={language}
              onChange={(e) => {
                const lang = e.target.value;
                setLanguage(lang);
                broadcastCode(code, lang);
              }}
              className="text-xs bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
            <button
              type="button"
              onClick={handleRunCode}
              className="text-xs px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              Run
            </button>
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              JS runs in your browser; partner sees output.
            </span>
          </div>
          <div className="flex-1 min-h-0 border-b border-slate-800">
            <Editor
              height="100%"
              theme="vs-dark"
              language={language}
              value={code}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: "on",
                scrollBeyondLastLine: false,
              }}
            />
          </div>
          <div className="shrink-0 flex flex-col border-b border-slate-800 bg-black/40 max-h-[28vh]">
            <div className="flex items-center justify-between px-2 py-1 bg-slate-900/90 border-b border-slate-800/80 shrink-0">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Terminal</p>
              <button
                type="button"
                onClick={() => setTerminalOutput("")}
                className="text-[10px] text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            </div>
            <pre className="overflow-y-auto px-2 py-2 text-[11px] leading-relaxed text-emerald-400/95 font-mono whitespace-pre-wrap break-words min-h-[5rem] max-h-[22vh]">
              {terminalOutput || "Output will appear here after Run."}
            </pre>
          </div>
          <div className="shrink-0 flex flex-col min-h-0 max-h-[20vh] border-t border-slate-800/80">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 px-2 py-1 bg-slate-900/80 shrink-0">
              Chat
            </p>
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1 space-y-1 text-xs">
              {chat.map((m, i) => (
                <div key={i} className="text-slate-300">
                  <span className="text-sky-400 font-medium">{m.name || "User"}:</span>{" "}
                  {m.text}
                </div>
              ))}
            </div>
            <div className="flex gap-1 p-2 border-t border-slate-800">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="Message…"
                className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-200"
              />
              <button
                type="button"
                onClick={sendChat}
                className="px-2 py-1 rounded bg-sky-600 text-white text-xs"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
