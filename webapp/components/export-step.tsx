"use client";

import { useState } from "react";
import type { ProcessedResult } from "@/lib/types";
import { toExportRows, toCSV, toMarkdown, toJSON, downloadBlob } from "@/lib/export";

interface Props {
  results: ProcessedResult[];
  onBack: () => void;
  onNewBatch: () => void;
}

type Filter = "all" | "accepted" | "accepted_uncertain";

export default function ExportStep({ results, onBack, onNewBatch }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "accepted"
      ? results.filter((r) => r.review_status === "accepted")
      : filter === "accepted_uncertain"
      ? results.filter(
          (r) => r.review_status === "accepted" || r.review_status === "uncertain"
        )
      : results;

  const rows = toExportRows(filtered);
  const accepted = results.filter((r) => r.review_status === "accepted").length;
  const skipped = results.filter((r) => r.review_status === "skipped").length;

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="text-center">
          <p className="text-2xl font-semibold text-gray-900">{results.length}</p>
          <p className="text-xs text-gray-400">Total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-green-600">{accepted}</p>
          <p className="text-xs text-gray-400">Accepted</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-gray-300">{skipped}</p>
          <p className="text-xs text-gray-400">Skipped</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
        {[
          { key: "all" as Filter, label: "All" },
          { key: "accepted" as Filter, label: "Accepted only" },
          { key: "accepted_uncertain" as Filter, label: "Accepted + Uncertain" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
              filter === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500 mb-4">
        <strong>{rows.length}</strong> emails ready for export.
      </p>

      {/* Download buttons */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <button
          onClick={() => downloadBlob(toCSV(rows), "cold_emails.csv", "text/csv")}
          className="py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Download CSV
        </button>
        <button
          onClick={() =>
            downloadBlob(toJSON(rows), "cold_emails.json", "application/json")
          }
          className="py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Download JSON
        </button>
        <button
          onClick={() =>
            downloadBlob(toMarkdown(rows), "cold_emails.md", "text/markdown")
          }
          className="py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Download Markdown
        </button>
      </div>

      {/* Preview */}
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Preview</h3>
      <div className="space-y-3">
        {rows.map((row, i) => (
          <details key={i} className="border border-gray-200 rounded-lg">
            <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
              {row.input_name} → {row.resolved_name}
              {row.warning_flag && (
                <span className="ml-2 text-xs text-amber-500">flagged</span>
              )}
            </summary>
            <div className="px-4 pb-4 text-sm">
              <p className="text-gray-500 mb-2">
                <strong>{row.role}</strong> at <strong>{row.company}</strong>
                {" · "}
                {row.confidence} confidence · {row.chosen_angle}
              </p>
              {row.subject_line_1 && (
                <p className="text-xs text-gray-400 mb-1">
                  Subjects: {row.subject_line_1}
                  {row.subject_line_2 ? ` · ${row.subject_line_2}` : ""}
                  {row.subject_line_3 ? ` · ${row.subject_line_3}` : ""}
                </p>
              )}
              <div className="mt-2 p-3 bg-white border border-gray-100 rounded-lg text-sm whitespace-pre-wrap text-gray-700">
                {row.email_body}
              </div>
              {row.warning_flag && (
                <p className="mt-2 text-xs text-amber-600">{row.warning_flag}</p>
              )}
            </div>
          </details>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Back to Review
        </button>
        <button
          onClick={onNewBatch}
          className="flex-1 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          New Batch
        </button>
      </div>
    </div>
  );
}
