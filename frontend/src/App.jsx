import React from 'react';
import {
  GraduationCap,
  Award,
  Users2,
  TrendingUp,
  ShieldCheck,
  Quote,
} from 'lucide-react';
import RegistrationForm from './components/RegistrationForm';
import campusImage from './assets/campus.png';

export default function App() {
  return (
    <div className="bg-[#e9edf5] text-slate-800 antialiased min-h-screen flex items-center justify-center p-2 sm:p-4 lg:p-6 selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Main Split-Screen Container matching Stitch design */}
      <main className="w-full max-w-[1640px] bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[920px] border border-slate-200/80 transition-all duration-300">
        {/* LEFT COLUMN: Campus Photography & Highlights */}
        <div className="lg:col-span-5 relative flex flex-col justify-between p-8 sm:p-10 lg:p-12 text-white min-h-[520px] lg:min-h-[900px] overflow-hidden">
          {/* Background Image with Gradient Overlay */}
          <img
            alt="University Campus DBS Global"
            className="absolute inset-0 w-full h-full object-cover object-center z-0 scale-105 transform hover:scale-100 transition-transform duration-1000 ease-out"
            src={campusImage}
            onError={(e) => {
              e.target.src = '/campus.png';
            }}
          />
          {/* Gradient overlay matching reference deep vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/65 to-slate-900/40 z-10 backdrop-blur-[0.5px]"></div>

          {/* Top Branding */}
          <div className="relative z-20 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white ring-2 ring-white/20">
              <GraduationCap className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white drop-shadow-sm">
                  Student<span className="text-blue-400">Hub</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 tracking-wide font-medium">
                University Registration Portal
              </p>
            </div>
          </div>

          {/* Center Hero Content */}
          <div className="relative z-20 my-auto py-8">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-black tracking-tight leading-[1.08] text-white drop-shadow-md">
              Your Future <br />
              Starts Here
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-200/90 max-w-md font-normal leading-relaxed">
              Join a vibrant learning community and unlock endless opportunities.
            </p>

            {/* Feature Highlight Badges */}
            <div className="mt-8 space-y-3.5 max-w-sm">
              {/* Item 1 */}
              <div className="flex items-center gap-3.5 bg-white/10 hover:bg-white/15 transition-colors backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
                <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-300 border border-blue-400/30 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white tracking-wide">
                    Quality Education
                  </h4>
                  <p className="text-xs text-slate-300 font-normal">
                    Learn from world-class faculty
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-center gap-3.5 bg-white/10 hover:bg-white/15 transition-colors backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
                <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-300 border border-blue-400/30 shrink-0">
                  <Users2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white tracking-wide">
                    Campus Life
                  </h4>
                  <p className="text-xs text-slate-300 font-normal">
                    Be part of an inspiring diverse community
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-center gap-3.5 bg-white/10 hover:bg-white/15 transition-colors backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
                <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-300 border border-blue-400/30 shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white tracking-wide">
                    Bright Career
                  </h4>
                  <p className="text-xs text-slate-300 font-normal">
                    Build your future with top recruiters
                  </p>
                </div>
              </div>

              {/* Item 4 */}
              <div className="flex items-center gap-3.5 bg-white/10 hover:bg-white/15 transition-colors backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
                <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-300 border border-blue-400/30 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white tracking-wide">
                    Secure &amp; Connected
                  </h4>
                  <p className="text-xs text-slate-300 font-normal">
                    Direct encrypted university credentials
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quote Card at Bottom matching reference */}
          <div className="relative z-20 bg-slate-900/70 border border-white/15 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="text-blue-400 shrink-0 mt-0.5">
                <Quote className="w-6 h-6 fill-blue-400/20 stroke-[1.8]" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-200 italic font-medium leading-relaxed">
                  "Education is the most powerful weapon which you can use to change the world."
                </p>
                <p className="mt-1.5 text-xs text-blue-300 font-semibold uppercase tracking-wider">
                  — Nelson Mandela
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Registration Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-11 flex flex-col justify-between bg-slate-50/50">
          <RegistrationForm />
        </div>
      </main>
    </div>
  );
}
