'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { exportService } from '@/lib/services/exportService';
import { toast } from '@/components/ui/use-toast';
import { Upload, FileUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ImportProjectDialog() {
  const [open, setOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Check if file is JSON
      if (selectedFile.type !== 'application/json' && !selectedFile.name.endsWith('.json')) {
        toast({
          title: 'Invalid file format',
          description: 'Please select a JSON file exported from Zenith.',
          variant: 'destructive',
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to import.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsImporting(true);
      
      const projectId = await exportService.importProjectFromJson(file);
      
      toast({
        title: 'Import successful',
        description: 'Project has been imported successfully.',
      });
      
      setOpen(false);
      
      // Navigate to the new project
      router.push(`/dashboard/projects/${projectId}`);
    } catch (error: any) {
      toast({
        title: 'Import failed',
        description: error.message || 'An error occurred during import.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Project</DialogTitle>
          <DialogDescription>
            Import a project from a previously exported JSON file.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Project File (JSON)</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                id="file"
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={handleBrowseClick}
                className="flex-1"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Browse...
              </Button>
            </div>
            {file && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected file: {file.name}
              </p>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Note: This will create a new project based on the imported data.</p>
            <p>The original project will not be modified.</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || isImporting}>
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
