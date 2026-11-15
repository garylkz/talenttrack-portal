import { lookupApplication } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const applicationId =
      typeof body.applicationId === "string" ? body.applicationId.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!applicationId || !email) {
      return NextResponse.json(
        { error: "Please enter both your Application ID and email address." },
        { status: 400 }
      );
    }

    const application = await lookupApplication(applicationId, email);
    if (!application) {
      return NextResponse.json(
        {
          error:
            "No matching application found. Please double-check your Application ID and the email address used when applying.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Application lookup failed:", error);
    return NextResponse.json(
      {
        error:
          "Unable to look up your application right now. Please try again shortly.",
      },
      { status: 500 }
    );
  }
}
