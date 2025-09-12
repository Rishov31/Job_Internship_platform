import React from "react";
import { Link } from "react-router-dom";

const companies = [
  "CocaCola",
  "Practo",
  "OYO",
  "Paytm",
  "Nestle",
  "HCL",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 14c6-2 12-2 18 0" stroke="#0284c7" strokeWidth="2" strokeLinecap="round"/>
                <path d="M4 10c5-2 11-2 16 0" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="text-sky-600 font-extrabold text-xl">INTERNSHALA</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <button className="hover:text-sky-700">Jobs</button>
            <button className="hover:text-sky-700">Internships</button>
            <button className="hover:text-sky-700 flex items-center gap-1">Courses <span className="ml-1 inline-block bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded">OFFER</span></button>
            <div className="flex items-center gap-3">
              <Link to="/login" className="px-4 py-2 border rounded-md hover:bg-gray-50">Login</Link>
              <Link to="/register" className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">Register</Link>
            </div>
          </nav>
          <div className="md:hidden">
            <button aria-label="menu" className="p-2 rounded hover:bg-gray-100">☰</button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute -top-24 -left-24 w-[480px] h-[480px] bg-sky-300/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-28 -right-24 w-[520px] h-[520px] bg-blue-500/20 rounded-full blur-3xl"></div>
          </div>
          <div className="bg-gradient-to-br from-sky-800 via-sky-800 to-blue-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="py-16 sm:py-20 grid md:grid-cols-2 gap-10 items-center">
                <div className="text-white">
                  <div className="inline-flex items-center gap-2 bg-white/10 ring-1 ring-white/20 text-white text-xs px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Trusted by 10,000+ companies
                  </div>
                  <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold leading-tight">
                    India's <span className="text-yellow-400">#1 platform</span>
                  </h1>
                  <p className="mt-3 text-lg opacity-90">
                    <span className="underline underline-offset-4 decoration-sky-300">For fresher jobs, internships and courses</span>
                  </p>
                  <div className="mt-8 flex flex-col sm:flex-row gap-4 max-w-md">
                    <button className="w-full sm:w-auto bg-white text-gray-900 rounded-md px-6 py-3 font-medium shadow hover:shadow-md flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.64,6.053,29.048,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,13,24,13c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.64,6.053,29.048,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.799-1.977,13.285-5.197l-6.146-5.207C29.086,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.281-7.952l-6.49,5.004C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.115,5.571l0.003-0.002l6.146,5.207C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
                      <span>Continue with Google</span>
                    </button>
                    <Link to="/register" className="w-full sm:w-auto bg-sky-600 text-white rounded-md px-6 py-3 font-medium shadow hover:bg-sky-700 text-center">
                      Continue with Email
                    </Link>
                  </div>
                  <p className="mt-3 text-xs opacity-80">
                    By continuing, you agree to our <a className="underline">T&C</a>.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -top-6 -left-6 w-32 h-32 bg-sky-400/30 rounded-full blur-2xl" />
                  <img
                    alt="Happy students with laptop"
                    className="relative z-10 w-full max-w-lg mx-auto rounded-xl shadow-2xl ring-1 ring-white/10"
                    src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=1400&auto=format&fit=crop"
                  />
                  <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-indigo-400/30 rounded-full blur-2xl" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-sky-900 to-blue-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="flex items-center gap-8 text-white/90">
              <div>
                <div className="text-3xl font-extrabold">10K+</div>
                <div className="text-white/70 text-sm">Openings daily</div>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div className="flex flex-wrap items-center gap-x-10 gap-y-4 opacity-90">
                {companies.map((c) => (
                  <span key={c} className="text-lg font-semibold text-white/80">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Trending now</h2>
            <span className="text-sky-600">⬈</span>
          </div>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-5 rounded-lg transition shadow-sm border bg-gradient-to-br from-sky-50 to-indigo-50 hover:shadow-md">
                <div className="text-xs text-sky-700 font-semibold">Collection</div>
                <div className="mt-1 font-semibold">Popular opportunities #{i + 1}</div>
                <button className="mt-4 text-sky-700 font-medium">Explore →</button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm text-gray-600 flex flex-wrap items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} Internshala clone demo</div>
          <div className="flex items-center gap-4">
            <a className="hover:underline">Privacy</a>
            <a className="hover:underline">Terms</a>
            <a className="hover:underline">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}


