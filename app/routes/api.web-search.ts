// app/routes/api.web-search.ts
import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import type { WebSearchResponse, SearchResultItem } from '~/types/search-result'; // Assuming path alias

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const numResultsParam = url.searchParams.get('num_results');
  const pageParam = url.searchParams.get('page');

  const numResults = numResultsParam ? parseInt(numResultsParam, 10) : 10;
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  const headers = {
    'Access-Control-Allow-Origin': '*', // Adjust for specific origins in production
    'Content-Type': 'application/json',
  };

  if (!query) {
    return json({ error: 'Search query (q) is required' }, { status: 400, headers });
  }

  /*
   * Placeholder / Mocked Data
   * In a real implementation, this section would:
   * 1. Get API key from server environment variables.
   * 2. Call the chosen external search provider's API with the query and other params.
   * 3. Transform the provider's response into our SearchResultItem[] structure.
   * 4. Handle errors from the external API.
   */

  const mockResults: SearchResultItem[] = [];

  for (let i = 1; i <= numResults; i++) {
    mockResults.push({
      id: `mock-${i}`,
      title: `Mock Search Result ${i} for "${query}"`,
      link: `https://example.com/search?q=${encodeURIComponent(query)}&page=${currentPage}&item=${i}`,
      snippet: `This is a mock snippet for search result ${i} related to the query "${query}". More details would appear here.`,
      displayLink: 'example.com',
      source: 'MockSearchEngine',
      favicon: 'https://example.com/favicon.ico',
    });
  }

  const responseData: WebSearchResponse = {
    query,
    results: mockResults,
    estimatedTotalResults: 100, // Mocked
    currentPage,
  };

  return json(responseData, { headers });
}
