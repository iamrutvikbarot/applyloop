import { JobOpportunity } from "@/types/dashboard";

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

function isLegitimateJobUrl(url: string, text: string): boolean {
  if (!url) return false;
  const urlLower = url.toLowerCase().trim();
  const textLower = text.toLowerCase().trim();

  // Reject mailto, javascript, anchor fragments
  if (urlLower.startsWith("mailto:") || urlLower.startsWith("javascript:") || urlLower.startsWith("#")) {
    return false;
  }

  // Reject text containing email addresses, footer keywords, or generic action buttons
  if (
    textLower.includes("@") ||
    textLower.includes("unsubscribe") ||
    textLower.includes("team hirist") ||
    textLower.includes("contact us") ||
    textLower.includes("privacy policy") ||
    textLower.includes("terms of use") ||
    textLower.includes("click here") ||
    textLower === "hirist.tech" ||
    textLower === "linkedin" ||
    textLower === "view all" ||
    textLower === "apply" ||
    textLower === "apply now" ||
    textLower === "easy apply" ||
    textLower === "one click apply" ||
    textLower === "one-click apply"
  ) {
    return false;
  }

  // Reject tracking pixels / images like /CI0/
  if (urlLower.includes("/ci0/") || urlLower.includes("/open?") || urlLower.match(/\.(png|jpg|jpeg|gif|webp)/i)) {
    return false;
  }

  // For Hirist: MUST be a specific job URL containing "/job/", "/j/", "one-click-apply", or "jobid=" (handles direct and postoffice.hirist.tech/CL0/ links)
  if (urlLower.includes("hirist.tech")) {
    const isJobPath =
      urlLower.includes("/job/") ||
      urlLower.includes("/j/") ||
      urlLower.includes("%2fj%2f") ||
      urlLower.includes("%2fjob%2f") ||
      urlLower.includes("one-click-apply") ||
      urlLower.includes("jobid=");
    return (
      isJobPath &&
      !urlLower.endsWith("hirist.tech/") &&
      !urlLower.endsWith("hirist.tech")
    );
  }

  // For LinkedIn: MUST be a job view URL
  if (urlLower.includes("linkedin.com")) {
    return (
      urlLower.includes("/jobs/view/") ||
      urlLower.includes("/comm/jobs/view") ||
      urlLower.includes("jobid=")
    );
  }

  // For other sites: Must have job-like path or valid job title length
  if (urlLower.includes("/job/") || urlLower.includes("/jobs/") || urlLower.includes("/career/")) {
    return true;
  }

  return false;
}

/**
 * Fast rule-based extractor for instant (<10ms) zero-latency extraction
 * on known portal structures like hirist.tech and linkedin.com.
 */
