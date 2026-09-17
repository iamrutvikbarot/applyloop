"use client";

import EmailsSection from "@/components/EmailsSection";
import ProfileSection from "@/components/ProfileSection";
import { useTheme } from "@/context/ThemeContext";
import { EmailItem, JobOpportunity, UserProfile } from "@/types/dashboard";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { BoltIcon, BriefcaseIcon, ChevronDownIcon, LockIcon, LogoutIcon, MailIcon } from "@/components/Icons";
import ThemeToggleButton from "@/components/ThemeToggle";

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"emails" | "jobs">("emails");

  const handleSwitchTab = (tab: "emails" | "jobs") => {
    setActiveTab(tab);
  };
  const [user, setUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [imgError, setImgError] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  // Close profile dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  // Auto-clear error message after 4 seconds
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => {
        setErrorMsg("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // Shared state for extracted jobs
  const [jobsCache, setJobsCache] = useState<Record<string, JobOpportunity[]>>({});
  const [isExtracting, setIsExtracting] = useState(false);

  // Read user from cookie & verify via API to get profile picture
  useEffect(() => {
    // 1. Try reading cookie first
    try {
      const match = document.cookie.split("; ").find((row) => row.startsWith("applyloop_user="));
      if (match) {
        const decoded = decodeURIComponent(match.split("=")[1]);
        const parsed = JSON.parse(decoded);
        setUser(parsed);
      }
    } catch (e) {
      console.error("Failed to parse user cookie:", e);
    }

    // 2. Fetch fresh user info from Google OAuth API to guarantee valid picture URL
    fetch("/api/auth/user")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !data.error) {
          setUser(data);
          setImgError(false);
        }
      })
      .catch((err) => console.error("Error fetching user profile:", err));

    fetchEmails("");
  }, []);

  const fetchEmails = async (query: string) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/gmail/search?q=${encodeURIComponent(query)}&maxResults=100`);
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const data = await res.json();
      if (data.success) {
        setEmails(data.emails || []);
        if (data.emails?.length > 0 && !selectedEmail) {
          setSelectedEmail(data.emails[0]);
        }
      } else {
        setErrorMsg(data.error || "Failed to load emails");
      }
    } catch (err) {
      setErrorMsg("Network error occurred while fetching emails");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractEmail = async (email: EmailItem, forceRefresh = false) => {
    if (!forceRefresh && jobsCache[email.id]) {
      return;
    }
    if (!forceRefresh && email.extractedJobs && email.extractedJobs.length > 0) {
      setJobsCache((prev) => ({ ...prev, [email.id]: email.extractedJobs! }));
      return;
    }

    setIsExtracting(true);
    try {
      const res = await fetch("/api/ai/extract-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          htmlBody: email.htmlBody,
          textBody: email.textBody || email.snippet,
          from: email.from,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.jobs)) {
        setJobsCache((prev) => ({ ...prev, [email.id]: data.jobs }));
      }
    } catch (err) {
      console.error("AI extraction error:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // 1. Call server logout to revoke token with Google and clear server cookies
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout request failed:", e);
    }

    // 2. Clear all browser client storage (localStorage, sessionStorage)
    if (typeof window !== "undefined") {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error("Storage clear error:", e);
      }

      // 3. Clear any accessible client-side cookies
      document.cookie.split(";").forEach((cookie) => {
        const name = cookie.split("=")[0].trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });

      // 4. Redirect user back to home
      window.location.href = "/";
    }
  };

  return (
    <div className="relative h-screen w-screen bg-[#e9e2d5] dark:bg-[#12100c] text-slate-900 dark:text-[#f0e8db] flex flex-col font-['Kalam',cursive] select-none overflow-hidden transition-colors duration-200">
      {/* Wooden Desk / Craft table backdrop subtle texture */}
      <div
        className="absolute inset-0 opacity-25 dark:opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#ab9b8a 1.2px, transparent 1.2px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top Wooden Desk Ruler & Notebook Header - Fixed / Non-scrolling & Fully Responsive */}
      <header className="relative z-20 w-full shrink-0 px-2.5 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between border-b-2 border-stone-300/80 dark:border-[#352e25] bg-[#f4eee2]/95 dark:bg-[#1c1814]/95 backdrop-blur-sm shadow-xs gap-1.5 sm:gap-3 transition-colors duration-200">
        {/* Brand Title & Navigation Tabs */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-5 min-w-0">
          <div className="flex items-baseline gap-1 shrink-0">
            <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-['Caveat',cursive] tracking-tight text-slate-900 dark:text-[#f0e8db]">
              Apply<span className="text-amber-800 dark:text-amber-400 underline decoration-wavy decoration-amber-500/50 dark:decoration-amber-500 decoration-2">Loop</span>
            </span>
          </div>

          {/* Navigation Bar: 2 Tabs (Emails, Job & Profile) with Smooth Sliding Indicator */}
          <nav className="relative flex items-center p-0.5 sm:p-1 bg-[#ecd9be]/60 dark:bg-[#13110d] border border-[#d2be9f] dark:border-[#3a3228] rounded-lg sm:rounded-xl font-['Patrick_Hand',cursive] shrink-0 gap-0.5">
            {/* Tab 1: Emails */}
            <button
              onClick={() => handleSwitchTab("emails")}
              className={`relative px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm md:text-base font-bold transition-colors cursor-pointer z-10 flex items-center gap-1 sm:gap-1.5 ${activeTab === "emails" ? "text-amber-950 dark:text-amber-200" : "text-slate-600 dark:text-[#b5aa9a] hover:text-slate-900 dark:hover:text-[#f0e8db]"}`}
            >
              {activeTab === "emails" && <motion.div layoutId="activeTabBadge" className="absolute inset-0 bg-[#fffdf8] dark:bg-[#2a241b] border-2 border-slate-800 dark:border-[#574c3e] rounded-md sm:rounded-lg shadow-[1px_1px_0px_#1e293b] sm:shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#080706]" transition={{ type: "spring", stiffness: 220, damping: 26 }} />}
              <span className="relative z-10">
                <MailIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-current" />
              </span>
              <span className="relative z-10">Emails</span>
            </button>

            {/* Tab 2: Job / Profile Workspace */}
            <button
              onClick={() => handleSwitchTab("jobs")}
              className={`relative px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm md:text-base font-bold transition-colors cursor-pointer z-10 flex items-center gap-1 sm:gap-1.5 ${activeTab === "jobs" ? "text-amber-950 dark:text-amber-200" : "text-slate-600 dark:text-[#b5aa9a] hover:text-slate-900 dark:hover:text-[#f0e8db]"}`}
            >
              {activeTab === "jobs" && <motion.div layoutId="activeTabBadge" className="absolute inset-0 bg-[#fffdf8] dark:bg-[#2a241b] border-2 border-slate-800 dark:border-[#574c3e] rounded-md sm:rounded-lg shadow-[1px_1px_0px_#1e293b] sm:shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#080706]" transition={{ type: "spring", stiffness: 220, damping: 26 }} />}
              <span className="relative z-10">
                <BriefcaseIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-current" />
              </span>
              <span className="relative z-10 hidden sm:inline">Job & Profile</span>
              <span className="relative z-10 sm:hidden">Job</span>
            </button>
          </nav>
        </div>

        {/* User profile with interactive dropdown menu */}
        <div ref={profileMenuRef} className="relative font-['Patrick_Hand',cursive] shrink-0">
          {user ? (
            <button
              type="button"
              id="profile-dropdown-button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              aria-expanded={isProfileMenuOpen}
              title="Click to view profile options"
              className="flex items-center gap-1.5 sm:gap-2 bg-[#fbf6dd] dark:bg-[#241f17] hover:bg-[#f6eed2] dark:hover:bg-[#2e271e] border-2 border-slate-700/80 dark:border-[#4d4337] px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-xl shadow-[1px_1px_0px_#334155] sm:shadow-[2px_2px_0px_#334155] dark:shadow-[2px_2px_0px_#080706] active:translate-x-[1px] active:translate-y-[1px] hand-drawn-box cursor-pointer select-none transition-all"
            >
              {user.picture && !imgError ? (
                <img src={user.picture} alt={user.name} referrerPolicy="no-referrer" crossOrigin="anonymous" onError={() => setImgError(true)} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full object-cover border border-slate-700 dark:border-amber-500/40 shadow-xs shrink-0" />
              ) : (
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-amber-700 dark:bg-amber-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center border border-slate-800 shrink-0">{user.name?.[0]?.toUpperCase() || "U"}</div>
              )}
              <div className="flex flex-col text-left">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#f0e8db] leading-tight truncate max-w-[110px] sm:max-w-[140px]">{user.name}</span>
                <span className="text-[10px] text-slate-600 dark:text-[#b5aa9a] leading-tight truncate max-w-[110px] sm:max-w-[140px]">{user.email}</span>
              </div>
              <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-600 dark:text-[#b5aa9a] transition-transform duration-200 shrink-0 ${isProfileMenuOpen ? "rotate-180 text-amber-800 dark:text-amber-400" : ""}`} />
            </button>
          ) : (
            <button
              type="button"
              id="profile-dropdown-button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              aria-expanded={isProfileMenuOpen}
              className="px-2.5 py-1 bg-[#fbf6dd] dark:bg-[#241f17] border-2 border-slate-700/80 dark:border-[#4d4337] rounded-xl text-xs sm:text-sm font-bold shadow-[1px_1px_0px_#334155] dark:shadow-[2px_2px_0px_#080706] cursor-pointer flex items-center gap-1.5"
            >
              <span>Profile</span>
              <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${isProfileMenuOpen ? "rotate-180" : ""}`} />
            </button>
          )}

          {/* Profile Dropdown Popover */}
          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-[#fffdf8] dark:bg-[#1e1913] border-2 border-slate-800 dark:border-[#4d4337] rounded-2xl shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#080706] p-3 z-50 flex flex-col gap-3 hand-drawn-box"
              >
                {/* User Info Header in Popover */}
                {user && (
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-dashed border-stone-300 dark:border-[#383025]">
                    {user.picture && !imgError ? (
                      <img src={user.picture} alt={user.name} referrerPolicy="no-referrer" crossOrigin="anonymous" className="w-10 h-10 rounded-full object-cover border-2 border-slate-700 dark:border-amber-500/40 shadow-xs shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-amber-700 text-white font-bold text-base flex items-center justify-center border-2 border-slate-800 shrink-0">{user.name?.[0]?.toUpperCase() || "U"}</div>
                    )}
                    <div className="flex flex-col text-left min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-[#f0e8db] truncate">{user.name}</span>
                      <span className="text-xs text-slate-500 dark:text-[#a89d8d] truncate">{user.email}</span>
                    </div>
                  </div>
                )}

                {/* Theme Selector Item */}
                <div className="flex items-center justify-between px-1 py-0.5">
                  <div className="flex flex-col text-left">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#ecdcc8]">Theme Mode</span>
                    <span className="text-[11px] text-slate-500 dark:text-[#9e9282]">Day journal / Night desk</span>
                  </div>
                  <ThemeToggleButton />
                </div>

                <div className="border-t border-dashed border-stone-300 dark:border-[#383025]" />

                {/* Logout Button */}
                <button
                  type="button"
                  id="dropdown-logout-button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#fefcf8] dark:bg-[#2a241b] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-bold text-xs sm:text-sm border-2 border-rose-300 dark:border-rose-900/50 rounded-xl shadow-[1px_1px_0px_#f43f5e] sm:shadow-[2px_2px_0px_#f43f5e] dark:shadow-[2px_2px_0px_#080706] active:translate-x-[1px] active:translate-y-[1px] hand-drawn-box transition-all cursor-pointer"
                >
                  <LogoutIcon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Realistic Workspace - Locked between Header & Footer */}
      <main className="relative z-10 flex-1 min-h-0 max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-6 flex flex-col gap-2 sm:gap-4 overflow-hidden">
        <div
          className="relative flex-1 min-h-0 w-full overflow-hidden"
          style={{
            WebkitMaskImage: "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
            maskImage: "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
          }}
        >
          <motion.div className="flex w-[200%] h-full" initial={false} animate={{ x: activeTab === "emails" ? "0%" : "-50%" }} transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}>
            {/* Slide 1: Emails View */}
            <div className="w-1/2 h-full flex flex-col min-h-0 overflow-hidden pl-4 sm:pl-5 pr-1.5 sm:pr-2">
              <EmailsSection emails={emails} isLoading={isLoading} selectedEmail={selectedEmail} errorMsg={errorMsg} jobsCache={jobsCache} isExtracting={isExtracting} onSelectEmail={setSelectedEmail} onRefresh={() => fetchEmails(searchQuery)} onExtractEmail={handleExtractEmail} />
            </div>

            {/* Slide 2: Job & Profile View */}
            <div className="w-1/2 h-full flex flex-col min-h-0 overflow-hidden pr-4 sm:pr-5 pl-1.5 sm:pl-2">
              <ProfileSection user={user} />
            </div>
          </motion.div>
        </div>
      </main>

      {/* Desk Footer - Fixed and Non-scrolling with Full Theme Support */}
      <footer className="relative z-20 w-full shrink-0 px-6 py-2.5 bg-[#f4eee2]/90 dark:bg-[#1c1814]/95 border-t-2 border-stone-300/80 dark:border-[#352e25] flex items-center justify-between text-xs sm:text-sm font-['Patrick_Hand',cursive] text-slate-600 dark:text-[#b5aa9a] backdrop-blur-sm transition-colors duration-200">
        <div>
          <span>ApplyLoop Career Workspace</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <LockIcon className="w-3.5 h-3.5 text-slate-500 dark:text-[#8a7f72]" />
            <span>Read-Only Gmail Sync</span>
          </span>
          <span className="flex items-center gap-1.5">
            <BoltIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>NVIDIA NIM AI Connected</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
