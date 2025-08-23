// app/routes/api.web-search.ts
import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import type { WebSearchResponse, SearchResultItem } from '~/types/search-result';

// Real search implementation using DuckDuckGo Instant Answer API
async function searchDuckDuckGo(query: string, numResults: number = 10): Promise<SearchResultItem[]> {
  try {
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }
    
    const data = await response.json();
    const results: SearchResultItem[] = [];
    
    // Add instant answer if available
    if (data.AbstractText) {
      results.push({
        id: 'instant-answer',
        title: data.Heading || query,
        link: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: data.AbstractText,
        displayLink: new URL(data.AbstractURL || 'https://duckduckgo.com').hostname,
        source: 'DuckDuckGo Instant Answer',
        favicon: 'https://duckduckgo.com/favicon.ico'
      });
    }
    
    // Add related topics
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      data.RelatedTopics.slice(0, Math.min(numResults - results.length, 5)).forEach((topic: any, index: number) => {
        if (topic.Text && topic.FirstURL) {
          results.push({
            id: `related-${index}`,
            title: topic.Text.split(' - ')[0] || topic.Text,
            link: topic.FirstURL,
            snippet: topic.Text,
            displayLink: new URL(topic.FirstURL).hostname,
            source: 'DuckDuckGo Related',
            favicon: 'https://duckduckgo.com/favicon.ico'
          });
        }
      });
    }
    
    return results;
  } catch (error) {
    console.error('DuckDuckGo search failed:', error);
    return [];
  }
}

// Fallback search using a simple web search
async function fallbackSearch(query: string, numResults: number = 10): Promise<SearchResultItem[]> {
  try {
    // Use a simple search approach - in production, you might want to use a real search API
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    // For now, return a structured response that directs users to search engines
    const results: SearchResultItem[] = [];
    
    for (let i = 1; i <= Math.min(numResults, 5); i++) {
      results.push({
        id: `fallback-${i}`,
        title: `Search Result ${i} for "${query}"`,
        link: searchUrl,
        snippet: `Click to search for "${query}" on Google. This is a fallback result as the search API is not configured.`,
        displayLink: 'google.com',
        source: 'Google Search',
        favicon: 'https://www.google.com/favicon.ico'
      });
    }
    
    return results;
  } catch (error) {
    console.error('Fallback search failed:', error);
    return [];
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
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

  try {
    // Try DuckDuckGo first
    let results = await searchDuckDuckGo(query, numResults);
    
    // If no results, fall back to alternative search
    if (results.length === 0) {
      results = await fallbackSearch(query, numResults);
    }
    
    // If still no results, provide helpful response
    if (results.length === 0) {
      results = [{
        id: 'no-results',
        title: 'No search results found',
        link: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: `No results found for "${query}". Try searching directly on DuckDuckGo or Google.`,
        displayLink: 'duckduckgo.com',
        source: 'Search Engine',
        favicon: 'https://duckduckgo.com/favicon.ico'
      }];
    }

    const responseData: WebSearchResponse = {
      query: query,
      results: results,
      estimatedTotalResults: results.length,
      currentPage: currentPage,
    };

    return json(responseData, { headers });
  } catch (error) {
    console.error('Search failed:', error);
    
    // Return fallback results on error
    const fallbackResults = await fallbackSearch(query, numResults);
    
    const responseData: WebSearchResponse = {
      query: query,
      results: fallbackResults,
      estimatedTotalResults: fallbackResults.length,
      currentPage: currentPage,
    };

    return json(responseData, { headers });
  }
}
