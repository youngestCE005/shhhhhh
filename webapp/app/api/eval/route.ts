import { NextRequest, NextResponse } from "next/server";
import { EVAL_RECIPIENTS, type EvalRecipient } from "@/lib/eval-data";
import { BANNED_WORDS } from "@/lib/style-guide";

export const maxDuration = 300; // eval can take a while

interface EvalResult {
  name: string;
  category: string;
  identityConfidence: number;
  researchConfidence: number;
  angleUsed: string;
  expectedAngle: string;
  angleMatch: boolean;
  flagged: boolean;
  expectedFlag: boolean;
  flagMatch: boolean;
  confidenceInRange: boolean;
  critiqueOverall: number;
  bannedWordsFound: string[];
  emailBody: string;
  subjectLines: string[];
  pass: boolean;
  failures: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subset = body.subset as string[] | undefined; // optional category filter
    const modelTier = body.modelTier || "sonnet";

    let recipients = EVAL_RECIPIENTS;
    if (subset && subset.length > 0) {
      recipients = recipients.filter((r) => subset.includes(r.category));
    }

    const results: EvalResult[] = [];

    for (const recipient of recipients) {
      console.log(`[eval] Processing: "${recipient.input.name}" (${recipient.category})`);

      try {
        // Call the process API internally
        const baseUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000";

        const resp = await fetch(`${baseUrl}/api/process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: recipient.input,
            previousAngles: [],
            modelTier,
          }),
        });

        if (!resp.ok) {
          const err = await resp.json();
          results.push(makeErrorResult(recipient, `API error: ${err.error}`));
          continue;
        }

        const data = await resp.json();
        const result = scoreResult(recipient, data);
        results.push(result);
      } catch (e) {
        results.push(makeErrorResult(recipient, String(e)));
      }
    }

    // Aggregate
    const totalPassed = results.filter((r) => r.pass).length;
    const avgCritique =
      results.reduce((sum, r) => sum + r.critiqueOverall, 0) / results.length;
    const avgConfidence =
      results.reduce((sum, r) => sum + r.identityConfidence, 0) / results.length;
    const angleAccuracy =
      results.filter((r) => r.angleMatch).length / results.length;
    const flagAccuracy =
      results.filter((r) => r.flagMatch).length / results.length;
    const bannedWordViolations = results.filter(
      (r) => r.bannedWordsFound.length > 0
    ).length;

    return NextResponse.json({
      summary: {
        total: results.length,
        passed: totalPassed,
        passRate: `${Math.round((totalPassed / results.length) * 100)}%`,
        avgCritiqueScore: avgCritique.toFixed(2),
        avgIdentityConfidence: avgConfidence.toFixed(2),
        angleAccuracy: `${Math.round(angleAccuracy * 100)}%`,
        flagAccuracy: `${Math.round(flagAccuracy * 100)}%`,
        bannedWordViolations,
      },
      results,
    });
  } catch (e) {
    console.error("[eval] Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

function scoreResult(
  recipient: EvalRecipient,
  data: Record<string, unknown>
): EvalResult {
  const failures: string[] = [];

  const identityConfidence = Number(data.identity_confidence ?? 0);
  const brief = data.brief as { confidence_score: number; background_emphasis: string } | undefined;
  const researchConfidence = Number(brief?.confidence_score ?? 0);
  const angleUsed = String(brief?.background_emphasis || "unknown");
  const flagged = Boolean(data.flagged);
  const draft = data.draft as { body: string; subject_lines: string[] } | undefined;
  const emailBody = String(draft?.body || "");
  const subjectLines = (draft?.subject_lines as string[]) || [];
  const critique = data.critique as { overall: number } | undefined;
  const critiqueOverall = Number(critique?.overall ?? 0);

  const exp = recipient.expected;

  // Check identity confidence range
  const confidenceInRange =
    identityConfidence >= exp.minIdentityConfidence &&
    identityConfidence <= exp.maxIdentityConfidence;
  if (!confidenceInRange) {
    failures.push(
      `Identity confidence ${identityConfidence.toFixed(2)} outside expected [${exp.minIdentityConfidence}, ${exp.maxIdentityConfidence}]`
    );
  }

  // Check research confidence
  if (researchConfidence < exp.minResearchConfidence) {
    failures.push(
      `Research confidence ${researchConfidence.toFixed(2)} below expected min ${exp.minResearchConfidence}`
    );
  }

  // Check angle
  const angleMatch = angleUsed === exp.expectedAngle;
  if (!angleMatch) {
    failures.push(`Angle "${angleUsed}" != expected "${exp.expectedAngle}"`);
  }

  // Check flag
  const flagMatch = flagged === exp.shouldFlag;
  if (!flagMatch) {
    failures.push(`Flagged=${flagged}, expected=${exp.shouldFlag}`);
  }

  // Check for banned words in email body
  const bodyLower = emailBody.toLowerCase();
  const bannedWordsFound = BANNED_WORDS.filter((w) => bodyLower.includes(w.toLowerCase()));

  if (bannedWordsFound.length > 0) {
    failures.push(`Banned words found: ${bannedWordsFound.join(", ")}`);
  }

  // Critique threshold
  if (critiqueOverall > 0 && critiqueOverall < 3.0) {
    failures.push(`Critique score ${critiqueOverall} below 3.0 threshold`);
  }

  return {
    name: recipient.input.name,
    category: recipient.category,
    identityConfidence,
    researchConfidence,
    angleUsed,
    expectedAngle: exp.expectedAngle,
    angleMatch,
    flagged,
    expectedFlag: exp.shouldFlag,
    flagMatch,
    confidenceInRange,
    critiqueOverall,
    bannedWordsFound,
    emailBody,
    subjectLines,
    pass: failures.length === 0,
    failures,
  };
}

function makeErrorResult(recipient: EvalRecipient, error: string): EvalResult {
  return {
    name: recipient.input.name,
    category: recipient.category,
    identityConfidence: 0,
    researchConfidence: 0,
    angleUsed: "error",
    expectedAngle: recipient.expected.expectedAngle,
    angleMatch: false,
    flagged: true,
    expectedFlag: recipient.expected.shouldFlag,
    flagMatch: false,
    confidenceInRange: false,
    critiqueOverall: 0,
    bannedWordsFound: [],
    emailBody: `[Error: ${error}]`,
    subjectLines: [],
    pass: false,
    failures: [`Error: ${error}`],
  };
}
