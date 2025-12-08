import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { getMyChatRooms, getMessages, sendMessage } from "../../api/mentorApi";
import NotificationBell from "../../components/NotificationBell";

export default function JobSeekerMentorChats() {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Get current user
    const token = localStorage.getItem("token");
    fetch("/api/users/me", { headers: { Authorization: `Bearer ${token}` }})
      .then(r => r.json())
      .then(data => {
        if (data.user?._id) setCurrentUserId(data.user._id);
      })
      .catch(() => {});
    
    fetchChatRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom._id);
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        fetchMessages(selectedRoom._id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      const data = await getMyChatRooms();
      setChatRooms(data.chatRooms || []);
      if (data.chatRooms && data.chatRooms.length > 0 && !selectedRoom) {
        setSelectedRoom(data.chatRooms[0]);
      }
    } catch (e) {
      console.error("Failed to fetch chat rooms:", e);
    } finally {
      setLoading(false);
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
      // Refresh messages
      await fetchMessages(selectedRoom._id);
      // Refresh chat rooms to update last message
      await fetchChatRooms();
    } catch (e) {
      alert(e.message || "Failed to send message");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getOtherUser = (room) => {
    if (!currentUserId) return room.mentor || room.jobseeker;
    // If current user is jobseeker, show mentor; otherwise show jobseeker
    if (room.jobseeker?._id === currentUserId || room.jobseeker === currentUserId) {
      return room.mentor;
    }
    return room.jobseeker;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      {/* Chat Rooms List - Left Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Mentor Chats</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chatRooms.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No chat rooms yet. Book a mentoring session to start chatting.
            </div>
          ) : (
            <div className="divide-y">
              {chatRooms.map((room) => {
                const otherUser = getOtherUser(room);
                const isSelected = selectedRoom?._id === room._id;
                return (
                  <button
                    key={room._id}
                    onClick={() => setSelectedRoom(room)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                      isSelected ? "bg-blue-50 border-l-4 border-blue-600" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        {otherUser?.avatarUrl ? (
                          <img src={otherUser.avatarUrl} alt={otherUser.fullName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-gray-600 font-medium">
                            {otherUser?.fullName?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {otherUser?.fullName || "Unknown"}
                        </div>
                        {room.lastMessage && (
                          <div className="text-sm text-gray-500 truncate mt-1">
                            {room.lastMessage.content}
                          </div>
                        )}
                        {room.lastMessageAt && (
                          <div className="text-xs text-gray-400 mt-1">
                            {formatTime(room.lastMessageAt)}
                          </div>
                        )}
                      </div>
                      {(room.unreadCountJobseeker > 0 || room.unreadCountMentor > 0) && (
                        <div className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {room.unreadCountJobseeker || room.unreadCountMentor}
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

      {/* Chat Window - Right Side */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    {getOtherUser(selectedRoom)?.avatarUrl ? (
                      <img 
                        src={getOtherUser(selectedRoom).avatarUrl} 
                        alt={getOtherUser(selectedRoom).fullName} 
                        className="w-full h-full rounded-full object-cover" 
                      />
                    ) : (
                      <span className="text-gray-600 font-medium">
                        {getOtherUser(selectedRoom)?.fullName?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{getOtherUser(selectedRoom)?.fullName || "Unknown"}</div>
                    <div className="text-sm text-gray-500">Mentor</div>
                  </div>
                </div>
                <Link
                  to={`/jobseeker/video-call?room=${selectedRoom._id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  <span>Video Call</span>
                </Link>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMyMessage = currentUserId && (
                    msg.sender._id === currentUserId || 
                    msg.sender === currentUserId ||
                    (typeof msg.sender === 'object' && msg.sender._id === currentUserId)
                  );
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isMyMessage
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        <div className="text-sm">{msg.content}</div>
                        <div
                          className={`text-xs mt-1 ${
                            isMyMessage ? "text-blue-100" : "text-gray-500"
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

            {/* Message Input */}
            <div className="bg-white border-t p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-lg mb-2">Select a chat to start messaging</div>
              <div className="text-sm">Book a mentoring session to create a chat room</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


