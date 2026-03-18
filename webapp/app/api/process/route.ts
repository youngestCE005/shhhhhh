import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { webSearch, hasSearchConfigured, searchProviderName } from "@/lib/search";
import type { SearchResult } from "@/lib/search";
import {
  ENRICHMENT_SYSTEM_SEARCH,
  ENRICHMENT_SYSTEM_KNOWLEDGE,
  enrichmentUserPrompt,
  RESEARCH_SYSTEM_SEARCH,
  RESEARCH_SYSTEM_KNOWLEDGE,
  researchUserPrompt,
  EMAIL_SYSTEM,
  emailUserPrompt,
  CRITIQUE_SYSTEM,
  critiqueUserPrompt,
  REWRITE_SYSTEM,
  rewriteUserPrompt,
} from "@/lib/prompts";
import { rankAngles } from "@/lib/style-guide";
import { generateSearchQueries } from "@/lib/parse-input";
import type {
  SparseInput,
  Contact,
  ResearchBrief,
  EmailDraft,
  AngleCategory,
  ModelTier,
} from "@/lib/types";

export const maxDuration = 60;

// --- Model resolution ---

const MODELS = {
  sonnet: "claude-sonnet-4-20250514",
  opus: "claude-opus-4-20250514",
} as const;

function resolveModel(tier: ModelTier, phase: "enrich" | "research" | "email" | "critique", context?: {
  identityConfidence?: number;
  researchConfidence?: number;
  highPriority?: boolean;
}): string {
  if (tier === "sonnet") return MODELS.sonnet;
  if (tier === "opus") return MODELS.opus;
  // Auto mode: escalate only when needed
  if (phase === "email" && context) {
    const shouldEscalate =
      context.highPriority ||
      (context.identityConfidence !== undefined && context.identityConfidence < 0.5) ||
      (context.researchConfidence !== undefined && context.researchConfidence < 0.5);
    if (shouldEscalate) return MODELS.opus;
  }
  // Critique always uses Sonnet (fast, cheap)
  return MODELS.sonnet;
}

// --- Helpers ---

