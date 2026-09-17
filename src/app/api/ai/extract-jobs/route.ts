import { NextRequest, NextResponse } from "next/server";
import { extractJobsWithNvidia } from "@/lib/nvidiaJobExtractor";

export async function POST(request: NextRequest) {
  try {
    const { htmlBody, textBody, from } = await request.json();

    const jobs = await extractJobsWithNvidia(htmlBody || "", textBody || "", from || "");

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error("Extract jobs API error:", error);
    return NextResponse.json(
      { error: "Failed to extract jobs with AI", jobs: [] },
      { status: 500 }
    );
  }
}
