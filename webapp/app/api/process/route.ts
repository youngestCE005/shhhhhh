import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { webSearch } from "@/lib/search";
import {
  ENRICHMENT_SYSTEM,
  enrichmentUserPrompt,
  RESEARCH_SYSTEM,
  researchUserPrompt,
  EMAIL_SYSTEM,
  emailUserPrompt,
} from "@/lib/prompts";
import { generateSearchQueries } from "@/lib/parse-input";
import type {
  SparseInput,
  Contact,
  ResearchBrief,
  EmailDraft,
  AngleCategory,
} from "@/lib/types";

export const maxDuration = 60;

function parseJSON(raw: string): Record<string, unknown> | null {
  let text = raw.trim();
  // Strip markdown code fences
  if (text.startsWith("```")) {
    const lines = text.split("\n");
    text = lines.filter((l) => !l.trim().startsWith("```")).join("\n");
  }
  try {
    return JSON.parse(text);
  } catch {
    // Try to find JSON object in the response
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function callClaude(
  client: Anthropic,
  system: string,
  user: string
): Promise<string> {
  const resp = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system,
    messages: [{ role: "user", content: user }],
  });
  const block = resp.content[0];
  return block.type === "text" ? block.text : "";
}

async function doSearch(queries: string[]): Promise<string> {
  const results: string[] = [];
  for (const q of queries) {
    try {
      const r = await webSearch(q);
      results.push(`--- Query: ${q} ---\n${r}\n`);
    } catch (e) {
      results.push(`--- Query: ${q} ---\n[Error: ${e}]\n`);
    }
  }
  return results.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sparse: SparseInput = body.input;
    const previousAngles: string[] = body.previousAngles || [];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    // --- Phase 1: Search ---
    const queries = generateSearchQueries(sparse);
    const searchResults = await doSearch(queries);

    // --- Phase 2: Enrich ---
    const enrichRaw = await callClaude(
      client,
      ENRICHMENT_SYSTEM,
      enrichmentUserPrompt(sparse, searchResults)
    );

    const enrichData = parseJSON(enrichRaw);
    const contact: Contact = {
      full_name: (enrichData?.full_name as string) || sparse.name,
      company: (enrichData?.company as string) || sparse.company || "",
      role: (enrichData?.role as string) || "",
      website: (enrichData?.website as string) || sparse.website || "",
      linkedin: (enrichData?.linkedin as string) || sparse.linkedin || "",
      twitter: (enrichData?.twitter as string) || sparse.twitter || "",
      notes: sparse.notes || "",
    };

    const bioSummary = (enrichData?.bio_summary as string) || "";
    const identityConfidence = Number(enrichData?.identity_confidence ?? 0.5);
    const ambiguityNote = (enrichData?.ambiguity_note as string) || "";

    // --- Phase 3: Research ---
    // Run additional search with enriched info
    const researchQueries: string[] = [];
    if (contact.company) {
      researchQueries.push(`"${contact.full_name}" "${contact.company}"`);
    }
    if (contact.role) {
      researchQueries.push(`"${contact.full_name}" ${contact.role}`);
    }
    researchQueries.push(
      `"${contact.full_name}" interview OR podcast OR essay OR talk`
    );
    researchQueries.push(
      `"${contact.full_name}" recent projects OR investments OR research`
    );
    if (contact.company) {
      researchQueries.push(`"${contact.company}" recent news OR announcements`);
    }

    const researchSearchResults = await doSearch(
      researchQueries.slice(0, 5)
    );
    const allSearchResults = searchResults + "\n" + researchSearchResults;

    const researchRaw = await callClaude(
      client,
      RESEARCH_SYSTEM,
      researchUserPrompt(contact, allSearchResults)
    );

    const researchData = parseJSON(researchRaw);
    const brief: ResearchBrief = {
      specific_facts: (researchData?.specific_facts as string[]) || [],
      plausible_reasons: (researchData?.plausible_reasons as string[]) || [],
      recommended_angle: (researchData?.recommended_angle as string) || "",
      background_emphasis:
        (researchData?.background_emphasis as AngleCategory) ||
        "builder_ambition_intellectual",
      confidence_score: Number(researchData?.confidence_score ?? 0.3),
    };

    // --- Phase 4: Generate email ---
    const emailRaw = await callClaude(
      client,
      EMAIL_SYSTEM,
      emailUserPrompt(contact, brief, previousAngles)
    );

    const emailData = parseJSON(emailRaw);
    const draft: EmailDraft = {
      subject_lines: ((emailData?.subject_lines as string[]) || []).slice(0, 3),
      body: (emailData?.body as string) || "[Generation failed]",
      angle_used: brief.background_emphasis,
      sender_details_used: (emailData?.sender_details_used as string[]) || [],
    };

    // --- Build flags ---
    let flagged = false;
    let warning = "";

    if (identityConfidence < 0.5) {
      flagged = true;
      warning += `Low identity confidence (${Math.round(identityConfidence * 100)}%). `;
    }
    if (brief.confidence_score < 0.6) {
      flagged = true;
      warning += `Low research confidence (${Math.round(brief.confidence_score * 100)}%). `;
    }
    if (ambiguityNote) {
      warning += ambiguityNote;
    }

    return NextResponse.json({
      contact,
      brief,
      draft,
      bio_summary: bioSummary,
      identity_confidence: identityConfidence,
      flagged,
      warning: warning.trim(),
    });
  } catch (e) {
    console.error("Process error:", e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
