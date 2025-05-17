/**
 * Academic Database Search Component
 * 
 * This component provides a user interface for searching academic databases
 * like PubMed, Scopus, IEEE, etc. It allows users to select a database,
 * enter search terms, and view the results.
 */

'use client';

import { useState, useEffect } from 'react';
import { useAcademicDatabases } from '@/hooks/useAcademicDatabases';
import { AcademicDatabaseType } from '@/lib/services/academicDatabases/academicDatabaseFactory';
import { AcademicPublication, AcademicSearchResults } from '@/lib/services/academicDatabases/baseAcademicDatabaseService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { Badge } from '@/components/ui/badge';
import { AddToCitationTool } from '@/components/citation-management/AddToCitationTool';
import { ExternalLink } from 'lucide-react';

interface AcademicDatabaseSearchProps {
  // Initial database to search
  initialDatabase?: AcademicDatabaseType;
  
  // Initial search query
  initialQuery?: string;
  
  // Callback when a publication is selected
  onPublicationSelect?: (publication: AcademicPublication) => void;
  
  // Whether to show the database selector
  showDatabaseSelector?: boolean;
  
  // Maximum number of results to show per page
  resultsPerPage?: number;
}

export function AcademicDatabaseSearch({
  initialDatabase = 'pubmed',
  initialQuery = '',
  onPublicationSelect,
  showDatabaseSelector = true,
  resultsPerPage = 10
}: AcademicDatabaseSearchProps) {
  // State for the search form
  const [selectedDatabase, setSelectedDatabase] = useState<AcademicDatabaseType>(initialDatabase);
  const [query, setQuery] = useState(initialQuery);
  const [field, setField] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  
  // State for the search results
  const [results, setResults] = useState<AcademicSearchResults | null>(null);
  
  // Get the academic database hook
  const { searchDatabase, getAvailableDatabaseTypes, isSearching } = useAcademicDatabases();
  
  // State for available database types
  const [availableDatabaseTypes, setAvailableDatabaseTypes] = useState<AcademicDatabaseType[]>([]);
  
  // Load available database types
  useEffect(() => {
    const loadDatabaseTypes = async () => {
      const types = await getAvailableDatabaseTypes();
      setAvailableDatabaseTypes(types);
      
      // If the initial database is not available, use the first available one
      if (types.length > 0 && !types.includes(initialDatabase)) {
        setSelectedDatabase(types[0]);
      }
    };
    
    loadDatabaseTypes();
  }, [getAvailableDatabaseTypes, initialDatabase]);
  
  // Handle search form submission
  const handleSearch = async () => {
    if (!query) return;
    
    const searchResults = await searchDatabase(selectedDatabase, {
      query,
      field,
      limit: resultsPerPage,
      page
    });
    
    if (searchResults) {
      setResults(searchResults);
    }
  };
  
  // Handle page change
  const handlePageChange = async (newPage: number) => {
    setPage(newPage);
    
    const searchResults = await searchDatabase(selectedDatabase, {
      query,
      field,
      limit: resultsPerPage,
      page: newPage
    });
    
    if (searchResults) {
      setResults(searchResults);
    }
  };
  
  // Handle publication selection
  const handlePublicationSelect = (publication: AcademicPublication) => {
    if (onPublicationSelect) {
      onPublicationSelect(publication);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Database Search</CardTitle>
          <CardDescription>
            Search academic databases for research publications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Database Selector */}
            {showDatabaseSelector && (
              <div className="space-y-2">
                <Label htmlFor="database">Database</Label>
                <Select
                  value={selectedDatabase}
                  onValueChange={(value) => setSelectedDatabase(value as AcademicDatabaseType)}
                >
                  <SelectTrigger id="database">
                    <SelectValue placeholder="Select a database" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDatabaseTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Search Field */}
            <div className="space-y-2">
              <Label htmlFor="field">Search Field</Label>
              <Select
                value={field || ''}
                onValueChange={(value) => setField(value || undefined)}
              >
                <SelectTrigger id="field">
                  <SelectValue placeholder="All Fields" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Fields</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="abstract">Abstract</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="journal">Journal</SelectItem>
                  <SelectItem value="keyword">Keyword</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Search Query */}
            <div className="space-y-2">
              <Label htmlFor="query">Search Query</Label>
              <div className="flex space-x-2">
                <Input
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter search terms..."
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isSearching || !query}>
                  {isSearching ? <LoadingIndicator size="sm" /> : 'Search'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Search Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {results.totalResults} results for &quot;{results.searchParams.query}&quot;
              {results.searchParams.field && ` in ${results.searchParams.field}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.publications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No results found. Try a different search query.
              </div>
            ) : (
              <div className="space-y-6">
                {results.publications.map((publication) => (
                  <div
                    key={publication.id}
                    className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => handlePublicationSelect(publication)}
                  >
                    <h3 className="text-lg font-semibold">{publication.title}</h3>
                    
                    {publication.authors && publication.authors.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {publication.authors.join(', ')}
                      </p>
                    )}
                    
                    {publication.publicationDate && (
                      <p className="text-sm mt-1">
                        {publication.source}
                        {publication.publicationDate && ` (${publication.publicationDate})`}
                      </p>
                    )}
                    
                    {publication.abstract && (
                      <p className="mt-2 line-clamp-3 text-sm">
                        {publication.abstract}
                      </p>
                    )}
                    
                    <div className="mt-2 flex flex-wrap gap-1 justify-between">
                      <div className="flex flex-wrap gap-1">
                        {publication.publicationType && (
                          <Badge variant="outline">
                            {Array.isArray(publication.publicationType)
                              ? publication.publicationType[0]
                              : publication.publicationType}
                          </Badge>
                        )}
                        
                        {publication.doi && (
                          <Badge variant="outline">DOI: {publication.doi}</Badge>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <AddToCitationTool 
                          publication={publication}
                          buttonVariant="outline"
                          buttonSize="sm"
                        />
                        
                        {publication.url && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(publication.url, '_blank');
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          
          {/* Pagination */}
          {results.totalPages > 1 && (
            <CardFooter>
              <PaginationControls
                currentPage={results.page}
                totalPages={results.totalPages}
                onPageChange={handlePageChange}
              />
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}
