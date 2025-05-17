/**
 * Add to Citation Tool Component
 * 
 * This component provides a UI for adding a publication to a citation management tool.
 * It allows users to select a citation tool, enter their API key and user ID,
 * and add the publication to their library.
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AcademicPublication } from '@/lib/services/academicDatabases/baseAcademicDatabaseService';
import { useCitationManagement } from '@/hooks/useCitationManagement';
import { CitationToolType } from '@/lib/services/citationManagement/citationServiceFactory';
import { Loader2, BookPlus } from 'lucide-react';

/**
 * Add to Citation Tool Props
 */
interface AddToCitationToolProps {
  publication: AcademicPublication;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  buttonText?: string;
  onSuccess?: () => void;
}

/**
 * Add to Citation Tool Component
 */
export function AddToCitationTool({
  publication,
  buttonVariant = 'default',
  buttonSize = 'default',
  buttonText = 'Add to Citation Tool',
  onSuccess
}: AddToCitationToolProps) {
  // State for the dialog
  const [open, setOpen] = useState(false);
  
  // State for the form
  const [toolType, setToolType] = useState<CitationToolType | ''>('');
  const [apiKey, setApiKey] = useState('');
  const [userId, setUserId] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [rememberCredentials, setRememberCredentials] = useState(true);
  
  // State for collections
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  
  // Get the citation management hook
  const { 
    isLoading, 
    error, 
    getAvailableToolTypes, 
    addCitation,
    getCollections
  } = useCitationManagement();
  
  // State for available tool types
  const [availableToolTypes, setAvailableToolTypes] = useState<CitationToolType[]>([]);
  
  // Load available tool types
  useEffect(() => {
    const loadToolTypes = async () => {
      const types = await getAvailableToolTypes();
      setAvailableToolTypes(types);
    };
    
    loadToolTypes();
  }, [getAvailableToolTypes]);
  
  // Load saved credentials from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCredentials = localStorage.getItem('citationCredentials');
      
      if (savedCredentials) {
        const { toolType, apiKey, userId } = JSON.parse(savedCredentials);
        setToolType(toolType);
        setApiKey(apiKey);
        setUserId(userId);
      }
    }
  }, []);
  
  // Load collections when tool type, API key, and user ID are set
  useEffect(() => {
    const loadCollections = async () => {
      if (toolType && apiKey && userId) {
        setLoadingCollections(true);
        
        const collections = await getCollections({
          toolType,
          apiKey,
          userId
        });
        
        if (collections) {
          setCollections(collections.map(collection => ({
            id: collection.id,
            name: collection.name
          })));
        }
        
        setLoadingCollections(false);
      }
    };
    
    loadCollections();
  }, [toolType, apiKey, userId, getCollections]);
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!toolType || !apiKey || !userId) {
      return;
    }
    
    // Save credentials to localStorage if rememberCredentials is true
    if (rememberCredentials) {
      localStorage.setItem('citationCredentials', JSON.stringify({
        toolType,
        apiKey,
        userId
      }));
    }
    
    // Add the citation
    const citation = await addCitation(
      {
        toolType,
        apiKey,
        userId
      },
      publication,
      collectionId || undefined,
      notes || undefined,
      tags ? tags.split(',').map(tag => tag.trim()) : undefined
    );
    
    // Close the dialog
    setOpen(false);
    
    // Reset the form
    setCollectionId('');
    setNotes('');
    setTags('');
    
    // Call the onSuccess callback
    if (citation && onSuccess) {
      onSuccess();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize}>
          <BookPlus className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add to Citation Tool</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="toolType" className="text-right">
              Tool
            </Label>
            <Select
              value={toolType}
              onValueChange={(value) => setToolType(value as CitationToolType)}
              disabled={isLoading}
            >
              <SelectTrigger id="toolType" className="col-span-3">
                <SelectValue placeholder="Select a citation tool" />
              </SelectTrigger>
              <SelectContent>
                {availableToolTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiKey" className="text-right">
              API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="col-span-3"
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="userId" className="text-right">
              User ID
            </Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="col-span-3"
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="collection" className="text-right">
              Collection
            </Label>
            <Select
              value={collectionId}
              onValueChange={setCollectionId}
              disabled={isLoading || loadingCollections || collections.length === 0}
            >
              <SelectTrigger id="collection" className="col-span-3">
                <SelectValue placeholder={
                  loadingCollections
                    ? 'Loading collections...'
                    : collections.length === 0
                      ? 'No collections found'
                      : 'Select a collection'
                } />
              </SelectTrigger>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tags" className="text-right">
              Tags
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="col-span-3"
              placeholder="Comma-separated tags"
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-span-1"></div>
            <div className="flex items-center space-x-2 col-span-3">
              <Checkbox
                id="rememberCredentials"
                checked={rememberCredentials}
                onCheckedChange={(checked) => setRememberCredentials(checked === true)}
                disabled={isLoading}
              />
              <Label htmlFor="rememberCredentials">
                Remember credentials
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !toolType || !apiKey || !userId}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add to {toolType ? toolType.charAt(0).toUpperCase() + toolType.slice(1) : 'Citation Tool'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
