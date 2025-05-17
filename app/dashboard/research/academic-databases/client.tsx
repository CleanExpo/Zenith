/**
 * Academic Databases Client Component
 * 
 * This client component provides a user interface for searching academic databases
 * like PubMed, Scopus, IEEE, etc. It allows users to search for publications
 * and view the results.
 */

'use client';

import { useState } from 'react';
import { AcademicDatabaseSearch } from '@/components/academic-databases/AcademicDatabaseSearch';
import { AcademicPublication } from '@/lib/services/academicDatabases/baseAcademicDatabaseService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function AcademicDatabasesClient() {
  // State for the selected publication
  const [selectedPublication, setSelectedPublication] = useState<AcademicPublication | null>(null);
  const { toast } = useToast();
  
  // Handle publication selection
  const handlePublicationSelect = (publication: AcademicPublication) => {
    setSelectedPublication(publication);
    
    // Scroll to the top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handle citation copy
  const handleCopyCitation = () => {
    if (!selectedPublication) return;
    
    // Format the citation in APA style
    const citation = formatCitation(selectedPublication);
    
    // Copy to clipboard
    navigator.clipboard.writeText(citation)
      .then(() => {
        toast({
          title: 'Citation copied',
          description: 'The citation has been copied to your clipboard.',
          variant: 'default'
        });
      })
      .catch((error) => {
        console.error('Failed to copy citation:', error);
        toast({
          title: 'Failed to copy citation',
          description: 'Please try again or copy manually.',
          variant: 'destructive'
        });
      });
  };
  
  // Format a citation in APA style
  const formatCitation = (publication: AcademicPublication): string => {
    // Extract the year from the publication date
    const year = publication.publicationDate 
      ? publication.publicationDate.match(/\d{4}/)
        ? publication.publicationDate.match(/\d{4}/)![0]
        : ''
      : '';
    
    // Format the authors
    const authors = publication.authors && publication.authors.length > 0
      ? publication.authors.length > 5
        ? `${publication.authors[0]} et al.`
        : publication.authors.join(', ')
      : 'Unknown';
    
    // Format the citation
    return `${authors} (${year}). ${publication.title}. ${publication.source || ''}${publication.doi ? ` doi:${publication.doi}` : ''}`;
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Academic Databases</h1>
      <p className="text-muted-foreground">
        Search academic databases for research publications. Select a database, enter search terms, and view the results.
      </p>
      
      {/* Selected Publication */}
      {selectedPublication && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{selectedPublication.title}</CardTitle>
                {selectedPublication.authors && selectedPublication.authors.length > 0 && (
                  <CardDescription className="mt-2 text-base">
                    {selectedPublication.authors.join(', ')}
                  </CardDescription>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPublication(null)}
                className="ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Search
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Publication Details */}
            <div className="space-y-4">
              {/* Source and Date */}
              {(selectedPublication.source || selectedPublication.publicationDate) && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Source</h3>
                  <p>
                    {selectedPublication.source}
                    {selectedPublication.publicationDate && ` (${selectedPublication.publicationDate})`}
                  </p>
                </div>
              )}
              
              {/* Abstract */}
              {selectedPublication.abstract && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Abstract</h3>
                  <p className="whitespace-pre-line">{selectedPublication.abstract}</p>
                </div>
              )}
              
              {/* Publication Type */}
              {selectedPublication.publicationType && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Publication Type</h3>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(selectedPublication.publicationType)
                      ? selectedPublication.publicationType.map((type, index) => (
                          <Badge key={index} variant="outline">{type}</Badge>
                        ))
                      : <Badge variant="outline">{selectedPublication.publicationType}</Badge>
                    }
                  </div>
                </div>
              )}
              
              {/* DOI */}
              {selectedPublication.doi && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">DOI</h3>
                  <p>
                    <a
                      href={`https://doi.org/${selectedPublication.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {selectedPublication.doi}
                    </a>
                  </p>
                </div>
              )}
              
              {/* URL */}
              {selectedPublication.url && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">URL</h3>
                  <p>
                    <a
                      href={selectedPublication.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {selectedPublication.url}
                    </a>
                  </p>
                </div>
              )}
              
              {/* Keywords */}
              {selectedPublication.keywords && selectedPublication.keywords.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Keywords</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedPublication.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">{keyword}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Citation */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Citation</h3>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">{formatCitation(selectedPublication)}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCitation}
                  className="mt-2"
                >
                  Copy Citation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Search Component */}
      <AcademicDatabaseSearch
        onPublicationSelect={handlePublicationSelect}
        showDatabaseSelector={true}
        resultsPerPage={10}
      />
    </div>
  );
}
