'use client';

import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { exportService } from '@/lib/services/exportService';
import { toast } from '@/components/ui/use-toast';
import { Download } from 'lucide-react';

interface ExportProjectDialogProps {
  projectId: string;
  projectTitle: string;
}

export function ExportProjectDialog({ projectId, projectTitle }: ExportProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [options, setOptions] = useState({
    includeTasks: true,
    includeNotes: true,
    includeFiles: false,
    includeComments: false,
    includeAnalytics: false,
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      switch (format) {
        case 'json':
          await exportService.exportProjectToJson(projectId, options);
          break;
        case 'csv':
          await exportService.exportProjectToCsv(projectId, options);
          break;
        case 'pdf':
          await exportService.exportProjectToPdf(projectId, options);
          break;
      }
      
      toast({
        title: 'Export successful',
        description: `Project "${projectTitle}" has been exported as ${format.toUpperCase()}.`,
      });
      
      setOpen(false);
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message || 'An error occurred during export.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Project</DialogTitle>
          <DialogDescription>
            Export your project data in various formats.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Export Format</h4>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as 'json' | 'csv' | 'pdf')}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json">JSON (Complete data)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv">CSV (Spreadsheet compatible)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf">PDF (Printable document)</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Include Data</h4>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTasks"
                  checked={options.includeTasks}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeTasks: !!checked })
                  }
                />
                <Label htmlFor="includeTasks">Tasks</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeNotes"
                  checked={options.includeNotes}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeNotes: !!checked })
                  }
                />
                <Label htmlFor="includeNotes">Notes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeFiles"
                  checked={options.includeFiles}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeFiles: !!checked })
                  }
                />
                <Label htmlFor="includeFiles">File metadata (not file contents)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeComments"
                  checked={options.includeComments}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeComments: !!checked })
                  }
                />
                <Label htmlFor="includeComments">Comments</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAnalytics"
                  checked={options.includeAnalytics}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeAnalytics: !!checked })
                  }
                />
                <Label htmlFor="includeAnalytics">Analytics summary</Label>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
