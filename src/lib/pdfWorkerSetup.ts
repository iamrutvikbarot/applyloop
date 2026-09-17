"use client";

import { GlobalWorkerOptions } from "pdfjs-dist";

// Point pdf.js to the worker file we copied to /public
// This avoids CDN dependency and ensures version compatibility
GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
