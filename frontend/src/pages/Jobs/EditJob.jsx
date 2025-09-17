import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getJobById, updateJob } from "../../api/jobApi";

export default function EditJob() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    company: "",
    location: "",
    jobType: "private",
    category: "",
    experience: { min: 0, max: 2 },
    salary: { min: "", max: "", currency: "INR", period: "monthly" },
    skills: [],
    requirements: [],
    benefits: [],
    applicationDeadline: "",
    isRemote: false,
    companyDetails: {
      website: "",
      logo: "",
      description: "",
      size: "",
      industry: "",
    },
  });

  const [skillsInput, setSkillsInput] = useState("");
  const [requirementsInput, setRequirementsInput] = useState("");
  const [benefitsInput, setBenefitsInput] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getJobById(id);
        // Normalize certain fields
        setForm({
          title: data.title || "",
          description: data.description || "",
          company: data.company || "",
          location: data.location || "",
          jobType: data.jobType || "private",
          category: data.category || "",
          experience: data.experience || { min: 0, max: 2 },
          salary: data.salary || { min: "", max: "", currency: "INR", period: "monthly" },
          skills: Array.isArray(data.skills) ? data.skills : [],
          requirements: Array.isArray(data.requirements) ? data.requirements : [],
          benefits: Array.isArray(data.benefits) ? data.benefits : [],
          applicationDeadline: data.applicationDeadline ? data.applicationDeadline.substring(0, 10) : "",
          isRemote: !!data.isRemote,
          companyDetails: {
            website: data.companyDetails?.website || "",
            logo: data.companyDetails?.logo || "",
            description: data.companyDetails?.description || "",
            size: data.companyDetails?.size || "",
            industry: data.companyDetails?.industry || "",
          },
        });
      } catch (e) {
        console.error(e);
        setError("Failed to load job. It may have been removed or you don't have access.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setForm(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: type === "checkbox" ? checked : value }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
  };

  const addToArray = (field, input, setInput) => {
    if (input.trim()) {
      setForm(prev => ({ ...prev, [field]: [...prev[field], input.trim()] }));
      setInput("");
    }
  };

  const removeFromArray = (field, index) => {
    setForm(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const jobData = {
        ...form,
        skills: form.skills.filter(Boolean),
        requirements: form.requirements.filter(Boolean),
        benefits: form.benefits.filter(Boolean),
        salary: {
          ...form.salary,
          min: form.salary.min ? parseInt(form.salary.min) : undefined,
          max: form.salary.max ? parseInt(form.salary.max) : undefined,
        },
        applicationDeadline: form.applicationDeadline || undefined,
      };
      await updateJob(id, jobData);
      navigate("/employer/jobs");
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to update job");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-sky-600 font-extrabold text-xl">HireMe</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-700 font-medium">Edit Job</span>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/jobs/${id}`} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">View</Link>
              <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm">Back</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h1 className="text-2xl font-bold text-gray-900">Edit Job</h1>
            <p className="text-gray-600 mt-1">Update your job posting details</p>
          </div>

          {error && (
            <div className="mx-6 mt-4 mb-2 p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                  <input type="text" name="title" value={form.title} onChange={handleChange} required className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                  <input type="text" name="company" value={form.company} onChange={handleChange} required className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input type="text" name="location" value={form.location} onChange={handleChange} required className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Type *</label>
                  <select name="jobType" value={form.jobType} onChange={handleChange} required className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option value="private">Private Sector</option>
                    <option value="government">Government</option>
                    <option value="overseas">Overseas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <input type="text" name="category" value={form.category} onChange={handleChange} required className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" name="isRemote" checked={form.isRemote} onChange={handleChange} className="mr-2" />
                  <label className="text-sm font-medium text-gray-700">Remote Work Available</label>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={6} required className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>

            {/* Experience & Salary */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Experience & Salary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Experience (years)</label>
                  <input type="number" name="experience.min" value={form.experience.min} onChange={handleChange} min="0" className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Experience (years)</label>
                  <input type="number" name="experience.max" value={form.experience.max} onChange={handleChange} min="0" className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Salary</label>
                  <input type="number" name="salary.min" value={form.salary.min} onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Salary</label>
                  <input type="number" name="salary.max" value={form.salary.max} onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select name="salary.currency" value={form.salary.currency} onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Period</label>
                  <select name="salary.period" value={form.salary.period} onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('skills', skillsInput, setSkillsInput))} className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Add a skill and press Enter" />
                <button type="button" onClick={() => addToArray('skills', skillsInput, setSkillsInput)} className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.skills.map((skill, index) => (
                  <span key={index} className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {skill}
                    <button type="button" onClick={() => removeFromArray('skills', index)} className="text-sky-600 hover:text-sky-800">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={requirementsInput} onChange={(e) => setRequirementsInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('requirements', requirementsInput, setRequirementsInput))} className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Add a requirement and press Enter" />
                <button type="button" onClick={() => addToArray('requirements', requirementsInput, setRequirementsInput)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.requirements.map((req, index) => (
                  <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {req}
                    <button type="button" onClick={() => removeFromArray('requirements', index)} className="text-green-600 hover:text-green-800">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Benefits & Perks</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={benefitsInput} onChange={(e) => setBenefitsInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('benefits', benefitsInput, setBenefitsInput))} className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Add a benefit and press Enter" />
                <button type="button" onClick={() => addToArray('benefits', benefitsInput, setBenefitsInput)} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.benefits.map((benefit, index) => (
                  <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {benefit}
                    <button type="button" onClick={() => removeFromArray('benefits', index)} className="text-purple-600 hover:text-purple-800">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Company Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input type="url" name="companyDetails.website" value={form.companyDetails.website} onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="https://company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                  <input type="text" name="companyDetails.size" value={form.companyDetails.size} onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="e.g., 51-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <input type="text" name="companyDetails.industry" value={form.companyDetails.industry} onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="e.g., Technology" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label>
                  <input type="date" name="applicationDeadline" value={form.applicationDeadline} onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Description</label>
                <textarea name="companyDetails.description" value={form.companyDetails.description} onChange={handleChange} rows={3} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Tell us about your company..." />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
