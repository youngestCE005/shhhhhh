import { SENDER } from "./sender";
import type { AngleCategory, SparseInput, Contact, ResearchBrief } from "./types";

// ---------------------------------------------------------------------------
// Enrichment: sparse input -> full contact
// ---------------------------------------------------------------------------

export const ENRICHMENT_SYSTEM = `You are an identity resolution and enrichment assistant. Given sparse information about a person (a name plus one or two identifiers), determine who they are and fill in their professional profile using ONLY the search results provided.

RULES:
- Only output facts clearly supported by the search results.
- If you cannot confidently determine something, leave it blank.
- Never invent or guess information.
- If multiple people match, pick the most prominent/likely match and note the ambiguity.
- Return valid JSON only.`;

export function enrichmentUserPrompt(
  sparse: SparseInput,
  searchResults: string
): string {
  return `I have sparse information about someone. Please identify them and enrich their profile using the search results below.

KNOWN INFORMATION:
- Name: ${sparse.name}
- Email: ${sparse.email || "not provided"}
- LinkedIn: ${sparse.linkedin || "not provided"}
- Company: ${sparse.company || "not provided"}
- Website: ${sparse.website || "not provided"}
- Twitter/X: ${sparse.twitter || "not provided"}
- Notes: ${sparse.notes || "none"}

SEARCH RESULTS:
<search_results>
${searchResults}
</search_results>

Based ONLY on the search results, return a JSON object:
{
  "full_name": "Their full name as commonly known",
  "company": "Current company or organization",
  "role": "Current role or title",
  "website": "Personal or company website if found",
  "linkedin": "LinkedIn URL if found",
  "twitter": "Twitter/X URL if found",
  "bio_summary": "1-2 sentence summary of who they are",
  "identity_confidence": 0.0 to 1.0,
  "ambiguity_note": "Any notes about identity uncertainty, or empty string"
}

If the search results are empty or unhelpful, still return the JSON with what you know and set identity_confidence accordingly.`;
}

// ---------------------------------------------------------------------------
// Research: contact -> research brief
// ---------------------------------------------------------------------------

export const RESEARCH_SYSTEM = `You are a research assistant. Analyze raw web search results about a person and produce a structured research brief.

RULES:
- Only include facts clearly supported by the search results provided.
- If a fact is ambiguous or uncertain, omit it entirely.
- Never invent, hallucinate, or speculate about the person.
- Be specific: names of companies, projects, publications, investment rounds, etc.
- Focus on what makes this person distinctive and interesting.`;

export function researchUserPrompt(
  contact: Contact,
  searchResults: string
): string {
  const facetLines = Object.entries(SENDER.background_facets)
    .map(([k, v]) => `  - ${k}: ${v}`)
    .join("\n");

  return `I need a research brief on the following person:

Name: ${contact.full_name}
Company: ${contact.company}
Role: ${contact.role}
Website: ${contact.website}
LinkedIn: ${contact.linkedin}
Twitter/X: ${contact.twitter}
Notes: ${contact.notes}

Here are the raw search results:

<search_results>
${searchResults}
</search_results>

Based ONLY on the search results above, produce a research brief in this JSON format:

{
  "specific_facts": [
    "Fact 1 — something concrete they built, wrote, invested in, or achieved",
    "Fact 2 — another specific, verifiable fact",
    "Fact 3 — a third specific fact (or 'INSUFFICIENT DATA' if not enough info)"
  ],
  "plausible_reasons": [
    "Reason 1 — why the sender is a plausible person to reach out",
    "Reason 2 — a second reason"
  ],
  "recommended_angle": "One sentence describing the best angle for outreach",
  "background_emphasis": "One of: aviation_engineering | investing_economic_development | global_infrastructure_china | ai_tools_technical_initiative | builder_ambition_intellectual",
  "confidence_score": 0.0 to 1.0,
  "key_themes": ["theme1", "theme2"]
}

About the sender (for context on plausible reasons):
- Name: ${SENDER.name}
- Role: ${SENDER.current_role} at ${SENDER.company}
- Education: ${SENDER.education}
- Background facets:
${facetLines}

Choose the background_emphasis that best aligns with this recipient's world. The confidence_score should reflect how much verifiable information you found.`;
}

// ---------------------------------------------------------------------------
// Email generation: brief -> draft
// ---------------------------------------------------------------------------

export const EMAIL_SYSTEM = `You are a cold email ghostwriter. You write emails on behalf of the sender that are warm, sharp, polished, and human. Each email must feel individually crafted — never mass-produced.

STRICT RULES:
1. 3–5 sentences ONLY. No more.
2. Mention 1–2 specific things the sender has done or is working on.
3. Include credible, specific admiration for the recipient's work — tied to something concrete they built, wrote, invested in, researched, or said.
4. End with a low-friction CTA (quick call, brief conversation, whenever convenient).
5. NEVER use vague praise like "I admire your impressive background" or "Your work is inspiring."
6. NEVER invent facts about the recipient or sender.
7. NEVER use exclamation marks in the email body.
8. Vary the sender's framing based on the angle — do not reuse the same intro.
9. Sound human. No corporate jargon. No filler. No buzzwords.
10. The email should make the recipient feel that the sender is paying close attention to them specifically.`;

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
    .map((f, i) => `  ${i + 1}. ${f}`)
    .join("\n");

  const prev =
    previousAngles.length > 0
      ? previousAngles.map((a) => `  - ${a}`).join("\n")
      : "  (none yet — this is the first email)";

  const tone = SENDER.tone_guidelines.map((t) => `  - ${t}`).join("\n");
  const anti = SENDER.anti_patterns.map((a) => `  - ${a}`).join("\n");

  const label = emphasis.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return `Write a personalized cold email for the following recipient.

RECIPIENT:
- Name: ${contact.full_name}
- Company: ${contact.company}
- Role: ${contact.role}

RESEARCH BRIEF:
- Specific facts about them:
${facts}
- Recommended angle: ${brief.recommended_angle}

SENDER:
- Name: ${SENDER.name}
- Background emphasis to use: ${label}
- Details: ${emphasisDetail}
- Education: ${SENDER.education}
- Company: ${SENDER.company}

PREVIOUS ANGLES USED (do NOT repeat these framings):
${prev}

TONE:
${tone}

ANTI-PATTERNS (avoid these):
${anti}

Return your response as JSON:
{
  "subject_lines": ["Subject 1", "Subject 2", "Subject 3"],
  "body": "The email body, 3-5 sentences.",
  "sender_details_used": ["brief note on which sender details you emphasized"]
}

Write the email now. Remember: 3-5 sentences, specific praise, low-friction CTA, human tone.`;
}
