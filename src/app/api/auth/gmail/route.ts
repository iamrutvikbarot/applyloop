import { NextResponse } from "next/server";
import { getOAuth2Client, GMAIL_SCOPES } from "@/lib/googleAuth";

export async function GET() {
  try {
    const oauth2Client = getOAuth2Client();

    // Generate consent URL asking for gmail.readonly permission
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline", // to get refresh_token
      prompt: "consent",      // ensures permissions/scopes dialog is shown
      scope: GMAIL_SCOPES,
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error generating Google Auth URL:", error);
    return NextResponse.json(
      { error: "Failed to initialize Google Authentication" },
      { status: 500 }
    );
  }
}
