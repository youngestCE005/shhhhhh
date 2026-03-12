import { SENDER } from "./sender";
import type { AngleCategory, SparseInput, Contact, ResearchBrief } from "./types";

// ---------------------------------------------------------------------------
// Enrichment: sparse input -> full contact
// ---------------------------------------------------------------------------

export const ENRICHMENT_SYSTEM = `You are an identity resolution assistant. Given sparse info about a person, determine who they are using ONLY the search results provided. Never invent information. If uncertain, leave fields blank. Return valid JSON only.`;

export function enrichmentUserPrompt(
  sparse: SparseInput,
  searchResults: string
): string {
  // Only include fields that have actual data — saves tokens
  const known: string[] = [`- Name: ${sparse.name}`];
  if (sparse.email) known.push(`- Email: ${sparse.email}`);
  if (sparse.linkedin) known.push(`- LinkedIn: ${sparse.linkedin}`);
  if (sparse.company) known.push(`- Company: ${sparse.company}`);
  if (sparse.website) known.push(`- Website: ${sparse.website}`);
  if (sparse.twitter) known.push(`- Twitter/X: ${sparse.twitter}`);
  if (sparse.notes) known.push(`- Notes: ${sparse.notes}`);

  return `Identify and enrich this person's profile using ONLY the search results below.

KNOWN:
${known.join("\n")}

<search_results>
${searchResults}
</search_results>

Return JSON:
{"full_name":"","company":"","role":"","website":"","linkedin":"","twitter":"","bio_summary":"1-2 sentences","identity_confidence":0.0-1.0,"ambiguity_note":""}`;
}

// ---------------------------------------------------------------------------
// Research: contact -> research brief
// ---------------------------------------------------------------------------

export const RESEARCH_SYSTEM = `You are a research assistant. Produce a structured brief from search results. Only include facts clearly supported by the results. Never invent or speculate. Be specific: company names, projects, publications, rounds.`;

export function researchUserPrompt(
  contact: Contact,
  searchResults: string
): string {
  // Only include non-empty contact fields
  const info: string[] = [`Name: ${contact.full_name}`];
  if (contact.company) info.push(`Company: ${contact.company}`);
  if (contact.role) info.push(`Role: ${contact.role}`);
  if (contact.website) info.push(`Website: ${contact.website}`);
  if (contact.linkedin) info.push(`LinkedIn: ${contact.linkedin}`);
  if (contact.twitter) info.push(`Twitter/X: ${contact.twitter}`);
  if (contact.notes) info.push(`Notes: ${contact.notes}`);

  const facetKeys = Object.keys(SENDER.background_facets).join(" | ");

  return `Research brief for:
${info.join("\n")}

<search_results>
${searchResults}
</search_results>

Return JSON with ONLY verified facts:
{"specific_facts":["fact1","fact2","fact3 or INSUFFICIENT DATA"],"plausible_reasons":["reason1","reason2"],"recommended_angle":"one sentence","background_emphasis":"${facetKeys}","confidence_score":0.0-1.0}

Sender context: ${SENDER.name}, ${SENDER.current_role} at ${SENDER.company}. ${SENDER.education}. Interests: aviation/airworthiness AI, investing/economic development, China infrastructure trip, building AI tools, intellectual ambition. Pick the background_emphasis that best fits this recipient's world.`;
}

// ---------------------------------------------------------------------------
// Email generation: brief -> draft
// ---------------------------------------------------------------------------

export const EMAIL_SYSTEM = `You ghostwrite cold emails: warm, sharp, polished, human. 3-5 sentences only. Specific praise tied to something concrete. Low-friction CTA. No vague praise, no exclamation marks, no jargon, no filler. Vary framing per recipient. Never invent facts.`;

export function emailUserPrompt(
  contact: Contact,
  brief: ResearchBrief,
  previousAngles: string[]
): string {
  const emphasis = brief.background_emphasis;
  const emphasisDetail =
    SENDER.background_facets[emphasis] ||
    SENDER.background_facets.builder_ambition_intellectual;

  const facts = brief.specific_facts
    .map((f, i) => `${i + 1}. ${f}`)
    .join("\n");

  const prev =
    previousAngles.length > 0
      ? previousAngles.slice(-5).join("\n")
      : "(first email)";

  const label = emphasis.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return `RECIPIENT: ${contact.full_name}, ${contact.role} at ${contact.company}

FACTS:
${facts}
Angle: ${brief.recommended_angle}

SENDER: ${SENDER.name}, ${label}. ${emphasisDetail} ${SENDER.education}.

DO NOT reuse these prior framings:
${prev}

STYLE: ${SENDER.tone_guidelines.join(" ")} ${SENDER.anti_patterns.join(" ")}

Return JSON: {"subject_lines":["s1","s2","s3"],"body":"3-5 sentences","sender_details_used":["what you emphasized"]}`;
}
