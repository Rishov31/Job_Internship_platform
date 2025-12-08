import React, { useEffect, useMemo, useRef, useState } from "react";

export default function JobSeekerProfile(){
  const [profile,setProfile] = useState(null);
  const [form,setForm] = useState({
    personalInfo:{ address:{} },
    professionalInfo:{},
    skills:{ technical:[], soft:[] },
    education:[],
    experience:[],
    resume:{},
    preferences:{ jobCategories:[], locations:[], jobAlerts:true }
  });
  const [editing,setEditing] = useState(true);
  const [activeTab,setActiveTab] = useState("personal");
  const [completion,setCompletion] = useState({ completionPercentage:0, isProfileComplete:false });
  const [errors,setErrors] = useState({});
  const resumeInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  useEffect(()=>{
    const token = localStorage.getItem("token");
    fetch("/api/jobseeker/profile",{ headers:{ Authorization:`Bearer ${token}` }}).then(async r=>{
      if(r.status===404){ setProfile(null); return; }
      const d = await r.json(); setProfile(d); setForm(prev=>({ ...prev, ...d }));
    }).catch(()=>{});
    fetch("/api/jobseeker/profile/completion",{ headers:{ Authorization:`Bearer ${token}` }}).then(r=>r.json()).then((c)=>{
      setCompletion(c);
      // if not complete, keep the form in editing mode by default
      setEditing(!c.isProfileComplete);
    }).catch(()=>{});
  },[]);

  const validate = ()=>{
    const e = {};
    if(!(form?.personalInfo?.firstName||"").trim()) e.firstName = "Required";
    if(!(form?.personalInfo?.lastName||"").trim()) e.lastName = "Required";
    const ph = form?.personalInfo?.phone||"";
    if(ph && !/^\d{10}$/.test(ph)) e.phone = "Enter 10 digits";
    return e;
  };

  const save = async ()=>{
    const e = validate();
    setErrors(e); if(Object.keys(e).length) return;
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
    setProfile(d); setForm(prev=>({ ...prev, ...d }));
    fetch("/api/jobseeker/profile/completion",{ headers:{ Authorization:`Bearer ${token}` }})
      .then(r=>r.json())
      .then((c)=>{ setCompletion(c); setEditing(!c.isProfileComplete); })
      .catch(()=>{});
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

  const uploadAvatar = async (file)=>{
    if(!file) return;
    const fileUrl = URL.createObjectURL(file);
    setForm(prev=>({ ...prev, personalInfo:{ ...(prev.personalInfo||{}), profilePicture:fileUrl }}));
  };

  const tabBtn = (id,label)=> (
    <button onClick={()=>setActiveTab(id)} className={`px-3 py-2 text-sm rounded ${activeTab===id?"bg-blue-600 text-white":"bg-white border"}`}>{label}</button>
  );

  const initials = useMemo(()=>{
    const f = form?.personalInfo?.firstName||""; const l = form?.personalInfo?.lastName||"";
    return `${f[0]||""}${l[0]||""}`.toUpperCase();
  },[form]);

  // Live completion (match backend calc) while editing
  const liveCompletion = useMemo(()=>{
    const p = form || {};
    let s = 0;
    if(p.personalInfo?.firstName && p.personalInfo?.lastName) s+=20;
    if((p.skills?.technical||[]).length) s+=15;
    if((p.education||[]).length) s+=15;
    if((p.experience||[]).length) s+=15;
    if(p.resume?.fileUrl) s+=20;
    if(p.professionalInfo?.currentTitle) s+=15;
    return Math.min(s,100);
  },[form]);

  // helper: format to yyyy-MM-dd for input[type=date]
  const dateStr = (v)=>{
    if(!v) return "";
    const d = new Date(v);
    if(isNaN(d.getTime())) return "";
    return d.toISOString().substring(0,10);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <div className="space-x-2">
          {completion.isProfileComplete ? (
            !editing ? (
              <button onClick={()=>setEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded">Edit</button>
            ) : (
              <>
                <button onClick={()=>setEditing(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button onClick={save} className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
              </>
            )
          ) : (
            // Incomplete profile -> always editing, only show Save
            <button onClick={save} className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
          )}
        </div>
      </div>

      {/* Header card */}
      <div className="bg-white border rounded p-5 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            {form?.personalInfo?.profilePicture ? (
              <img src={form.personalInfo.profilePicture} alt="avatar" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-semibold">{initials||"?"}</div>
            )}
            {editing && (
              <button className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded" onClick={()=>avatarInputRef.current?.click()}>Edit</button>
            )}
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={e=>uploadAvatar(e.target.files?.[0])} />
          </div>
          <div>
            <div className="font-medium">{form?.personalInfo?.firstName||""} {form?.personalInfo?.lastName||""}</div>
            <div className="text-sm text-gray-500">{form?.professionalInfo?.currentTitle||"Add your title"}</div>
          </div>
        </div>
        <div className="min-w-[220px]">
          <div className="flex items-center justify-between text-sm mb-1"><span>Completion</span><span>{editing ? liveCompletion : completion.completionPercentage}%</span></div>
          <div className="w-full bg-gray-100 h-2 rounded"><div className="h-2 bg-blue-600 rounded" style={{width:`${editing ? liveCompletion : completion.completionPercentage}%`}}></div></div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {tabBtn("personal","Personal")}
        {tabBtn("professional","Professional")}
        {tabBtn("skills","Skills")}
        {tabBtn("education","Education")}
        {tabBtn("experience","Experience")}
        {tabBtn("resume","Resume")}
        {tabBtn("preferences","Preferences")}
      </div>

      <div className="bg-white border rounded p-6">
        {activeTab==="personal" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className={`border rounded px-3 py-2 ${errors.firstName?"border-red-500":""}`} placeholder="First name" disabled={!editing}
              value={form?.personalInfo?.firstName||""}
              onChange={e=>update("personalInfo","firstName",e.target.value)} />
            <input className={`border rounded px-3 py-2 ${errors.lastName?"border-red-500":""}`} placeholder="Last name" disabled={!editing}
              value={form?.personalInfo?.lastName||""}
              onChange={e=>update("personalInfo","lastName",e.target.value)} />
            <input className={`border rounded px-3 py-2 ${errors.phone?"border-red-500":""}`} placeholder="Mobile (10 digits)" disabled={!editing}
              value={form?.personalInfo?.phone||""}
              onChange={e=>{
                const value = e.target.value;
                if (value.length <= 10 && /^\d*$/.test(value)) {
                  update("personalInfo","phone",value);
                }
              }} />
            <input type="date" className="border rounded px-3 py-2" disabled={!editing}
              value={form?.personalInfo?.dateOfBirth?String(form.personalInfo.dateOfBirth).substring(0,10):""}
              onChange={e=>update("personalInfo","dateOfBirth",e.target.value)} />
            <select className="border rounded px-3 py-2" disabled={!editing}
              value={form?.personalInfo?.gender||""}
              onChange={e=>update("personalInfo","gender",e.target.value)}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
            <input className="border rounded px-3 py-2" placeholder="Location" disabled={!editing}
              value={form?.personalInfo?.address?.city||""}
              onChange={e=>update("personalInfo","address",{ ...(form?.personalInfo?.address||{}), city:e.target.value })} />
          </div>
        )}

        {activeTab==="professional" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded px-3 py-2" placeholder="Current title" disabled={!editing}
              value={form?.professionalInfo?.currentTitle||""}
              onChange={e=>update("professionalInfo","currentTitle",e.target.value)} />
            <input type="number" min="0" className="border rounded px-3 py-2" placeholder="Years of experience" disabled={!editing}
              value={form?.professionalInfo?.yearsOfExperience??""}
              onChange={e=>update("professionalInfo","yearsOfExperience",Number(e.target.value||0))} />
            <select multiple className="border rounded px-3 py-2 h-28" disabled={!editing}
              value={form?.professionalInfo?.jobType||[]}
              onChange={e=>{ const vals=[...e.target.selectedOptions].map(o=>o.value); update("professionalInfo","jobType",vals); }}>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="freelance">Freelance</option>
            </select>
            <select className="border rounded px-3 py-2" disabled={!editing}
              value={form?.professionalInfo?.workLocation||"on-site"}
              onChange={e=>update("professionalInfo","workLocation",e.target.value)}>
              <option value="on-site">On-site</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <input className="border rounded px-3 py-2" placeholder="Notice period" disabled={!editing}
              value={form?.professionalInfo?.noticePeriod||""}
              onChange={e=>update("professionalInfo","noticePeriod",e.target.value)} />
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
                <input type="date" className="border rounded px-3 py-2" disabled={!editing} value={dateStr(ed.startDate)} onChange={e=>updateArrayItem("education",i,"startDate",e.target.value)} />
                <input type="date" className="border rounded px-3 py-2" disabled={!editing} value={dateStr(ed.endDate)} onChange={e=>updateArrayItem("education",i,"endDate",e.target.value)} />
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
                <input type="date" className="border rounded px-3 py-2" disabled={!editing} value={dateStr(ex.startDate)} onChange={e=>updateArrayItem("experience",i,"startDate",e.target.value)} />
                <input type="date" className="border rounded px-3 py-2" disabled={!editing} value={dateStr(ex.endDate)} onChange={e=>updateArrayItem("experience",i,"endDate",e.target.value)} />
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
        {activeTab==="preferences" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded px-3 py-2" placeholder="Preferred locations (comma separated)" disabled={!editing}
              value={(form?.preferences?.locations||[]).join(", ")}
              onChange={e=>setForm(prev=>({ ...prev, preferences:{ ...(prev.preferences||{}), locations: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) }}))} />
            <input className="border rounded px-3 py-2" placeholder="Preferred categories (comma separated)" disabled={!editing}
              value={(form?.preferences?.jobCategories||[]).join(", ")}
              onChange={e=>setForm(prev=>({ ...prev, preferences:{ ...(prev.preferences||{}), jobCategories: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) }}))} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" disabled={!editing} checked={!!form?.preferences?.jobAlerts}
                onChange={e=>setForm(prev=>({ ...prev, preferences:{ ...(prev.preferences||{}), jobAlerts: e.target.checked }}))} />
              Receive job alerts
            </label>
          </div>
        )}
      </div>
    </div>
  );
}


