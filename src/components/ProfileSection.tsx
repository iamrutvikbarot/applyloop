"use client";

import { EyeIcon, FilePdfIcon, PencilIcon, ProfilePortfolioHero, TrashIcon, UploadIcon, WarningIcon } from "@/components/Icons";
import { UserProfile } from "@/types/dashboard";
import PdfEditor from "@/components/PdfEditor";
import React, { useEffect, useRef, useState } from "react";

interface ProfileSectionProps {
  user: UserProfile | null;
}

interface StoredResume {
  name: string;
  size: string;
  uploadedAt: string;
  dataUrl?: string;
}

export default function ProfileSection({ user }: ProfileSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [resume, setResume] = useState<StoredResume | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hasEdits, setHasEdits] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load saved resume metadata from localStorage on mount
  useEffect(() => {
    try {
      const savedResume = localStorage.getItem("applyloop_user_resume");
      if (savedResume) {
        setResume(JSON.parse(savedResume));
      }
    } catch (e) {
      console.error("Could not load resume from storage:", e);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isUploading) {
      setUploadProgress(0);
      interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 5 + 2;
        });
      }, 500);
    } else {
      setUploadProgress(100);
    }
    return () => clearInterval(interval);
  }, [isUploading]);

  // Auto-clear error message after 4 seconds
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => {
        setErrorMsg(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = (file: File) => {
    setErrorMsg(null);

    // Validate PDF MIME type or extension
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setErrorMsg("Please upload a valid PDF document (.pdf)");
      return;
    }

    // Validate size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMsg("Resume file size must be less than 10MB.");
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newResume: StoredResume = {
        name: file.name,
        size: formatFileSize(file.size),
        uploadedAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        dataUrl: file.size <= 3.5 * 1024 * 1024 ? dataUrl : undefined,
      };

      try {
        localStorage.setItem("applyloop_user_resume", JSON.stringify(newResume));
      } catch (e) {
        console.warn("Could not save PDF dataUrl to localStorage:", e);
        const minimalResume = { ...newResume, dataUrl: undefined };
        try {
          localStorage.setItem("applyloop_user_resume", JSON.stringify(minimalResume));
        } catch (_) {}
      }

      setResume({ ...newResume, dataUrl });
      setIsUploading(false);
    };

    reader.onerror = () => {
      setErrorMsg("Failed to read the file. Please try again.");
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemoveResume = () => {
    setResume(null);
    try {
      localStorage.removeItem("applyloop_user_resume");
    } catch (e) {
      console.error(e);
    }
  };

  const handlePreviewResume = () => {
    if (resume?.dataUrl) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`<iframe src="${resume.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        newWindow.document.title = resume.name;
      }
    } else {
      alert("Resume preview is not cached in local storage. Re-upload to view directly.");
    }
  };

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col gap-3 overflow-hidden font-['Patrick_Hand',cursive] pr-2 pb-2">
      {/* Hidden File Input for PDF */}
      <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={handleFileChange} className="hidden" />

      {/* Error notification if any */}
      {errorMsg && (
        <div className="shrink-0 w-full flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border-2 border-slate-800 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm rounded-xl shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#080706] hand-drawn-box">
          <WarningIcon className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="flex-1 text-left">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800 dark:hover:text-rose-200 font-bold px-1 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* 1. TOP ACTION: ONLY A SMALL BUTTON TO UPLOAD PDF */}
      {!resume && !isUploading && (
        <div className="shrink-0 flex items-center justify-end w-full">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#fef5e7] dark:bg-[#2e261d] hover:bg-amber-100 dark:hover:bg-[#3d3226] text-amber-950 dark:text-amber-200 font-bold text-xs sm:text-sm border-2 border-slate-800 dark:border-[#4d4337] rounded-xl shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#080706] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer transition-all hand-drawn-box font-['Patrick_Hand',cursive]"
          >
            <UploadIcon className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" />
            <span>Upload Resume (PDF)</span>
          </button>
        </div>
      )}

      {/* 2. TOP LOADING STATE */}
      {isUploading && (
        <div className="shrink-0 w-full p-4 sm:p-5 bg-[#fffdf8] dark:bg-[#1c1814] border-2 border-slate-800 dark:border-[#4d4337] rounded-2xl shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#080706] flex items-center justify-between gap-4 flex-wrap hand-drawn-box">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
              <FilePdfIcon className="w-7 h-7 text-amber-700 dark:text-amber-400 animate-pulse" />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <h4 className="text-base sm:text-lg font-bold font-['Caveat',cursive] text-slate-900 dark:text-[#f0e8db] leading-tight truncate">Reading PDF Document...</h4>
              <p className="text-xs text-slate-500 dark:text-[#9e9282] leading-tight truncate">Loading resume into the editor...</p>
            </div>
          </div>
          <div className="w-full sm:w-48 h-2 bg-amber-100 dark:bg-[#2e261d] border border-slate-800 dark:border-[#4d4337] rounded-full overflow-hidden shrink-0">
            <div className="h-full bg-amber-600 dark:bg-amber-500 rounded-full transition-all duration-300 ease-out" style={{ width: `${Math.min(uploadProgress, 100).toFixed(1)}%` }} />
          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN WORKSPACE
          ========================================================================= */}
      {resume && !isUploading ? (
        <PdfEditor
          pdfDataUrl={resume.dataUrl || ""}
          onEditsChanged={setHasEdits}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          isDragOver={isDragOver}
          sidebarTopContent={
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 border-2 border-slate-800 dark:border-rose-800 flex items-center justify-center text-rose-700 dark:text-rose-400 shrink-0 shadow-[1px_1px_0px_#1e293b]">
                  <FilePdfIcon className="w-4 h-4" />
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold uppercase tracking-wider border border-emerald-300 dark:border-emerald-800 shrink-0">PDF Active</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-[#f0e8db] truncate" title={resume.name}>{resume.name}</p>
                <p className="text-xs text-slate-500 dark:text-[#9e9282] mt-0.5">
                  {resume.size} • {resume.uploadedAt}
                </p>
              </div>
            </div>
          }
          sidebarBottomContent={
            <div className="flex flex-col gap-2.5">
              {resume.dataUrl && (
                <button type="button" onClick={handlePreviewResume} className="w-full inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm px-2.5 py-1.5 bg-white dark:bg-[#252019] hover:bg-emerald-50 dark:hover:bg-[#2f281f] text-emerald-900 dark:text-emerald-200 border-2 border-slate-800 dark:border-[#4d4337] rounded-lg shadow-[1px_1px_0px_#1e293b] cursor-pointer transition-colors">
                  <EyeIcon className="w-3.5 h-3.5" />
                  <span>View PDF File</span>
                </button>
              )}
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm px-2.5 py-1.5 bg-white dark:bg-[#252019] hover:bg-stone-50 dark:hover:bg-[#2f281f] text-slate-700 dark:text-[#d6cebf] border-2 border-slate-800 dark:border-[#4d4337] rounded-lg shadow-[1px_1px_0px_#1e293b] cursor-pointer transition-colors">
                <UploadIcon className="w-3.5 h-3.5" />
                <span>Change Resume</span>
              </button>
              <button type="button" onClick={handleRemoveResume} className="w-full inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm px-2.5 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-2 border-transparent hover:border-rose-200 dark:hover:border-rose-900 rounded-lg cursor-pointer transition-colors">
                <TrashIcon className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          }
        />
      ) : (
        <div className="flex-1 min-h-0 w-full flex flex-col md:flex-row gap-3">
          {/* EMPTY STATE WORKSPACE INFO (when no resume yet) */}
          {!resume && !isUploading && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative flex-1 min-w-0 min-h-0 paper-sheet border-2 border-slate-800 dark:border-[#4d4337] rounded-2xl shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#080706] p-3 sm:p-5 md:p-6 flex flex-col hand-drawn-box overflow-y-auto transition-colors ${isDragOver ? "border-amber-600 ring-2 ring-amber-400/50" : ""}`}
            >
              <div className="max-w-xl w-full mx-auto my-auto flex flex-col items-center gap-4 text-center py-4">
                <div className="transform transition-transform hover:scale-105 duration-200">
                  <ProfilePortfolioHero className="w-20 h-20" />
                </div>
                <h3 className="text-3xl font-bold font-['Caveat',cursive] text-slate-900 dark:text-[#f0e8db]">PDF Edit Workspace</h3>
                <p className="text-slate-600 dark:text-[#b5aa9a] text-base sm:text-lg leading-relaxed max-w-md">Upload your resume PDF to edit your document directly.</p>
                {user && (
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-[#e0d4c4] bg-amber-50/80 dark:bg-[#1c1814] border-2 border-slate-800/80 dark:border-[#4d4337] shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#080706] px-3.5 py-1 rounded-xl hand-drawn-box">
                    Logged in as <span className="font-bold text-slate-900 dark:text-[#f0e8db]">{user.name}</span> ({user.email})
                  </div>
                )}
                <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 bg-[#fbf6dd] dark:bg-[#241f17] border-2 border-slate-800/80 dark:border-[#4d4337] shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#080706] rounded-xl text-xs sm:text-sm text-amber-900 dark:text-amber-300 hand-drawn-box">
                  <PencilIcon className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                  <span>Click 'Upload Resume' to get started</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
