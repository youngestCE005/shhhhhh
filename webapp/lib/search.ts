/**
 * Web search integration — calls Brave or Tavily from the server side.
 * Returns structured results so callers know if real search data was found.
 */

export interface SearchResult {
  text: string;
  hasRealResults: boolean;
  resultCount: number;
  provider: string;
  error?: string;
}

export async function webSearch(query: string): Promise<SearchResult> {
  if (process.env.BRAVE_API_KEY) {
    return braveSearch(query, process.env.BRAVE_API_KEY);
  }
  if (process.env.TAVILY_API_KEY) {
    return tavilySearch(query, process.env.TAVILY_API_KEY);
  }
  return { text: "", hasRealResults: false, resultCount: 0, provider: "none" };
}

async function braveSearch(query: string, apiKey: string): Promise<SearchResult> {
  try {
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
      return { text: "", hasRealResults: false, resultCount: 0, provider: "brave", error: `HTTP ${resp.status}` };
    }

    const data = await resp.json();
    const results = data?.web?.results || [];

    if (results.length === 0) {
      return { text: "", hasRealResults: false, resultCount: 0, provider: "brave" };
    }

    const text = results
      .slice(0, 5)
      .map(
        (r: { title?: string; url?: string; description?: string }) =>
          `- ${r.title || ""}\n  ${r.url || ""}\n  ${r.description || ""}`
      )
      .join("\n");

    return { text, hasRealResults: true, resultCount: results.length, provider: "brave" };
  } catch (e) {
    return { text: "", hasRealResults: false, resultCount: 0, provider: "brave", error: String(e) };
  }
}

async function tavilySearch(query: string, apiKey: string): Promise<SearchResult> {
  try {
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
      return { text: "", hasRealResults: false, resultCount: 0, provider: "tavily", error: `HTTP ${resp.status}` };
    }

    const data = await resp.json();
    const results = data?.results || [];

    if (results.length === 0) {
      return { text: "", hasRealResults: false, resultCount: 0, provider: "tavily" };
    }

    const text = results
      .slice(0, 5)
      .map(
        (r: { title?: string; url?: string; content?: string }) =>
          `- ${r.title || ""}\n  ${r.url || ""}\n  ${r.content || ""}`
      )
      .join("\n");

    return { text, hasRealResults: true, resultCount: results.length, provider: "tavily" };
  } catch (e) {
    return { text: "", hasRealResults: false, resultCount: 0, provider: "tavily", error: String(e) };
  }
}

export function hasSearchConfigured(): boolean {
  return !!(process.env.BRAVE_API_KEY || process.env.TAVILY_API_KEY);
}

export function searchProviderName(): string {
  if (process.env.BRAVE_API_KEY) return "Brave";
  if (process.env.TAVILY_API_KEY) return "Tavily";
  return "none";
}
