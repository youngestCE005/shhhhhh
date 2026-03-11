"use client";

import { useState } from "react";
import type { ProcessedResult, AngleCategory } from "@/lib/types";
import { ANGLE_LABELS } from "@/lib/types";

interface Props {
  results: ProcessedResult[];
  setResults: (r: ProcessedResult[]) => void;
  onExport: () => void;
  onBack: () => void;
}

export default function ReviewStep({ results, setResults, onExport, onBack }: Props) {
  const accepted = results.filter((r) => r.review_status === "accepted").length;
  const skipped = results.filter((r) => r.review_status === "skipped").length;
  const flagged = results.filter((r) => r.flagged).length;
  const pending = results.length - accepted - skipped;

  const updateResult = (idx: number, updates: Partial<ProcessedResult>) => {
    const next = [...results];
    next[idx] = { ...next[idx], ...updates };
    setResults(next);
  };

  return (
    <div>
      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: results.length, color: "text-gray-900" },
          { label: "Flagged", value: flagged, color: "text-amber-600" },
          { label: "Accepted", value: accepted, color: "text-green-600" },
          { label: "Remaining", value: pending, color: "text-gray-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <p className={`text-2xl font-semibold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-6">
        {results.map((r, idx) => (
          <RecipientCard
            key={r.id}
            result={r}
            onUpdate={(updates) => updateResult(idx, updates)}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Back to Input
        </button>
        <button
          onClick={onExport}
          className="flex-[3] py-3 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          Export Results
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recipient Card
// ---------------------------------------------------------------------------

function RecipientCard({
  result: r,
  onUpdate,
}: {
  result: ProcessedResult;
  onUpdate: (updates: Partial<ProcessedResult>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(r.edited_body || r.draft.body);

  const activeAngle = r.edited_angle || r.draft.angle_used;
  const body = r.edited_body || r.draft.body;
  const conf = r.brief.confidence_score;

  const confColor =
    conf >= 0.8
      ? "bg-green-50 text-green-700"
      : conf >= 0.5
      ? "bg-amber-50 text-amber-700"
      : "bg-red-50 text-red-700";

  const statusBadge =
    r.review_status === "accepted" ? (
      <span className="text-[10px] font-semibold uppercase tracking-wider bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
        Accepted
      </span>
    ) : r.review_status === "skipped" ? (
      <span className="text-[10px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
        Skipped
      </span>
    ) : r.review_status === "uncertain" ? (
      <span className="text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
        Uncertain
      </span>
    ) : null;

  return (
    <div
      className={`rounded-xl border p-6 ${
        r.flagged
          ? "bg-amber-50/40 border-amber-200"
          : "bg-gray-50/50 border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base">{r.contact.full_name}</h3>
            {statusBadge}
          </div>
          {(r.contact.role || r.contact.company) && (
            <p className="text-sm text-gray-500 mt-0.5">
              {r.contact.role}
              {r.contact.role && r.contact.company ? " at " : ""}
              {r.contact.company}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${confColor}`}
          >
            {Math.round(conf * 100)}%
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
            {ANGLE_LABELS[activeAngle]}
          </span>
        </div>
      </div>

      {/* Warning */}
      {r.warning && (
        <div className="mb-4 px-3 py-2 bg-amber-50 border-l-2 border-amber-400 rounded-r text-xs text-amber-800">
          {r.warning}
        </div>
      )}

      {/* Facts */}
      {r.brief.specific_facts.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {r.brief.specific_facts
            .filter((f) => !f.toUpperCase().includes("INSUFFICIENT"))
            .map((fact, i) => (
              <div
                key={i}
                className="pl-3 border-l-2 border-blue-200 text-sm text-gray-600"
              >
                {fact}
              </div>
            ))}
        </div>
      )}

      {/* Email body */}
      {editing ? (
        <div className="mb-4">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-sans resize-none"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                onUpdate({ edited_body: editBody });
                setEditing(false);
              }}
              className="px-4 py-1.5 bg-gray-900 text-white text-xs rounded-lg font-medium"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditBody(r.edited_body || r.draft.body);
                setEditing(false);
              }}
              className="px-4 py-1.5 border border-gray-200 text-xs rounded-lg font-medium text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          className="mb-4 bg-white border border-gray-100 rounded-lg px-5 py-4 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap cursor-pointer hover:border-gray-300 transition-colors"
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          {body}
        </div>
      )}

      {/* Subject lines */}
      {r.draft.subject_lines.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {r.draft.subject_lines.map((s, i) => (
            <span
              key={i}
              className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => onUpdate({ review_status: "accepted" })}
          className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            r.review_status === "accepted"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
          }`}
        >
          Accept
        </button>
        <button
          onClick={() => onUpdate({ review_status: "skipped" })}
          className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            r.review_status === "skipped"
              ? "bg-gray-200 text-gray-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Skip
        </button>
        <button
          onClick={() => onUpdate({ review_status: "uncertain" })}
          className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            r.review_status === "uncertain"
              ? "bg-amber-100 text-amber-700"
              : "bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-600"
          }`}
        >
          Uncertain
        </button>

        <div className="ml-auto">
          <select
            value={activeAngle}
            onChange={(e) =>
              onUpdate({ edited_angle: e.target.value as AngleCategory })
            }
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            {(Object.entries(ANGLE_LABELS) as [AngleCategory, string][]).map(
              ([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              )
            )}
          </select>
        </div>
      </div>
    </div>
  );
}
