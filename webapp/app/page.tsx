"use client";

import { useState } from "react";
import type { SparseInput, ProcessedResult } from "@/lib/types";
import InputStep from "@/components/input-step";
import ProcessingStep from "@/components/processing-step";
import ReviewStep from "@/components/review-step";
import ExportStep from "@/components/export-step";

type Step = "input" | "processing" | "review" | "export";

const STEPS: { key: Step; label: string }[] = [
  { key: "input", label: "Input" },
  { key: "processing", label: "Research" },
  { key: "review", label: "Review" },
  { key: "export", label: "Export" },
];

export default function Home() {
  const [step, setStep] = useState<Step>("input");
  const [contacts, setContacts] = useState<SparseInput[]>([]);
  const [results, setResults] = useState<ProcessedResult[]>([]);

  const stepIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Cold Email Tool
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Minimum input. Maximum personalization.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex justify-center gap-8 my-8">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            onClick={() => {
              // Allow going back but not forward past current
              if (i <= stepIdx) setStep(s.key);
            }}
            className={`text-sm font-medium transition-colors ${
              i < stepIdx
                ? "text-green-600 cursor-pointer"
                : i === stepIdx
                ? "text-gray-900 font-semibold"
                : "text-gray-300 cursor-default"
            }`}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      {/* Steps */}
      {step === "input" && (
        <InputStep
          contacts={contacts}
          setContacts={setContacts}
          onNext={() => setStep("processing")}
        />
      )}
      {step === "processing" && (
        <ProcessingStep
          contacts={contacts}
          onComplete={(r) => {
            setResults(r);
            setStep("review");
          }}
          onBack={() => setStep("input")}
        />
      )}
      {step === "review" && (
        <ReviewStep
          results={results}
          setResults={setResults}
          onExport={() => setStep("export")}
          onBack={() => setStep("input")}
        />
      )}
      {step === "export" && (
        <ExportStep
          results={results}
          onBack={() => setStep("review")}
          onNewBatch={() => {
            setContacts([]);
            setResults([]);
            setStep("input");
          }}
        />
      )}
    </div>
  );
}
