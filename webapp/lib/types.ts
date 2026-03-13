export type ModelTier = "sonnet" | "opus" | "auto";

export type AngleCategory =
  | "aviation_engineering"
  | "investing_economic_development"
  | "global_infrastructure_china"
  | "ai_tools_technical_initiative"
  | "builder_ambition_intellectual";

export const ANGLE_LABELS: Record<AngleCategory, string> = {
  aviation_engineering: "Aviation / Engineering",
  investing_economic_development: "Investing / Economic Development",
  global_infrastructure_china: "Global Infrastructure / China",
  ai_tools_technical_initiative: "AI Tools / Technical Initiative",
  builder_ambition_intellectual: "Builder Ambition / Intellectual",
};

export interface SparseInput {
  name: string;
  email?: string;
  linkedin?: string;
  company?: string;
  website?: string;
  twitter?: string;
  notes?: string;
  highPriority?: boolean;
}

export interface Contact {
  full_name: string;
  company: string;
  role: string;
  website: string;
  linkedin: string;
  twitter: string;
  notes: string;
}

export interface ResearchBrief {
  specific_facts: string[];
  plausible_reasons: string[];
  recommended_angle: string;
  background_emphasis: AngleCategory;
  confidence_score: number;
}

export interface EmailDraft {
  subject_lines: string[];
  body: string;
  angle_used: AngleCategory;
  sender_details_used: string[];
}

export interface ProcessedResult {
  id: string;
  input: SparseInput;
  contact: Contact;
  brief: ResearchBrief;
  draft: EmailDraft;
  bio_summary: string;
  identity_confidence: number;
  flagged: boolean;
  warning: string;
  review_status: "pending" | "accepted" | "skipped" | "uncertain";
  edited_body?: string;
  edited_angle?: AngleCategory;
  model_used?: string;
  debug?: {
    searchProvider: string;
    queriesRun: number;
    resultsFound: number;
    searchFailed: boolean;
    mode: "search-grounded" | "knowledge-assisted";
  };
}

export interface ExportRow {
  input_name: string;
  resolved_name: string;
  email: string;
  linkedin: string;
  company: string;
  role: string;
  chosen_angle: string;
  confidence: string;
  subject_line_1: string;
  subject_line_2: string;
  subject_line_3: string;
  email_body: string;
  review_status: string;
  warning_flag: string;
}
