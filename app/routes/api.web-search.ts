// app/routes/api.web-search.ts
import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import type { WebSearchResponse, SearchResultItem } from '~/types/search-result';

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
    // Use DuckDuckGo Instant Answer API for real search results
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    let results: SearchResultItem[] = [];
    
    // Process DuckDuckGo results
    if (data.AbstractText) {
      results.push({
        id: 'ddg-abstract',
        title: data.Heading || query,
        link: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: data.AbstractText,
        displayLink: new URL(data.AbstractURL || 'https://duckduckgo.com').hostname,
        source: 'DuckDuckGo',
        favicon: data.Image || 'https://duckduckgo.com/favicon.ico'
      });
    }
    
    // Add related topics
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      data.RelatedTopics.slice(0, numResults - results.length).forEach((topic: any, index: number) => {
        if (topic.Text && topic.FirstURL) {
          results.push({
            id: `ddg-topic-${index}`,
            title: topic.Text.split(' - ')[0] || topic.Text,
            link: topic.FirstURL,
            snippet: topic.Text,
            displayLink: new URL(topic.FirstURL).hostname,
            source: 'DuckDuckGo',
            favicon: 'https://duckduckgo.com/favicon.ico'
          });
        }
      });
    }
    
    // If no results from DuckDuckGo, try alternative search
    if (results.length === 0) {
      // Fallback to a simple web search using DuckDuckGo HTML
      const htmlResponse = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
      const htmlText = await htmlResponse.text();
      
      // Basic HTML parsing for results (simplified)
      const resultMatches = htmlText.match(/<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g);
      
      if (resultMatches) {
        resultMatches.slice(0, numResults).forEach((match, index) => {
          const hrefMatch = match.match(/href="([^"]*)"/);
          const textMatch = match.match(/>([^<]*)</);
          
          if (hrefMatch && textMatch) {
            const link = hrefMatch[1];
            const title = textMatch[1].trim();
            
            if (link && title && !link.startsWith('javascript:')) {
              results.push({
                id: `ddg-html-${index}`,
                title,
                link: link.startsWith('//') ? `https:${link}` : link,
                snippet: `Search result for "${query}"`,
                displayLink: new URL(link.startsWith('//') ? `https:${link}` : link).hostname,
                source: 'DuckDuckGo',
                favicon: 'https://duckduckgo.com/favicon.ico'
              });
            }
          }
        });
      }
    }
    
    // Ensure we have the requested number of results
    results = results.slice(0, numResults);
    
    const responseData: WebSearchResponse = {
      query: query,
      results: results,
      estimatedTotalResults: results.length,
      currentPage: currentPage,
    };

    return json(responseData, { headers });
    
  } catch (error) {
    console.error('Search error:', error);
    
    // Return error instead of mock data
    return json({
      error: 'Failed to perform web search',
      details: error instanceof Error ? error.message : 'Unknown error',
      query: query,
      results: [],
      estimatedTotalResults: 0,
      currentPage: currentPage,
    }, { status: 500, headers });
  }
}
