export type PipelineStage =
  | "Applied"
  | "Screening"
  | "Interview"
  | "Offer"
  | "Hired";

export type ApplicationStage = PipelineStage | "Rejected";

export interface StageHistoryEntry {
  stage: ApplicationStage;
  updatedAt: string;
  note?: string;
}

export interface JobApplication {
  id: string;
  applicantName: string;
  email: string;
  jobTitle: string;
  department: string;
  location: string;
  currentStage: ApplicationStage;
  lastActivePipelineStage: PipelineStage;
  candidateNote?: string;
  appliedAt: string;
  updatedAt: string;
  history: StageHistoryEntry[];
}

export interface CreateApplicationInput {
  applicantName: string;
  email: string;
  jobTitle: string;
  department: string;
  location?: string;
  currentStage?: ApplicationStage;
  candidateNote?: string;
  customId?: string;
}

export interface UpdateApplicationInput {
  applicantName?: string;
  email?: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  currentStage?: ApplicationStage;
  candidateNote?: string;
}
