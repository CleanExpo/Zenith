'use client';

import { useState, useEffect } from 'react';
import { SearchResult } from '@/lib/services/searchService';
import { SearchResultItem } from '@/components/search/SearchResultItem';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  onFilterChange?: (types: ('project' | 'task' | 'note' | 'file')[]) => void;
}

export function SearchResults({ results, isLoading, onFilterChange }: SearchResultsProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>(results);
  const [visibleCount, setVisibleCount] = useState<number>(10);

  // Count results by type
  const projectCount = results.filter(r => r.type === 'project').length;
  const taskCount = results.filter(r => r.type === 'task').length;
  const noteCount = results.filter(r => r.type === 'note').length;
  const fileCount = results.filter(r => r.type === 'file').length;

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredResults(results);
      if (onFilterChange) {
        onFilterChange(['project', 'task', 'note', 'file']);
      }
    } else {
      const filtered = results.filter(r => r.type === activeTab);
      setFilteredResults(filtered);
      if (onFilterChange) {
        onFilterChange([activeTab as 'project' | 'task' | 'note' | 'file']);
      }
    }
    setVisibleCount(10); // Reset visible count when filter changes
  }, [activeTab, results, onFilterChange]);

  const loadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No results found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search query or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="all">
            All ({results.length})
          </TabsTrigger>
          <TabsTrigger value="project" disabled={projectCount === 0}>
            Projects ({projectCount})
          </TabsTrigger>
          <TabsTrigger value="task" disabled={taskCount === 0}>
            Tasks ({taskCount})
          </TabsTrigger>
          <TabsTrigger value="note" disabled={noteCount === 0}>
            Notes ({noteCount})
          </TabsTrigger>
          <TabsTrigger value="file" disabled={fileCount === 0}>
            Files ({fileCount})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {filteredResults.slice(0, visibleCount).map(result => (
              <SearchResultItem key={`${result.type}-${result.id}`} result={result} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="project" className="mt-6">
          <div className="space-y-4">
            {filteredResults.slice(0, visibleCount).map(result => (
              <SearchResultItem key={`${result.type}-${result.id}`} result={result} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="task" className="mt-6">
          <div className="space-y-4">
            {filteredResults.slice(0, visibleCount).map(result => (
              <SearchResultItem key={`${result.type}-${result.id}`} result={result} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="note" className="mt-6">
          <div className="space-y-4">
            {filteredResults.slice(0, visibleCount).map(result => (
              <SearchResultItem key={`${result.type}-${result.id}`} result={result} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="file" className="mt-6">
          <div className="space-y-4">
            {filteredResults.slice(0, visibleCount).map(result => (
              <SearchResultItem key={`${result.type}-${result.id}`} result={result} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredResults.length > visibleCount && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={loadMore}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
