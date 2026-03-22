import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { getChatRoom } from "../../api/mentorApi";
import VideoCall from "../../components/VideoCall";
import { getMentorNavBase } from "../../utils/mentorNavBase";

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

export default function JobSeekerVideoCall() {
  const navBase = getMentorNavBase();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callStarted, setCallStarted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const getOtherUser = useCallback((room, uid) => {
    if (!room) return null;
    const jid = userIdFromRef(room.jobseeker);
    const mid = userIdFromRef(room.mentor);
    const id = uid ? String(uid) : "";
    if (!id) return room.jobseeker || room.mentor;
    if (jid && jid === id) return room.mentor;
    if (mid && mid === id) return room.jobseeker;
    return room.jobseeker || room.mentor;
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        let userId = null;
        const userResponse = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (userResponse.ok) {
          userId = extractUserId(await userResponse.json());
        }
        if (!userId) {
          const authRes = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          });
          if (authRes.ok) userId = extractUserId(await authRes.json());
        }
        if (userId) setCurrentUserId(userId);

        const roomId = searchParams.get("room");
        if (roomId) {
          const roomData = await getChatRoom(roomId);
          const room = roomData.chatRoom;
          setSelectedRoom(room);
          setOtherUser(getOtherUser(room, userId));
        }
      } catch (error) {
        console.error("Error loading video call data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchParams, getOtherUser]);

  const startCall = () => {
    setCallStarted(true);
  };

  const handleCallEnd = () => {
    setCallStarted(false);
    navigate(`${navBase}/mentor-chats?room=${selectedRoom?._id}`);
  };

  const dashPath =
    navBase === "/startup"
      ? "/startup/dashboard"
      : navBase === "/investor"
        ? "/investor/dashboard"
        : "/jobseeker/dashboard";

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#050818] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-600 border-t-sky-400 mx-auto mb-4" />
          <div className="text-slate-400 text-sm">Loading video call…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050818] text-slate-200">
      {/* Sidebar — matches dashboard */}
      <div className="w-64 shrink-0 border-r border-slate-800/80 bg-[#0a1020] flex flex-col">
        <div className="p-6 border-b border-slate-800/80">
          <h1 className="text-lg font-bold tracking-tight text-white">
            Hire<span className="text-sky-400">Me</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Mentorship</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <Link
            to={dashPath}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
          >
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <span>Dashboard</span>
          </Link>
          <Link
            to={`${navBase}/mentor-chats`}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
          >
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Mentor Chats</span>
          </Link>
          <Link
            to={`${navBase}/video-call`}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-sky-600/30 to-indigo-600/25 text-sky-200 border border-sky-500/30"
          >
            <svg
              className="w-5 h-5 text-sky-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Video Call</span>
          </Link>
        </nav>
      </div>

      {/* Main */}
      <div
        className="flex-1 flex flex-col min-h-0"
        style={{ height: "100vh", overflow: "hidden" }}
      >
        {selectedRoom ? (
          <>
            <div className="shrink-0 border-b border-slate-800/80 bg-[#0a1020]/90 backdrop-blur px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 ring-2 ring-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                    {otherUser?.avatarUrl ? (
                      <img
                        src={otherUser.avatarUrl}
                        alt={otherUser.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sky-300 font-semibold text-lg">
                        {otherUser?.fullName?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">
                      {otherUser?.fullName || "Participant"}
                    </div>
                    <div className="text-xs text-slate-500">Video session</div>
                  </div>
                </div>
                <Link
                  to={`${navBase}/mentor-chats?room=${selectedRoom._id}`}
                  className="text-sm font-medium text-sky-400 hover:text-sky-300 shrink-0"
                >
                  ← Back to Chat
                </Link>
              </div>
            </div>

            <div
              className="flex-1 bg-[#050818] relative min-h-0"
              style={{ height: "100%", minHeight: 0 }}
            >
              {!callStarted ? (
                <div className="flex items-center justify-center h-full p-8">
                  <div className="text-center max-w-md">
                    <div className="mb-8">
                      <div className="w-36 h-36 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 ring-2 ring-slate-700 flex items-center justify-center overflow-hidden shadow-xl shadow-black/40">
                        {otherUser?.avatarUrl ? (
                          <img
                            src={otherUser.avatarUrl}
                            alt={otherUser.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-5xl text-sky-400/90 font-semibold">
                            {otherUser?.fullName?.charAt(0)?.toUpperCase() ||
                              "?"}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-semibold text-white mb-2">
                        Ready to connect?
                      </h2>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        Start a video call with{" "}
                        <span className="text-slate-200">
                          {otherUser?.fullName || "your peer"}
                        </span>
                        . Make sure your camera and microphone are allowed in
                        the browser.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={startCall}
                      className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-lg shadow-sky-900/40 transition"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Start Video Call
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full" style={{ height: "100%" }}>
                  <VideoCall
                    roomId={selectedRoom._id}
                    onCallEnd={handleCallEnd}
                    currentUserId={currentUserId}
                    otherUser={otherUser}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center rounded-2xl border border-slate-800/80 bg-[#0a1020]/50 px-10 py-12 max-w-md">
              <div className="text-slate-300 font-medium mb-2">
                No room selected
              </div>
              <div className="text-sm text-slate-500 mb-6">
                Open mentor chats and pick a conversation, or add{" "}
                <code className="text-sky-400/90">?room=...</code> to the URL.
              </div>
              <Link
                to={`${navBase}/mentor-chats`}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 transition"
              >
                Go to Mentor Chats
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
