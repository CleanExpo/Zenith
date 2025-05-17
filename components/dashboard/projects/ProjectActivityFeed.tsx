'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  FileText, 
  CheckSquare, 
  MessageSquare, 
  Upload, 
  Edit, 
  Trash2, 
  Plus, 
  UserPlus, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { collaborationService, ActivityLog } from '@/lib/services/collaborationService';
import { logger } from '@/lib/logger';

interface ProjectActivityFeedProps {
  projectId: string;
}

export default function ProjectActivityFeed({ projectId }: ProjectActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  const loadActivities = async (pageNumber = 0, append = false) => {
    try {
      setIsLoading(true);
      const offset = pageNumber * pageSize;
      const data = await collaborationService.getProjectActivityLogs(projectId, pageSize, offset);
      
      if (append) {
        setActivities(prev => [...prev, ...data]);
      } else {
        setActivities(data);
      }
      
      setHasMore(data.length === pageSize);
      logger.info('Loaded project activities', { count: data.length, page: pageNumber });
    } catch (error: any) {
      logger.error('Error loading project activities', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [projectId]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadActivities(nextPage, true);
  };

  const getActivityIcon = (activity: ActivityLog) => {
    const { action_type, entity_type } = activity;
    
    if (action_type === 'create') {
      if (entity_type === 'project') return <Plus className="h-4 w-4 text-green-500" />;
      if (entity_type === 'task') return <CheckSquare className="h-4 w-4 text-green-500" />;
      if (entity_type === 'note') return <FileText className="h-4 w-4 text-green-500" />;
      if (entity_type === 'file') return <Upload className="h-4 w-4 text-green-500" />;
      if (entity_type === 'comment') return <MessageSquare className="h-4 w-4 text-green-500" />;
      if (entity_type === 'collaborator') return <UserPlus className="h-4 w-4 text-green-500" />;
    }
    
    if (action_type === 'update') {
      if (entity_type === 'project') return <Edit className="h-4 w-4 text-blue-500" />;
      if (entity_type === 'task') return <RefreshCw className="h-4 w-4 text-blue-500" />;
      if (entity_type === 'note') return <Edit className="h-4 w-4 text-blue-500" />;
      if (entity_type === 'file') return <Edit className="h-4 w-4 text-blue-500" />;
      if (entity_type === 'comment') return <Edit className="h-4 w-4 text-blue-500" />;
      if (entity_type === 'collaborator') return <RefreshCw className="h-4 w-4 text-blue-500" />;
    }
    
    if (action_type === 'delete') {
      return <Trash2 className="h-4 w-4 text-red-500" />;
    }
    
    if (action_type === 'invite') {
      return <UserPlus className="h-4 w-4 text-purple-500" />;
    }
    
    if (action_type === 'accept_invitation') {
      return <UserPlus className="h-4 w-4 text-green-500" />;
    }
    
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getActivityDescription = (activity: ActivityLog) => {
    const { action_type, entity_type, details } = activity;
    const userName = activity.user?.display_name || activity.user?.email || 'A user';
    
    if (action_type === 'create') {
      if (entity_type === 'project') return `${userName} created this project`;
      if (entity_type === 'task') return `${userName} created task "${details?.title || 'Untitled'}"`;
      if (entity_type === 'note') return `${userName} added note "${details?.title || 'Untitled'}"`;
      if (entity_type === 'file') return `${userName} uploaded file "${details?.file_name || 'Untitled'}"`;
      if (entity_type === 'comment') return `${userName} commented on ${details?.entity_type || 'item'}`;
      if (entity_type === 'collaborator') return `${userName} was added as a collaborator`;
    }
    
    if (action_type === 'update') {
      if (entity_type === 'project') return `${userName} updated project details`;
      if (entity_type === 'task') return `${userName} updated task "${details?.title || 'Untitled'}"`;
      if (entity_type === 'note') return `${userName} edited note "${details?.title || 'Untitled'}"`;
      if (entity_type === 'file') return `${userName} updated file "${details?.file_name || 'Untitled'}"`;
      if (entity_type === 'comment') return `${userName} edited a comment`;
      if (entity_type === 'collaborator') {
        if (details?.old_role && details?.new_role) {
          return `${userName} changed ${details?.user_id === activity.user_id ? 'their' : 'a user\'s'} role from ${details.old_role} to ${details.new_role}`;
        }
        return `${userName} updated a collaborator's settings`;
      }
    }
    
    if (action_type === 'delete') {
      if (entity_type === 'task') return `${userName} deleted a task`;
      if (entity_type === 'note') return `${userName} deleted a note`;
      if (entity_type === 'file') return `${userName} deleted a file`;
      if (entity_type === 'comment') return `${userName} deleted a comment`;
      if (entity_type === 'collaborator') return `${userName} removed a collaborator`;
    }
    
    if (action_type === 'invite') {
      return `${userName} invited ${details?.email || 'someone'} to collaborate as ${details?.role || 'a collaborator'}`;
    }
    
    if (action_type === 'accept_invitation') {
      return `${userName} accepted an invitation to collaborate`;
    }
    
    return `${userName} performed an action on the project`;
  };

  const getFormattedTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  const getEntityTypeBadge = (entityType: string) => {
    let color = '';
    let label = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    
    switch (entityType) {
      case 'project':
        color = 'bg-blue-500 hover:bg-blue-600';
        break;
      case 'task':
        color = 'bg-green-500 hover:bg-green-600';
        break;
      case 'note':
        color = 'bg-amber-500 hover:bg-amber-600';
        break;
      case 'file':
        color = 'bg-purple-500 hover:bg-purple-600';
        break;
      case 'comment':
        color = 'bg-pink-500 hover:bg-pink-600';
        break;
      case 'collaborator':
        color = 'bg-indigo-500 hover:bg-indigo-600';
        break;
      default:
        color = 'bg-gray-500 hover:bg-gray-600';
    }
    
    return (
      <Badge variant="secondary" className={`text-xs ${color}`}>
        {label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center">
          <Activity className="mr-2 h-5 w-5" />
          Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && activities.length === 0 ? (
          <div className="space-y-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No activity recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b last:border-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={activity.user?.avatar_url} 
                    alt={activity.user?.display_name || activity.user?.email || 'User'} 
                  />
                  <AvatarFallback>
                    {(activity.user?.display_name || activity.user?.email || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getActivityIcon(activity)}
                      <span className="text-sm font-medium">{getActivityDescription(activity)}</span>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{getFormattedTime(activity.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getEntityTypeBadge(activity.entity_type)}
                    {activity.details?.content_preview && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {activity.details.content_preview}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {hasMore && (
              <div className="pt-2 text-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