function parseJSON(raw: string): Record<string, unknown> | null {
  let text = raw.trim();
  if (text.startsWith("```")) {
    const lines = text.split("\n");
    text = lines.filter((l) => !l.trim().startsWith("```")).join("\n");
  }
  try {
    return JSON.parse(text);
  } catch {
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
  model: string,
  system: string,
  user: string,
  maxTokens: number
): Promise<string> {
  const resp = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  const block = resp.content[0];
  return block.type === "text" ? block.text : "";
}

interface SearchStats {
  provider: string;
  queriesRun: number;
  totalResults: number;
  hasRealResults: boolean;
  errors: string[];
}

async function doSearch(queries: string[]): Promise<{ text: string; stats: SearchStats }> {
  const stats: SearchStats = {
    provider: searchProviderName(),
    queriesRun: queries.length,
    totalResults: 0,
    hasRealResults: false,
    errors: [],
  };

  if (!hasSearchConfigured()) {
    console.log(`[search] No search API configured. Skipping ${queries.length} queries.`);
    return { text: "", stats };
  }

  const textParts: string[] = [];
  for (const q of queries) {
    const result: SearchResult = await webSearch(q);
    if (result.error) {
      stats.errors.push(`${q}: ${result.error}`);
      console.log(`[search] ERROR query="${q}" error="${result.error}"`);
    } else if (result.hasRealResults) {
      stats.hasRealResults = true;
      stats.totalResults += result.resultCount;
      textParts.push(`--- Query: ${q} ---\n${result.text}\n`);
      console.log(`[search] OK query="${q}" results=${result.resultCount}`);
    } else {
      console.log(`[search] EMPTY query="${q}"`);
    }
    stats.provider = result.provider;
  }

  return { text: textParts.join("\n"), stats };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sparse: SparseInput = body.input;
    const previousAngles: string[] = body.previousAngles || [];
    const tier: ModelTier = body.modelTier || process.env.MODEL_TIER || "sonnet";

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });
    console.log(`\n[process] Starting: "${sparse.name}" (tier=${tier})`);

    // --- Phase 1: Search ---
    const queries = generateSearchQueries(sparse);
    const { text: searchResults, stats: searchStats } = await doSearch(queries);
    const hasSearch = searchStats.hasRealResults;
    const mode = hasSearch ? "search-grounded" : "knowledge-assisted";

    console.log(`[search] Summary: provider=${searchStats.provider} queries=${searchStats.queriesRun} results=${searchStats.totalResults} mode=${mode}`);

    // --- Phase 2: Enrich ---
    const enrichModel = resolveModel(tier, "enrich");
    const enrichSystem = hasSearch ? ENRICHMENT_SYSTEM_SEARCH : ENRICHMENT_SYSTEM_KNOWLEDGE;
    const enrichRaw = await callClaude(
      client,
      enrichModel,
      enrichSystem,
      enrichmentUserPrompt(sparse, searchResults, hasSearch),
      800
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

    console.log(`[enrich] model=${enrichModel} identity_confidence=${identityConfidence} name="${contact.full_name}" role="${contact.role}" company="${contact.company}"`);

    // --- Phase 3: Research ---
    let allSearchResults = searchResults;
    let researchStats = searchStats;

    if (hasSearchConfigured()) {
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

      const { text: moreResults, stats: moreStats } = await doSearch(researchQueries.slice(0, 5));
      if (moreResults) {
        allSearchResults = searchResults + "\n" + moreResults;
      }
      researchStats = {
        ...searchStats,
        queriesRun: searchStats.queriesRun + moreStats.queriesRun,
        totalResults: searchStats.totalResults + moreStats.totalResults,
        hasRealResults: searchStats.hasRealResults || moreStats.hasRealResults,
        errors: [...searchStats.errors, ...moreStats.errors],
      };
    }

    const researchModel = resolveModel(tier, "research");
    const researchSystem = hasSearch ? RESEARCH_SYSTEM_SEARCH : RESEARCH_SYSTEM_KNOWLEDGE;
    const researchRaw = await callClaude(
      client,
      researchModel,
      researchSystem,
      researchUserPrompt(contact, allSearchResults, researchStats.hasRealResults),
      800
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

    // --- Angle intelligence: cross-check LLM's choice with keyword matching ---
    const usableFacts = brief.specific_facts.filter(
      (f) => !f.toUpperCase().includes("INSUFFICIENT")
    );
    const angleRanking = rankAngles({
      role: contact.role,
      company: contact.company,
      facts: usableFacts,
      bio: bioSummary,
    });

    // If the LLM's chosen angle scores poorly and there's a much better match, override
    const llmAngleScore =
      angleRanking.find((a) => a.angle === brief.background_emphasis)?.score ?? 0;
    const bestAngle = angleRanking[0];
    if (bestAngle.score > 0.5 && bestAngle.score - llmAngleScore > 0.3) {
      console.log(
        `[angle] Overriding LLM choice "${brief.background_emphasis}" (${llmAngleScore.toFixed(2)}) → "${bestAngle.angle}" (${bestAngle.score.toFixed(2)})`
      );
      brief.background_emphasis = bestAngle.angle as AngleCategory;
    }

    console.log(`[research] model=${researchModel} confidence=${brief.confidence_score} facts=${brief.specific_facts.length} angle="${brief.background_emphasis}"`);

    // --- Phase 4: Generate email ---
    const emailModel = resolveModel(tier, "email", {
      identityConfidence,
      researchConfidence: brief.confidence_score,
      highPriority: sparse.highPriority,
    });

    const emailRaw = await callClaude(
      client,
      emailModel,
      EMAIL_SYSTEM,
      emailUserPrompt(contact, brief, previousAngles),
      600
    );

    const emailData = parseJSON(emailRaw);
    let emailBody = (emailData?.body as string) || "[Generation failed]";
    const subjectLines = ((emailData?.subject_lines as string[]) || []).slice(0, 3);
    const senderDetailsUsed = (emailData?.sender_details_used as string[]) || [];

    console.log(`[email] model=${emailModel} generated for "${contact.full_name}"`);

    // --- Phase 5: Self-critique + optional rewrite ---
    let critiqueResult = null;
    let wasRewritten = false;

    if (emailBody !== "[Generation failed]") {
      const critiqueModel = resolveModel(tier, "critique");
      const critiqueRaw = await callClaude(
        client,
        critiqueModel,
        CRITIQUE_SYSTEM,
        critiqueUserPrompt(contact.full_name, contact.role, emailBody, usableFacts),
        400
      );

      critiqueResult = parseJSON(critiqueRaw);

      if (critiqueResult) {
        const overall = Number(critiqueResult.overall ?? 5);
        const hardFails = (critiqueResult.hard_fails as string[]) || [];

        console.log(
          `[critique] overall=${overall} hard_fails=${hardFails.length} suggestion="${critiqueResult.suggestion || "none"}"`
        );

        // Rewrite if score is below 3.5 or there are hard fails
        if (overall < 3.5 || hardFails.length > 0) {
          console.log(`[rewrite] Triggering rewrite (score=${overall}, fails=${hardFails.length})`);

          const rewriteRaw = await callClaude(
            client,
            emailModel, // same model as email generation
            REWRITE_SYSTEM,
            rewriteUserPrompt(
              emailBody,
              {
                hard_fails: hardFails,
                suggestion: (critiqueResult.suggestion as string) || "",
                overall,
              },
              contact.full_name,
              usableFacts
            ),
            500
          );

          if (rewriteRaw.trim()) {
            emailBody = rewriteRaw.trim();
            wasRewritten = true;
            console.log(`[rewrite] Done — email rewritten for "${contact.full_name}"`);
          }
        }
      }
    }

    const draft: EmailDraft = {
      subject_lines: subjectLines,
      body: emailBody,
      angle_used: brief.background_emphasis,
      sender_details_used: senderDetailsUsed,
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
    if (!hasSearch) {
      warning += warning ? " " : "";
      warning += "No search API — used model knowledge only.";
    }

    return NextResponse.json({
      contact,
      brief,
      draft,
      bio_summary: bioSummary,
      identity_confidence: identityConfidence,
      flagged,
      warning: warning.trim(),
      model_used: emailModel,
      debug: {
        searchProvider: researchStats.provider,
        queriesRun: researchStats.queriesRun,
        resultsFound: researchStats.totalResults,
        searchFailed: !researchStats.hasRealResults && hasSearchConfigured(),
        mode,
      },
      critique: critiqueResult
        ? {
            overall: Number(critiqueResult.overall ?? 0),
            specificity: Number(critiqueResult.specificity ?? 0),
            voice: Number(critiqueResult.voice ?? 0),
            connection: Number(critiqueResult.connection ?? 0),
            brevity: Number(critiqueResult.brevity ?? 0),
            ask: Number(critiqueResult.ask ?? 0),
            hard_fails: (critiqueResult.hard_fails as string[]) || [],
            was_rewritten: wasRewritten,
          }
        : undefined,
    });
  } catch (e) {
    console.error("[process] Error:", e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
