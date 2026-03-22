import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { getResource, likeResource } from "../../api/resourceApi";
import { getTypeBadgeClass } from "./resourceConstants";

export default function ResourceDetails() {
  const { id } = useParams();
  const location = useLocation();
  const isStudent = location.pathname.startsWith("/student/resources");
  const listPath = isStudent ? "/student/resources" : "/resources";
  const homePath = isStudent ? "/student/dashboard" : "/";

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetchResource();
  }, [id]);

  const fetchResource = async () => {
    try {
      setLoading(true);
      const data = await getResource(id);
      setResource(data);
    } catch (error) {
      console.error("Error fetching resource:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const action = liked ? "unlike" : "like";
      await likeResource(id, action);
      setLiked(!liked);
      setResource((prev) => ({
        ...prev,
        likes: prev.likes + (liked ? -1 : 1),
      }));
    } catch (error) {
      console.error("Error liking resource:", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const theme = isStudent
    ? {
        page: "",
        spin: "border-2 border-slate-600 border-t-sky-400",
        loadText: "text-slate-400",
        notFoundIcon: "text-slate-600",
        notFoundTitle: "text-slate-200",
        notFoundDesc: "text-slate-500",
        notFoundBtn:
          "inline-flex items-center rounded-lg border border-sky-500/30 bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500",
        crumb: "text-slate-500 hover:text-sky-400",
        crumbSep: "text-slate-600",
        crumbCurrent: "text-slate-400",
        card: "overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-xl backdrop-blur",
        headerBorder: "border-b border-slate-700/80",
        title: "text-slate-50",
        desc: "text-slate-400",
        meta: "text-slate-500",
        metaIcon: "text-slate-500",
        featured:
          "rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-1 text-sm text-violet-200",
        likeBtn: (on) =>
          on
            ? "border-rose-500/40 bg-rose-500/15 text-rose-200"
            : "border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-800",
        tag: "bg-slate-800/80 text-slate-300",
        articleBody: "prose prose-invert max-w-none text-slate-300 prose-headings:text-slate-100 prose-a:text-sky-400",
        footer: "border-t border-slate-700/80 bg-slate-900/40",
        footerLink: "text-sky-400 hover:text-sky-300",
      }
    : {
        page: "min-h-screen bg-gray-50",
        spin: "border-b-2 border-indigo-600",
        loadText: "text-gray-600",
        notFoundIcon: "text-gray-400",
        notFoundTitle: "text-gray-900",
        notFoundDesc: "text-gray-500",
        notFoundBtn:
          "inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm bg-indigo-600 hover:bg-indigo-700",
        crumb: "text-gray-400 hover:text-gray-500",
        crumbSep: "text-gray-300",
        crumbCurrent: "text-gray-500",
        card: "overflow-hidden rounded-lg bg-white shadow-lg",
        headerBorder: "border-b border-gray-200",
        title: "text-gray-900",
        desc: "text-gray-600",
        meta: "text-gray-500",
        metaIcon: "text-gray-500",
        featured: "bg-purple-100 text-purple-800 rounded-full px-3 py-1 text-sm",
        likeBtn: (on) =>
          on
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100",
        tag: "bg-gray-100 text-gray-700",
        articleBody: "text-gray-800 leading-relaxed",
        footer: "border-t border-gray-200 bg-gray-50",
        footerLink: "text-indigo-600 hover:text-indigo-900",
      };

  if (loading) {
    return (
      <div
        className={
          isStudent
            ? "flex min-h-[40vh] items-center justify-center"
            : "flex min-h-screen items-center justify-center bg-gray-50"
        }
      >
        <div className="text-center">
          <div
            className={`mx-auto h-12 w-12 animate-spin rounded-full ${theme.spin}`}
          />
          <p className={`mt-4 ${theme.loadText}`}>
            Loading resource…
          </p>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div
        className={
          isStudent
            ? "flex min-h-[40vh] items-center justify-center"
            : "flex min-h-screen items-center justify-center bg-gray-50"
        }
      >
        <div className="text-center">
          <svg
            className={`mx-auto h-12 w-12 ${theme.notFoundIcon}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className={`mt-2 text-sm font-medium ${theme.notFoundTitle}`}>
            Resource not found
          </h3>
          <p className={`mt-1 text-sm ${theme.notFoundDesc}`}>
            The resource you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <div className="mt-6">
            <Link to={listPath} className={theme.notFoundBtn}>
              Back to Resources
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={theme.page}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-8 flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link to={homePath} className={theme.crumb}>
                {isStudent ? "Dashboard" : "Home"}
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className={`h-5 w-5 shrink-0 ${theme.crumbSep}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <Link to={listPath} className={`ml-4 ${theme.crumb}`}>
                  Resources
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className={`h-5 w-5 shrink-0 ${theme.crumbSep}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className={`ml-4 ${theme.crumbCurrent}`} aria-current="page">
                  {resource.title}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        <div className={theme.card}>
          <div className={`px-6 py-8 ${theme.headerBorder}`}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span
                  className={`rounded-full px-3 py-1 text-sm capitalize ${getTypeBadgeClass(
                    resource.type,
                    isStudent ? "dark" : "light"
                  )}`}
                >
                  {resource.type}
                </span>
                {resource.featured && (
                  <span className={theme.featured}>Featured</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleLike}
                className={`flex items-center space-x-2 rounded-md border px-4 py-2 ${theme.likeBtn(liked)}`}
              >
                <svg
                  className={`h-5 w-5 ${liked ? "fill-current text-red-500" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span>{resource.likes || 0}</span>
              </button>
            </div>

            <h1 className={`mb-4 text-3xl font-bold ${theme.title}`}>
              {resource.title}
            </h1>

            <p className={`mb-6 text-lg ${theme.desc}`}>{resource.description}</p>

            <div
              className={`flex flex-wrap items-center justify-between gap-4 text-sm ${theme.meta}`}
            >
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center">
                  <svg
                    className={`mr-2 h-4 w-4 ${theme.metaIcon}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {resource.author?.fullName || "Admin"}
                </div>
                <div className="flex items-center">
                  <svg
                    className={`mr-2 h-4 w-4 ${theme.metaIcon}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {formatDate(resource.createdAt)}
                </div>
                <div className="flex items-center">
                  <svg
                    className={`mr-2 h-4 w-4 ${theme.metaIcon}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  {resource.viewCount || 0} views
                </div>
              </div>

              {resource.tags && resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`rounded-full px-2 py-1 text-xs ${theme.tag}`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-8">
            {resource.type === "video" ? (
              <div className="mb-8">
                <div className="aspect-video overflow-hidden rounded-lg bg-gray-900">
                  {resource.videoUrl ? (
                    <iframe
                      src={resource.videoUrl}
                      title={resource.title}
                      className="h-full w-full"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white">
                      <div className="text-center">
                        <svg
                          className="mx-auto mb-4 h-16 w-16"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-7a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p>Video not available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="prose max-w-none">
                <div
                  className={theme.articleBody}
                  dangerouslySetInnerHTML={{ __html: resource.content }}
                />
              </div>
            )}
          </div>

          <div className={`px-6 py-4 ${theme.footer}`}>
            <div className="flex items-center justify-between">
              <Link
                to={listPath}
                className={`inline-flex items-center font-medium ${theme.footerLink}`}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Resources
              </Link>

              <button
                type="button"
                onClick={handleLike}
                className={`flex items-center space-x-2 rounded-md border px-4 py-2 ${theme.likeBtn(liked)}`}
              >
                <svg
                  className={`h-5 w-5 ${liked ? "fill-current text-red-500" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span>{resource.likes || 0}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
