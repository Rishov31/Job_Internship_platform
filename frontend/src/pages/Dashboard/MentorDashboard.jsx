import React, { useEffect, useState } from "react";
import { getMyMentorProfile, upsertMyMentorProfile, listMyBookingsAsMentor } from "../../api/mentorApi";

export default function MentorDashboard() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ title: "", experienceYears: 0, expertise: [], bio: "", pricePerMinute: 0, timezone: "UTC", availability: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    getMyMentorProfile().then(setProfile).catch(() => setProfile(null));
    listMyBookingsAsMentor().then((d)=>setBookings(d.bookings||[])).catch(()=>setBookings([]));
  }, []);

  useEffect(() => {
    if (!profile) return;
    setForm({
      title: profile.title || "",
      experienceYears: profile.experienceYears || 0,
      expertise: profile.expertise || [],
      bio: profile.bio || "",
      pricePerMinute: profile.pricePerMinute || 0,
      timezone: profile.timezone || "UTC",
      availability: profile.availability || [],
    });
  }, [profile]);

  const updateField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "experienceYears" || name === "pricePerMinute" ? Number(value) : value }));
  };

  const updateExpertise = (value) => setForm((f) => ({ ...f, expertise: value.split(",").map((s) => s.trim()).filter(Boolean) }));

  const addSlot = () => setForm((f) => ({ ...f, availability: [...(f.availability || []), { dayOfWeek: "mon", startTime: "09:00", endTime: "10:00" }] }));
  const updateSlot = (idx, key, value) => setForm((f) => ({ ...f, availability: f.availability.map((s, i) => (i === idx ? { ...s, [key]: value } : s)) }));
  const removeSlot = (idx) => setForm((f) => ({ ...f, availability: f.availability.filter((_, i) => i !== idx) }));

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const saved = await upsertMyMentorProfile(form);
      setProfile(saved);
      alert("Profile saved");
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Mentor Dashboard</h1>
            <p className="text-gray-500 text-sm">Manage your mentoring profile</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <form className="bg-white border rounded p-6 space-y-4" onSubmit={onSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Title</label>
              <input name="title" value={form.title} onChange={updateField} className="w-full border rounded px-3 py-2" placeholder="e.g., Senior Frontend Engineer" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Experience (years)</label>
              <input name="experienceYears" type="number" min="0" value={form.experienceYears} onChange={updateField} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Price per minute (₹)</label>
              <input name="pricePerMinute" type="number" min="0" value={form.pricePerMinute} onChange={updateField} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Timezone</label>
              <input name="timezone" value={form.timezone} onChange={updateField} className="w-full border rounded px-3 py-2" placeholder="e.g., Asia/Kolkata" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Expertise (comma separated)</label>
            <input value={form.expertise.join(", ")} onChange={(e)=>updateExpertise(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="React, System Design, Resume Review" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Bio</label>
            <textarea name="bio" value={form.bio} onChange={updateField} rows={4} className="w-full border rounded px-3 py-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-gray-600">Availability</label>
              <button type="button" onClick={addSlot} className="text-blue-600 text-sm">Add Slot</button>
            </div>
            <div className="space-y-2">
              {(form.availability||[]).map((s, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <select value={s.dayOfWeek} onChange={(e)=>updateSlot(idx, "dayOfWeek", e.target.value)} className="col-span-3 border rounded px-2 py-2">
                    {['sun','mon','tue','wed','thu','fri','sat'].map(d=> <option key={d} value={d}>{d.toUpperCase()}</option>)}
                  </select>
                  <input type="time" value={s.startTime} onChange={(e)=>updateSlot(idx, "startTime", e.target.value)} className="col-span-3 border rounded px-2 py-2" />
                  <input type="time" value={s.endTime} onChange={(e)=>updateSlot(idx, "endTime", e.target.value)} className="col-span-3 border rounded px-2 py-2" />
                  <button type="button" onClick={()=>removeSlot(idx)} className="col-span-3 text-red-600">Remove</button>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end">
            <button disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving?"Saving...":"Save Profile"}</button>
          </div>
        </form>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-10">
        <div className="bg-white border rounded p-6">
          <h2 className="text-lg font-semibold mb-4">Mentoring Sessions (Bookings)</h2>
          {bookings.length === 0 ? (
            <div className="text-sm text-gray-600">No sessions yet.</div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b)=> (
                <div key={b._id} className="border rounded p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-700">Jobseeker: {b?.jobseeker?.fullName || "-"}</div>
                    <div className="text-xs text-gray-500">Starts: {new Date(b.startTime).toLocaleString()} • {b.minutes} mins • Status: {b.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


