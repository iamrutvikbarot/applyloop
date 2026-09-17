"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { LockIcon, PencilIcon, PenNibIcon, CoffeeIcon } from "@/components/Icons";
import ThemeToggleButton from "@/components/ThemeToggle";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = () => {
    setIsSigningIn(true);
    // Redirects to authentic Google OAuth consent for Gmail read-only access
    window.location.href = "/api/auth/gmail";
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-3 sm:p-6 md:p-8 bg-[#e8e0d2] dark:bg-[#12100c] overflow-x-hidden overflow-y-auto select-none transition-colors duration-200">
      {/* Wooden Desk / Craft table backdrop subtle texture */}
      <div 
        className="absolute inset-0 opacity-30 dark:opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#9e8e7c 1.2px, transparent 1.2px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Theme Toggle Button in top corner */}
      <div className="absolute top-4 left-4 z-30">
        <ThemeToggleButton />
      </div>

      {/* Realistic Ballpoint Pen lying on desk - hidden on small tablets & phones */}
      <div className="hidden xl:flex absolute right-8 2xl:right-16 top-28 -rotate-12 pointer-events-none flex-col items-center opacity-90 z-20">
        {/* Pen clicker / cap */}
        <div className="w-3.5 h-6 bg-slate-700 dark:bg-[#302a20] rounded-t-sm" />
        <div className="w-4 h-3 bg-amber-400 border border-slate-600 dark:border-amber-600" />
        {/* Pen clip */}
        <div className="w-1.5 h-16 bg-slate-400 dark:bg-[#574c3e] absolute top-7 -right-1 shadow-sm rounded-b" />
        {/* Pen Body */}
        <div className="w-4 h-64 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 dark:from-amber-900 dark:via-amber-800 dark:to-amber-950 rounded-sm shadow-xl flex items-center justify-center">
          <span className="text-[9px] tracking-widest text-blue-200/60 dark:text-amber-200/50 rotate-90 uppercase font-sans">
            ApplyLoop Pen 0.7
          </span>
        </div>
        {/* Pen grip & nib */}
        <div className="w-3.5 h-10 bg-slate-800 dark:bg-[#1c1814] rounded-b-sm" />
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[14px] border-t-slate-400 dark:border-t-[#574c3e]" />
        <div className="w-1 h-2 bg-slate-900 dark:bg-black rounded-b-full" />
      </div>

      {/* Mini yellow sticky note - responsive placement */}
      <div className="hidden md:block absolute top-4 right-4 lg:right-12 bg-[#fff677] dark:bg-[#2a2418] text-slate-800 dark:text-amber-200 p-3 lg:p-4 w-36 lg:w-44 shadow-md rotate-3 hand-drawn-box border border-amber-300/80 dark:border-amber-600/40 z-20 font-['Caveat',cursive]">
        <div className="w-12 lg:w-16 h-2.5 lg:h-3 bg-amber-200/50 dark:bg-amber-500/15 absolute -top-1 left-1/2 -translate-x-1/2 rounded-sm" />
        <p className="text-base lg:text-lg leading-tight font-bold flex items-baseline gap-1">
          <span>"Stay in the loop with every application!"</span>
          <svg className="w-4 h-4 inline-block text-indigo-700 dark:text-amber-400 shrink-0 self-center" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M4 12c0-3 2.5-5 5.5-5 4 0 6 10 9 10 2.5 0 4.5-2 4.5-5s-2-5-4.5-5c-3 0-5 10-9 10-3 0-5.5-2-5.5-5z" />
          </svg>
        </p>
        <span className="text-xs lg:text-sm text-slate-600 dark:text-amber-400/70 mt-1 block">~ note to self</span>
      </div>

      {/* Main Realistic Paper Sheet - Responsive padding & typography */}
      <main className="relative z-10 w-full max-w-xl md:max-w-2xl my-4 sm:my-6 paper-sheet shadow-[0_10px_35px_rgba(40,30,15,0.2)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.5)] rounded-md border border-[#dfd5c5] dark:border-[#3d352a] p-4 sm:p-8 md:p-12 hand-drawn-border transition-transform duration-200">
        
        {/* Washi Tape on top holding the paper down */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-32 sm:w-40 h-6 sm:h-7 washi-tape rotate-[-1.2deg] z-20 flex items-center justify-center text-[9px] sm:text-[10px] tracking-widest text-stone-600 dark:text-[#b5aa9a] uppercase font-mono opacity-85">
          ApplyLoop Note
        </div>

        {/* Top Binder Holes on the left */}
        <div className="absolute left-2 sm:left-3.5 top-0 bottom-0 flex flex-col justify-around py-8 sm:py-12 pointer-events-none">
          <div className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 rounded-full bg-[#d7cfbf] dark:bg-[#13110d] border border-[#beb5a3] dark:border-[#443b2f] shadow-inner" />
          <div className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 rounded-full bg-[#d7cfbf] dark:bg-[#13110d] border border-[#beb5a3] dark:border-[#443b2f] shadow-inner" />
          <div className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 rounded-full bg-[#d7cfbf] dark:bg-[#13110d] border border-[#beb5a3] dark:border-[#443b2f] shadow-inner" />
        </div>

        {/* Content container aligned past the red notebook margin */}
        <div className="pl-4 sm:pl-8 md:pl-10 flex flex-col items-center text-center">

          {/* Doodled Stamp Tag */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1 border-2 border-dashed border-rose-500/80 dark:border-rose-400/60 text-rose-700 dark:text-rose-300 bg-rose-50/50 dark:bg-rose-950/30 rounded-lg -rotate-1 mb-4 font-['Caveat',cursive] text-lg font-bold">
            <PencilIcon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Gmail Reader & Career Journal</span>
            <span className="text-xs ml-1 bg-rose-200/70 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 px-1.5 py-0.5 rounded">No. 01</span>
          </div>

          {/* Brand Title: ApplyLoop handwritten in rich fountain pen ink */}
          <div className="flex flex-col items-center gap-1 mb-1">
            <div className="flex items-baseline justify-center">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-[#f0e8db] font-['Caveat',cursive] leading-tight">
                Apply
                <span className="relative inline-block text-indigo-800 dark:text-amber-400 ml-0.5">
                  Loop
                  {/* Handwritten ink scribble loop under "Loop" */}
                  <svg 
                    className="absolute -bottom-1.5 sm:-bottom-2 left-0 w-full h-2.5 sm:h-3 text-indigo-600/70 dark:text-amber-400/70 overflow-visible" 
                    viewBox="0 0 100 12" 
                    fill="none" 
                    stroke="currentColor"
                  >
                    <path 
                      d="M 2 6 Q 25 12, 50 4 T 98 7" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                    />
                  </svg>
                </span>
              </h1>
            </div>
          </div>

          {/* Hand sketched directional connector arrow */}
          <div className="flex items-center justify-center my-1">
            <svg className="w-40 sm:w-56 h-6 sm:h-7 text-indigo-700/80 dark:text-amber-400/70" viewBox="0 0 200 24" fill="none" stroke="currentColor">
              <path 
                d="M 12 14 Q 50 4, 100 12 T 188 10" 
                strokeWidth="2.8" 
                strokeLinecap="round" 
              />
              <path 
                d="M 174 4 L 190 10 L 176 18" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </div>

          {/* Hand-written description / slogan */}
          <p className="max-w-md text-lg sm:text-xl md:text-2xl text-slate-800 dark:text-[#d4c9b8] font-['Kalam',cursive] leading-relaxed my-2">
            Never lose track of your jobs. Keep every interview, application, and reply in the loop.
          </p>

          {/* Hand-sketched Read-Only permission sticky box */}
          <div className="w-full max-w-sm my-2 sm:my-3 p-2.5 sm:p-3 bg-[#fbf6dd] dark:bg-[#241f17] border-2 border-dashed border-amber-400/90 dark:border-amber-500/40 rounded-xl text-amber-950 dark:text-amber-200 font-['Patrick_Hand',cursive] text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs -rotate-0.5">
            <LockIcon className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>Connects to Gmail with strictly <b>Read-Only</b> search permissions.</span>
          </div>

          {/* Hand-Drawn "Continue with Google" Button */}
          <div className="w-full max-w-sm mt-3 sm:mt-4 mb-2 flex flex-col items-center">
            <button
              id="google-signin-button"
              type="button"
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="group relative w-full px-4 sm:px-6 py-3 sm:py-3.5 bg-[#fefcf8] dark:bg-[#241f17] hover:bg-[#fff9e6] dark:hover:bg-[#332d22] active:bg-[#f5eedb] dark:active:bg-[#1c1814] text-slate-900 dark:text-[#f0e8db] border-2 border-slate-800 dark:border-[#574c3e] shadow-[2px_3px_0px_#1e293b] sm:shadow-[3px_4px_0px_#1e293b] dark:shadow-[3px_4px_0px_#080706] hover:shadow-[3px_5px_0px_#1e293b] dark:hover:shadow-[3px_5px_0px_#080706] active:shadow-[1px_1px_0px_#1e293b] active:translate-x-[2px] active:translate-y-[2px] hand-drawn-pill transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
            >
              {/* Google Icon */}
              <div className="relative flex items-center justify-center">
                {isSigningIn ? (
                  <svg className="animate-spin h-6 w-6 text-slate-800 dark:text-amber-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.99 0 12s.45 3.86 1.24 5.42l4.04-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                )}
              </div>

              <span className="text-xl sm:text-2xl font-bold font-['Caveat',cursive] tracking-wide text-slate-900 dark:text-[#f0e8db]">
                {isSigningIn ? "Signing you in..." : "Continue with Google"}
              </span>
            </button>

            {/* Hand-drawn arrow pointing to Google Button */}
            <div className="flex items-center gap-2 mt-3 text-slate-700 dark:text-amber-300/80 font-['Patrick_Hand',cursive] text-base">
              <svg className="w-8 h-8 text-slate-800 dark:text-amber-300/80 -rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 4 L12 20 M12 4 L6 10 M12 4 L18 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Click with your pen or mouse here!</span>
            </div>
          </div>

          {/* Doodled margin notes & drawings */}
          <div className="mt-6 pt-4 border-t border-dashed border-slate-300 dark:border-[#3d352a] w-full flex flex-row items-center justify-between text-xs sm:text-sm font-['Patrick_Hand',cursive] text-slate-600 dark:text-[#b5aa9a]">
            <div className="flex items-center gap-1.5">
              <PenNibIcon className="w-3.5 h-3.5 text-indigo-700 dark:text-amber-400" />
              <span>Handcrafted for real applicants</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CoffeeIcon className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>Coffee powered</span>
            </div>
            <div>
              <span>Page 1 of 1</span>
            </div>
          </div>

        </div>
      </main>

      {/* Hand scribbled coffee stain ring in corner */}
      <div 
        className="hidden md:block absolute -bottom-10 -left-10 w-44 h-44 rounded-full border-[7px] border-[#cbb399]/40 pointer-events-none rotate-45"
        style={{
          boxShadow: 'inset 0 0 12px rgba(160, 120, 80, 0.15)'
        }}
      />
    </div>
  );
}
