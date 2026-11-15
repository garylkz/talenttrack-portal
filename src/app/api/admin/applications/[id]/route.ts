import { isAdminAuthenticated } from "@/lib/auth";
import { ALL_STAGES } from "@/lib/config";
import { deleteApplication, updateApplication } from "@/lib/db";
import { UpdateApplicationInput } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const updates: UpdateApplicationInput = {};
    if (typeof body.applicantName === "string") {
      updates.applicantName = body.applicantName;
    }
    if (typeof body.email === "string") {
      updates.email = body.email;
    }
    if (typeof body.jobTitle === "string") {
      updates.jobTitle = body.jobTitle;
    }
    if (typeof body.department === "string") {
      updates.department = body.department;
    }
    if (typeof body.location === "string") {
      updates.location = body.location;
    }
    if (typeof body.candidateNote === "string") {
      updates.candidateNote = body.candidateNote;
    }
    if (body.currentStage && ALL_STAGES.includes(body.currentStage)) {
      updates.currentStage = body.currentStage;
    }

    const updated = await updateApplication(id, updates);
    if (!updated) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ application: updated });
  } catch (error) {
    console.error("Failed to update application:", error);
    return NextResponse.json(
      { error: "Failed to update application." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const deleted = await deleteApplication(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Failed to delete application:", error);
    return NextResponse.json(
      { error: "Failed to delete application." },
      { status: 500 }
    );
  }
}
