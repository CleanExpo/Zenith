'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Notification, collaborationService } from '@/lib/services/collaborationService';
import { logger } from '@/lib/logger';

// Extended interface to include invitation token in metadata
interface ExtendedNotification extends Notification {
  metadata?: {
    invitation_token?: string;
    [key: string]: any;
  };
}

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<ExtendedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await collaborationService.getUserNotifications(10, 0);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
      logger.info('Fetched user notifications', { count: data.length });
    } catch (error: any) {
      logger.error('Error fetching notifications', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await collaborationService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      logger.info('Marked notification as read', { notificationId });
    } catch (error: any) {
      logger.error('Error marking notification as read', { error: error.message });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await collaborationService.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      logger.info('Marked all notifications as read');
    } catch (error: any) {
      logger.error('Error marking all notifications as read', { error: error.message });
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await collaborationService.deleteNotification(notificationId);
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      logger.info('Deleted notification', { notificationId });
    } catch (error: any) {
      logger.error('Error deleting notification', { error: error.message });
    }
  };

  const handleAcceptInvitation = async (invitationToken: string, notificationId: string) => {
    try {
      const success = await collaborationService.acceptProjectInvitation(invitationToken);
      if (success) {
        toast({
          title: 'Invitation accepted',
          description: 'You have successfully joined the project.',
        });
        await handleDeleteNotification(notificationId);
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to accept invitation. It may have expired.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      logger.error('Error accepting invitation', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to accept invitation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeclineInvitation = async (invitationToken: string, notificationId: string) => {
    try {
      const success = await collaborationService.declineProjectInvitation(invitationToken);
      if (success) {
        toast({
          title: 'Invitation declined',
          description: 'You have declined the project invitation.',
        });
        await handleDeleteNotification(notificationId);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to decline invitation. It may have expired.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      logger.error('Error declining invitation', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to decline invitation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read when clicked
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate to the link if provided
    if (notification.link) {
      router.push(notification.link);
      setOpen(false);
    }
  };

  const getFormattedTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No notifications</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 border-b last:border-0 ${!notification.is_read ? 'bg-muted/50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      {notification.sender ? (
                        <>
                          <AvatarImage 
                            src={notification.sender.avatar_url} 
                            alt={notification.sender.display_name || notification.sender.email || 'User'} 
                          />
                          <AvatarFallback>
                            {(notification.sender.display_name || notification.sender.email || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </>
                      ) : (
                        <AvatarFallback>Z</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div 
                        className="text-sm font-medium cursor-pointer hover:underline"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {notification.title}
                      </div>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      
      {notification.type === 'invitation' && notification.metadata?.invitation_token && (
        <div className="flex space-x-2 mt-2">
          <Button 
            size="sm" 
            variant="default" 
            className="h-7 text-xs"
            onClick={() => handleAcceptInvitation(notification.metadata!.invitation_token!, notification.id)}
          >
            Accept
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 text-xs"
            onClick={() => handleDeclineInvitation(notification.metadata!.invitation_token!, notification.id)}
          >
            Decline
          </Button>
        </div>
      )}
                      
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {getFormattedTime(notification.created_at)}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => handleDeleteNotification(notification.id)}
                        >
                          <span className="sr-only">Delete</span>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="text-muted-foreground"
                          >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
