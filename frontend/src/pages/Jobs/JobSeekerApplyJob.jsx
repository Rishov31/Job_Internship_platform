import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function JobSeekerApplyJob(){
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job,setJob] = useState(null);
  const [coverLetter,setCoverLetter] = useState("");
  const [submitting,setSubmitting] = useState(false);

  useEffect(()=>{ fetch(`/api/jobs/${jobId}`).then(r=>r.json()).then(setJob).catch(()=>{}); },[jobId]);

  const apply = async ()=>{
    setSubmitting(true);
    try{
      const token = localStorage.getItem("token");
      const r = await fetch(`/api/applications/jobs/${jobId}/apply`,{
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ coverLetter })
      });
      if(!r.ok){ const e = await r.json(); alert(e.message||"Failed to apply"); return; }
      alert("Application submitted");
      navigate("/jobseeker/applications");
    }finally{
      setSubmitting(false);
    }
  };

  if(!job) return <div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>;
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white border rounded p-6">
        <h1 className="text-xl font-semibold">{job.title}</h1>
        <div className="text-sm text-gray-600">{job.company} · {job.location}</div>
        <p className="text-gray-700 mt-3 whitespace-pre-line">{job.description}</p>
      </div>
      <div className="bg-white border rounded p-6">
        <h2 className="font-semibold mb-2">Cover Letter</h2>
        <textarea className="w-full border rounded p-3 h-40" value={coverLetter} onChange={e=>setCoverLetter(e.target.value)} placeholder="Write a short cover letter" />
        <button disabled={submitting} onClick={apply} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">{submitting?"Submitting...":"Submit Application"}</button>
      </div>
    </div>
  );
}


