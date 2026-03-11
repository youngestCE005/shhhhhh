import type { SparseInput } from "./types";

/**
 * Parse a free-form identifier string into the right SparseInput field.
 */
export function parseSingleInput(
  name: string,
  identifier: string,
  notes: string = ""
): SparseInput {
  const sparse: SparseInput = { name: name.trim(), notes: notes.trim() };
  const ident = identifier.trim();

  if (!ident) return sparse;

  // Email
  if (ident.includes("@") && ident.split("@").pop()?.includes(".")) {
    sparse.email = ident;
  }
  // LinkedIn
  else if (ident.toLowerCase().includes("linkedin.com")) {
    sparse.linkedin = ident.startsWith("http") ? ident : `https://${ident}`;
  }
  // Twitter/X
  else if (
    ident.toLowerCase().includes("twitter.com") ||
    ident.toLowerCase().includes("x.com")
  ) {
    sparse.twitter = ident.startsWith("http") ? ident : `https://${ident}`;
  } else if (ident.startsWith("@")) {
    sparse.twitter = `https://x.com/${ident.replace(/^@/, "")}`;
  }
  // URL
  else if (ident.startsWith("http://") || ident.startsWith("https://")) {
    sparse.website = ident;
  } else if (ident.includes(".") && !ident.includes(" ") && ident.length > 4) {
    sparse.website = `https://${ident}`;
  }
  // Assume company
  else {
    sparse.company = ident;
  }

  return sparse;
}

/**
 * Generate search queries from sparse input.
 */
export function generateSearchQueries(sparse: SparseInput): string[] {
  const queries: string[] = [];
  const name = sparse.name.trim();
  if (!name) return queries;

  if (sparse.company) {
    queries.push(`"${name}" "${sparse.company}"`);
  }
  if (sparse.email && sparse.email.includes("@")) {
    const domain = sparse.email.split("@")[1];
    queries.push(`"${name}" "${domain}"`);
  }
  if (sparse.linkedin) {
    queries.push(`"${name}" site:linkedin.com`);
  }
  if (sparse.website) {
    const domain = sparse.website.replace(/https?:\/\//, "").replace(/\/$/, "");
    queries.push(`"${name}" "${domain}"`);
  }
  if (sparse.twitter) {
    const handle = sparse.twitter.split("/").pop()?.replace("@", "") || "";
    if (handle) queries.push(`"${name}" "@${handle}" OR "${handle}"`);
  }

  queries.push(`"${name}" who is OR about OR bio OR profile`);
  queries.push(`"${name}" interview OR podcast OR talk OR essay`);

  // Deduplicate
  const seen = new Set<string>();
  return queries.filter((q) => {
    if (seen.has(q)) return false;
    seen.add(q);
    return true;
  }).slice(0, 5);
}

/**
 * Map flexible column names from CSV uploads to canonical field names.
 */
const COLUMN_ALIASES: Record<string, keyof SparseInput> = {
  name: "name",
  full_name: "name",
  fullname: "name",
  email: "email",
  linkedin: "linkedin",
  linkedin_url: "linkedin",
  linkedin_link: "linkedin",
  company: "company",
  organization: "company",
  org: "company",
  website: "website",
  url: "website",
  site: "website",
  web: "website",
  twitter: "twitter",
  twitter_url: "twitter",
  x: "twitter",
  x_url: "twitter",
  notes: "notes",
  note: "notes",
  comments: "notes",
};

export function normalizeColumnName(col: string): keyof SparseInput | null {
  const lower = col.trim().toLowerCase().replace(/\s+/g, "_");
  return COLUMN_ALIASES[lower] || null;
}

export function parseCSVRows(
  rows: Record<string, string>[]
): SparseInput[] {
  return rows
    .map((row) => {
      const sparse: SparseInput = { name: "" };
      for (const [col, val] of Object.entries(row)) {
        const canonical = normalizeColumnName(col);
        if (canonical && val?.trim()) {
          (sparse as unknown as Record<string, string>)[canonical] = val.trim();
        }
      }
      return sparse;
    })
    .filter((s) => s.name.length > 0);
}
