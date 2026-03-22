import React, { useEffect, useState } from "react";
import { useOutletContext, useNavigate, Link } from "react-router-dom";

function tokenHeaders() {
  const t = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

export default function StudentMentorship() {
  const { authUser } = useOutletContext();
  const navigate = useNavigate();
  const [tab, setTab] = useState("hub");
  const [startups, setStartups] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgModal, setMsgModal] = useState(null);
  const [msgText, setMsgText] = useState("");

  const refreshRequests = () =>
    fetch("/api/mentorship-requests/me", {
      headers: tokenHeaders(),
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : { requests: [] }))
      .then((d) => setRequests(d.requests || []));

  useEffect(() => {
    if (!authUser) return;
    refreshRequests().finally(() => setLoading(false));
  }, [authUser]);

  useEffect(() => {
    if (tab !== "founders") return;
    fetch("/api/startups/explore?limit=48", {
      headers: tokenHeaders(),
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : { startups: [] }))
      .then((d) => setStartups(d.startups || []));
  }, [tab]);

  useEffect(() => {
    if (tab !== "investors") return;
    fetch("/api/mentorship-requests/investors?limit=40", {
      headers: tokenHeaders(),
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : { investors: [] }))
      .then((d) => setInvestors(d.investors || []));
  }, [tab]);

  const openModal = (type, id, name) => {
    setMsgModal({ type, id, name });
    setMsgText(
      type === "startup"
        ? `I'd like mentorship from ${name} on product / career guidance.`
        : `I'd like mentorship from investor ${name}.`
    );
  };

  const submitRequest = async () => {
    if (!msgModal) return;
    const body =
      msgModal.type === "startup"
        ? {
            providerType: "startup",
            startupId: msgModal.id,
            message: msgText,
          }
        : {
            providerType: "investor",
            investorUserId: msgModal.id,
            message: msgText,
          };
    const res = await fetch("/api/mentorship-requests", {
      method: "POST",
      headers: tokenHeaders(),
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      window.alert(data.message || "Could not send request");
      return;
    }
    setMsgModal(null);
    refreshRequests();
    window.alert("Request sent. The founder or investor will propose a time and price.");
  };

  const payRequest = async (id) => {
    if (!window.confirm("Confirm booking with demo payment?")) return;
    const res = await fetch(`/api/mentorship-requests/${id}/pay`, {
      method: "POST",
      headers: tokenHeaders(),
      credentials: "include",
      body: JSON.stringify({ paymentMethod: "demo" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      window.alert(data.message || "Payment failed");
      return;
    }
    window.alert(
      `${data.message || "Booked!"} Use Mentor Chat and Video Call below.`
    );
    refreshRequests();
  };

  const statusLabel = (s) => {
    if (s === "slot_proposed") return "Slot ready — pay to book";
    if (s === "paid") return "Booked";
    if (s === "rejected") return "Declined";
    return "Pending review";
  };

  if (!authUser) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Mentorship</h1>
          <p className="text-sm text-slate-400 mt-1">
            Request guidance from startup founders or investors, then pay, chat, and video call.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <Link
            to="/jobseeker/mentor-chats"
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-sky-300 hover:bg-slate-700"
          >
            Mentor chat
          </Link>
          <Link
            to="/jobseeker/video-call"
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-sky-300 hover:bg-slate-700"
          >
            Video call
          </Link>
          <Link
            to="/jobseeker/mentoring"
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Platform mentors
          </Link>
        </div>
      </div>

      {/* My requests */}
      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 backdrop-blur">
        <h2 className="text-sm font-semibold text-slate-100 mb-3">My mentorship requests</h2>
        {loading ? (
          <p className="text-[11px] text-slate-500">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="text-[11px] text-slate-500">
            No requests yet. Choose a startup founder or investor below.
          </p>
        ) : (
          <ul className="space-y-2">
            {requests.map((r) => (
              <li
                key={r._id}
                className="rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2 text-[11px]"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-slate-200 font-medium">
                    {r.providerType === "startup"
                      ? r.startup?.name || "Startup"
                      : r.investorUser?.fullName || "Investor"}
                  </span>
                  <span
                    className={
                      r.status === "paid"
                        ? "text-emerald-400"
                        : r.status === "rejected"
                          ? "text-red-400"
                          : r.status === "slot_proposed"
                            ? "text-amber-300"
                            : "text-sky-300"
                    }
                  >
                    {statusLabel(r.status)}
                  </span>
                </div>
                {r.status === "slot_proposed" && (
                  <div className="mt-2 text-slate-400 space-y-1">
                    <p>
                      {r.proposedStartTime
                        ? new Date(r.proposedStartTime).toLocaleString()
                        : ""}{" "}
                      · {r.proposedMinutes} min · ₹{r.pricePerMinute}/min · Total ₹
                      {r.totalAmount}
                    </p>
                    <button
                      type="button"
                      onClick={() => payRequest(r._id)}
                      className="mt-1 px-3 py-1 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500"
                    >
                      Pay & book (demo)
                    </button>
                  </div>
                )}
                {r.status === "paid" && (
                  <p className="mt-2 text-emerald-300/90">
                    Session booked — open{" "}
                    <Link to="/jobseeker/mentor-chats" className="underline">
                      Mentor chat
                    </Link>{" "}
                    or{" "}
                    <Link to="/jobseeker/video-call" className="underline">
                      Video call
                    </Link>
                    .
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {tab === "hub" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTab("founders")}
            className="rounded-2xl border border-slate-700 bg-gradient-to-br from-indigo-900/40 to-slate-900 p-6 text-left hover:border-sky-500/50 transition-colors"
          >
            <p className="text-xs font-semibold text-sky-300 uppercase tracking-wider">
              Startup founders
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-50">
              Mentorship from company founders
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Browse startups on HireMe and send a request. They propose time & pricing.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setTab("investors")}
            className="rounded-2xl border border-slate-700 bg-gradient-to-br from-violet-900/40 to-slate-900 p-6 text-left hover:border-violet-500/50 transition-colors"
          >
            <p className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
              Investors
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-50">
              Mentorship from investors
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Pick an investor account, request a session, then book after they respond.
            </p>
          </button>
        </div>
      )}

      {tab === "founders" && (
        <section>
          <button
            type="button"
            onClick={() => setTab("hub")}
            className="text-[11px] text-sky-400 mb-3 hover:underline"
          >
            ← Back
          </button>
          <h2 className="text-sm font-semibold text-slate-100 mb-3">Choose a startup</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {startups.map((s) => (
              <div
                key={s._id}
                className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-[11px]"
              >
                <p className="font-semibold text-slate-100">{s.name}</p>
                <p className="text-slate-500 mt-0.5">
                  {s.industry || "Startup"} · {s.stage || "—"}
                </p>
                <button
                  type="button"
                  onClick={() => openModal("startup", s._id, s.name)}
                  className="mt-3 w-full py-1.5 rounded-lg bg-sky-600/80 text-white font-medium hover:bg-sky-600"
                >
                  Request mentorship
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "investors" && (
        <section>
          <button
            type="button"
            onClick={() => setTab("hub")}
            className="text-[11px] text-sky-400 mb-3 hover:underline"
          >
            ← Back
          </button>
          <h2 className="text-sm font-semibold text-slate-100 mb-3">Choose an investor</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {investors.map((inv) => (
              <div
                key={inv._id}
                className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-[11px]"
              >
                <p className="font-semibold text-slate-100">{inv.fullName || "Investor"}</p>
                <p className="text-slate-500 mt-0.5 truncate">{inv.email}</p>
                <button
                  type="button"
                  onClick={() =>
                    openModal("investor", inv._id, inv.fullName || inv.email)
                  }
                  className="mt-3 w-full py-1.5 rounded-lg bg-violet-600/80 text-white font-medium hover:bg-violet-600"
                >
                  Request mentorship
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {msgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-600 bg-slate-900 p-5 text-slate-100">
            <p className="text-sm font-semibold">Message to {msgModal.name}</p>
            <textarea
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              rows={4}
              className="mt-3 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-100"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={submitRequest}
                className="flex-1 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold"
              >
                Send request
              </button>
              <button
                type="button"
                onClick={() => setMsgModal(null)}
                className="px-4 py-2 rounded-lg border border-slate-600 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate("/student/dashboard")}
        className="text-sm text-sky-400 hover:text-sky-300"
      >
        ← Back to dashboard
      </button>
    </div>
  );
}
