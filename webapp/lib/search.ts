/**
 * Web search integration — calls Brave or Tavily from the server side.
 */

export async function webSearch(query: string): Promise<string> {
  if (process.env.BRAVE_API_KEY) {
    return braveSearch(query, process.env.BRAVE_API_KEY);
  }
  if (process.env.TAVILY_API_KEY) {
    return tavilySearch(query, process.env.TAVILY_API_KEY);
  }
  return `[No search API configured. Query: ${query}]`;
}

async function braveSearch(query: string, apiKey: string): Promise<string> {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "5");

  const resp = await fetch(url.toString(), {
    headers: {
      "X-Subscription-Token": apiKey,
      Accept: "application/json",
    },
  });

  if (!resp.ok) {
    return `[Brave search error: ${resp.status}]`;
  }

  const data = await resp.json();
  const results = data?.web?.results || [];

  if (results.length === 0) {
    return `[No results for: ${query}]`;
  }

  return results
    .slice(0, 5)
    .map(
      (r: { title?: string; url?: string; description?: string }) =>
        `- ${r.title || ""}\n  ${r.url || ""}\n  ${r.description || ""}`
    )
    .join("\n");
}

async function tavilySearch(query: string, apiKey: string): Promise<string> {
  const resp = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: 5,
    }),
  });

  if (!resp.ok) {
    return `[Tavily search error: ${resp.status}]`;
  }

  const data = await resp.json();
  const results = data?.results || [];

  if (results.length === 0) {
    return `[No results for: ${query}]`;
  }

  return results
    .slice(0, 5)
    .map(
      (r: { title?: string; url?: string; content?: string }) =>
        `- ${r.title || ""}\n  ${r.url || ""}\n  ${r.content || ""}`
    )
    .join("\n");
}

export function hasSearchConfigured(): boolean {
  return !!(process.env.BRAVE_API_KEY || process.env.TAVILY_API_KEY);
}

export function searchProviderName(): string {
  if (process.env.BRAVE_API_KEY) return "Brave";
  if (process.env.TAVILY_API_KEY) return "Tavily";
  return "None";
}
