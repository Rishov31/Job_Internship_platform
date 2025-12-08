import React, { useState, useEffect } from 'react';
import { applyToJob } from '../api/applicationApi';

export default function ApplicationFormModal({ job, isOpen, onClose, onSuccess }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [resume, setResume] = useState(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Load user profile to get resume
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      fetch(`${API_BASE}/jobseeker/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      })
        .then(r => r.json())
        .then(data => {
          setProfile(data);
          if (data.resume?.fileUrl) {
            setResumeUrl(data.resume.fileUrl);
          }
        })
        .catch(() => {});
    } else {
      // Reset form when modal closes
      setCoverLetter('');
      setResume(null);
      setResumeUrl('');
      setError('');
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }
      setResume(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let resumeData = null;
      
      // If new resume file is selected, upload it
      if (resume) {
        // For now, we'll use the existing resume from profile
        // In production, you'd upload the file to cloud storage first
        resumeData = {
          fileName: resume.name,
          fileUrl: resumeUrl || profile?.resume?.fileUrl || ''
        };
      } else if (profile?.resume?.fileUrl) {
        resumeData = profile.resume;
      }

      const applicationData = {
        coverLetter: coverLetter.trim(),
        resume: resumeData,
        isScraped: job.isScraped || false
      };

      await applyToJob(job._id, applicationData);
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      
      // Reset form
      setCoverLetter('');
      setResume(null);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Apply for {job?.title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">{job?.company} · {job?.location}</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Cover Letter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Letter <span className="text-gray-400">(Optional)</span>
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={8}
                maxLength={2000}
                placeholder="Tell the employer why you're a great fit for this position..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {coverLetter.length}/2000 characters
              </div>
            </div>

            {/* Resume */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resume
              </label>
              {profile?.resume?.fileUrl ? (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-700">{profile.resume.fileName || 'Resume.pdf'}</span>
                    </div>
                    <a 
                      href={profile.resume.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 text-sm hover:underline"
                    >
                      View
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-3">
                  No resume uploaded. Please upload a resume to apply.
                </p>
              )}
              
              <label className="block">
                <span className="sr-only">Upload resume</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: PDF, DOC, DOCX (Max 5MB)
              </p>
            </div>

            {/* Application Info */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Application Information</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>• Your profile information will be shared with the employer</p>
                <p>• You can track your application status in your dashboard</p>
                <p>• The employer will be notified of your application</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || (!profile?.resume?.fileUrl && !resume)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