export function fastRuleBasedExtraction(emailContent: string, sender: string): JobOpportunity[] {
  const jobs: JobOpportunity[] = [];
  const senderLower = sender.toLowerCase();

  // 1. hirist.tech pattern
  if (senderLower.includes("hirist")) {
    const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>(?:\s*-\s*([A-Za-z\s,]+))?/gi;
    let match;
    const seenUrls = new Set<string>();

    while ((match = linkRegex.exec(emailContent)) !== null) {
      const url = match[1].trim();
      const rawText = match[2].replace(/<[^>]+>/g, "").trim();
      const locationMatch = match[3]?.trim();

      // Ensure rawText is a legitimate job title and NOT a generic action button like "Apply Now"
      if (rawText.length > 3 && isLegitimateJobUrl(url, rawText) && !seenUrls.has(url)) {
        seenUrls.add(url);

        // Parse experience if inside parens, e.g. "(5-8 yrs)"
        const expMatch = rawText.match(/\(([^)]*(?:yr|exp|year)[^)]*)\)/i);
        const experience = expMatch ? expMatch[1].trim() : undefined;
        const cleanTitle = rawText.replace(/\([^)]*\)/g, "").replace(/\s*-\s*$/, "").trim();

        jobs.push({
          title: cleanTitle || rawText,
          company: "hirist.tech",
          location: locationMatch || "India",
          experience,
          url,
        });
      }
    }

    // Special single-job email pattern (e.g. "Opportunity at Sapphire Software Solutions (India) looks like a strong fit", "Senior Full Stack Developer", "Location: Ahmedabad", "Experience: 5 - 8 Years")
    if (jobs.length === 0) {
      // Find the apply / job link
      const applyUrlMatch = emailContent.match(/href=["'](https?:\/\/[^"']*(?:one-click-apply|jobid|\/j\/)[^"']*)["']/i);
      if (applyUrlMatch) {
        const url = applyUrlMatch[1].trim();

        // Extract title: e.g. "Senior Full Stack Developer"
        const titleMatch = emailContent.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i) ||
          emailContent.match(/class=["'][^"']*(?:job-title|title)[^"']*["'][^>]*>([\s\S]*?)<\//i) ||
          emailContent.match(/([A-Z][A-Za-z0-9\s/.-]{4,40}(?:Developer|Engineer|Architect|Lead|Manager|Specialist|Consultant|Designer))/);

        // Extract company: e.g. "Opportunity at Sapphire Software Solutions (India) looks like a strong fit"
        const companyMatch = emailContent.match(/Opportunity at\s+([^<.]+?)\s+looks like a strong fit/i) ||
          emailContent.match(/([A-Z][A-Za-z0-9\s.,()]{3,40}\s*(?:\(India\)|Pvt\.? Ltd\.?|Solutions|Technologies|Software|Corporation))/);

        // Extract location: e.g. "Location: Ahmedabad"
        const locMatch = emailContent.match(/Location\s*:\s*([A-Za-z\s,]+?)(?:<|\n|$)/i);

        // Extract experience: e.g. "Experience: 5 - 8 Years"
        const expMatch = emailContent.match(/Experience\s*:\s*([0-9\s\-+]+(?:Years|Yrs|y|year))/i);

        if (titleMatch && titleMatch[1]) {
          const rawTitle = titleMatch[1].replace(/<[^>]+>/g, "").trim();
          if (rawTitle && isLegitimateJobUrl(url, rawTitle)) {
            jobs.push({
              title: rawTitle,
              company: companyMatch ? companyMatch[1].trim() : "hirist.tech",
              location: locMatch ? locMatch[1].trim() : undefined,
              experience: expMatch ? expMatch[1].trim() : undefined,
              url,
            });
          }
        }
      }
    }
  }

  // 2. linkedin.com pattern: look for job alert view links
  if (senderLower.includes("linkedin")) {
    const linkedinRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    const seenUrls = new Set<string>();

    while ((match = linkedinRegex.exec(emailContent)) !== null) {
      const url = match[1].trim();
      const title = match[2].replace(/<[^>]+>/g, "").trim();

      if (
        title.length > 3 &&
        isLegitimateJobUrl(url, title) &&
        !seenUrls.has(url)
      ) {
        seenUrls.add(url);
        jobs.push({
          title,
          company: "LinkedIn Alert",
          url,
        });
      }
    }
  }

  return jobs;
}

/**
 * Extracts job opportunities with titles, URLs, locations, and experience.
 * Uses high-speed rule parsing first for instant <10ms response, then NVIDIA AI when needed.
 */
