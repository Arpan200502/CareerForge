import { NextResponse } from "next/server";

const DEFAULT_BACKEND_URL = "http://localhost:5000";

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL;
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

  return NextResponse.json(
    {
      success: true,
      backendUrl,
      clerkPublishableKey,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
