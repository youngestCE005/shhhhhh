import type { ProcessedResult, ExportRow } from "./types";

const ANGLE_DISPLAY: Record<string, string> = {
  aviation_engineering: "Aviation / Engineering",
  investing_economic_development: "Investing / Economic Development",
  global_infrastructure_china: "Global Infrastructure / China",
  ai_tools_technical_initiative: "AI Tools / Technical Initiative",
  builder_ambition_intellectual: "Builder Ambition / Intellectual",
};

export function toExportRows(results: ProcessedResult[]): ExportRow[] {
  return results.map((r) => {
    const angle = r.edited_angle || r.draft.angle_used;
    const body = r.edited_body || r.draft.body;
    const subjs = [...r.draft.subject_lines, "", "", ""];

    return {
      input_name: r.input.name,
      resolved_name: r.contact.full_name,
      email: r.input.email || "",
      linkedin: r.contact.linkedin,
      company: r.contact.company,
      role: r.contact.role,
      chosen_angle: ANGLE_DISPLAY[angle] || angle,
      confidence: `${Math.round(r.brief.confidence_score * 100)}%`,
      subject_line_1: subjs[0],
      subject_line_2: subjs[1],
      subject_line_3: subjs[2],
      email_body: body,
      review_status: r.review_status,
      warning_flag: r.warning,
    };
  });
}

export function toCSV(rows: ExportRow[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => escape(String((row as unknown as Record<string, string>)[h] || ""))).join(",")
    ),
  ];
  return lines.join("\n");
}

export function toMarkdown(rows: ExportRow[]): string {
  const lines = ["# Cold Email Drafts\n"];
  for (const row of rows) {
    lines.push(`## ${row.resolved_name}`);
    if (row.role || row.company) {
      lines.push(`**${row.role}** at **${row.company}**\n`);
    }
    lines.push(`- Angle: ${row.chosen_angle}`);
    lines.push(`- Confidence: ${row.confidence}`);
    lines.push(`- Status: ${row.review_status}`);
    if (row.warning_flag) lines.push(`- Warning: ${row.warning_flag}`);
    lines.push("");
    if (row.subject_line_1) lines.push(`**Subject 1:** ${row.subject_line_1}`);
    if (row.subject_line_2) lines.push(`**Subject 2:** ${row.subject_line_2}`);
    if (row.subject_line_3) lines.push(`**Subject 3:** ${row.subject_line_3}`);
    lines.push(`\n${row.email_body}\n`);
    lines.push("---\n");
  }
  return lines.join("\n");
}

export function toJSON(rows: ExportRow[]): string {
  return JSON.stringify(rows, null, 2);
}

export function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
