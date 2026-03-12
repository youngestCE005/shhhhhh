"use client";

import { useState, useRef } from "react";
import type { SparseInput, ModelTier } from "@/lib/types";
import { parseSingleInput, parseCSVRows } from "@/lib/parse-input";
import Papa from "papaparse";

interface Props {
  contacts: SparseInput[];
  setContacts: (c: SparseInput[]) => void;
  modelTier: ModelTier;
  setModelTier: (t: ModelTier) => void;
  onNext: () => void;
}

type Tab = "single" | "batch" | "upload";

const MODEL_OPTIONS: { value: ModelTier; label: string; desc: string }[] = [
  { value: "sonnet", label: "Sonnet", desc: "Fast, cost-effective (default)" },
  { value: "auto", label: "Auto", desc: "Sonnet + Opus for hard cases" },
  { value: "opus", label: "Opus", desc: "Best quality, higher cost" },
];

export default function InputStep({
  contacts,
  setContacts,
  modelTier,
  setModelTier,
  onNext,
}: Props) {
  const [tab, setTab] = useState<Tab>("single");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [notes, setNotes] = useState("");
  const [batchText, setBatchText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const addSingle = () => {
    if (!name.trim()) return;
    const sparse = parseSingleInput(name.trim(), identifier.trim(), notes.trim());
    setContacts([...contacts, sparse]);
    setName("");
    setIdentifier("");
    setNotes("");
  };

  const addBatch = () => {
    if (!batchText.trim()) return;
    const newContacts: SparseInput[] = [];
    for (const line of batchText.trim().split("\n")) {
      const parts = line.split(",").map((s) => s.trim());
      if (parts[0]) {
        newContacts.push(
          parseSingleInput(parts[0], parts[1] || "", parts[2] || "")
        );
      }
    }
    setContacts([...contacts, ...newContacts]);
    setBatchText("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const rows = parseCSVRows(result.data as Record<string, string>[]);
          setContacts([...contacts, ...rows]);
        },
      });
    } else {
      alert("Please upload a CSV file. XLSX support coming soon.");
    }

    if (fileRef.current) fileRef.current.value = "";
  };

  const removeContact = (idx: number) => {
    setContacts(contacts.filter((_, i) => i !== idx));
  };

  const togglePriority = (idx: number) => {
    const next = [...contacts];
    next[idx] = { ...next[idx], highPriority: !next[idx].highPriority };
    setContacts(next);
  };

  const detail = (s: SparseInput) =>
    s.company || s.email || s.linkedin || s.website || s.twitter || "";

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
        {(["single", "batch", "upload"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "single"
              ? "Single Person"
              : t === "batch"
              ? "Batch Entry"
              : "Upload File"}
          </button>
        ))}
      </div>

      {/* Single entry */}
      {tab === "single" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Enter a name and any one identifier. That&apos;s enough.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSingle()}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Email, LinkedIn, company, website, or X"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSingle()}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSingle()}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <button
            onClick={addSingle}
            disabled={!name.trim()}
            className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
          >
            Add Person
          </button>
        </div>
      )}

      {/* Batch entry */}
      {tab === "batch" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Paste multiple people, one per line. Format: Name, identifier, notes
          </p>
          <textarea
            placeholder={`Patrick Collison, Stripe\nGwynne Shotwell, SpaceX\nNat Friedman, https://nat.org, AI investor`}
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
          />
          <button
            onClick={addBatch}
            disabled={!batchText.trim()}
            className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
          >
            Add All
          </button>
        </div>
      )}

      {/* File upload */}
      {tab === "upload" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Upload a CSV file. Only <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">name</code> is required — everything else is optional.
          </p>
          <p className="text-xs text-gray-400">
            Supported columns: name, email, linkedin, company, website, twitter, notes
          </p>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <p className="text-sm text-gray-500">Click to upload CSV</p>
            <p className="text-xs text-gray-400 mt-1">or drag and drop</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Queued contacts */}
      {contacts.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Queued ({contacts.length})
            </h3>
            <button
              onClick={() => setContacts([])}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2">
            {contacts.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 px-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => togglePriority(i)}
                    title={
                      s.highPriority
                        ? "High priority (uses Opus in Auto mode)"
                        : "Normal priority — click to mark high priority"
                    }
                    className={`text-sm flex-shrink-0 ${
                      s.highPriority
                        ? "text-amber-500"
                        : "text-gray-200 hover:text-gray-400"
                    }`}
                  >
                    &#9733;
                  </button>
                  <span className="font-medium text-sm truncate">
                    {s.name}
                  </span>
                  {detail(s) && (
                    <span className="text-xs text-gray-400 truncate">
                      {detail(s).slice(0, 40)}
                    </span>
                  )}
                  {s.notes && (
                    <span className="text-xs text-gray-300 truncate hidden sm:inline">
                      {s.notes.slice(0, 30)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeContact(i)}
                  className="text-gray-300 hover:text-gray-500 text-lg leading-none ml-2 flex-shrink-0"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          {/* Model selector + go button */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-500 flex-shrink-0">
                Model:
              </label>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 flex-1">
                {MODEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setModelTier(opt.value)}
                    title={opt.desc}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                      modelTier === opt.value
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {modelTier === "auto" && (
              <p className="text-xs text-gray-400">
                Auto uses Sonnet by default. Opus only for starred contacts or
                when confidence is low.
              </p>
            )}
            <button
              onClick={onNext}
              className="w-full py-3.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Research & Generate Emails
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
