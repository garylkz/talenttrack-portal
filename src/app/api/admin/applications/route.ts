import { isAdminAuthenticated } from "@/lib/auth";
import { ALL_STAGES } from "@/lib/config";
import {
  createApplication,
  listApplications,
  seedSampleApplications,
} from "@/lib/db";
import { ApplicationStage } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const applications = await listApplications();
    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Failed to list applications:", error);
    return NextResponse.json(
      { error: "Failed to load applications from database." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.action === "seed") {
      const applications = await seedSampleApplications();
      return NextResponse.json({ applications });
    }

    const applicantName =
      typeof body.applicantName === "string" ? body.applicantName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const jobTitle =
      typeof body.jobTitle === "string" ? body.jobTitle.trim() : "";
    const department =
      typeof body.department === "string" ? body.department.trim() : "";
    const location =
      typeof body.location === "string" ? body.location.trim() : "";
    const candidateNote =
      typeof body.candidateNote === "string" ? body.candidateNote.trim() : "";
    const customId =
      typeof body.customId === "string" ? body.customId.trim() : "";
    const currentStage: ApplicationStage = ALL_STAGES.includes(
      body.currentStage
    )
      ? body.currentStage
      : "Applied";

    if (!applicantName || !email || !jobTitle || !department) {
      return NextResponse.json(
        {
          error:
            "Candidate name, email, job title, and department are required.",
        },
        { status: 400 }
      );
    }

    const application = await createApplication({
      applicantName,
      email,
      jobTitle,
      department,
      location,
      currentStage,
      candidateNote,
      customId: customId || undefined,
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("Failed to create application:", error);
    return NextResponse.json(
      { error: "Failed to create application." },
      { status: 500 }
    );
  }
}