export async function extractJobsWithNvidia(
  htmlContent: string,
  textContent: string,
  sender: string
): Promise<JobOpportunity[]> {
  // 1. Try instantaneous rule extraction first from HTML, then plain text
  const combinedContent = htmlContent || textContent || "";
  const fastJobs = fastRuleBasedExtraction(combinedContent, sender);
  if (fastJobs.length > 0) {
    return fastJobs;
  }

  const apiKey = process.env.NVIDIA_API_KEY;
  const model = process.env.NVIDIA_MODEL || "meta/llama-3.2-11b-vision-instruct";

  if (!apiKey || !combinedContent.trim()) {
    return [];
  }

  // Clean HTML tags and strip bloated styles/scripts to reduce tokens drastically
  const strippedText = combinedContent
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, " [$2]($1) ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000); // 3000 chars runs 3x faster and avoids token overflow

  const prompt = `Extract job postings from "${sender}" email into JSON array.
Keys: "title", "company", "location", "experience", "url".
Output ONLY JSON array. Example: [{"title":"React Dev","company":"ABC","location":"Mumbai","experience":"3y","url":"https://..."}]
If none: []

Text:
${strippedText}`;

  try {
    let response = await fetch(NVIDIA_BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 1500,
      }),
    });

    // If NVIDIA upstream suffers a transient 500 error, retry once after 500ms
    if (response.status === 500 || response.status === 503) {
      console.warn("NVIDIA 500 inference error, attempting quick retry...");
      await new Promise((r) => setTimeout(r, 600));
      response = await fetch(NVIDIA_BASE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 1500,
        }),
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`NVIDIA API response (${response.status}):`, errText);
      return [];
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim() || "[]";

    // Clean markdown fences
    let cleanText = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // Check if the LLM returned multiple separate arrays like [...] \n [...]
    if (cleanText.includes("][") || cleanText.includes("]\n[") || cleanText.includes("] [") || cleanText.includes("]\r\n[")) {
      cleanText = cleanText
        .replace(/\]\s*\n*\s*\[/g, ", ")
        .replace(/\]\s*\[/g, ", ")
        .trim();
    }

    // Helper to repair truncated JSON strings (e.g. cut off mid-URL without closing quote or braces)
    const repairTruncatedJson = (str: string): string => {
      let repaired = str.trim();
      if (!repaired.startsWith("[")) {
        const b = repaired.indexOf("[");
        if (b !== -1) repaired = repaired.substring(b);
        else return repaired;
      }

      // If it ends with an unclosed string like: "url":"https://...
      // Count quotes that are not escaped
      let inString = false;
      for (let i = 0; i < repaired.length; i++) {
        if (repaired[i] === '"' && (i === 0 || repaired[i - 1] !== "\\")) {
          inString = !inString;
        }
      }

      // If string was truncated mid-way, close the quote
      if (inString) {
        repaired += '"';
      }

      // Check for unclosed curly braces and brackets
      let openCurlies = 0;
      let inStr = false;
      for (let i = 0; i < repaired.length; i++) {
        const char = repaired[i];
        if (char === '"' && (i === 0 || repaired[i - 1] !== "\\")) {
          inStr = !inStr;
        } else if (!inStr) {
          if (char === "{") openCurlies++;
          else if (char === "}") openCurlies--;
        }
      }

      while (openCurlies > 0) {
        repaired += "}";
        openCurlies--;
      }

      if (!repaired.trim().endsWith("]")) {
        repaired += "]";
      }

      return repaired;
    };

    // Safely extract the JSON array slice [ ... ]
    const firstBracket = cleanText.indexOf("[");
    const lastBracket = cleanText.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleanText = cleanText.substring(firstBracket, lastBracket + 1);
    } else if (firstBracket !== -1) {
      cleanText = repairTruncatedJson(cleanText.substring(firstBracket));
    }

    console.log("Showing Log for -> cleanText > at 302 line > ", cleanText); // Rut-console-log
    try {
      let parsed: any;
      try {
        parsed = JSON.parse(cleanText);
      } catch (initialErr) {
        // Try repairing truncated quotes / unclosed braces
        const healed = repairTruncatedJson(cleanText);
        parsed = JSON.parse(healed);
      }

      if (Array.isArray(parsed)) {
        return parsed
          .filter((item: any) => {
            const title = (item.title || "").trim();
            const url = (item.url || "").trim();
            if (!url || !title) return false;
            return isLegitimateJobUrl(url, title);
          })
          .map((item: any) => ({
            title: item.title || "Job Opportunity",
            company: item.company || undefined,
            location: item.location || undefined,
            experience: item.experience || undefined,
            url: item.url || undefined,
          }));
      }
      return [];
    } catch (parseErr) {
      // Robust Fallback: extract individual items by regex matching titles and URLs even if cut off
      const recoveredJobs: JobOpportunity[] = [];
      const itemRegex = /\{[\s\S]*?"title"\s*:\s*"([^"]+)"[\s\S]*?"url"\s*:\s*"([^"]+)"[\s\S]*?\}/g;
      let match;
      while ((match = itemRegex.exec(rawContent)) !== null) {
        const title = match[1]?.trim();
        const url = match[2]?.trim();
        if (title && url && isLegitimateJobUrl(url, title)) {
          // Extract optional company / location / experience if present
          const compMatch = match[0].match(/"company"\s*:\s*"([^"]+)"/);
          const locMatch = match[0].match(/"location"\s*:\s*"([^"]+)"/);
          const expMatch = match[0].match(/"experience"\s*:\s*"([^"]+)"/);
          recoveredJobs.push({
            title,
            url,
            company: compMatch ? compMatch[1] : undefined,
            location: locMatch ? locMatch[1] : undefined,
            experience: expMatch ? expMatch[1] : undefined,
          });
        }
      }

      // If cut off mid-URL at the very end of raw output, capture the last unfinished item too!
      if (recoveredJobs.length === 0) {
        const partialMatch = rawContent.match(/"title"\s*:\s*"([^"]+)"[\s\S]*?"url"\s*:\s*"(https?:\/\/[^\s"]+)/);
        if (partialMatch && partialMatch[1] && partialMatch[2]) {
          const title = partialMatch[1].trim();
          const url = partialMatch[2].replace(/[",}\]]+$/, "").trim();
          if (isLegitimateJobUrl(url, title)) {
            const compMatch = rawContent.match(/"company"\s*:\s*"([^"]+)"/);
            const locMatch = rawContent.match(/"location"\s*:\s*"([^"]+)"/);
            const expMatch = rawContent.match(/"experience"\s*:\s*"([^"]+)"/);
            recoveredJobs.push({
              title,
              url,
              company: compMatch ? compMatch[1] : undefined,
              location: locMatch ? locMatch[1] : undefined,
              experience: expMatch ? expMatch[1] : undefined,
            });
          }
        }
      }

      if (recoveredJobs.length > 0) {
        return recoveredJobs;
      }

      console.warn("Could not parse JSON from NVIDIA model output:", parseErr);
      return [];
    }
  } catch (error) {
    console.error("Failed to extract jobs using NVIDIA AI:", error);
    return [];
  }
}
