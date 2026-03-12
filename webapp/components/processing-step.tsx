"use client";

import { useEffect, useState, useRef } from "react";
import type { SparseInput, ProcessedResult, ModelTier } from "@/lib/types";

interface Props {
  contacts: SparseInput[];
  modelTier: ModelTier;
  onComplete: (results: ProcessedResult[]) => void;
  onBack: () => void;
}

export default function ProcessingStep({ contacts, modelTier, onComplete, onBack }: Props) {
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState("Searching...");
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function processAll() {
      const allResults: ProcessedResult[] = [];
      const previousAngles: string[] = [];

      for (let i = 0; i < contacts.length; i++) {
        setCurrent(i);
        setPhase(`Enriching & researching ${contacts[i].name}...`);

        try {
          const resp = await fetch("/api/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              input: contacts[i],
              previousAngles,
              modelTier,
            }),
          });

          if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.error || `HTTP ${resp.status}`);
          }

          const data = await resp.json();

          const result: ProcessedResult = {
            id: crypto.randomUUID(),
            input: contacts[i],
            contact: data.contact,
            brief: data.brief,
            draft: data.draft,
            bio_summary: data.bio_summary,
            identity_confidence: data.identity_confidence,
            flagged: data.flagged,
            warning: data.warning,
            review_status: "pending",
            model_used: data.model_used,
          };

          allResults.push(result);
          previousAngles.push(
            `${result.contact.full_name}: ${result.draft.angle_used} — ${result.brief.recommended_angle}`
          );
        } catch (e) {
          // Create error result
          allResults.push({
            id: crypto.randomUUID(),
            input: contacts[i],
            contact: {
              full_name: contacts[i].name,
              company: contacts[i].company || "",
              role: "",
              website: contacts[i].website || "",
              linkedin: contacts[i].linkedin || "",
              twitter: contacts[i].twitter || "",
              notes: contacts[i].notes || "",
            },
            brief: {
              specific_facts: [],
              plausible_reasons: [],
              recommended_angle: "",
              background_emphasis: "builder_ambition_intellectual",
              confidence_score: 0,
            },
            draft: {
              subject_lines: [],
              body: "[Processing failed — manual draft required]",
              angle_used: "builder_ambition_intellectual",
              sender_details_used: [],
            },
            bio_summary: "",
            identity_confidence: 0,
            flagged: true,
            warning: `Error: ${e}`,
            review_status: "pending",
          });
        }

        setResults([...allResults]);
      }

      onComplete(allResults);
    }

    processAll().catch((e) => setError(String(e)));
  }, [contacts, onComplete]);

  const pct = contacts.length > 0 ? ((current + 1) / contacts.length) * 100 : 0;

  return (
    <div className="text-center py-16">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Researching & Writing
      </h2>
      <p className="text-sm text-gray-400 mb-8">
        Enriching profiles, researching recipients, generating emails.
      </p>

      {error ? (
        <div className="space-y-4">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Back to Input
          </button>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="w-full max-w-md mx-auto mb-6">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>

          <p className="text-sm text-gray-500">
            {current + 1} of {contacts.length}
          </p>
          <p className="text-sm text-gray-400 mt-1">{phase}</p>

          {/* Show completed names */}
          {results.length > 0 && (
            <div className="mt-8 max-w-sm mx-auto space-y-1">
              {results.map((r, i) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 text-sm text-gray-500"
                >
                  <span className="text-green-500">&#10003;</span>
                  <span>{r.contact.full_name}</span>
                  {r.flagged && (
                    <span className="text-xs text-amber-500">flagged</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
