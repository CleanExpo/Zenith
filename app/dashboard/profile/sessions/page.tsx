'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, formatDistanceToNow } from 'date-fns';

interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent?: string;
  ip?: string;
  current: boolean;
}

export default function SessionsPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTerminating, setIsTerminating] = useState(false);
  
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!currentSession) {
          toast.error('You are not authenticated');
          router.push('/auth/login');
          return;
        }
        
        // For demonstration purposes, we'll create mock sessions since Supabase doesn't
        // provide an API to list all sessions for a user
        // In a real implementation, you would use a backend API to get this information
        const mockSessions: Session[] = [
          {
            id: currentSession.access_token,
            // Use a fallback date for created_at since it might not be available in the session
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_agent: navigator.userAgent,
            ip: '127.0.0.1', // This would be the real IP in a production environment
            current: true,
          },
          {
            id: 'mock-session-1',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
            ip: '192.168.1.1',
            current: false,
          },
          {
            id: 'mock-session-2',
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            ip: '192.168.1.2',
            current: false,
          },
        ];
        
        setSessions(mockSessions);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        toast.error('Failed to load sessions');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSessions();
  }, [router, supabase.auth]);

  const handleTerminateSession = async (sessionId: string) => {
    // Skip terminating the current session
    const session = sessions.find(s => s.id === sessionId);
    if (session?.current) {
      toast.error('You cannot terminate your current session from here');
      return;
    }
    
    setIsTerminating(true);
    
    try {
      // In a real implementation, you would call a backend API to terminate the session
      // For demonstration purposes, we'll just remove it from the local state
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      toast.success('Session terminated successfully');
    } catch (error) {
      console.error('Error terminating session:', error);
      toast.error('Failed to terminate session');
    } finally {
      setIsTerminating(false);
    }
  };

  const handleTerminateAllSessions = async () => {
    setIsTerminating(true);
    
    try {
      // In a real implementation, you would call a backend API to terminate all sessions
      // For demonstration purposes, we'll just keep the current session
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update local state
      setSessions(prev => prev.filter(s => s.current));
      
      toast.success('All other sessions terminated successfully');
    } catch (error) {
      console.error('Error terminating all sessions:', error);
      toast.error('Failed to terminate sessions');
    } finally {
      setIsTerminating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const getDeviceInfo = (userAgent: string = '') => {
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      return { device: 'iOS Device', icon: '📱' };
    } else if (userAgent.includes('Android')) {
      return { device: 'Android Device', icon: '📱' };
    } else if (userAgent.includes('Windows')) {
      return { device: 'Windows PC', icon: '💻' };
    } else if (userAgent.includes('Mac OS')) {
      return { device: 'Mac', icon: '💻' };
    } else if (userAgent.includes('Linux')) {
      return { device: 'Linux', icon: '💻' };
    } else {
      return { device: 'Unknown Device', icon: '🖥️' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Session Management</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/profile')}
        >
          Back to Profile
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            These are the devices where you're currently logged in. You can review and manage your active sessions.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {sessions.length === 0 ? (
            <div className="rounded-md bg-gray-50 p-4 text-center">
              <p className="text-gray-600">No active sessions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => {
                const { device, icon } = getDeviceInfo(session.user_agent);
                return (
                  <div 
                    key={session.id} 
                    className={`rounded-lg border p-4 ${session.current ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="text-2xl">{icon}</div>
                        <div>
                          <div className="flex items-center">
                            <h3 className="font-medium">{device}</h3>
                            {session.current && (
                              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                Current Session
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {session.ip} • Last active {formatDistanceToNow(new Date(session.updated_at))} ago
                          </p>
                          <p className="text-xs text-gray-400">
                            Created on {format(new Date(session.created_at), 'PPP')}
                          </p>
                        </div>
                      </div>
                      
                      {!session.current && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleTerminateSession(session.id)}
                          disabled={isTerminating}
                        >
                          {isTerminating ? 'Terminating...' : 'Terminate'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleTerminateAllSessions}
            disabled={isTerminating || sessions.length <= 1}
          >
            {isTerminating ? 'Terminating...' : 'Terminate All Other Sessions'}
          </Button>
          
          <Button 
            variant="destructive"
            onClick={handleSignOut}
          >
            Sign Out Everywhere
          </Button>
        </CardFooter>
      </Card>
      
      <Alert>
        <AlertTitle>Session Security</AlertTitle>
        <AlertDescription>
          <p className="mb-2">
            For security reasons, we recommend terminating sessions on devices you no longer use or don't recognize.
          </p>
          <ul className="list-inside list-disc text-sm">
            <li>Sessions automatically expire after 7 days of inactivity</li>
            <li>Changing your password will terminate all sessions except the current one</li>
            <li>If you suspect unauthorized access, terminate all sessions and change your password immediately</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
