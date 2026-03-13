import { SENDER } from "./sender";
import type { AngleCategory, SparseInput, Contact, ResearchBrief } from "./types";

// ---------------------------------------------------------------------------
// Enrichment: sparse input -> full contact
// ---------------------------------------------------------------------------

export const ENRICHMENT_SYSTEM_SEARCH = `You are an identity resolution assistant. Given sparse info about a person, determine who they are using ONLY the search results provided. Never invent information. If uncertain, leave fields blank. Return valid JSON only.`;

export const ENRICHMENT_SYSTEM_KNOWLEDGE = `You are an identity resolution assistant. No live search results are available, so use your knowledge of publicly known people. Be honest about your confidence:
- For famous/widely-known public figures (CEOs of major companies, TV personalities, prominent investors, etc.) you can be confident — set identity_confidence 0.7-0.9.
- For moderately known professionals, cap identity_confidence at 0.5-0.7.
- For people you're not sure about, set identity_confidence below 0.4 and note the uncertainty.
Never fabricate specific details (exact funding amounts, recent quotes, dates) — only state things you are genuinely confident about. Return valid JSON only.`;

export function enrichmentUserPrompt(
  sparse: SparseInput,
  searchResults: string,
  hasSearch: boolean
): string {
  const known: string[] = [`- Name: ${sparse.name}`];
  if (sparse.email) known.push(`- Email: ${sparse.email}`);
  if (sparse.linkedin) known.push(`- LinkedIn: ${sparse.linkedin}`);
  if (sparse.company) known.push(`- Company: ${sparse.company}`);
  if (sparse.website) known.push(`- Website: ${sparse.website}`);
  if (sparse.twitter) known.push(`- Twitter/X: ${sparse.twitter}`);
  if (sparse.notes) known.push(`- Notes: ${sparse.notes}`);

  if (hasSearch) {
    return `Identify and enrich this person's profile using ONLY the search results below.

KNOWN:
${known.join("\n")}

<search_results>
${searchResults}
</search_results>

Return JSON:
{"full_name":"","company":"","role":"","website":"","linkedin":"","twitter":"","bio_summary":"1-2 sentences","identity_confidence":0.0-1.0,"ambiguity_note":""}`;
  }

  return `Identify and enrich this person's profile using your knowledge.

KNOWN:
${known.join("\n")}

Use what you know about this person. If they are a well-known public figure, fill in their details confidently. If you're unsure who they are, say so and set low confidence.

Return JSON:
{"full_name":"","company":"","role":"","website":"","linkedin":"","twitter":"","bio_summary":"1-2 sentences","identity_confidence":0.0-1.0,"ambiguity_note":""}`;
}

// ---------------------------------------------------------------------------
// Research: contact -> research brief
// ---------------------------------------------------------------------------

export const RESEARCH_SYSTEM_SEARCH = `You are a research assistant. Produce a structured brief from search results. Only include facts clearly supported by the results. Never invent or speculate. Be specific: company names, projects, publications, rounds.`;

export const RESEARCH_SYSTEM_KNOWLEDGE = `You are a research assistant. No live search results are available. Use your knowledge of this person to produce a research brief.
Rules:
- Only state facts you are genuinely confident about (well-known achievements, public roles, famous projects).
- Do NOT fabricate specific recent quotes, exact dates, specific funding numbers, or recent events you aren't sure about.
- For famous people, you can be confident about their major known work.
- For less-known people, state what you can and mark confidence accordingly.
- Cap confidence at 0.75 max without live search, unless the person is extremely famous.`;

export function researchUserPrompt(
  contact: Contact,
  searchResults: string,
  hasSearch: boolean
): string {
  const info: string[] = [`Name: ${contact.full_name}`];
  if (contact.company) info.push(`Company: ${contact.company}`);
  if (contact.role) info.push(`Role: ${contact.role}`);
  if (contact.website) info.push(`Website: ${contact.website}`);
  if (contact.linkedin) info.push(`LinkedIn: ${contact.linkedin}`);
  if (contact.twitter) info.push(`Twitter/X: ${contact.twitter}`);
  if (contact.notes) info.push(`Notes: ${contact.notes}`);

  const facetKeys = Object.keys(SENDER.background_facets).join(" | ");
  const senderCtx = `Sender context: ${SENDER.name}, ${SENDER.current_role} at ${SENDER.company}. ${SENDER.education}. Interests: aviation/airworthiness AI, investing/economic development, China infrastructure trip, building AI tools, intellectual ambition. Pick the background_emphasis that best fits this recipient's world.`;

  if (hasSearch) {
    return `Research brief for:
${info.join("\n")}

<search_results>
${searchResults}
</search_results>

Return JSON with ONLY verified facts:
{"specific_facts":["fact1","fact2","fact3 or INSUFFICIENT DATA"],"plausible_reasons":["reason1","reason2"],"recommended_angle":"one sentence","background_emphasis":"${facetKeys}","confidence_score":0.0-1.0}

${senderCtx}`;
  }

  return `Research brief for:
${info.join("\n")}

No live search results available. Use your knowledge of this person. Only state facts you're confident about. Do not fabricate specific recent events or quotes.

Return JSON:
{"specific_facts":["fact1","fact2","fact3 or INSUFFICIENT DATA"],"plausible_reasons":["reason1","reason2"],"recommended_angle":"one sentence","background_emphasis":"${facetKeys}","confidence_score":0.0-1.0}

${senderCtx}`;
}

// ---------------------------------------------------------------------------
// Email generation: brief -> draft
// ---------------------------------------------------------------------------

export const EMAIL_SYSTEM = `You ghostwrite cold emails for a 21-year-old engineering student. The emails should sound like he actually typed them — not like a polished AI networking message.

Voice rules:
- Short sentences. Direct. Casual-professional, not formal.
- Specific praise only — reference a concrete thing they did, built, or said.
- "I saw you..." or "I read your..." is better than "Your work demonstrates..."
- No words like: remarkable, strategic, foresight, leverage, ecosystem, landscape, trajectory, pivot, intersection, impressive, inspiring.
- No phrases like: "from both X and Y perspective", "at the intersection of", "where the real X will emerge", "application layer".
- No stacking multiple abstract concepts in one sentence.
- The reader should think "this kid is sharp" not "this was clearly AI-generated."
- End with something easy to say yes to. Not formal. Not stiff.
- Sign off with just "Kuzey" (no "Best," or "Best regards,").
- 3-5 sentences max. Shorter is better.`;

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
    .filter(f => !f.toUpperCase().includes("INSUFFICIENT"))
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

IMPORTANT — write like a real person, not an AI:
- No abstract praise. Be specific about what impressed you.
- Keep sentences short. One idea per sentence.
- Sound warm but casual. Like a smart 21-year-old, not a consultant.
- "I'd love to hear how you think about X" > "I would greatly value your perspective on X"
- "Would you be up for a quick call sometime?" > "If you'd ever be open to a brief conversation, I'd really value it."

Return JSON: {"subject_lines":["s1","s2","s3"],"body":"3-5 sentences","sender_details_used":["what you emphasized"]}`;
}
