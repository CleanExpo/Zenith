'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { Copy, Check } from 'lucide-react';
import { CitationFormat } from '@/lib/services/citationManagement/baseCitationService';
import { AcademicPublication } from '@/lib/services/academicDatabases/baseAcademicDatabaseService';
import { useToast } from '@/components/ui/use-toast';

interface CitationFormatterProps {
  // The publication to format
  publication: AcademicPublication;
  
  // The citation tool credentials
  toolType: string;
  apiKey: string;
  userId: string;
  
  // Whether to show the copy button
  showCopyButton?: boolean;
  
  // Whether to show the card header
  showHeader?: boolean;
}

export function CitationFormatter({
  publication,
  toolType,
  apiKey,
  userId,
  showCopyButton = true,
  showHeader = true
}: CitationFormatterProps) {
  // State for the citation format
  const [format, setFormat] = useState<CitationFormat>('apa');
  
  // State for the formatted citation
  const [formattedCitation, setFormattedCitation] = useState<string>('');
  
  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  
  // State for copy button
  const [isCopied, setIsCopied] = useState(false);
  
  // Toast
  const { toast } = useToast();
  
  // Available citation formats
  const citationFormats: { value: CitationFormat; label: string }[] = [
    { value: 'apa', label: 'APA' },
    { value: 'mla', label: 'MLA' },
    { value: 'chicago', label: 'Chicago' },
    { value: 'harvard', label: 'Harvard' },
    { value: 'ieee', label: 'IEEE' },
    { value: 'vancouver', label: 'Vancouver' },
    { value: 'bibtex', label: 'BibTeX' },
    { value: 'ris', label: 'RIS' }
  ];
  
  // Format the citation
  const formatCitation = async () => {
    if (!toolType || !apiKey || !userId || !publication) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/citation-management/format', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toolType,
          apiKey,
          userId,
          publication,
          format
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to format citation');
      }
      
      const data = await response.json();
      setFormattedCitation(data.formattedCitation);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to format citation',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Copy the formatted citation to the clipboard
  const copyToClipboard = () => {
    if (!formattedCitation) return;
    
    navigator.clipboard.writeText(formattedCitation)
      .then(() => {
        setIsCopied(true);
        
        // Reset the copied state after 2 seconds
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
        
        toast({
          title: 'Copied',
          description: 'Citation copied to clipboard'
        });
      })
      .catch(() => {
        toast({
          title: 'Error',
          description: 'Failed to copy citation to clipboard',
          variant: 'destructive'
        });
      });
  };
  
  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle>Citation Formatter</CardTitle>
          <CardDescription>
            Format citations in different styles
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              Format
            </Label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as CitationFormat)}
              disabled={isLoading}
            >
              <SelectTrigger id="format" className="col-span-3">
                <SelectValue placeholder="Select a citation format" />
              </SelectTrigger>
              <SelectContent>
                {citationFormats.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-span-1"></div>
            <div className="col-span-3">
              <Button
                onClick={formatCitation}
                disabled={isLoading || !toolType || !apiKey || !userId || !publication}
              >
                {isLoading ? <LoadingIndicator size="sm" /> : 'Format Citation'}
              </Button>
            </div>
          </div>
          
          {formattedCitation && (
            <div className="mt-4 p-4 border rounded-md bg-muted relative">
              <pre className="whitespace-pre-wrap text-sm">{formattedCitation}</pre>
              
              {showCopyButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={copyToClipboard}
                  disabled={isCopied}
                >
                  {isCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
