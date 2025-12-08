import React, { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getJobById, saveJob, unsaveJob, checkSavedJobs } from "../../api/jobApi";
import ApplicationFormModal from "../../components/ApplicationFormModal";
import { checkApplication } from "../../api/applicationApi";

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    loadJobDetails();
  }, [id]);

  useEffect(() => {
    if (job) {
      checkSavedStatus();
      checkApplicationStatus();
    }
  }, [job]);

  const checkApplicationStatus = async () => {
    if (!job || job.isScraped) return; // Don't check for scraped jobs
    
    try {
      const data = await checkApplication(job._id, job.isScraped);
      setHasApplied(data.applied || false);
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const handleApplicationSuccess = () => {
    setHasApplied(true);
    // Optionally reload job to update application count
    loadJobDetails();
  };

  const loadJobDetails = async () => {
    try {
      setLoading(true);
        const data = await getJobById(id);
        setJob(data);
    } catch (error) {
      console.error('Error loading job details:', error);
      setError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

  const checkSavedStatus = async () => {
    try {
      const data = await checkSavedJobs([job._id], job.isScraped);
      setSaved(data.savedJobs.includes(job._id));
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleSaveJob = async () => {
    try {
      if (saved) {
        await unsaveJob(job._id, job.isScraped);
        setSaved(false);
      } else {
        await saveJob(job._id, job.isScraped);
        setSaved(true);
      }
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const getCompanyLogo = (company) => {
    const logos = {
      'Dobby Ads': 'https://ui-avatars.com/api/?name=Dobby&background=random',
      'Google': 'https://logo.clearbit.com/google.com',
      'Microsoft': 'https://logo.clearbit.com/microsoft.com',
      'Apple': 'https://logo.clearbit.com/apple.com'
    };
    
    return logos[company] || `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=random`;
  };

  const formatDate = (date) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    });
  };

  const getTimeAgo = (date) => {
    if (!date) return 'Recently posted';
    const now = new Date();
    const jobDate = new Date(date);
    const diffInDays = Math.floor((now - jobDate) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const formatSalary = (job) => {
    if (job.salary?.text) {
      return job.salary.text;
    }
    
    if (job.salary?.annualCTCMin && job.salary?.annualCTCMax) {
      return `₹${job.salary.annualCTCMin.toLocaleString()} - ${job.salary.annualCTCMax.toLocaleString()}`;
    }
    
    if (job.salary?.min && job.salary?.max) {
      return `₹${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}`;
    }
    
    return 'Salary not specified';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading job details...</div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">❌ {error || 'Job not found'}</div>
          <button 
            onClick={() => navigate('/jobseeker/jobs')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/jobseeker/jobs')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Jobs
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSaveJob}
              className={`p-2 rounded-lg ${saved ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <svg className="w-5 h-5" fill={saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Job Header */}
          <div className="p-8 border-b">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                  {job.isUrgent && (
                    <span className="bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded-full">
                      Urgent
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-gray-600 mb-4">
                  <span className="text-lg">{job.company}</span>
                  <img 
                    src={getCompanyLogo(job.company)} 
                    alt={job.company} 
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>{job.isRemote ? 'Work from home' : job.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>START DATE: {job.startDate || 'Immediately'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>CTC (ANNUAL): {formatSalary(job)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                    <span>EXPERIENCE: {job.experience?.min || 0} year(s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>APPLY BY: {formatDate(job.applicationDeadline)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">{getTimeAgo(job.createdAt || job.lastScraped)}</span>
                {job.isFresher && (
                  <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                    Fresher Job
                  </span>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{job.applicationsCount || Math.floor(Math.random() * 100) + 1} applicants</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSaveJob}
                  className={`p-2 rounded-lg ${saved ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <svg className="w-5 h-5" fill={saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
                <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
                {hasApplied ? (
                  <button 
                    disabled
                    className="bg-gray-400 text-white px-6 py-2 rounded-lg font-medium cursor-not-allowed"
                  >
                    Already Applied
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowApplicationForm(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Apply now
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Job Content */}
          <div className="p-8">
            {job.isScraped && (job.fullDetailsHtml || job.descriptionHtml) ? (
              <div
                className="prose max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.fullDetailsHtml || job.descriptionHtml) }}
              />
            ) : (
              <>
                {/* Skills Required */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Skill(s) required:</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills && job.skills.length > 0 ? (
                      job.skills.map((skill, index) => (
                        <span 
                          key={index}
                          className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 italic">No specific skills mentioned</span>
                    )}
                  </div>
                </div>

                {/* About the Job */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">About the job:</h2>
                  {job.description ? (
                    <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {job.description.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="mb-4">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No job description available</p>
                  )}
                </div>

                {/* Key Responsibilities */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Key Responsibilities:</h2>
                  {job.keyResponsibilities && job.keyResponsibilities.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-2">
                      {job.keyResponsibilities.map((responsibility, index) => (
                        <li key={index} className="text-gray-700">{responsibility}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-gray-500 italic">No specific responsibilities mentioned</p>
                  )}
                </div>

                {/* Work Environment Requirements */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Work environment requirements:</h2>
                  {job.workEnvironmentRequirements && job.workEnvironmentRequirements.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-2">
                      {job.workEnvironmentRequirements.map((requirement, index) => (
                        <li key={index} className="text-gray-700">{requirement}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-gray-500 italic">No specific work environment requirements mentioned</p>
                  )}
                </div>

                {/* Other Requirements */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Other requirements:</h2>
                  {job.otherRequirements && job.otherRequirements.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-2">
                      {job.otherRequirements.map((requirement, index) => (
                        <li key={index} className="text-gray-700">{requirement}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-gray-500 italic">No additional requirements mentioned</p>
                  )}
                </div>

                {/* Requirements */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Requirement:</h2>
                  {job.requirements && job.requirements.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-2">
                      {job.requirements.map((requirement, index) => (
                        <li key={index} className="text-gray-700">{requirement}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-gray-500 italic">No specific requirements mentioned</p>
                  )}
                </div>

                {/* Education Qualification */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Education qualification:</h2>
                  {job.educationQualifications && job.educationQualifications.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-2">
                      {job.educationQualifications.map((qualification, index) => (
                        <li key={index} className="text-gray-700">{qualification}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-gray-500 italic">No specific education requirements mentioned</p>
                  )}
                </div>

                {/* Why Company */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Why {job.company}?</h2>
                  {job.whyCompany && job.whyCompany.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-2">
                      {job.whyCompany.map((benefit, index) => (
                        <li key={index} className="text-gray-700">{benefit}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-gray-500 italic">No specific company benefits mentioned</p>
                  )}
                </div>

                {/* Salary Details */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Salary:</h2>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Probation:</h3>
                      <div className="text-gray-700">
                        <p>Duration: {job.salary?.probationDuration || '3 months'}</p>
                        {job.salary?.probationSalaryMin && job.salary?.probationSalaryMax ? (
                          <p>
                            Salary during probation: ₹{job.salary.probationSalaryMin.toLocaleString()} - {job.salary.probationSalaryMax.toLocaleString()}/month
                            {job.isFresher && <span className="text-sm text-gray-500"> (only for freshers)</span>}
                          </p>
                        ) : (
                          <p className="text-gray-500 italic">Probation salary not specified</p>
                        )}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">After probation:</h3>
                      {job.salary?.annualCTCMin && job.salary?.annualCTCMax ? (
                        <p className="text-gray-700">
                          Annual CTC: ₹{job.salary.annualCTCMin.toLocaleString()} - {job.salary.annualCTCMax.toLocaleString()}/year
                        </p>
                      ) : (
                        <p className="text-gray-500 italic">Annual CTC not specified</p>
                      )}
                    </div>
                    <div className="mt-4">
                      <p className="text-gray-700">
                        <strong>Number of openings:</strong> {job.numberOfOpenings || 1}
                      </p>
                    </div>
                  </div>
                </div>

                {/* About Company */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">About {job.company}</h2>
                  {job.companyDetails?.description ? (
                    <p className="text-gray-700 leading-relaxed">{job.companyDetails.description}</p>
                  ) : (
                    <p className="text-gray-500 italic">No company description available</p>
                  )}
                </div>

                {/* Activity on Platform */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Activity on Platform</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-500">Hiring since</p>
                        <p className="font-semibold">{job.companyDetails?.hiringSince || 'January 2020'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-500">Opportunities posted</p>
                        <p className="font-semibold">{job.companyDetails?.opportunitiesPosted || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-500">Candidates hired</p>
                        <p className="font-semibold">{job.companyDetails?.candidatesHired || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Apply Button Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {job.isScraped ? (
                  <span>This job is from {job.source}. Apply directly on their platform.</span>
                ) : (
                  <span>Apply through our platform for better tracking and updates.</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSaveJob}
                  className={`px-4 py-2 rounded-lg ${saved ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {saved ? 'Saved' : 'Save Job'}
                </button>
                {job.isScraped ? (
                  <a 
                    href={job.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Apply on {job.source}
                  </a>
                ) : hasApplied ? (
                  <button 
                    disabled
                    className="bg-gray-400 text-white px-6 py-2 rounded-lg font-medium cursor-not-allowed"
                  >
                    Already Applied
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowApplicationForm(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Apply now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Form Modal */}
      {!job.isScraped && (
        <ApplicationFormModal
          job={job}
          isOpen={showApplicationForm}
          onClose={() => setShowApplicationForm(false)}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
}