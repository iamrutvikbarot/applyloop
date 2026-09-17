import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client } from "@/lib/googleAuth";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("applyloop_gmail_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: token });

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const userInfo = await oauth2.userinfo.get();
    return NextResponse.json({
      name: userInfo.data.name || "User",
      email: userInfo.data.email || "",
      picture: userInfo.data.picture || "",
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}
