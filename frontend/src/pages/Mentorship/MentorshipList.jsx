import React, { useEffect, useState } from "react";
import { listMentors, createBooking } from "../../api/mentorApi";

export default function MentorshipList() {
  const [mentors, setMentors] = useState([]);
  const [pagination, setPagination] = useState({});
  const [booking, setBooking] = useState({});
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState(null);
  const [payment, setPayment] = useState({
    fullName: "",
    aadharNumber: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });

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

  useEffect(() => { fetchMentors(); }, []);

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

  const openPayment = (mentorId) => {
    setSelectedMentorId(mentorId);
    setShowPayment(true);
  };

  const closePayment = () => {
    setShowPayment(false);
    setSelectedMentorId(null);
    setPayment({ fullName: "", aadharNumber: "", cardNumber: "", expiryMonth: "", expiryYear: "", cvv: "" });
  };

  const submitPaymentAndBook = async () => {
    if (!selectedMentorId) return;
    const mentor = mentors.find(m => m._id === selectedMentorId);
    const startTime = buildStartTimeISO(mentor);
    const minutes = 30; // default duration
    if (!startTime) { alert("Mentor has no availability set"); return; }
    if (!payment.fullName || !payment.aadharNumber || !payment.cardNumber || !payment.expiryYear) {
      alert("Please fill payment details");
      return;
    }
    try {
      await createBooking(selectedMentorId, { startTime, minutes, notes: `paid by ${payment.fullName}` });
      closePayment();
      alert("Payment successful. Booking created.");
    } catch (e) {
      alert(e.message || "Failed to book");
    }
  };

  const setBookingField = (id, key, value) => setBooking((b) => ({ ...b, [id]: { ...(b[id] || {}), [key]: value } }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Find a Mentor</h1>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mentors.map((m) => (
            <div key={m._id} className="bg-white border rounded p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">{m?.user?.fullName}</div>
                  <div className="text-sm text-gray-600">{m.title}</div>
                </div>
                <div className="text-sm">₹{m.pricePerMinute}/min</div>
              </div>
              <div className="mt-2 text-sm text-gray-700 line-clamp-3">{m.bio}</div>
              <div className="mt-2 flex gap-2 flex-wrap">
                {(m.expertise||[]).slice(0,6).map((e,i)=> <span key={i} className="text-xs bg-gray-100 rounded px-2 py-1">{e}</span>)}
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                <input readOnly value={getDisplayTime(m)} className="border rounded px-2 py-2 bg-gray-50" />
                <input readOnly value={getDisplayDate(m)} className="border rounded px-2 py-2 bg-gray-50" />
                <button onClick={()=>openPayment(m._id)} className="bg-green-600 text-white rounded px-3 py-2">Interested</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Dummy Payment</h2>
              <button onClick={closePayment} className="text-gray-500">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                <input value={payment.fullName} onChange={(e)=>setPayment(p=>({...p, fullName: e.target.value}))} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Aadhar Number</label>
                <input value={payment.aadharNumber} onChange={(e)=>setPayment(p=>({...p, aadharNumber: e.target.value}))} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Card Number</label>
                <input value={payment.cardNumber} onChange={(e)=>setPayment(p=>({...p, cardNumber: e.target.value}))} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Exp Month</label>
                  <input value={payment.expiryMonth} onChange={(e)=>setPayment(p=>({...p, expiryMonth: e.target.value}))} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Exp Year</label>
                  <input value={payment.expiryYear} onChange={(e)=>setPayment(p=>({...p, expiryYear: e.target.value}))} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">CVV</label>
                  <input value={payment.cvv} onChange={(e)=>setPayment(p=>({...p, cvv: e.target.value}))} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <button onClick={submitPaymentAndBook} className="w-full bg-blue-600 text-white rounded px-4 py-2">Pay & Book</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


