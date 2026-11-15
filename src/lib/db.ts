import { Firestore } from "@google-cloud/firestore";
import fs from "fs/promises";
import path from "path";
import { PIPELINE_STAGES } from "./config";
import {
  ApplicationStage,
  CreateApplicationInput,
  JobApplication,
  PipelineStage,
  UpdateApplicationInput,
} from "./types";

const COLLECTION_NAME = process.env.FIRESTORE_COLLECTION || "applications";
const LOCAL_DB_PATH = path.join(process.cwd(), ".data", "applications.json");

let firestoreInstance: Firestore | null = null;

function useLocalFallback(): boolean {
  return process.env.USE_LOCAL_DB === "true";
}

function getFirestore(): Firestore {
  if (!firestoreInstance) {
    firestoreInstance = new Firestore({
      ignoreUndefinedProperties: true,
      databaseId: process.env.FIRESTORE_DATABASE_ID || "(default)",
    });
  }
  return firestoreInstance;
}

async function readLocalDb(): Promise<Record<string, JobApplication>> {
  try {
    const raw = await fs.readFile(LOCAL_DB_PATH, "utf8");
    return JSON.parse(raw) as Record<string, JobApplication>;
  } catch {
    return {};
  }
}

async function writeLocalDb(
  records: Record<string, JobApplication>
): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_DB_PATH), { recursive: true });
  await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(records, null, 2), "utf8");
}

export function normalizeApplicationId(id: string): string {
  return id.trim().toUpperCase();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isPipelineStage(stage: ApplicationStage): stage is PipelineStage {
  return (PIPELINE_STAGES as string[]).includes(stage);
}

function generateApplicationId(): string {
  const year = new Date().getFullYear();
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `APP-${year}-${digits}`;
}

export async function getApplicationById(
  id: string
): Promise<JobApplication | null> {
  const normalizedId = normalizeApplicationId(id);
  if (!normalizedId) return null;

  if (useLocalFallback()) {
    const db = await readLocalDb();
    return db[normalizedId] || null;
  }

  const doc = await getFirestore()
    .collection(COLLECTION_NAME)
    .doc(normalizedId)
    .get();
  if (!doc.exists) return null;
  return doc.data() as JobApplication;
}

export async function lookupApplication(
  applicationId: string,
  email: string
): Promise<JobApplication | null> {
  const app = await getApplicationById(applicationId);
  if (!app) return null;

  if (normalizeEmail(app.email) !== normalizeEmail(email)) {
    return null;
  }
  return app;
}

export async function listApplications(): Promise<JobApplication[]> {
  if (useLocalFallback()) {
    const db = await readLocalDb();
    return Object.values(db).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
  }

  const snapshot = await getFirestore()
    .collection(COLLECTION_NAME)
    .orderBy("updatedAt", "desc")
    .get();

  return snapshot.docs.map((doc) => doc.data() as JobApplication);
}

export async function createApplication(
  input: CreateApplicationInput
): Promise<JobApplication> {
  const now = new Date().toISOString();
  const initialStage: ApplicationStage = input.currentStage || "Applied";
  const lastActivePipelineStage: PipelineStage = isPipelineStage(initialStage)
    ? initialStage
    : "Applied";

  let id = input.customId
    ? normalizeApplicationId(input.customId)
    : generateApplicationId();

  // Ensure no accidental ID collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await getApplicationById(id);
    if (!existing) break;
    id = generateApplicationId();
  }

  const trimmedNote = input.candidateNote?.trim() || undefined;
  const history = [
    {
      stage: initialStage,
      updatedAt: now,
      ...(trimmedNote ? { note: trimmedNote } : {}),
    },
  ];

  const application: JobApplication = {
    id,
    applicantName: input.applicantName.trim(),
    email: normalizeEmail(input.email),
    jobTitle: input.jobTitle.trim(),
    department: input.department.trim(),
    location: (input.location || "Singapore (Hybrid)").trim(),
    currentStage: initialStage,
    lastActivePipelineStage,
    ...(trimmedNote ? { candidateNote: trimmedNote } : {}),
    appliedAt: now,
    updatedAt: now,
    history,
  };

  if (useLocalFallback()) {
    const db = await readLocalDb();
    db[id] = application;
    await writeLocalDb(db);
    return application;
  }

  await getFirestore().collection(COLLECTION_NAME).doc(id).set(application);
  return application;
}

