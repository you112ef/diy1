// app/routes/api.web-search.ts
import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import type { WebSearchResponse, SearchResultItem } from '~/types/search-result';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const numResultsParam = url.searchParams.get('num_results');
  const pageParam = url.searchParams.get('page');

  const numResults = numResultsParam ? parseInt(numResultsParam, 10) : 10;
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (!query) {
    return json({ error: 'Search query (q) is required' }, { status: 400, headers });
  }

  // Resolve API key from Cloudflare context or process.env (dev)
  const tavilyApiKey = (context as any)?.cloudflare?.env?.TAVILY_API_KEY || (context as any)?.env?.TAVILY_API_KEY || process.env.TAVILY_API_KEY;

  if (!tavilyApiKey) {
    return json(
      {
        error: 'TAVILY_API_KEY is not set on the server. Please configure it to enable real web search.',
      },
      { status: 501, headers },
    );
  }

  try {
    const tavilyEndpoint = 'https://api.tavily.com/search';

    const body = {
      api_key: tavilyApiKey,
      query,
      search_depth: 'basic',
      include_answer: false,
      max_results: Math.max(1, Math.min(numResults, 20)),
      page: currentPage,
    } as const;

    const response = await fetch(tavilyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      // Reasonable timeout to avoid hanging requests
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      return json(
        {
          error: 'Web search provider error',
          status: response.status,
          details: errText,
        },
        { status: 502, headers },
      );
    }

    const data = (await response.json()) as any;

    const results: SearchResultItem[] = Array.isArray(data?.results)
      ? (data.results as any[]).map((item, idx) => ({
          id: item.url || item.id || `result-${idx + 1}`,
          title: item.title || item.name || 'Untitled',
          link: item.url || item.link || '#',
          snippet: item.content || item.snippet || '',
          displayLink: item.url ? safeDisplayLink(item.url) : undefined,
          source: 'tavily',
          favicon: undefined,
        }))
      : [];

    const responseData: WebSearchResponse = {
      query,
      results,
      estimatedTotalResults: typeof data?.total_results === 'number' ? data.total_results : undefined,
      currentPage,
    };

    return json(responseData, { headers });
  } catch (error) {
    return json(
      {
        error: 'Unexpected error during web search',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers },
    );
  }
}

function safeDisplayLink(href: string): string | undefined {
  try {
    const u = new URL(href);
    return u.host;
  } catch {
    return undefined;
  }
}
