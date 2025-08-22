// app/types/search-result.ts
export interface SearchResultItem {
  id: string;           // A unique identifier for the item (could be the URL or an ID from the provider)
  title: string;        // The title of the search result.
  link: string;         // The direct URL to the search result.
  snippet: string;      // A short description or summary of the content.
  displayLink?: string;  // Optional: A user-friendly version of the link
  source?: string;       // Optional: Name of the search provider
  favicon?: string;      // Optional: URL to the website's favicon
}

export interface WebSearchResponse {
  query: string;                 // The original search query that was processed.
  results: SearchResultItem[];   // An array of search result items.
  estimatedTotalResults?: number; // Optional: Estimated total number of results
  currentPage?: number;           // Optional: The current page number of the results
}
