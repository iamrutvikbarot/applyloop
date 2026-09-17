"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import "@/lib/pdfWorkerSetup";
import { getDocument, type PDFDocumentProxy, type PDFPageProxy } from "pdfjs-dist";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// ─── Types ───────────────────────────────────────────────────────────

interface TextItem {
  id: string;
  str: string;
  fontName: string;
  fontSize: number;
  left: number;
  top: number;
  width: number;
  height: number;
  transform: number[];
}

interface PdfEditorProps {
  /** PDF source as data URL string (data:application/pdf;base64,...) */
  pdfDataUrl: string;
  /** Callback to notify parent that edits exist */
  onEditsChanged?: (hasEdits: boolean) => void;
  /** Content to render at the top of the sidebar */
  sidebarTopContent?: React.ReactNode;
  /** Content to render at the bottom of the sidebar */
  sidebarBottomContent?: React.ReactNode;
  /** Drag and drop handlers */
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  isDragOver?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Convert PDF coordinate system (bottom-left origin) to CSS (top-left origin) */
function pdfToCSS(
  transform: number[],
  viewportHeight: number,
  scale: number
): { left: number; top: number; fontSize: number; scaleX: number } {
  const [scaleX, , , scaleY, tx, ty] = transform;
  const fontSize = Math.abs(scaleY) * scale;
  const left = tx * scale;
  const top = viewportHeight - ty * scale;
  // Shift top so that CSS text baseline closely matches PDF canvas baseline
  return { left, top: top - fontSize * 0.82, fontSize, scaleX: Math.abs(scaleX / scaleY) };
}

/** Approximate a CSS-friendly font family from a PDF internal fontName */
function mapPdfFont(fontName: string): string {
  const lower = fontName.toLowerCase();
  if (lower.includes("courier") || lower.includes("mono")) return "'Courier New', Courier, monospace";
  if (lower.includes("arial") || lower.includes("helvetica") || lower.includes("sans")) return "Arial, Helvetica, sans-serif";
  if (lower.includes("times") || lower.includes("roman")) return "'Times New Roman', Times, serif";
  if (lower.includes("georgia")) return "Georgia, serif";
  if (lower.includes("verdana")) return "Verdana, sans-serif";
  if (lower.includes("calibri")) return "Calibri, 'Segoe UI', sans-serif";
  if (lower.includes("cambria")) return "Cambria, Georgia, serif";
  if (lower.includes("garamond")) return "Garamond, 'Times New Roman', serif";
  if (lower.includes("trebuchet")) return "'Trebuchet MS', sans-serif";
  if (lower.includes("palatino")) return "'Palatino Linotype', Palatino, serif";
  // Default fallback
  return "Arial, Helvetica, sans-serif";
}

/** Detect if font name suggests bold */
function isBold(fontName: string): boolean {
  const lower = fontName.toLowerCase();
  return lower.includes("bold") || lower.includes("heavy") || lower.includes("black");
}

/** Detect if font name suggests italic */
function isItalic(fontName: string): boolean {
  const lower = fontName.toLowerCase();
  return lower.includes("italic") || lower.includes("oblique");
}

// ─── Component ───────────────────────────────────────────────────────

export default function PdfEditor({ 
  pdfDataUrl, 
  onEditsChanged,
  sidebarTopContent,
  sidebarBottomContent,
  onDrop,
  onDragOver,
  onDragLeave,
  isDragOver = false
}: PdfEditorProps) {
  // State
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [edits, setEdits] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewportDims, setViewportDims] = useState({ width: 0, height: 0 });
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeEditId, setActiveEditId] = useState<string | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // ─── Load PDF Document ─────────────────────────────────────────────

  useEffect(() => {
    if (!pdfDataUrl) return;

    let cancelled = false;

    async function loadPdf() {
      try {
        setIsLoading(true);
        setError(null);

        // Convert data URL to ArrayBuffer
        const base64 = pdfDataUrl.replace(/^data:[^;]+;base64,/, "");
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const loadingTask = getDocument({ data: bytes });
        const doc = await loadingTask.promise;

        if (cancelled) {
          return;
        }

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setEdits(new Map());
      } catch (err) {
        console.error("Failed to load PDF:", err);
        if (!cancelled) {
          setError("Failed to load PDF document. It may be corrupted or encrypted.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [pdfDataUrl]);

  // ─── Render Page ───────────────────────────────────────────────────

  const renderPage = useCallback(
    async (doc: PDFDocumentProxy, pageNum: number, renderScale: number) => {
      try {
        const page: PDFPageProxy = await doc.getPage(pageNum);
        const viewport = page.getViewport({ scale: renderScale });

        // Set canvas size
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // High-DPI rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        ctx.scale(dpr, dpr);

        setViewportDims({ width: viewport.width, height: viewport.height });

        // Render canvas
        await page.render({
          canvas,
          viewport,
        }).promise;

        // Extract text content with positions
        const textContent = await page.getTextContent();
        const items: TextItem[] = [];

        for (let i = 0; i < textContent.items.length; i++) {
          const item = textContent.items[i] as any;
          if (!item.str || item.str.trim() === "") continue;

          const { left, top, fontSize, scaleX } = pdfToCSS(
            item.transform,
            viewport.height,
            renderScale
          );

          items.push({
            id: `p${pageNum}-i${i}`,
            str: item.str,
            fontName: item.fontName || "",
            fontSize,
            left,
            top,
            width: item.width * renderScale * scaleX,
            height: fontSize * 1.2,
            transform: item.transform,
          });
        }

        setTextItems(items);
      } catch (err) {
        console.error("Failed to render page:", err);
        setError("Failed to render PDF page.");
      }
    },
    []
  );

  useEffect(() => {
    if (pdfDoc && currentPage >= 1 && currentPage <= totalPages) {
      renderPage(pdfDoc, currentPage, scale);
    }
  }, [pdfDoc, currentPage, scale, totalPages, renderPage]);

  // Notify parent about edits
  useEffect(() => {
    onEditsChanged?.(edits.size > 0);
  }, [edits, onEditsChanged]);

  // ─── Text Edit Handler ─────────────────────────────────────────────

  const handleTextEdit = useCallback(
    (id: string, newText: string, originalText: string) => {
      setEdits((prev) => {
        const next = new Map(prev);
        if (newText === originalText) {
          next.delete(id);
        } else {
          next.set(id, newText);
        }
        return next;
      });
    },
    []
  );

  // ─── Download Edited PDF ──────────────────────────────────────────

  const handleDownload = useCallback(async () => {
    if (!pdfDataUrl || edits.size === 0) return;

    setIsDownloading(true);

    try {
      // Load original PDF with pdf-lib
      const base64 = pdfDataUrl.replace(/^data:[^;]+;base64,/, "");
      const pdfBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const pdfLibDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfLibDoc.getPages();

      // Embed standard fonts for invisible ATS text
      const helveticaFont = await pdfLibDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfLibDoc.embedFont(StandardFonts.HelveticaBold);
      const helveticaItalic = await pdfLibDoc.embedFont(StandardFonts.HelveticaOblique);

      // For each edit on the current page, overlay new text
      for (const [id, newText] of edits) {
        const pageMatch = id.match(/^p(\d+)-i(\d+)$/);
        if (!pageMatch) continue;

        const pageIndex = parseInt(pageMatch[1]) - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;

        const page = pages[pageIndex];
        const item = textItems.find((t) => t.id === id);
        if (!item) continue;

        const { height: pageHeight } = page.getSize();

        // Cover original text with white rectangle
        const pdfX = item.transform[4];
        const pdfY = item.transform[5];
        const pdfFontSize = Math.abs(item.transform[3]);
        
        // Mask out exactly the physical text ink (ignoring trailing spaces) to avoid erasing adjacent icons
        const measureCtx = document.createElement("canvas").getContext("2d")!;
        measureCtx.font = `${pdfFontSize}px "${item.fontName}", sans-serif`;
        const exactOldTextWidth = measureCtx.measureText(item.str.trim()).width;

        page.drawRectangle({
          x: pdfX,
          y: pdfY - pdfFontSize * 0.25,
          width: exactOldTextWidth,
          height: pdfFontSize * 1.1,
          color: { type: "RGB" as any, red: 1, green: 1, blue: 1 },
        } as any);

        // Draw new text (invisible, for ATS and text selection)
        let activeFont = helveticaFont;
        const fName = item.fontName.toLowerCase();
        if (fName.includes("bold")) activeFont = helveticaBold;
        else if (fName.includes("italic") || fName.includes("oblique")) activeFont = helveticaItalic;

        page.drawText(newText, {
          x: pdfX,
          y: pdfY,
          size: pdfFontSize,
          font: activeFont,
          opacity: 0, // Invisible!
        });

        // Generate 100% visually accurate text using Browser Canvas + Injected Original Font
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const scaleFactor = 8; // 8x resolution for ultra-crisp PDF printing
          const fontSize = pdfFontSize * scaleFactor;
          
          ctx.font = `${fontSize}px "${item.fontName}", sans-serif`;
          const metrics = ctx.measureText(newText);
          
          const ascent = metrics.actualBoundingBoxAscent || fontSize;
          const descent = metrics.actualBoundingBoxDescent || fontSize * 0.3;
          const textWidth = metrics.width;
          const textHeight = ascent + descent;
          
          const padding = fontSize * 0.2;
          canvas.width = textWidth + padding * 2;
          canvas.height = textHeight + padding * 2;
          
          const ctx2 = canvas.getContext("2d")!;
          
          ctx2.scale(scaleFactor, scaleFactor);
          ctx2.font = `${pdfFontSize}px "${item.fontName}", sans-serif`;
          ctx2.fillStyle = "#000000"; // Assuming black text for edits
          ctx2.textBaseline = "alphabetic";
          
          const drawX = padding / scaleFactor;
          const drawY = (padding + ascent) / scaleFactor;
          
          ctx2.fillText(newText, drawX, drawY);
          
          const pngDataUrl = canvas.toDataURL("image/png");
          const pngImage = await pdfLibDoc.embedPng(pngDataUrl);
          
          const pdfImageHeight = canvas.height / scaleFactor;
          const pdfImageWidth = canvas.width / scaleFactor;
          
          page.drawImage(pngImage, {
            x: pdfX - drawX,
            y: pdfY - (pdfImageHeight - drawY),
            width: pdfImageWidth,
            height: pdfImageHeight,
          });
        }
      }

      const editedPdfBytes = await pdfLibDoc.save();
      const blob = new Blob([editedPdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "edited-resume.pdf";
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download edited PDF:", err);
      setError("Failed to create edited PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [pdfDataUrl, edits, textItems, scale]);

  // ─── Navigation ────────────────────────────────────────────────────

  const goToPreviousPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const zoomIn = () => setScale((s) => Math.min(3, s + 0.25));
  const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.25));
  const zoomReset = () => setScale(1.5);

  // ─── Render ────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-center">
        <div className="p-6 bg-rose-50 dark:bg-rose-950/40 border-2 border-slate-800 dark:border-rose-800 rounded-2xl shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#080706] hand-drawn-box max-w-sm">
          <p className="text-rose-700 dark:text-rose-300 text-sm font-bold">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <div className="w-10 h-10 border-3 border-amber-300 dark:border-amber-600 border-t-amber-700 dark:border-t-amber-300 rounded-full animate-spin" />
        <p className="text-sm text-slate-600 dark:text-[#b5aa9a] font-['Patrick_Hand',cursive]">
          Loading PDF document...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col md:flex-row gap-3">
      {/* ─── Sidebar ────────────────────────────────────────────────── */}
      <div className="shrink-0 w-full md:w-56 p-3 sm:p-4 rounded-2xl border-2 border-slate-800 dark:border-[#4d4337] bg-[#fffdf8] dark:bg-[#1a1713] shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#080706] flex flex-col gap-4 hand-drawn-box overflow-y-auto">
        {sidebarTopContent}

        {sidebarTopContent && (
          <div className="h-px bg-slate-200 dark:bg-[#383025] w-full border-t border-dashed border-slate-300 dark:border-[#4d4337]"></div>
        )}

        {/* PDF Controls */}
        <div className="flex flex-col gap-2.5">
          {/* Page Navigation */}
          <div className="flex items-center justify-between gap-1.5">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage <= 1}
              className="px-2 py-0.5 text-xs font-bold border-2 border-slate-800 dark:border-[#4d4337] rounded-lg bg-white dark:bg-[#252019] hover:bg-amber-50 dark:hover:bg-[#2f281f] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-[1px_1px_0px_#1e293b]"
            >
              ◀
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-[#e0d4c4] tabular-nums">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className="px-2 py-0.5 text-xs font-bold border-2 border-slate-800 dark:border-[#4d4337] rounded-lg bg-white dark:bg-[#252019] hover:bg-amber-50 dark:hover:bg-[#2f281f] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-[1px_1px_0px_#1e293b]"
            >
              ▶
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center justify-between gap-1.5 mt-1">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="px-2 py-0.5 text-xs font-bold border-2 border-slate-800 dark:border-[#4d4337] rounded-lg bg-white dark:bg-[#252019] hover:bg-amber-50 dark:hover:bg-[#2f281f] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-[1px_1px_0px_#1e293b]"
            >
              −
            </button>
            <button
              onClick={zoomReset}
              className="px-2 py-0.5 text-xs font-bold border-2 border-slate-800 dark:border-[#4d4337] rounded-lg bg-white dark:bg-[#252019] hover:bg-amber-50 dark:hover:bg-[#2f281f] cursor-pointer transition-colors shadow-[1px_1px_0px_#1e293b] tabular-nums"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={zoomIn}
              disabled={scale >= 3}
              className="px-2 py-0.5 text-xs font-bold border-2 border-slate-800 dark:border-[#4d4337] rounded-lg bg-white dark:bg-[#252019] hover:bg-amber-50 dark:hover:bg-[#2f281f] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-[1px_1px_0px_#1e293b]"
            >
              +
            </button>
          </div>

          <div className="flex items-center justify-between mt-1">
            {edits.size > 0 ? (
              <span className="text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-lg font-semibold">
                {edits.size} edit{edits.size > 1 ? "s" : ""}
              </span>
            ) : (
              <div />
            )}
          </div>
          
          <button
            onClick={handleDownload}
            disabled={edits.size === 0 || isDownloading}
            className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm font-bold bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-900 dark:text-emerald-300 border-2 border-slate-800 dark:border-emerald-800 rounded-lg shadow-[1px_1px_0px_#1e293b] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isDownloading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-emerald-300 border-t-emerald-700 rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3.5 h-3.5"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>

        {sidebarBottomContent && (
          <div className="h-px bg-slate-200 dark:bg-[#383025] w-full border-t border-dashed border-slate-300 dark:border-[#4d4337]"></div>
        )}

        {sidebarBottomContent}
      </div>

      {/* ─── Workspace ────────────────────────────────────────────────── */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative flex-1 min-w-0 min-h-0 paper-sheet border-2 border-slate-800 dark:border-[#4d4337] rounded-2xl shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#080706] p-3 sm:p-5 md:p-6 flex flex-col hand-drawn-box overflow-y-auto transition-colors ${isDragOver ? "border-amber-600 ring-2 ring-amber-400/50" : ""}`}
      >
        <div className="flex-1 min-h-0 w-full flex flex-col gap-2">
          {/* PDF Viewport */}
          <div
            ref={containerRef}
            className="relative overflow-auto bg-stone-200 dark:bg-[#0f0d0a] border-2 border-slate-800 dark:border-[#4d4337] rounded-xl shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#080706] hand-drawn-box"
            style={{ minHeight: "60vh", maxHeight: "100%" }}
          >
            <div
              className="relative mx-auto my-4"
              style={{
                width: viewportDims.width || "auto",
                height: viewportDims.height || "auto",
              }}
            >
              {/* Canvas Layer */}
              <canvas
                ref={canvasRef}
                className="block shadow-lg mx-auto"
                style={{ background: "white" }}
              />

              {/* Editable Text Overlay */}
              <div
                ref={overlayRef}
                className="absolute inset-0"
                style={{
                  width: viewportDims.width,
                  height: viewportDims.height,
                  pointerEvents: "none",
                }}
              >
                {textItems.map((item) => {
                  const editedText = edits.get(item.id);
                  const displayText = editedText !== undefined ? editedText : item.str;
                  const isEdited = editedText !== undefined;
                  const isActive = activeEditId === item.id;

                  return (
                    <span
                      key={item.id}
                      contentEditable
                      suppressContentEditableWarning
                      onFocus={() => setActiveEditId(item.id)}
                      onBlur={(e) => {
                        const newText = e.currentTarget.textContent || "";
                        handleTextEdit(item.id, newText, item.str);
                        setActiveEditId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          e.currentTarget.blur();
                        }
                      }}
                      className="pdf-text-overlay"
                      style={{
                        position: "absolute",
                        left: `${item.left}px`,
                        top: `${item.top}px`,
                        fontSize: `${item.fontSize}px`,
                        lineHeight: 1,
                        fontFamily: mapPdfFont(item.fontName),
                        fontWeight: isBold(item.fontName) ? "bold" : "normal",
                        fontStyle: isItalic(item.fontName) ? "italic" : "normal",
                        color: (isActive || isEdited) ? "#111827" : "transparent",
                        caretColor: "#d97706",
                        pointerEvents: "auto",
                        cursor: "text",
                        whiteSpace: "pre",
                        background: (isActive || isEdited) ? "white" : "transparent",
                        outline: isActive
                          ? "2px solid rgba(217, 119, 6, 0.8)"
                          : isEdited
                            ? "1px dashed rgba(16, 185, 129, 0.8)"
                            : "none",
                        borderRadius: "2px",
                        padding: "0.05em 0.1em",
                        minWidth: `${item.width}px`,
                        maxWidth: "none",
                        overflow: "visible",
                        transition: "background 0.15s, outline 0.15s, color 0.15s",
                        zIndex: isActive ? 10 : 1,
                      }}
                    >
                      {displayText}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Edit Hint */}
          <div className="shrink-0 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-[#9e9282] font-['Patrick_Hand',cursive] py-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
            <span>Click any text in the PDF to edit it directly • Edits highlighted in green</span>
          </div>
        </div>
      </div>
    </div>
  );
}
