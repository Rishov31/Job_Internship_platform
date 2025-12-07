import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getMyChatRooms, getChatRoom } from "../../api/mentorApi";

export default function MentorVideoCall() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [callStarted, setCallStarted] = useState(false);

  useEffect(() => {
    const roomId = searchParams.get("room");
    if (roomId) {
      getChatRoom(roomId)
        .then((data) => {
          setSelectedRoom(data.chatRoom);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const startCall = () => {
    setCallStarted(true);
    // In a real implementation, you would initialize WebRTC here
    // For now, this is a placeholder UI
  };

  const endCall = () => {
    setCallStarted(false);
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
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Header */}
            <div className="bg-white border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    {selectedRoom.jobseeker?.avatarUrl ? (
                      <img 
                        src={selectedRoom.jobseeker.avatarUrl} 
                        alt={selectedRoom.jobseeker.fullName} 
                        className="w-full h-full rounded-full object-cover" 
                      />
                    ) : (
                      <span className="text-gray-600 font-medium">
                        {selectedRoom.jobseeker?.fullName?.charAt(0)?.toUpperCase() || "J"}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{selectedRoom.jobseeker?.fullName || "Jobseeker"}</div>
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
            <div className="flex-1 bg-gray-900 relative flex items-center justify-center">
              {!callStarted ? (
                <div className="text-center text-white">
                  <div className="mb-6">
                    <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">Ready to start video call?</h2>
                    <p className="text-gray-400">Click the button below to start the call with {selectedRoom.jobseeker?.fullName || "the jobseeker"}</p>
                  </div>
                  <button
                    onClick={startCall}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-lg font-medium"
                  >
                    Start Video Call
                  </button>
                </div>
              ) : (
                <>
                  {/* Remote Video (Jobseeker) */}
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">
                          {selectedRoom.jobseeker?.fullName?.charAt(0)?.toUpperCase() || "J"}
                        </span>
                      </div>
                      <div className="text-xl font-medium">{selectedRoom.jobseeker?.fullName || "Jobseeker"}</div>
                      <div className="text-gray-400 mt-2">Waiting for connection...</div>
                    </div>
                  </div>

                  {/* Local Video (Mentor) - Picture in Picture */}
                  <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden border-2 border-white">
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <div className="text-center">
                        <div className="text-2xl mb-1">You</div>
                        <div className="text-sm text-gray-300">Mentor</div>
                      </div>
                    </div>
                  </div>

                  {/* Call Controls */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
                    <button className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 transition">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                      </svg>
                    </button>
                    <button
                      onClick={endCall}
                      className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition"
                    >
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                    <button className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 transition">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                    </button>
                  </div>
                </>
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


