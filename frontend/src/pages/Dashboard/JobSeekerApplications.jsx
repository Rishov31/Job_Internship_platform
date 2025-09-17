import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function JobSeekerApplications(){
  const [apps,setApps] = useState([]);
  useEffect(()=>{
    const token = localStorage.getItem("token");
    fetch("/api/jobseeker/applications", { headers:{ Authorization:`Bearer ${token}` }})
      .then(r=>r.json()).then(d=>setApps(d.applications||[])).catch(()=>{});
  },[]);
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Applications</h1>
        <Link to="/jobseeker/jobs" className="text-blue-600">Find Jobs</Link>
      </div>
      <div className="bg-white border rounded divide-y">
        {apps.length===0 && <div className="p-6 text-gray-500">No applications yet.</div>}
        {apps.map(a=> (
          <div key={a._id} className="p-5 flex items-center justify-between">
            <div>
              <div className="font-medium">{a?.job?.title}</div>
              <div className="text-sm text-gray-600">{a?.job?.company} · {a?.job?.location}</div>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-gray-100 capitalize">{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


