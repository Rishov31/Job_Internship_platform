import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { getChatRoom } from "../../api/mentorApi";
import VideoCall from "../../components/VideoCall";

export default function MentorVideoCall() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callStarted, setCallStarted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        
        // Get current user
        const userResponse = await fetch(`${API_BASE}/users/me`, { 
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        
        let userId = null;
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.user?._id) {
            userId = userData.user._id;
            setCurrentUserId(userId);
          }
        }

        // Get room data
        const roomId = searchParams.get("room");
        if (roomId) {
          const roomData = await getChatRoom(roomId);
          const room = roomData.chatRoom;
          setSelectedRoom(room);
          
          // Determine other user (jobseeker for mentor)
          // The mentor is stored in room.mentor (populated User)
          if (room.mentor?._id?.toString() === userId?.toString() || room.mentor?.toString() === userId?.toString()) {
            setOtherUser(room.jobseeker);
          } else {
            setOtherUser(room.mentor);
          }
        }
      } catch (error) {
        console.error('Error loading video call data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchParams]);

  const startCall = () => {
    setCallStarted(true);
  };

  const handleCallEnd = () => {
    setCallStarted(false);
    navigate(`/mentor/chat?room=${selectedRoom?._id}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">Hirefly.</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/mentor/dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            <span>Dashboard</span>
          </Link>
          <Link to="/mentor/chat" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Chat</span>
          </Link>
          <Link to="/mentor/video-call" className="flex items-center gap-3 px-4 py-3 bg-blue-600 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            <span>Video Call</span>
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
        {selectedRoom ? (
          <>
            {/* Header */}
            <div className="bg-white border-b p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    {otherUser?.avatarUrl ? (
                      <img 
                        src={otherUser.avatarUrl} 
                        alt={otherUser.fullName} 
                        className="w-full h-full rounded-full object-cover" 
                      />
                    ) : (
                      <span className="text-gray-600 font-medium">
                        {otherUser?.fullName?.charAt(0)?.toUpperCase() || "J"}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{otherUser?.fullName || "Jobseeker"}</div>
                    <div className="text-sm text-gray-500">Video Call</div>
                  </div>
                </div>
                <Link
                  to={`/mentor/chat?room=${selectedRoom._id}`}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Back to Chat
                </Link>
              </div>
            </div>

            {/* Video Call Area */}
            <div className="flex-1 bg-gray-900 relative" style={{ height: '100%', minHeight: 0 }}>
              {!callStarted ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-white">
                    <div className="mb-6">
                      <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        {otherUser?.avatarUrl ? (
                          <img 
                            src={otherUser.avatarUrl} 
                            alt={otherUser.fullName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl text-gray-300">
                            {otherUser?.fullName?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-semibold mb-2">Ready to start video call?</h2>
                      <p className="text-gray-400">Click the button below to start the call with {otherUser?.fullName || "the other participant"}</p>
                    </div>
                    <button
                      onClick={startCall}
                      className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-lg font-medium"
                    >
                      Start Video Call
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full" style={{ height: '100%' }}>
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
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-lg mb-2">No room selected</div>
              <div className="text-sm">Select a chat room to start a video call</div>
              <Link to="/mentor/chat" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
                Go to Chat
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


