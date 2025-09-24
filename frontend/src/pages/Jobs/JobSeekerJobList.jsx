import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function JobSeekerJobList(){
  const [jobs,setJobs] = useState([]);
  const [search,setSearch] = useState("");
  const navigate = useNavigate();
  useEffect(()=>{ fetch("/api/jobs").then(r=>r.json()).then(d=>setJobs(d.jobs||d||[])).catch(()=>{}); },[]);
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Browse Jobs</h1>
        <Link to="/jobseeker/dashboard" className="text-blue-600">Dashboard</Link>
      </div>
      <div className="mb-6">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by title, company or location" className="w-full border rounded px-4 py-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.filter(j=>{
          const q = search.toLowerCase();
          return !q || `${j.title} ${j.company} ${j.location}`.toLowerCase().includes(q);
        }).map(j=> (
          <div key={j._id} className="bg-white border rounded p-5 hover:shadow cursor-pointer" onClick={()=>navigate(`/jobseeker/jobs/${j._id}`)}>
            <div className="font-semibold text-lg">{j.title}</div>
            <div className="text-sm text-gray-600">{j.company} · {j.location}</div>
            <p className="text-sm text-gray-700 mt-2 line-clamp-2">{j.description}</p>
            <div className="mt-3 flex gap-2 flex-wrap">
              {(j.skills||[]).slice(0,4).map((s,i)=> <span key={i} className="text-xs px-2 py-1 rounded bg-gray-100">{s}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


