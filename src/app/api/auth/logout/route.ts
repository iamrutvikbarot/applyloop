import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("applyloop_gmail_token")?.value;
  const refreshToken = request.cookies.get("applyloop_refresh_token")?.value;

  // Revoke token on Google's servers so the user is forced to grant consent again on next sign in
  const tokenToRevoke = refreshToken || token;
  if (tokenToRevoke) {
    try {
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tokenToRevoke)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
    } catch (err) {
      console.error("Error revoking token with Google:", err);
    }
  }

  const response = NextResponse.json({ success: true });

  // Delete all cookies with matching options
  const cookieOptions = {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };

  response.cookies.set("applyloop_user", "", cookieOptions);
  response.cookies.set("applyloop_gmail_token", "", cookieOptions);
  response.cookies.set("applyloop_refresh_token", "", cookieOptions);

  return response;
}
