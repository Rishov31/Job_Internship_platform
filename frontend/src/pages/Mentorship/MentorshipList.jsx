import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  listMentors,
  createMentoringSession,
  createMentoringStripeCheckout,
  confirmMentoringStripePayment,
  getMyMentoringSessions,
  getMyChatRooms,
} from "../../api/mentorApi";
import NotificationBell from "../../components/NotificationBell";

export default function MentorshipList() {
  const location = useLocation();
  const processedCheckoutRef = useRef(new Set());
  const [mentors, setMentors] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [motivation, setMotivation] = useState("");
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [userName, setUserName] = useState("User");

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const data = await listMentors();
      setMentors(data.mentors || []);
      setPagination(data.pagination || {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchMentors();
    
    // Get user info
    const token = localStorage.getItem("token");
    fetch("/api/users/me", { headers: { Authorization: `Bearer ${token}` }})
      .then(r=>r.json()).then(data=>{
        if (data.user?.fullName) setUserName(data.user.fullName);
      }).catch(()=>{});

    // Mentoring sessions
    getMyMentoringSessions().then((data)=>{
      const sessions = (data.sessions || []).filter(s => 
        s.status === "paid" || s.status === "scheduled"
      ).slice(0, 3);
      setUpcomingSessions(sessions);
    }).catch(()=> setUpcomingSessions([]));

    // Chat rooms for pinned conversations
    getMyChatRooms().then((data)=>{
      setChatRooms((data.chatRooms || []).slice(0, 4));
    }).catch(()=> setChatRooms([]));
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const paymentState = q.get("payment");
    const sessionId = q.get("sessionId");
    const checkoutSessionId = q.get("checkoutSessionId");
    if (paymentState === "success") {
      if (!sessionId || !checkoutSessionId) {
        window.alert("Payment returned successfully. Please refresh your sessions.");
        return;
      }
      if (processedCheckoutRef.current.has(checkoutSessionId)) return;
      processedCheckoutRef.current.add(checkoutSessionId);
      confirmMentoringStripePayment(sessionId, checkoutSessionId)
        .then(() => {
          window.alert("Payment successful! Session booked and invoice sent to your email.");
        })
        .catch((e) => {
          window.alert(e.message || "Payment confirmation failed. Please contact support.");
        });
    } else if (paymentState === "cancelled") {
      window.alert("Payment was cancelled. You can retry anytime.");
    }
  }, [location.search]);

  const dayOfWeekToIndex = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const computeNextDateForDay = (dayKey) => {
    const target = dayOfWeekToIndex[dayKey];
    if (typeof target !== "number") return null;
    const now = new Date();
    const result = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = (target - result.getDay() + 7) % 7;
    result.setDate(result.getDate() + (diff === 0 ? 7 : diff));
    return result;
  };

  const getPreferredSlot = (mentor) => {
    const slots = mentor?.availability || [];
    if (!slots.length) return null;
    return slots[0];
  };

  const getDisplayDate = (mentor) => {
    const slot = getPreferredSlot(mentor);
    if (!slot) return "N/A";
    const nextDate = computeNextDateForDay(slot.dayOfWeek);
    if (!nextDate) return "N/A";
    return nextDate.toLocaleDateString();
  };

  const getDisplayTime = (mentor) => {
    const slot = getPreferredSlot(mentor);
    return slot ? `${slot.startTime} - ${slot.endTime}` : "N/A";
  };

  const buildStartTimeISO = (mentor) => {
    const slot = getPreferredSlot(mentor);
    if (!slot) return null;
    const nextDate = computeNextDateForDay(slot.dayOfWeek);
    if (!nextDate) return null;
    const [hh, mm] = (slot.startTime || "09:00").split(":");
    const start = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate(), parseInt(hh, 10) || 9, parseInt(mm, 10) || 0, 0);
    return start.toISOString();
  };

  const openPayment = async (mentorId) => {
    setSelectedMentorId(mentorId);
    const mentor = mentors.find(m => m._id === mentorId);
    const startTime = buildStartTimeISO(mentor);
    const minutes = 30; // default duration
    if (!startTime) { 
      alert("Mentor has no availability set"); 
      return; 
    }
    
    try {
      // First create the session with pending_payment status
      const result = await createMentoringSession(mentorId, { 
        startTime, 
        minutes, 
        motivation: motivation || "Interested in mentorship" 
      });
      setSelectedSession(result.session);
      setShowPayment(true);
    } catch (e) {
      alert(e.message || "Failed to create session");
    }
  };

  const closePayment = () => {
    setShowPayment(false);
    setCheckoutLoading(false);
    setSelectedMentorId(null);
    setSelectedSession(null);
    setMotivation("");
  };

  const submitPaymentAndBook = async () => {
    if (!selectedSession) return;
    try {
      setCheckoutLoading(true);
      const data = await createMentoringStripeCheckout(selectedSession._id);
      if (!data?.checkoutUrl) {
        throw new Error("Stripe checkout URL not found.");
      }
      window.location.href = data.checkoutUrl;
    } catch (e) {
      alert(e.message || "Failed to process payment");
    } finally {
      setCheckoutLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Same as Dashboard */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">Hirefly.</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/jobseeker/dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            <span>Dashboard</span>
          </Link>
          <Link to="/jobseeker/applications" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>My Application</span>
          </Link>
          <Link to="/jobseeker/mentoring" className="flex items-center gap-3 px-4 py-3 bg-blue-600 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span>Mentoring</span>
          </Link>
          <Link to="/jobseeker/mentor-chats" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Mentor Chats</span>
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search anything here..." 
              className="flex-1 outline-none text-gray-700"
            />
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <Link to="/jobseeker/profile" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <span className="text-sm font-medium">User</span>
            </Link>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-8 bg-blue-50">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <NotificationBell />
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Welcome Section */}
          <div className="bg-white rounded-xl p-8 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome Back, <span className="text-blue-600">{userName}</span>
                </h2>
                <p className="text-gray-600">
                  Manage all the things from single Dashboard. See latest info sessions, recent conversations and update your recommendations.
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="w-48 h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-32 h-32 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Ongoing Info Sessions & Find Mentors */}
            <div className="lg:col-span-2 space-y-6">
              {/* Ongoing Info Sessions */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Ongoing Info Sessions</h2>
                {upcomingSessions.length === 0 ? (
                  <div className="bg-white rounded-xl p-6 text-center text-gray-500">
                    No upcoming sessions. Book a mentoring session to get started.
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {upcomingSessions.map((session, idx) => {
                      const daysLeft = Math.ceil((new Date(session.startTime) - new Date()) / (1000 * 60 * 60 * 24));
                      const sessionDate = new Date(session.startTime);
                      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                      return (
                        <div key={session._id || idx} className="bg-white rounded-xl p-4 min-w-[280px] shadow-sm border">
                          <div className="flex items-center gap-2 text-red-600 mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            <span className="text-sm font-medium">{daysLeft} Day{daysLeft !== 1 ? 's' : ''} Left</span>
                          </div>
                          <div className="text-sm font-semibold text-gray-700 mb-1">
                            {dayNames[sessionDate.getDay()]}, {monthNames[sessionDate.getMonth()]} {sessionDate.getDate()} @{sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            Mentoring Session with {session.mentor?.user?.fullName || 'Mentor'}
                          </div>
                          <div className="text-xs text-gray-500 mb-3">Online Session</div>
                          <Link to="/jobseeker/mentor-chats" className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                            Attend
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Find Mentors Section */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Find Mentors</h2>
                {loading ? (
                  <div className="bg-white rounded-xl p-8 text-center">Loading...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {mentors.map((m) => (
                      <div key={m._id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-lg font-semibold text-gray-900">{m?.user?.fullName}</div>
                            <div className="text-sm text-gray-600">{m.title}</div>
                          </div>
                          <div className="text-sm font-semibold text-blue-600">
                            ₹{Math.round((Number(m.pricePerMinute) || 0) * 60)}/hour
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-700 line-clamp-3">{m.bio}</div>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {(m.expertise||[]).slice(0,6).map((e,i)=> <span key={i} className="text-xs bg-gray-100 rounded px-2 py-1">{e}</span>)}
                        </div>
                        <div className="mt-4 space-y-2">
                          <input 
                            type="text" 
                            placeholder="Your motivation for seeking mentorship..." 
                            value={motivation}
                            onChange={(e) => setMotivation(e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input readOnly value={getDisplayTime(m)} className="border rounded px-2 py-2 bg-gray-50 text-sm" />
                            <input readOnly value={getDisplayDate(m)} className="border rounded px-2 py-2 bg-gray-50 text-sm" />
                            <button onClick={()=>openPayment(m._id)} className="bg-green-600 text-white rounded px-3 py-2 hover:bg-green-700 transition font-medium">Interested</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Pinned Conversations */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold text-gray-900">Pinned Conversations</h2>
              </div>
              <div className="p-4 max-h-[600px] overflow-y-auto">
                {chatRooms.length === 0 ? (
                  <div className="text-center text-gray-500 py-8 text-sm">
                    No conversations yet. Start chatting with your mentors.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatRooms.map((room) => {
                      const otherUser = room.mentor || room.jobseeker;
                      const lastMsg = room.lastMessage;
                      const timeAgo = lastMsg ? (() => {
                        const diff = new Date() - new Date(lastMsg.createdAt);
                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                        if (days === 0) return 'Today';
                        if (days === 1) return 'Yesterday';
                        if (days < 7) return `${days} days ago`;
                        return new Date(lastMsg.createdAt).toLocaleDateString();
                      })() : '';
                      return (
                        <Link 
                          key={room._id} 
                          to="/jobseeker/mentor-chats"
                          className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition group"
                        >
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                            {otherUser?.avatarUrl ? (
                              <img src={otherUser.avatarUrl} alt={otherUser.fullName} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-gray-600 font-medium">
                                {otherUser?.fullName?.charAt(0)?.toUpperCase() || "M"}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-gray-900 truncate">
                                {otherUser?.fullName || "Mentor"}
                              </span>
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z"/>
                              </svg>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {lastMsg?.content || "No messages yet"}
                            </p>
                            {timeAgo && (
                              <div className="text-xs text-gray-400 mt-1">{timeAgo}</div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showPayment && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Complete Secure Payment</h2>
              <button onClick={closePayment} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="mb-4 p-3 bg-blue-50 rounded">
              <div className="text-sm text-gray-600">Session Amount:</div>
              <div className="text-lg font-semibold text-blue-600">₹{selectedSession.totalAmount}</div>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                You will be redirected to Stripe Checkout to complete card payment securely.
                After successful payment, your session is confirmed and invoice is emailed to you.
              </p>
              <button
                onClick={submitPaymentAndBook}
                disabled={checkoutLoading}
                className="w-full bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-60"
              >
                {checkoutLoading ? "Redirecting..." : "Pay with Stripe"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

