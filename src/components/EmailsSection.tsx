"use client";

import React, { useState, useEffect } from "react";
import { EmailItem, JobOpportunity } from "@/types/dashboard";
import {
  MailIcon,
  PostboxIcon,
  PenNibIcon,
  PencilIcon,
  BoltIcon,
  LocationIcon,
  ExperienceIcon,
  WarningIcon,
  ExternalLinkIcon,
} from "@/components/Icons";

interface EmailsSectionProps {
  emails: EmailItem[];
  isLoading: boolean;
  selectedEmail: EmailItem | null;
  errorMsg: string;
  jobsCache: Record<string, JobOpportunity[]>;
  isExtracting: boolean;
  onSelectEmail: (email: EmailItem | null) => void;
  onRefresh: () => void;
  onExtractEmail: (email: EmailItem, forceRefresh?: boolean) => void;
}

export default function EmailsSection({
  emails,
  isLoading,
  selectedEmail,
  errorMsg,
  jobsCache,
  isExtracting,
  onSelectEmail,
  onRefresh,
  onExtractEmail,
}: EmailsSectionProps) {
  // Trigger AI extraction whenever an email is selected
  useEffect(() => {
    if (selectedEmail) {
      onExtractEmail(selectedEmail);
    }
  }, [selectedEmail?.id]);

  const [isMiddleCollapsed, setIsMiddleCollapsed] = useState(false);

  const currentJobs = selectedEmail ? jobsCache[selectedEmail.id] || selectedEmail.extractedJobs || [] : [];

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col gap-3 overflow-hidden font-['Patrick_Hand',cursive] pr-2 pb-2">
      {/* Error Alert */}
      {errorMsg && (
        <div className="shrink-0 bg-[#ffebe9] border-2 border-rose-500 text-rose-800 px-4 py-2 rounded-lg text-base font-['Patrick_Hand',cursive] flex items-center justify-between hand-drawn-box">
          <span className="flex items-center gap-1.5">
            <WarningIcon className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </span>
          <button onClick={onRefresh} className="font-bold underline ml-4 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Responsive 3-Section Workspace */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col lg:grid lg:grid-cols-12 gap-3 sm:gap-4 md:gap-4">
        {/* SECTION 1: Ruled Sheet Email List */}
        <div
          className={`relative lg:col-span-3 paper-sheet border-2 border-slate-800 dark:border-[#4d4337] rounded-2xl shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#080706] flex flex-col h-full min-h-0 min-w-0 overflow-hidden hand-drawn-box ${
            selectedEmail ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Top Binder Hole accents */}
          <div className="absolute left-2.5 top-0 bottom-0 flex flex-col justify-around py-4 pointer-events-none z-10">
            <div className="w-2.5 h-2.5 rounded-full bg-[#d7cfbf] dark:bg-[#13110d] border border-[#beb5a3] dark:border-[#443b2f] shadow-inner" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#d7cfbf] dark:bg-[#13110d] border border-[#beb5a3] dark:border-[#443b2f] shadow-inner" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#d7cfbf] dark:bg-[#13110d] border border-[#beb5a3] dark:border-[#443b2f] shadow-inner" />
          </div>

          {/* List Header */}
          <div className="shrink-0 pl-7 sm:pl-9 pr-3 sm:pr-4 py-2 sm:py-2.5 border-b-2 border-slate-800/80 dark:border-[#4d4337] bg-[#faf6ee] dark:bg-[#1c1814] flex items-center justify-between font-['Caveat',cursive] overflow-hidden">
            <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-[#f0e8db] truncate">
              Inbox ({emails.length})
            </span>
            <button
              onClick={onRefresh}
              className="text-xs sm:text-sm text-amber-800 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-300 font-bold underline cursor-pointer shrink-0 ml-1"
            >
              ↻ Refresh
            </button>
          </div>

          {/* Emails List - Scrollable */}
          <div className="pl-8 sm:pl-9 pr-1 divide-y divide-stone-200/90 dark:divide-[#352e25] overflow-y-auto flex-1 min-h-0 min-w-0">
            {isLoading && emails.length === 0 ? (
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-center gap-2 py-3 text-slate-700 dark:text-amber-300 font-['Caveat',cursive] text-lg font-bold">
                  <PencilIcon className="w-5 h-5 animate-pen-scribble text-amber-700 dark:text-amber-400" />
                  <span>Browsing your mailbox...</span>
                </div>
                {/* Ruled paper skeleton lines */}
                <div className="p-2.5 flex flex-col gap-1.5 opacity-80">
                  <div className="h-3 w-1/3 paper-skeleton rounded-md" />
                  <div className="h-4 w-4/5 paper-skeleton rounded-md" />
                  <div className="h-2.5 w-full paper-skeleton rounded-md" />
                </div>
                <div className="p-2.5 flex flex-col gap-1.5 opacity-60">
                  <div className="h-3 w-1/4 paper-skeleton rounded-md" />
                  <div className="h-4 w-3/4 paper-skeleton rounded-md" />
                  <div className="h-2.5 w-5/6 paper-skeleton rounded-md" />
                </div>
                <div className="p-2.5 flex flex-col gap-1.5 opacity-40">
                  <div className="h-3 w-1/3 paper-skeleton rounded-md" />
                  <div className="h-4 w-2/3 paper-skeleton rounded-md" />
                </div>
              </div>
            ) : emails.length === 0 ? (
              <div className="p-6 text-center text-slate-600 dark:text-[#b5aa9a] text-sm font-['Patrick_Hand',cursive] leading-relaxed">
                No emails from hirist.tech or linkedin.com found.
              </div>
            ) : (
              emails.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                return (
                  <div
                    key={email.id}
                    onClick={() => onSelectEmail(email)}
                    className={`py-2.5 px-3 cursor-pointer transition-all text-left flex flex-col gap-1 font-['Patrick_Hand',cursive] min-w-0 ${
                      isSelected
                        ? "bg-[#f5ebd7] dark:bg-[#2e261b] border-l-4 border-l-amber-700 dark:border-l-amber-500 shadow-xs"
                        : "hover:bg-amber-50/70 dark:hover:bg-[#2a241b]/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 min-w-0">
                      <span className={`text-xs font-bold truncate tracking-wide ${
                        isSelected ? "text-amber-950 dark:text-[#f0e8db]" : "text-slate-800 dark:text-[#e0d4c4]"
                      }`}>
                        {email.from.replace(/<.*>/, "").replace(/"/g, "").trim() || email.from}
                      </span>
                      <span className={`text-[11px] shrink-0 font-mono ${
                        isSelected ? "text-amber-800/80 dark:text-[#9e9282]" : "text-slate-500 dark:text-[#8a7f72]"
                      }`}>
                        {email.date ? new Date(email.date).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <h4 className={`text-[13px] sm:text-sm font-bold line-clamp-1 leading-snug break-words ${
                      isSelected ? "text-amber-950 dark:text-amber-300" : "text-slate-900 dark:text-[#e8ded0]"
                    }`}>
                      {email.subject}
                    </h4>
                    <p className={`text-xs line-clamp-1 break-words leading-tight ${
                      isSelected ? "text-amber-900/80 dark:text-[#b5aa9a]" : "text-slate-600 dark:text-[#8a7f72]"
                    }`}>
                      {email.snippet}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SECTION 2: Original Email Content Column (Middle Section) */}
        <div
          className={`relative bg-white dark:bg-[#201c16] border-2 border-slate-800 dark:border-[#4d4337] rounded-2xl shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#080706] p-3 sm:p-5 flex flex-col h-full min-h-0 min-w-0 overflow-hidden hand-drawn-box ${
            !selectedEmail ? "hidden lg:flex lg:col-span-5" : (isMiddleCollapsed ? "flex lg:hidden" : "flex lg:col-span-5")
          }`}
        >
          {/* Mobile Back Button */}
          <button
            onClick={() => onSelectEmail(null)}
            className="lg:hidden mb-2 text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-[#2a241b] px-2.5 py-1 rounded-md border-2 border-slate-800 dark:border-[#4d4337] shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#080706] flex items-center gap-1 cursor-pointer w-fit font-['Patrick_Hand',cursive]"
          >
            <span>← Back to Inbox</span>
          </button>

          {selectedEmail ? (
            <div className="flex flex-col h-full min-h-0 min-w-0">
              {/* Header inside Email Reader */}
              <div className="shrink-0 pb-2.5 border-b-2 border-dashed border-slate-800/60 dark:border-[#4d4337] min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1.5 min-w-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-[#f0e8db] leading-tight font-['Caveat',cursive] break-words flex-1 min-w-0 max-h-16 overflow-y-auto pr-1">
                    {selectedEmail.subject}
                  </h2>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setIsMiddleCollapsed(true)}
                      className="hidden lg:flex px-2 py-1 bg-stone-100 dark:bg-[#2b1f1a] hover:bg-stone-200 dark:hover:bg-[#38271d] text-stone-700 dark:text-stone-300 border-2 border-slate-800 dark:border-[#4d4337] text-xs font-bold rounded-lg transition-all items-center gap-1 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#080706] font-['Patrick_Hand',cursive]"
                      title="Collapse Email View"
                    >
                      <span className="text-[14px]">⛌</span> Collapse
                    </button>
                    {selectedEmail.gmailUrl && (
                      <a
                        href={selectedEmail.gmailUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-red-50 dark:bg-[#2b1f1a] hover:bg-red-100 dark:hover:bg-[#38271d] text-red-700 dark:text-red-300 border-2 border-slate-800 dark:border-rose-900/60 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-[2px_2px_0px_#991b1b] font-['Patrick_Hand',cursive] shrink-0"
                        title="Open in Gmail"
                      >
                        <span>Gmail ↗</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-0.5 text-xs text-slate-600 dark:text-[#b5aa9a] font-['Patrick_Hand',cursive]">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-[#e0d4c4]">From: </span>
                    <span className="truncate">{selectedEmail.from}</span>
                  </div>
                  {selectedEmail.date && (
                    <div>
                      <span className="font-bold text-slate-800 dark:text-[#e0d4c4]">Date: </span>
                      <span>{new Date(selectedEmail.date).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Email Content Body - Scrollable */}
              <div className="py-3 flex-1 min-h-0 overflow-y-auto pr-1">
                {selectedEmail.htmlBody ? (
                  <div className="bg-white dark:bg-[#16130e] p-3 sm:p-4 rounded-xl border border-stone-200/80 dark:border-[#352e25] font-sans text-xs sm:text-sm text-slate-800 dark:text-[#e0d4c4] leading-relaxed overflow-x-auto email-content-container">
                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }} />
                  </div>
                ) : selectedEmail.textBody ? (
                  <div className="bg-white dark:bg-[#16130e] p-3 sm:p-4 rounded-xl border border-stone-200/80 dark:border-[#352e25] text-slate-800 dark:text-[#e0d4c4] text-sm font-['Kalam',cursive] whitespace-pre-wrap leading-relaxed">
                    {selectedEmail.textBody}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#16130e] p-3 sm:p-4 rounded-xl border border-stone-200/80 dark:border-[#352e25] text-slate-800 dark:text-[#e0d4c4] text-sm font-['Kalam',cursive] whitespace-pre-wrap leading-relaxed">
                    {selectedEmail.snippet}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-[#8a7f72] text-sm font-['Patrick_Hand',cursive] gap-2 py-12">
              <MailIcon className="w-10 h-10 stroke-[1.4] text-slate-400 dark:text-[#8a7f72]" />
              <span>Select an email from your list</span>
            </div>
          )}
        </div>

        {/* SECTION 3: Extracted Job Opportunities Column (Last Section) */}
        <div
          className={`relative bg-[#fffdfa] dark:bg-[#201c16] border-2 border-slate-800 dark:border-[#4d4337] rounded-2xl shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#080706] p-3 sm:p-4 flex flex-col h-full min-h-0 min-w-0 overflow-hidden hand-drawn-box ${
            !selectedEmail ? "hidden lg:flex lg:col-span-4" : (isMiddleCollapsed ? "flex lg:col-span-9" : "flex lg:col-span-4")
          }`}
        >
          {/* Section Header */}
          <div className="shrink-0 pb-2 border-b-2 border-dashed border-slate-800/60 dark:border-[#4d4337] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-['Caveat',cursive] text-lg sm:text-xl font-bold text-amber-950 dark:text-amber-300">
              <BoltIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Extracted Jobs ({currentJobs.length})</span>
            </div>
            <div className="flex items-center gap-3">
              {isMiddleCollapsed && (
                <button
                  onClick={() => setIsMiddleCollapsed(false)}
                  className="hidden lg:flex px-2 py-1 bg-stone-100 dark:bg-[#2b1f1a] hover:bg-stone-200 dark:hover:bg-[#38271d] text-stone-700 dark:text-stone-300 border-2 border-slate-800 dark:border-[#4d4337] text-xs font-bold rounded-lg transition-all items-center gap-1 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#080706] font-['Patrick_Hand',cursive]"
                  title="Expand Email View"
                >
                  <span className="text-[14px]">⛶</span> Expand Email
                </button>
              )}
              {isExtracting ? (
                <span className="text-[11px] text-amber-800 dark:text-amber-400 animate-pulse font-['Patrick_Hand',cursive]">
                  Scanning...
                </span>
              ) : selectedEmail ? (
                <button
                  onClick={() => onExtractEmail(selectedEmail, true)}
                  className="text-xs text-amber-800 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-300 underline font-bold cursor-pointer font-['Patrick_Hand',cursive]"
                >
                  ↻ Re-extract
                </button>
              ) : null}
            </div>
          </div>

          {/* Jobs List - Scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto py-3 pr-1 flex flex-col gap-2.5">
            {!selectedEmail ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-[#8a7f72] text-sm font-['Patrick_Hand',cursive] gap-2 py-12 text-center">
                <PostboxIcon className="w-10 h-10 stroke-[1.4] text-amber-600/70 dark:text-amber-400/50" />
                <span>Select an email to view extracted jobs</span>
              </div>
            ) : isExtracting ? (
              <div className="flex flex-col gap-3 py-2">
                {/* Hand-drawn Theme Loading Card */}
                <div className="bg-[#faf6ee] dark:bg-[#1c1814] border-2 border-dashed border-amber-300 dark:border-amber-500/30 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center hand-drawn-border shadow-xs">
                  <div className="relative flex items-center justify-center w-12 h-12">
                    <PenNibIcon className="w-7 h-7 text-amber-700 dark:text-amber-400 animate-pen-scribble" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-600 dark:bg-amber-400 rounded-full animate-ink-pulse" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-['Caveat',cursive] text-lg font-bold text-amber-950 dark:text-amber-300">
                      Scanning parchment for job openings...
                    </span>
                    <span className="font-['Patrick_Hand',cursive] text-xs text-amber-800/80 dark:text-amber-400/70">
                      Detecting titles, locations & apply links
                    </span>
                  </div>
                </div>

                {/* Hand-drawn Paper Skeleton Cards */}
                <div className="bg-white/90 dark:bg-[#2a241b] border-2 border-stone-200/90 dark:border-[#3d352a] rounded-lg p-3 flex flex-col gap-2.5 opacity-75">
                  <div className="flex justify-between items-center gap-2">
                    <div className="h-4 w-3/4 paper-skeleton rounded-md" />
                    <div className="h-4 w-12 paper-skeleton rounded-md shrink-0" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-3 w-16 paper-skeleton rounded-md" />
                    <div className="h-3 w-14 paper-skeleton rounded-md" />
                  </div>
                  <div className="h-7 w-full paper-skeleton rounded-md mt-1" />
                </div>

                <div className="bg-white/80 dark:bg-[#2a241b] border-2 border-stone-200/80 dark:border-[#3d352a] rounded-lg p-3 flex flex-col gap-2.5 opacity-50">
                  <div className="flex justify-between items-center gap-2">
                    <div className="h-4 w-2/3 paper-skeleton rounded-md" />
                    <div className="h-4 w-10 paper-skeleton rounded-md shrink-0" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-3 w-14 paper-skeleton rounded-md" />
                  </div>
                </div>
              </div>
            ) : currentJobs.length > 0 ? (
              currentJobs.map((job, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#201c16] border-2 border-slate-800 dark:border-[#4d4337] rounded-xl p-3 sm:p-3.5 shadow-[3px_3px_0px_#1e293b] dark:shadow-[3px_3px_0px_#080706] flex flex-col gap-2 hover:translate-x-[1px] hover:translate-y-[1px] hand-drawn-box transition-all"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <h4 className="text-base font-bold font-['Caveat',cursive] text-slate-900 dark:text-[#f0e8db] leading-snug">
                        {job.title}
                      </h4>
                      {job.company && (
                        <span className="shrink-0 text-[11px] bg-amber-100 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-lg border border-slate-800/80 dark:border-amber-500/40 font-['Patrick_Hand',cursive] shadow-[1px_1px_0px_#1e293b] dark:shadow-[1px_1px_0px_#080706]">
                          {job.company}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 dark:text-[#b5aa9a] font-['Patrick_Hand',cursive]">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <LocationIcon className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                          <span>{job.location}</span>
                        </span>
                      )}
                      {job.experience && (
                        <span className="flex items-center gap-1">
                          <ExperienceIcon className="w-3 h-3 text-slate-500 dark:text-[#8a7f72]" />
                          <span>{job.experience}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {job.url && (
                    <div className="pt-1.5 border-t border-dashed border-stone-200 dark:border-[#463d30]">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-1.5 bg-amber-700 dark:bg-amber-700 hover:bg-amber-800 dark:hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#080706] border-2 border-slate-800 flex items-center justify-center gap-1.5 font-['Patrick_Hand',cursive] transition-all cursor-pointer hand-drawn-box"
                      >
                        <span>Apply Now</span>
                        <ExternalLinkIcon className="w-3 h-3 text-white/90" />
                      </a>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/15 border border-dashed border-amber-300 dark:border-amber-500/25 rounded-lg text-xs sm:text-sm text-slate-600 dark:text-[#b5aa9a] font-['Patrick_Hand',cursive] text-center">
                No job postings detected in this message.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
