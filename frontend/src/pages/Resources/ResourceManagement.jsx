import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAdminResources, createResource, updateResource, deleteResource } from "../../api/resourceApi";
import { uploadToCloudinary } from "../../services/cloudinaryService";

export default function ResourceManagement() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "article",
    content: "",
    videoUrl: "",
    thumbnailUrl: "",
    tags: "",
    category: "career-planning",
    featured: false,
    isPublished: true,
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await getAdminResources();
      setResources(data.resources || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const uploadResult = await uploadToCloudinary(selectedFile, formData.type);
      
      if (formData.type === 'video') {
        setFormData(prev => ({
          ...prev,
          videoUrl: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnail
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          thumbnailUrl: uploadResult.url
        }));
      }
      
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const resourceData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      if (editingResource) {
        await updateResource(editingResource._id, resourceData);
      } else {
        await createResource(resourceData);
      }
      
      setShowForm(false);
      setEditingResource(null);
      setFormData({
        title: "",
        description: "",
        type: "article",
        content: "",
        videoUrl: "",
        thumbnailUrl: "",
        tags: "",
        category: "career-planning",
        featured: false,
        isPublished: true,
      });
      fetchResources();
    } catch (error) {
      console.error("Error saving resource:", error);
      alert("Error saving resource. Please try again.");
    }
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description,
      type: resource.type,
      content: resource.content || "",
      videoUrl: resource.videoUrl || "",
      thumbnailUrl: resource.thumbnailUrl || "",
      tags: resource.tags?.join(", ") || "",
      category: resource.category,
      featured: resource.featured,
      isPublished: resource.isPublished,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      try {
        await deleteResource(id);
        fetchResources();
      } catch (error) {
        console.error("Error deleting resource:", error);
        alert("Error deleting resource. Please try again.");
      }
    }
  };

  const categories = [
    { value: "career-planning", label: "Career Planning" },
    { value: "interview-tips", label: "Interview Tips" },
    { value: "resume-writing", label: "Resume Writing" },
    { value: "job-search", label: "Job Search" },
    { value: "skill-development", label: "Skill Development" },
    { value: "networking", label: "Networking" },
    { value: "workplace-ethics", label: "Workplace Ethics" },
    { value: "leadership", label: "Leadership" },
    { value: "other", label: "Other" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resource Management</h1>
            <p className="mt-1 text-sm text-gray-600">Manage career guidance resources</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Add New Resource
          </button>
        </div>

        {/* Resources Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {resources.map((resource) => (
                <tr key={resource._id}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{resource.title}</div>
                        <div className="text-sm text-gray-500">{resource.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        resource.type === 'article' ? 'bg-blue-100 text-blue-800' :
                        resource.type === 'video' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {resource.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {categories.find(cat => cat.value === resource.category)?.label || resource.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        resource.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {resource.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {resource.featured ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                          Featured
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(resource)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(resource._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Resource Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingResource ? "Edit Resource" : "Add New Resource"}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="article">Article</option>
                        <option value="video">Video</option>
                        <option value="blog">Blog</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {categories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder="career, tips, interview"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {formData.type === "video" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Upload Video File</label>
                      <div className="flex gap-4">
                        <input
                          id="file-upload"
                          type="file"
                          accept="video/*"
                          onChange={handleFileChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={handleUpload}
                          disabled={!selectedFile || uploading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {uploading ? "Uploading..." : "Upload"}
                        </button>
                      </div>
                      {formData.videoUrl && (
                        <div className="mt-2">
                          <p className="text-sm text-green-600">✓ Video uploaded successfully</p>
                          <video
                            src={formData.videoUrl}
                            controls
                            className="mt-2 w-full max-w-md rounded"
                            style={{ maxHeight: '200px' }}
                          />
                        </div>
                      )}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">Or Video URL</label>
                        <input
                          type="url"
                          name="videoUrl"
                          value={formData.videoUrl}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="https://example.com/video.mp4"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Content</label>
                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        required
                        rows={8}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail Image</label>
                    <div className="flex gap-4">
                      <input
                        id="thumbnail-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            uploadToCloudinary(file, 'image').then(result => {
                              setFormData(prev => ({ ...prev, thumbnailUrl: result.url }));
                              e.target.value = '';
                            }).catch(error => {
                              console.error('Thumbnail upload error:', error);
                              alert('Thumbnail upload failed');
                            });
                          }
                        }}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    {formData.thumbnailUrl && (
                      <div className="mt-2">
                        <img
                          src={formData.thumbnailUrl}
                          alt="Thumbnail preview"
                          className="w-32 h-20 object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Or Thumbnail URL</label>
                      <input
                        type="url"
                        name="thumbnailUrl"
                        value={formData.thumbnailUrl}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Featured</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isPublished"
                        checked={formData.isPublished}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Published</span>
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingResource(null);
                        setFormData({
                          title: "",
                          description: "",
                          type: "article",
                          content: "",
                          videoUrl: "",
                          thumbnailUrl: "",
                          tags: "",
                          category: "career-planning",
                          featured: false,
                          isPublished: true,
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      {editingResource ? "Update Resource" : "Create Resource"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
