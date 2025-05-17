'use client';

import { SearchResult } from '@/lib/services/searchService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { File, FileText, Folder, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SearchResultItemProps {
  result: SearchResult;
}

export function SearchResultItem({ result }: SearchResultItemProps) {
  const getTypeIcon = () => {
    switch (result.type) {
      case 'project':
        return <Folder className="h-4 w-4 text-blue-500" />;
      case 'task':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'note':
        return <FileText className="h-4 w-4 text-amber-500" />;
      case 'file':
        return <File className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getTypeLabel = () => {
    switch (result.type) {
      case 'project':
        return 'Project';
      case 'task':
        return 'Task';
      case 'note':
        return 'Note';
      case 'file':
        return 'File';
      default:
        return 'Item';
    }
  };

  const getFormattedDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <Link href={result.url} className="block">
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="flex items-center gap-1 px-2 py-0 h-5">
                  {getTypeIcon()}
                  <span>{getTypeLabel()}</span>
                </Badge>
                {result.project_title && result.type !== 'project' && (
                  <span className="text-xs text-muted-foreground truncate">
                    in {result.project_title}
                  </span>
                )}
              </div>
              <h3 className="font-medium truncate">{result.title}</h3>
              {result.match_details && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {result.match_details}
                </p>
              )}
            </div>
            <div className="flex items-center text-xs text-muted-foreground ml-4">
              <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
              <span>{getFormattedDate(result.updated_at || result.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
