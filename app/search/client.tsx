'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchInput } from '@/components/ui/search-input';
import { SearchResults } from '@/components/search/SearchResults';
import { SearchResult } from '@/lib/services/searchService';
import { logger } from '@/lib/logger';

interface SearchPageClientProps {
  initialQuery: string;
}

export default function SearchPageClient({ initialQuery }: SearchPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<('project' | 'task' | 'note' | 'file')[]>([
    'project', 'task', 'note', 'file'
  ]);

  useEffect(() => {
    // Update query when URL changes
    const urlQuery = searchParams.get('q') || '';
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [searchParams, query]);

  useEffect(() => {
    if (query) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [query, selectedTypes]);

  const performSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('q', query);
      
      if (selectedTypes.length > 0 && selectedTypes.length < 4) {
        params.append('types', selectedTypes.join(','));
      }

      // Make API request
      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data.results || []);
      
      logger.info('Search completed', { 
        query, 
        resultCount: data.results?.length || 0 
      });
    } catch (error: any) {
      logger.error('Error performing search', { error: error.message, query });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (newQuery: string) => {
    if (newQuery === query) return;
    
    // Update URL with new query
    if (newQuery) {
      router.push(`/search?q=${encodeURIComponent(newQuery)}`);
    } else {
      router.push('/search');
    }
    
    setQuery(newQuery);
  };

  const handleFilterChange = (types: ('project' | 'task' | 'note' | 'file')[]) => {
    setSelectedTypes(types);
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-6">Search</h1>
          <SearchInput 
            placeholder="Search projects, tasks, notes, and files..." 
            initialQuery={query}
            onSearch={handleSearch}
            className="w-full max-w-3xl mx-auto"
            autoFocus
          />
        </div>

        {query && (
          <div>
            <h2 className="text-xl font-medium mb-4">
              {isLoading 
                ? 'Searching...' 
                : results.length > 0 
                  ? `Found ${results.length} results for "${query}"` 
                  : `No results found for "${query}"`
              }
            </h2>
            <SearchResults 
              results={results} 
              isLoading={isLoading} 
              onFilterChange={handleFilterChange}
            />
          </div>
        )}

        {!query && !isLoading && (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium mb-2">Enter a search term to get started</h2>
            <p className="text-muted-foreground">
              Search across your projects, tasks, notes, and files.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
