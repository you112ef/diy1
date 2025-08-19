import type { SearchResultItem } from '~/types/search-result';

export type Provider = 'tavily' | 'bing' | 'serper' | 'google_cse';

export interface SearchKeys {
  tavily?: string;
  bing?: string;
  serper?: string;
  googleCseKey?: string;
  googleCseCx?: string;
}

export function extractSearchKeys(envLike: Record<string, any>): SearchKeys {
  return {
    tavily: envLike?.TAVILY_API_KEY,
    bing: envLike?.BING_SEARCH_API_KEY,
    serper: envLike?.SERPER_API_KEY,
    googleCseKey: envLike?.GOOGLE_CSE_API_KEY,
    googleCseCx: envLike?.GOOGLE_CSE_CX,
  };
}

export function selectProvider(preferred: Provider | '', keys: SearchKeys): Provider | null {
  if (preferred) return preferred;
  if (keys.tavily) return 'tavily';
  if (keys.bing) return 'bing';
  if (keys.serper) return 'serper';
  if (keys.googleCseKey && keys.googleCseCx) return 'google_cse';
  return null;
}

export async function performSearch(args: {
  provider: Provider;
  query: string;
  currentPage: number;
  numResults: number;
  keys: SearchKeys;
}): Promise<{ items: SearchResultItem[]; total?: number }> {
  const { provider, query, currentPage, numResults, keys } = args;

  switch (provider) {
    case 'tavily':
      return searchTavily({ apiKey: keys.tavily!, query, currentPage, numResults });
    case 'bing':
      return searchBing({ apiKey: keys.bing!, query, currentPage, numResults });
    case 'serper':
      return searchSerper({ apiKey: keys.serper!, query, currentPage, numResults });
    case 'google_cse':
      return searchGoogleCse({ apiKey: keys.googleCseKey!, cx: keys.googleCseCx!, query, currentPage, numResults });
    default:
      return { items: [] };
  }
}

async function searchTavily({ apiKey, query, currentPage, numResults }: { apiKey: string; query: string; currentPage: number; numResults: number }) {
  const endpoint = 'https://api.tavily.com/search';
  const body = {
    api_key: apiKey,
    query,
    search_depth: 'basic',
    include_answer: false,
    max_results: Math.max(1, Math.min(numResults, 20)),
    page: currentPage,
  } as const;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Tavily error: ${res.status} ${await safeText(res)}`);
  const data: any = await res.json();
  const items: SearchResultItem[] = Array.isArray(data?.results)
    ? data.results.map((item: any, idx: number) => ({
        id: item.url || item.id || `result-${idx + 1}`,
        title: item.title || item.name || 'Untitled',
        link: item.url || item.link || '#',
        snippet: item.content || item.snippet || '',
        displayLink: item.url ? safeDisplayLink(item.url) : undefined,
        source: 'tavily',
      }))
    : [];
  return { items, total: typeof data?.total_results === 'number' ? data.total_results : undefined };
}

async function searchBing({ apiKey, query, currentPage, numResults }: { apiKey: string; query: string; currentPage: number; numResults: number }) {
  const endpoint = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${Math.max(1, Math.min(numResults, 50))}&offset=${(currentPage - 1) * numResults}`;
  const res = await fetch(endpoint, { headers: { 'Ocp-Apim-Subscription-Key': apiKey }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Bing error: ${res.status} ${await safeText(res)}`);
  const data: any = await res.json();
  const webPages = data.webPages?.value || [];
  const items: SearchResultItem[] = webPages.map((item: any) => ({
    id: item.id || item.url,
    title: item.name,
    link: item.url,
    snippet: item.snippet || item.description || '',
    displayLink: safeDisplayLink(item.url),
    source: 'bing',
  }));
  const total = typeof data.webPages?.totalEstimatedMatches === 'number' ? data.webPages.totalEstimatedMatches : undefined;
  return { items, total };
}

async function searchSerper({ apiKey, query, currentPage, numResults }: { apiKey: string; query: string; currentPage: number; numResults: number }) {
  const endpoint = 'https://google.serper.dev/search';
  const body = { q: query, num: Math.max(1, Math.min(numResults, 20)), page: currentPage, gl: 'us', hl: 'en' } as const;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Serper error: ${res.status} ${await safeText(res)}`);
  const data: any = await res.json();
  const organic = data?.organic || [];
  const items: SearchResultItem[] = organic.map((item: any) => ({
    id: item.link,
    title: item.title,
    link: item.link,
    snippet: item.snippet || '',
    displayLink: safeDisplayLink(item.link),
    source: 'serper',
  }));
  const total = undefined;
  return { items, total };
}

async function searchGoogleCse({ apiKey, cx, query, currentPage, numResults }: { apiKey: string; cx: string; query: string; currentPage: number; numResults: number }) {
  const start = (currentPage - 1) * numResults + 1;
  const endpoint = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&num=${Math.max(1, Math.min(numResults, 10))}&start=${start}`;
  const res = await fetch(endpoint, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Google CSE error: ${res.status} ${await safeText(res)}`);
  const data: any = await res.json();
  const items: SearchResultItem[] = (data.items || []).map((item: any) => ({
    id: item.cacheId || item.link,
    title: item.title,
    link: item.link,
    snippet: item.snippet || '',
    displayLink: item.displayLink,
    source: 'google_cse',
  }));
  const total = typeof data.searchInformation?.totalResults === 'string' ? Number(data.searchInformation.totalResults) : undefined;
  return { items, total };
}

function safeDisplayLink(href: string): string | undefined {
  try {
    const u = new URL(href);
    return u.host;
  } catch {
    return undefined;
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return res.statusText;
  }
}