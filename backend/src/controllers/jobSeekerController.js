const JobSeekerProfile = require("../models/JobSeekerProfile");
const Application = require("../models/Application");

function calcCompletion(p){
  if(!p) return 0; let s = 0;
  if(p.personalInfo?.firstName && p.personalInfo?.lastName) s+=20;
  if((p.skills?.technical||[]).length) s+=15;
  if((p.education||[]).length) s+=15;
  if((p.experience||[]).length) s+=15;
  if(p.resume?.fileUrl) s+=20;
  if(p.professionalInfo?.currentTitle) s+=15;
  return Math.min(s,100);
}

exports.getProfile = async (req,res,next)=>{
  try{
    const profile = await JobSeekerProfile.findOne({ user: req.user.id });
    if(!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  }catch(e){ next(e); }
};

exports.upsertProfile = async (req,res,next)=>{
  try{
    const data = req.body;
    const profile = await JobSeekerProfile.findOneAndUpdate(
      { user: req.user.id },
      { ...data, user: req.user.id },
      { upsert: true, new: true, runValidators: true }
    );
    const pct = calcCompletion(profile);
    profile.isProfileComplete = pct >= 70; profile.profileCompletionPercentage = pct;
    await profile.save();
    res.json(profile);
  }catch(e){ next(e); }
};

exports.sectionUpdate = async (req,res,next)=>{
  try{
    const { section } = req.params;
    const allowed = new Set(["personalInfo","professionalInfo","education","experience","skills","resume","preferences"]);
    if(!allowed.has(section)) return res.status(400).json({ message: "Invalid section" });
    const profile = await JobSeekerProfile.findOneAndUpdate(
      { user: req.user.id }, { [section]: req.body }, { new: true, upsert: true }
    );
    const pct = calcCompletion(profile);
    profile.isProfileComplete = pct >= 70; profile.profileCompletionPercentage = pct;
    await profile.save();
    res.json(profile);
  }catch(e){ next(e); }
};

exports.uploadResume = async (req,res,next)=>{
  try{
    const { fileName, fileUrl } = req.body;
    if(!fileName || !fileUrl) return res.status(400).json({ message: "fileName and fileUrl are required" });
    const profile = await JobSeekerProfile.findOneAndUpdate(
      { user: req.user.id },
      { resume: { fileName, fileUrl, uploadedAt: new Date() } },
      { new: true, upsert: true }
    );
    const pct = calcCompletion(profile);
    profile.isProfileComplete = pct >= 70; profile.profileCompletionPercentage = pct;
    await profile.save();
    res.json({ message: "Resume updated", profile });
  }catch(e){ next(e); }
};

exports.completion = async (req,res,next)=>{
  try{
    const profile = await JobSeekerProfile.findOne({ user: req.user.id });
    if(!profile) return res.json({ hasProfile:false, completionPercentage:0, isProfileComplete:false });
    const pct = calcCompletion(profile);
    res.json({ hasProfile:true, completionPercentage:pct, isProfileComplete: pct>=70 });
  }catch(e){ next(e); }
};

exports.myApplications = async (req,res,next)=>{
  try{
    const apps = await Application.find({ applicant: req.user.id }).populate("job","title company location jobType").sort({ createdAt:-1 });
    res.json({ applications: apps });
  }catch(e){ next(e); }
};


