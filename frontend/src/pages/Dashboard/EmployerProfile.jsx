import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { me } from "../../api/authApi";

export default function EmployerProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    bio: "",
    avatarUrl: "",
    companyDetails: {
      name: "",
      website: "",
      logo: "",
      description: "",
      size: "",
      industry: "",
      founded: "",
      headquarters: "",
      socialMedia: {
        linkedin: "",
        twitter: "",
        facebook: "",
      },
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await me();
        setUser(userData);
        setForm({
          fullName: userData.fullName || "",
          email: userData.email || "",
          phone: userData.phone || "",
          bio: userData.bio || "",
          avatarUrl: userData.avatarUrl || "",
          companyDetails: {
            name: userData.companyDetails?.name || "",
            website: userData.companyDetails?.website || "",
            logo: userData.companyDetails?.logo || "",
            description: userData.companyDetails?.description || "",
            size: userData.companyDetails?.size || "",
            industry: userData.companyDetails?.industry || "",
            founded: userData.companyDetails?.founded || "",
            headquarters: userData.companyDetails?.headquarters || "",
            socialMedia: {
              linkedin: userData.companyDetails?.socialMedia?.linkedin || "",
              twitter: userData.companyDetails?.socialMedia?.twitter || "",
              facebook: userData.companyDetails?.socialMedia?.facebook || "",
            },
          },
        });
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child, subChild] = name.split(".");
      if (subChild) {
        setForm(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subChild]: value
            }
          }
        }));
      } else {
        setForm(prev => ({
          ...prev,
          [parent]: { ...prev[parent], [child]: value }
        }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Here you would call an API to update the user profile
      // For now, we'll just show a success message
      alert("Profile updated successfully!");
      navigate("/employer/dashboard");
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  const companySizes = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
  const industries = [
    "Technology", "Healthcare", "Finance", "Education", "Marketing", "Sales",
    "Engineering", "Design", "Operations", "HR", "Legal", "Consulting",
    "Manufacturing", "Retail", "Hospitality", "Real Estate", "Transportation",
    "Energy", "Media", "Telecommunications", "Other"
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-sky-600 font-extrabold text-xl">INTERNSHALA</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-700 font-medium">Complete Profile</span>
            </div>
            <button
              onClick={() => navigate("/employer/dashboard")}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
            <p className="text-gray-600 mt-1">
              A complete profile helps candidates trust your company and increases application rates
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    disabled
                    className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture URL
                  </label>
                  <input
                    type="url"
                    name="avatarUrl"
                    value={form.avatarUrl}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="https://example.com/profile.jpg"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Tell us about yourself and your role in the company..."
                />
              </div>
            </div>

            {/* Company Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyDetails.name"
                    value={form.companyDetails.name}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Website
                  </label>
                  <input
                    type="url"
                    name="companyDetails.website"
                    value={form.companyDetails.website}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="https://company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Logo URL
                  </label>
                  <input
                    type="url"
                    name="companyDetails.logo"
                    value={form.companyDetails.logo}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="https://company.com/logo.png"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size
                  </label>
                  <select
                    name="companyDetails.size"
                    value={form.companyDetails.size}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Select Company Size</option>
                    {companySizes.map(size => (
                      <option key={size} value={size}>{size} employees</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry *
                  </label>
                  <select
                    name="companyDetails.industry"
                    value={form.companyDetails.industry}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Select Industry</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Founded Year
                  </label>
                  <input
                    type="number"
                    name="companyDetails.founded"
                    value={form.companyDetails.founded}
                    onChange={handleChange}
                    min="1800"
                    max={new Date().getFullYear()}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="2020"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Headquarters
                  </label>
                  <input
                    type="text"
                    name="companyDetails.headquarters"
                    value={form.companyDetails.headquarters}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Mumbai, India"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Description *
                </label>
                <textarea
                  name="companyDetails.description"
                  value={form.companyDetails.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Describe your company, its mission, values, and what makes it unique..."
                />
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    name="companyDetails.socialMedia.linkedin"
                    value={form.companyDetails.socialMedia.linkedin}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter
                  </label>
                  <input
                    type="url"
                    name="companyDetails.socialMedia.twitter"
                    value={form.companyDetails.socialMedia.twitter}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="https://twitter.com/yourcompany"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="url"
                    name="companyDetails.socialMedia.facebook"
                    value={form.companyDetails.socialMedia.facebook}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="https://facebook.com/yourcompany"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate("/employer/dashboard")}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-50"
              >
                {submitting ? "Updating Profile..." : "Update Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