export async function updateApplication(
  id: string,
  updates: UpdateApplicationInput
): Promise<JobApplication | null> {
  const normalizedId = normalizeApplicationId(id);
  const existing = await getApplicationById(normalizedId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const nextStage = updates.currentStage ?? existing.currentStage;
  const stageChanged = nextStage !== existing.currentStage;

  const nextNote =
    updates.candidateNote !== undefined
      ? updates.candidateNote.trim() || undefined
      : existing.candidateNote;
  const noteChanged =
    updates.candidateNote !== undefined && nextNote !== existing.candidateNote;

  const nextLastActivePipelineStage: PipelineStage = isPipelineStage(nextStage)
    ? nextStage
    : existing.lastActivePipelineStage || "Applied";

  const nextHistory = [...(existing.history || [])];
  if (stageChanged || noteChanged) {
    nextHistory.push({
      stage: nextStage,
      updatedAt: now,
      ...(nextNote ? { note: nextNote } : {}),
    });
  }

  const updated: JobApplication = {
    ...existing,
    applicantName:
      updates.applicantName !== undefined
        ? updates.applicantName.trim()
        : existing.applicantName,
    email:
      updates.email !== undefined
        ? normalizeEmail(updates.email)
        : existing.email,
    jobTitle:
      updates.jobTitle !== undefined
        ? updates.jobTitle.trim()
        : existing.jobTitle,
    department:
      updates.department !== undefined
        ? updates.department.trim()
        : existing.department,
    location:
      updates.location !== undefined
        ? updates.location.trim()
        : existing.location,
    currentStage: nextStage,
    lastActivePipelineStage: nextLastActivePipelineStage,
    candidateNote: nextNote,
    updatedAt: now,
    history: nextHistory,
  };

  if (!updated.candidateNote) {
    delete updated.candidateNote;
  }

  if (useLocalFallback()) {
    const db = await readLocalDb();
    db[normalizedId] = updated;
    await writeLocalDb(db);
    return updated;
  }

  await getFirestore()
    .collection(COLLECTION_NAME)
    .doc(normalizedId)
    .set(updated);
  return updated;
}

export async function deleteApplication(id: string): Promise<boolean> {
  const normalizedId = normalizeApplicationId(id);
  const existing = await getApplicationById(normalizedId);
  if (!existing) return false;

  if (useLocalFallback()) {
    const db = await readLocalDb();
    delete db[normalizedId];
    await writeLocalDb(db);
    return true;
  }

  await getFirestore().collection(COLLECTION_NAME).doc(normalizedId).delete();
  return true;
}

export async function seedSampleApplications(): Promise<JobApplication[]> {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const samples: JobApplication[] = [
    {
      id: "APP-2026-1042",
      applicantName: "Sarah Tan",
      email: "sarah.tan@example.com",
      jobTitle: "Senior Cloud Engineer",
      department: "Platform Infrastructure",
      location: "Singapore (Hybrid)",
      currentStage: "Interview",
      lastActivePipelineStage: "Interview",
      candidateNote:
        "Technical panel interview scheduled for Tuesday at 2:30 PM SGT via Google Meet. Check your email for the calendar invite.",
      appliedAt: new Date(now - 9 * dayMs).toISOString(),
      updatedAt: new Date(now - 1 * dayMs).toISOString(),
      history: [
        {
          stage: "Applied",
          updatedAt: new Date(now - 9 * dayMs).toISOString(),
          note: "Application submitted through careers portal.",
        },
        {
          stage: "Screening",
          updatedAt: new Date(now - 6 * dayMs).toISOString(),
          note: "Introductory recruiter chat completed.",
        },
        {
          stage: "Interview",
          updatedAt: new Date(now - 1 * dayMs).toISOString(),
          note: "Technical panel interview scheduled for Tuesday at 2:30 PM SGT via Google Meet.",
        },
      ],
    },
    {
      id: "APP-2026-2088",
      applicantName: "Marcus Lim",
      email: "marcus.lim@example.com",
      jobTitle: "Product Designer",
      department: "Design & UX",
      location: "Singapore (On-site)",
      currentStage: "Offer",
      lastActivePipelineStage: "Offer",
      candidateNote:
        "Formal offer package has been sent to your email. Please let your recruiter know if you would like to schedule a follow-up call.",
      appliedAt: new Date(now - 16 * dayMs).toISOString(),
      updatedAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
      history: [
        {
          stage: "Applied",
          updatedAt: new Date(now - 16 * dayMs).toISOString(),
        },
        {
          stage: "Screening",
          updatedAt: new Date(now - 13 * dayMs).toISOString(),
          note: "Portfolio review passed.",
        },
        {
          stage: "Interview",
          updatedAt: new Date(now - 5 * dayMs).toISOString(),
          note: "Completed design critique and hiring manager interview.",
        },
        {
          stage: "Offer",
          updatedAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
          note: "Formal offer package has been sent to your email.",
        },
      ],
    },
    {
      id: "APP-2026-3195",
      applicantName: "Priya Nair",
      email: "priya.nair@example.com",
      jobTitle: "Data Analyst",
      department: "Data & Analytics",
      location: "Remote (APAC)",
      currentStage: "Screening",
      lastActivePipelineStage: "Screening",
      candidateNote:
        "Our talent specialist is reviewing your SQL & analytics case experience and will reach out within 3 business days.",
      appliedAt: new Date(now - 3 * dayMs).toISOString(),
      updatedAt: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
      history: [
        {
          stage: "Applied",
          updatedAt: new Date(now - 3 * dayMs).toISOString(),
        },
        {
          stage: "Screening",
          updatedAt: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
          note: "Moved to recruiter screening.",
        },
      ],
    },
    {
      id: "APP-2026-4410",
      applicantName: "Daniel Wong",
      email: "daniel.wong@example.com",
      jobTitle: "Frontend Software Engineer",
      department: "Web Experience",
      location: "Singapore (Hybrid)",
      currentStage: "Hired",
      lastActivePipelineStage: "Hired",
      candidateNote:
        "Signed offer received! Onboarding instructions and equipment preferences will be sent 1 week prior to your start date.",
      appliedAt: new Date(now - 24 * dayMs).toISOString(),
      updatedAt: new Date(now - 2 * dayMs).toISOString(),
      history: [
        {
          stage: "Applied",
          updatedAt: new Date(now - 24 * dayMs).toISOString(),
        },
        {
          stage: "Screening",
          updatedAt: new Date(now - 20 * dayMs).toISOString(),
        },
        {
          stage: "Interview",
          updatedAt: new Date(now - 12 * dayMs).toISOString(),
        },
        {
          stage: "Offer",
          updatedAt: new Date(now - 5 * dayMs).toISOString(),
        },
        {
          stage: "Hired",
          updatedAt: new Date(now - 2 * dayMs).toISOString(),
          note: "Signed offer received! Welcome to the team.",
        },
      ],
    },
  ];

  if (useLocalFallback()) {
    const db = await readLocalDb();
    for (const sample of samples) {
      db[sample.id] = sample;
    }
    await writeLocalDb(db);
    return listApplications();
  }

  const batch = getFirestore().batch();
  for (const sample of samples) {
    const ref = getFirestore().collection(COLLECTION_NAME).doc(sample.id);
    batch.set(ref, sample, { merge: true });
  }
  await batch.commit();
  return listApplications();
}
