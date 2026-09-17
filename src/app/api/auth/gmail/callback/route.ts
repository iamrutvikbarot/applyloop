import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client } from "@/lib/googleAuth";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code) {
    console.error("OAuth callback error or missing code:", error);
    return NextResponse.redirect(`${baseUrl}/?auth_error=${encodeURIComponent(error || "missing_code")}`);
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user profile information (name, email, avatar)
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const userInfoResponse = await oauth2.userinfo.get();
    const user = {
      name: userInfoResponse.data.name || "User",
      email: userInfoResponse.data.email || "",
      picture: userInfoResponse.data.picture || "",
    };

    // Store user session info and access token securely in HTTP-only cookies
    const response = NextResponse.redirect(`${baseUrl}/dashboard`);

    response.cookies.set("applyloop_user", JSON.stringify(user), {
      httpOnly: false, // Accessible to client to show profile info
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      sameSite: "lax",
    });

    if (tokens.access_token) {
      response.cookies.set("applyloop_gmail_token", tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
        path: "/",
        sameSite: "lax",
      });
    }

    if (tokens.refresh_token) {
      response.cookies.set("applyloop_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
        sameSite: "lax",
      });
    }

    return response;
  } catch (err: unknown) {
    console.error("Error exchanging code for tokens:", err);
    return NextResponse.redirect(`${baseUrl}/?auth_error=token_exchange_failed`);
  }
}
