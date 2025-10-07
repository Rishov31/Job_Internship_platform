import React, { useEffect, useRef, useState } from "react";

export default function JobSeekerProfile(){
  const [profile,setProfile] = useState(null);
  const [form,setForm] = useState({
    personalInfo:{ address:{} },
    professionalInfo:{},
    skills:{ technical:[], soft:[] },
    education:[],
    experience:[],
    resume:{}
  });
  const [editing,setEditing] = useState(false);
  const [activeTab,setActiveTab] = useState("personal");
  const resumeInputRef = useRef(null);

  useEffect(()=>{
    const token = localStorage.getItem("token");
    fetch("/api/jobseeker/profile",{ headers:{ Authorization:`Bearer ${token}` }}).then(async r=>{
      if(r.status===404){ setProfile(null); setForm({}); return; }
      const d = await r.json(); setProfile(d); setForm(d);
    }).catch(()=>{});
  },[]);

  const save = async ()=>{
    const token = localStorage.getItem("token");
    const r = await fetch("/api/jobseeker/profile",{
      method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify(form)
    });
    let d = {};
    try { d = await r.json(); } catch (_) {}
    if(!r.ok){
      alert(d.message || `Failed to save profile (HTTP ${r.status}). Check if backend is running on 5000 and proxy is set.`);
      return;
    }
    setProfile(d); setForm(d); setEditing(false);
  };

  const update = (section, key, value)=>{
    setForm(prev=>({ ...prev, [section]:{ ...(prev?.[section]||{}), [key]:value } }));
  };

  const addArrayItem = (section, newItem)=>{
    setForm(prev=>({ ...prev, [section]: [ ...(prev?.[section]||[]), newItem ] }));
  };

  const updateArrayItem = (section, index, key, value)=>{
    setForm(prev=>({
      ...prev,
      [section]: (prev?.[section]||[]).map((it,i)=> i===index ? { ...it, [key]: value } : it)
    }));
  };

  const removeArrayItem = (section, index)=>{
    setForm(prev=>({ ...prev, [section]: (prev?.[section]||[]).filter((_,i)=> i!==index) }));
  };

  const addSkill = (type, value)=>{
    if(!value) return;
    setForm(prev=>({ ...prev, skills:{ ...(prev.skills||{ technical:[], soft:[] }), [type]: [ ...(prev.skills?.[type]||[]), value ] } }));
  };

  const removeSkill = (type, index)=>{
    setForm(prev=>({ ...prev, skills:{ ...(prev.skills||{ technical:[], soft:[] }), [type]: (prev.skills?.[type]||[]).filter((_,i)=>i!==index) } }));
  };

  const uploadResume = async (file)=>{
    if(!file) return;
    // demo: create blob url; in production upload to storage and use returned URL
    const fileUrl = URL.createObjectURL(file);
    const token = localStorage.getItem("token");
    const r = await fetch("/api/jobseeker/profile/resume",{
      method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ fileName:file.name, fileUrl })
    });
    const d = await r.json();
    if(r.ok){ setProfile(d.profile); setForm(d.profile); } else { alert(d.message||"Resume upload failed"); }
  };

  const tabBtn = (id,label)=> (
    <button onClick={()=>setActiveTab(id)} className={`px-3 py-2 text-sm rounded ${activeTab===id?"bg-blue-600 text-white":"bg-white border"}`}>{label}</button>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <div className="space-x-2">
          {!editing && (<button onClick={()=>setEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded">Edit</button>)}
          {editing && (<>
            <button onClick={()=>setEditing(false)} className="px-4 py-2 border rounded">Cancel</button>
            <button onClick={save} className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
          </>)}
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {tabBtn("personal","Personal")}
        {tabBtn("skills","Skills")}
        {tabBtn("education","Education")}
        {tabBtn("experience","Experience")}
        {tabBtn("resume","Resume")}
      </div>

      <div className="bg-white border rounded p-6">
        {activeTab==="personal" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded px-3 py-2" placeholder="First name" disabled={!editing}
              value={form?.personalInfo?.firstName||""}
              onChange={e=>update("personalInfo","firstName",e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Last name" disabled={!editing}
              value={form?.personalInfo?.lastName||""}
              onChange={e=>update("personalInfo","lastName",e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Mobile (10 digits)" disabled={!editing}
              value={form?.personalInfo?.phone||""}
              onChange={e=>{
                const value = e.target.value;
                if (value.length <= 10 && /^\d*$/.test(value)) {
                  update("personalInfo","phone",value);
                }
              }} />
            <input className="border rounded px-3 py-2" placeholder="Location" disabled={!editing}
              value={form?.personalInfo?.address?.city||""}
              onChange={e=>update("personalInfo","address",{ ...(form?.personalInfo?.address||{}), city:e.target.value })} />
          </div>
        )}


        {activeTab==="skills" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Technical Skills</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {(form.skills?.technical||[]).map((s,i)=> (
                  <span key={i} className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-sm">
                    {s}
                    {editing && (<button onClick={()=>removeSkill("technical",i)} className="ml-2 text-blue-700">×</button>)}
                  </span>
                ))}
              </div>
              {editing && (
                <input className="border rounded px-3 py-2" placeholder="Add a skill" onKeyDown={e=>{
                  if(e.key==="Enter"){ e.preventDefault(); addSkill("technical", e.currentTarget.value.trim()); e.currentTarget.value=""; }
                }} />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Soft Skills</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {(form.skills?.soft||[]).map((s,i)=> (
                  <span key={i} className="px-2 py-1 rounded bg-amber-50 text-amber-700 text-sm">
                    {s}
                    {editing && (<button onClick={()=>removeSkill("soft",i)} className="ml-2 text-amber-700">×</button>)}
                  </span>
                ))}
              </div>
              {editing && (
                <input className="border rounded px-3 py-2" placeholder="Add a soft skill" onKeyDown={e=>{
                  if(e.key==="Enter"){ e.preventDefault(); addSkill("soft", e.currentTarget.value.trim()); e.currentTarget.value=""; }
                }} />
              )}
            </div>
          </div>
        )}

        {activeTab==="education" && (
          <div className="space-y-4">
            {(form.education||[]).map((ed,i)=> (
              <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start border rounded p-3">
                <input className="border rounded px-3 py-2" placeholder="Institution name" disabled={!editing} value={ed.institution||""} onChange={e=>updateArrayItem("education",i,"institution",e.target.value)} />
                <input className="border rounded px-3 py-2" placeholder="Degree" disabled={!editing} value={ed.degree||""} onChange={e=>updateArrayItem("education",i,"degree",e.target.value)} />
                <input className="border rounded px-3 py-2" placeholder="Start date" disabled={!editing} value={ed.startDate?ed.startDate.toString().substring(0,10):""} onChange={e=>updateArrayItem("education",i,"startDate",e.target.value)} />
                <input className="border rounded px-3 py-2" placeholder="End date" disabled={!editing} value={ed.endDate?ed.endDate.toString().substring(0,10):""} onChange={e=>updateArrayItem("education",i,"endDate",e.target.value)} />
                {editing && (<button onClick={()=>removeArrayItem("education",i)} className="px-3 py-2 border rounded">Remove</button>)}
              </div>
            ))}
            {editing && (<button onClick={()=>addArrayItem("education",{ institution:"", degree:"" })} className="px-4 py-2 border rounded">Add education</button>)}
          </div>
        )}

        {activeTab==="experience" && (
          <div className="space-y-4">
            {(form.experience||[]).map((ex,i)=> (
              <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start border rounded p-3">
                <input className="border rounded px-3 py-2" placeholder="Company name" disabled={!editing} value={ex.company||""} onChange={e=>updateArrayItem("experience",i,"company",e.target.value)} />
                <input className="border rounded px-3 py-2" placeholder="Position" disabled={!editing} value={ex.position||""} onChange={e=>updateArrayItem("experience",i,"position",e.target.value)} />
                <input className="border rounded px-3 py-2" placeholder="Location" disabled={!editing} value={ex.location||""} onChange={e=>updateArrayItem("experience",i,"location",e.target.value)} />
                <input className="border rounded px-3 py-2" placeholder="Start date" disabled={!editing} value={ex.startDate?ex.startDate.toString().substring(0,10):""} onChange={e=>updateArrayItem("experience",i,"startDate",e.target.value)} />
                <input className="border rounded px-3 py-2" placeholder="End date" disabled={!editing} value={ex.endDate?ex.endDate.toString().substring(0,10):""} onChange={e=>updateArrayItem("experience",i,"endDate",e.target.value)} />
                {editing && (<button onClick={()=>removeArrayItem("experience",i)} className="px-3 py-2 border rounded">Remove</button>)}
              </div>
            ))}
            {editing && (<button onClick={()=>addArrayItem("experience",{ company:"", position:"" })} className="px-4 py-2 border rounded">Add experience</button>)}
          </div>
        )}

        {activeTab==="resume" && (
          <div>
            {form?.resume?.fileUrl ? (
              <div className="flex items-center justify-between border rounded p-3">
                <div className="text-sm">
                  <div className="font-medium">{form.resume.fileName}</div>
                  <div className="text-gray-500">Uploaded</div>
                </div>
                <div className="space-x-2">
                  <a href={form.resume.fileUrl} target="_blank" rel="noreferrer" className="px-3 py-2 border rounded">View</a>
                  {editing && <button onClick={()=>resumeInputRef.current?.click()} className="px-3 py-2 bg-blue-600 text-white rounded">Replace</button>}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">No resume uploaded.</div>
            )}
            {editing && (
              <>
                <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e=>uploadResume(e.target.files?.[0])} />
                <button onClick={()=>resumeInputRef.current?.click()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Upload Resume</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


