import { ApplicationStage, PipelineStage } from "./types";

export const BRAND_CONFIG = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "TalentTrack",
  tagline:
    process.env.NEXT_PUBLIC_BRAND_TAGLINE || "Candidate Application Portal",
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "careers@talenttrack.example.com",
};

export const PIPELINE_STAGES: PipelineStage[] = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Hired",
];

export const ALL_STAGES: ApplicationStage[] = [...PIPELINE_STAGES, "Rejected"];

export const STAGE_METADATA: Record<
  ApplicationStage,
  {
    label: string;
    shortLabel: string;
    headline: string;
    description: string;
    badgeClass: string;
  }
> = {
  Applied: {
    label: "Application Received",
    shortLabel: "Applied",
    headline: "Your application has been received",
    description:
      "Thank you for applying! Your profile is in our system and queued for initial review by our talent acquisition team.",
    badgeClass:
      "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
  },
  Screening: {
    label: "Recruiter Screening",
    shortLabel: "Screening",
    headline: "Your application is under recruiter review",
    description:
      "Our recruiting team is actively reviewing your experience and qualifications against the role requirements.",
    badgeClass:
      "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20",
  },
  Interview: {
    label: "Interview Stage",
    shortLabel: "Interview",
    headline: "You are in the interview stage",
    description:
      "You have progressed to interviews with our hiring team. Watch your email for calendar invitations and preparation details.",
    badgeClass:
      "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/25",
  },
  Offer: {
    label: "Offer Extended",
    shortLabel: "Offer",
    headline: "Congratulations — an offer has been extended!",
    description:
      "Our team is thrilled to extend an offer to join us. Please check your inbox or recruiter note below for offer details.",
    badgeClass:
      "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20",
  },
  Hired: {
    label: "Hired & Onboarding",
    shortLabel: "Hired",
    headline: "Welcome aboard!",
    description:
      "Your offer is complete and your application has moved to onboarding. We are excited to welcome you to the team!",
    badgeClass:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  },
  Rejected: {
    label: "Not Selected",
    shortLabel: "Closed",
    headline: "Update on your application",
    description:
      "Thank you sincerely for your time and interest. After careful consideration, we have decided to move forward with other candidates for this position.",
    badgeClass:
      "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
  },
};
