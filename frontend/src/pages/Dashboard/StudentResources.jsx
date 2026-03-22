import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllResources } from "../../api/resourceApi";
import {
  RESOURCE_CATEGORIES,
  RESOURCE_TYPES,
  getCategoryLabel,
  getTypeBadgeClass,
} from "../Resources/resourceConstants";

/**
 * Career Guidance Resources — same data & filters as /resources, styled for Student Space (#050818).
 */
export default function StudentResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "",
    category: "",
    search: "",
  });

  useEffect(() => {
    fetchResources();
  }, [filters]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;

      const data = await getAllResources(params);
      setResources(data.resources || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const inputClass =
    "w-full rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500/60 focus:outline-none focus:ring-2 focus:ring-sky-500/30";

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
          <p className="mt-3 text-sm text-slate-400">Loading resources…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-50 md:text-4xl">
          Career Guidance Resources
        </h1>
        <p className="mx-auto mt-3 max-w-3xl text-sm text-slate-400 md:text-base">
          Discover articles, videos, and blogs to help you advance your career,
          improve your skills, and achieve your professional goals.
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-700/70 bg-slate-900/50 p-5 shadow-xl backdrop-blur">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Search
            </label>
            <input
              type="text"
              placeholder="Search resources…"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className={inputClass}
            >
              {RESOURCE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className={inputClass}
            >
              {RESOURCE_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setFilters({ type: "", category: "", search: "" })}
              className="w-full rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 py-16 text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-slate-200">
            No resources found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <article
              key={resource._id}
              className="group overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-lg transition hover:border-sky-500/30 hover:shadow-sky-500/10"
            >
              {resource.thumbnailUrl && (
                <div className="aspect-video overflow-hidden bg-slate-800">
                  <img
                    src={resource.thumbnailUrl}
                    alt={resource.title}
                    className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                  />
                </div>
              )}

              <div className="p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs capitalize ${getTypeBadgeClass(resource.type, "dark")}`}
                  >
                    {resource.type}
                  </span>
                  {resource.featured && (
                    <span className="rounded-full border border-violet-500/40 bg-violet-500/15 px-2 py-0.5 text-xs text-violet-200">
                      Featured
                    </span>
                  )}
                </div>

                <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-slate-50">
                  {resource.title}
                </h3>

                <p className="mb-4 line-clamp-3 text-sm text-slate-400">
                  {resource.description}
                </p>

                <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate text-slate-400">
                    {getCategoryLabel(resource.category)}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span>{resource.viewCount || 0} views</span>
                    {resource.likes > 0 && (
                      <span className="flex items-center gap-0.5 text-rose-400">
                        <svg
                          className="h-3.5 w-3.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {resource.likes}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  to={`/student/resources/${resource._id}`}
                  className="inline-flex items-center text-sm font-medium text-sky-400 transition hover:text-sky-300"
                >
                  Read more
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
