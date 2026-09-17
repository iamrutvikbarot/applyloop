import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client } from "@/lib/googleAuth";
import { google } from "googleapis";
import { fastRuleBasedExtraction } from "@/lib/nvidiaJobExtractor";

// Helper function to extract HTML or plain text body recursively from Gmail payload
function extractBody(payload: any): { html: string; text: string } {
  let html = "";
  let text = "";

  if (!payload) return { html, text };

  const mimeType = payload.mimeType || "";

  if (payload.body?.data) {
    const decoded = Buffer.from(payload.body.data, "base64").toString("utf-8");
    if (mimeType === "text/html") {
      html += decoded;
    } else if (mimeType === "text/plain") {
      text += decoded;
    }
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const partBody = extractBody(part);
      if (partBody.html) html += partBody.html;
      if (partBody.text) text += partBody.text;
    }
  }

  return { html, text };
}

// Filter out emails that require 5+ years of experience
function hasHighExperience(text: string): boolean {
  if (!text) return false;
  // Check for X-Y years where X >= 5
  const rangeMatch = text.match(/\b([0-9]+)\s*(?:-|to)\s*([0-9]+)\s*(?:years?|yrs?)\b/i);
  if (rangeMatch) {
    const lowerBound = parseInt(rangeMatch[1], 10);
    if (lowerBound >= 5) return true;
  }
  
  // Check for X+ years or exactly X years where X >= 5
  const plusMatch = text.match(/(?<!-\s*)\b([0-9]+)\s*\+?\s*(?:years?|yrs?)\b/i);
  if (plusMatch) {
    const val = parseInt(plusMatch[1], 10);
    if (val >= 5) return true;
  }

  // Look for "minimum X years"
  const minMatch = text.match(/minimum\s+([0-9]+)\s*(?:years?|yrs?)/i);
  if (minMatch) {
    const val = parseInt(minMatch[1], 10);
    if (val >= 5) return true;
  }
  
  return false;
}

// Allowed job portals / domains specified by the user
const ALLOWED_DOMAINS = ["hirist.tech", "linkedin.com"];

export async function GET(request: NextRequest) {
  const token = request.cookies.get("applyloop_gmail_token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in with Google first." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const userQuery = searchParams.get("q")?.trim() || "";
  const maxResults = Math.min(parseInt(searchParams.get("maxResults") || "100", 10), 100);

  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: token });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Gmail search query filtering ONLY to the allowed domains AND last 10 days:
    // (from:hirist.tech OR from:linkedin.com) newer_than:10d
    const domainFilter = ALLOWED_DOMAINS.map((d) => `from:${d}`).join(" OR ");
    const dateFilter = "newer_than:10d";
    
    let baseQuery = `(${domainFilter}) ${dateFilter}`;
    const finalQuery = userQuery
      ? `(${baseQuery}) ${userQuery}`
      : baseQuery;

    // Search messages using the Gmail query format - dynamically fetch up to 100 recent emails from last 10 days
    const listRes = await gmail.users.messages.list({
      userId: "me",
      q: finalQuery,
      maxResults: Math.min(Math.max(maxResults, 50), 100),
    });

    const messages = listRes.data.messages || [];

    // Fetch message details in controlled batches to stay safely within Google's per-minute quota
    const emailDetails: any[] = [];
    const BATCH_SIZE = 5;

    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const batch = messages.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (msg) => {
          if (!msg.id) return null;
          try {
            const detail = await gmail.users.messages.get({
              userId: "me",
              id: msg.id,
              format: "full",
            });

            const headers = detail.data.payload?.headers || [];
            const getHeader = (name: string) =>
              headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

            const fromHeader = getHeader("From") || "Unknown Sender";

            // Double check domain filter on server-side to guarantee only hirist.tech & linkedin.com
            const isAllowedDomain = ALLOWED_DOMAINS.some((domain) =>
              fromHeader.toLowerCase().includes(domain.toLowerCase())
            );

            if (!isAllowedDomain) {
              return null;
            }

            const { html, text } = extractBody(detail.data.payload);
            const combinedText = (html || "") + " " + (text || "");
            
            // Filter out emails that require 5+ years of experience
            if (hasHighExperience(combinedText)) {
              return null;
            }

            // Direct URL to open this specific email thread in Gmail
            const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${msg.threadId || msg.id}`;

            // Pre-extract jobs instantly using rules (0ms latency, eliminates NVIDIA 500 errors)
            const preExtractedJobs = fastRuleBasedExtraction(html || text || "", fromHeader);

            return {
              id: msg.id,
              threadId: msg.threadId,
              snippet: detail.data.snippet || "",
              subject: getHeader("Subject") || "(No Subject)",
              from: fromHeader,
              to: getHeader("To") || "",
              date: getHeader("Date") || "",
              htmlBody: html,
              textBody: text,
              gmailUrl,
              extractedJobs: preExtractedJobs.length > 0 ? preExtractedJobs : undefined,
            };
          } catch (err: any) {
            // Check if rate limited / quota error
            if (err?.code === 403 || err?.status === 403) {
              console.warn(`Gmail quota reached for message ${msg.id}`);
            } else {
              console.error(`Error fetching detail for message ${msg.id}:`, err);
            }
            return null;
          }
        })
      );

      emailDetails.push(...batchResults.filter(Boolean));

      // If we got throttled or reached enough emails, pause briefly between batches
      if (i + BATCH_SIZE < messages.length) {
        await new Promise((r) => setTimeout(r, 120));
      }
    }

    return NextResponse.json({
      success: true,
      emails: emailDetails,
    });
  } catch (error: unknown) {
    console.error("Gmail search error:", error);
    return NextResponse.json(
      { error: "Failed to search and retrieve emails." },
      { status: 500 }
    );
  }
}
