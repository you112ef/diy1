// app/routes/api.web-search.ts
import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import type { WebSearchResponse } from '~/types/search-result';
import { extractSearchKeys, performSearch, selectProvider, type Provider } from '~/lib/web/search.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const numResultsParam = url.searchParams.get('num_results');
  const pageParam = url.searchParams.get('page');
  const providerParam = (url.searchParams.get('provider') || '').toLowerCase() as Provider | '';

  const numResults = numResultsParam ? parseInt(numResultsParam, 10) : 10;
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (!query) {
    return json({ error: 'Search query (q) is required' }, { status: 400, headers });
  }

  const env = (context as any)?.cloudflare?.env || (context as any)?.env || process.env;
  const keys = extractSearchKeys(env as any);
  const provider = selectProvider(providerParam, keys);

  if (!provider) {
    return json(
      {
        error:
          'No valid search provider configured. Provide ?provider=tavily|bing|serper|google_cse and set the matching API keys.',
      },
      { status: 501, headers },
    );
  }

  try {
    const result = await performSearch({ provider, query, currentPage, numResults, keys });

    return json(
      {
        query,
        results: result.items,
        estimatedTotalResults: result.total,
        currentPage,
        provider,
      } satisfies WebSearchResponse & { provider: Provider },
      { headers },
    );
  } catch (error) {
    return json(
      {
        error: 'Unexpected error during web search',
        details: error instanceof Error ? error.message : String(error),
        provider,
      },
      { status: 500, headers },
    );
  }
}
