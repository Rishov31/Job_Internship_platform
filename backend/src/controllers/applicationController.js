const Application = require("../models/Application");
const Job = require("../models/Job");
const JobSeekerProfile = require("../models/JobSeekerProfile");

exports.apply = async (req,res,next)=>{
  try{
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if(!job || job.status !== 'active') return res.status(404).json({ message: "Job not found" });
    const profile = await JobSeekerProfile.findOne({ user: req.user.id });
    if(!profile) return res.status(400).json({ message: "Complete profile before applying" });
    const exists = await Application.findOne({ job: jobId, applicant: req.user.id });
    if(exists) return res.status(400).json({ message: "Already applied" });

    const app = await Application.create({
      job: jobId,
      applicant: req.user.id,
      jobSeekerProfile: profile._id,
      coverLetter: req.body.coverLetter,
      resume: req.body.resume || profile.resume,
    });
    await Job.findByIdAndUpdate(jobId,{ $inc:{ applicationsCount:1 }});
    res.status(201).json({ message:"Applied", application: app });
  }catch(e){ next(e); }
};


