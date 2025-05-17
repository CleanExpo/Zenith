'use client';

import { useState, useEffect } from 'react';
import { UserRole } from '@/lib/auth/types';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  FileText, 
  Settings, 
  BarChart3, 
  Shield, 
  Database, 
  CreditCard,
  AlertTriangle,
  Cpu,
  RefreshCw,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalTeams: number;
  totalStorage: number;
  subscriptionStats: {
    free: number;
    basic: number;
    premium: number;
    enterprise: number;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchSystemStats();
    fetchRecentLogs();
    fetchSystemAlerts();
  }, []);

  const fetchSystemStats = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Get total users count
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      
      // Get active users (logged in within the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gt('last_sign_in_at', thirtyDaysAgo.toISOString());
      
      // Get total projects count
      const { count: totalProjects } = await supabase
        .from('research_projects')
        .select('*', { count: 'exact', head: true });
      
      // Get total teams count
      const { count: totalTeams } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true });
      
      // Get subscription stats
      const { data: subscriptionData } = await supabase
        .from('stripe.user_plans')
        .select('plan_type')
        .not('plan_type', 'is', null);
      
      const subscriptionStats = {
        free: 0,
        basic: 0,
        premium: 0,
        enterprise: 0
      };
      
      if (subscriptionData) {
        subscriptionData.forEach((sub) => {
          if (sub.plan_type && subscriptionStats.hasOwnProperty(sub.plan_type)) {
            subscriptionStats[sub.plan_type as keyof typeof subscriptionStats]++;
          }
        });
      }
      
      // Calculate free users (total users - paid users)
      const paidUsers = subscriptionStats.basic + subscriptionStats.premium + subscriptionStats.enterprise;
      subscriptionStats.free = (totalUsers || 0) - paidUsers;
      
      // Get total storage used (in MB)
      const { data: storageData } = await supabase
        .from('storage.objects')
        .select('metadata');
      
      let totalStorage = 0;
      if (storageData) {
        storageData.forEach((obj) => {
          if (obj.metadata && obj.metadata.size) {
            totalStorage += parseInt(obj.metadata.size, 10);
          }
        });
      }
      
      // Convert bytes to MB
      totalStorage = Math.round(totalStorage / (1024 * 1024));
      
      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalProjects: totalProjects || 0,
        totalTeams: totalTeams || 0,
        totalStorage,
        subscriptionStats
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const supabase = createClient();
      
      const { data } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user_profiles:user_id (
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (data) {
        const transformedData = data.map(log => ({
          ...log,
          user_email: log.user_profiles?.email || 'Unknown',
        }));
        
        setRecentLogs(transformedData);
      }
    } catch (error) {
      console.error('Error fetching recent logs:', error);
    }
  };

  const fetchSystemAlerts = async () => {
    try {
      // This would typically come from a monitoring service
      // For now, we'll simulate some alerts
      setAlerts([
        {
          id: 1,
          severity: 'low',
          message: 'Storage usage approaching 80% of quota',
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          severity: 'medium',
          message: 'API rate limit reached for endpoint /api/research-projects',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error fetching system alerts:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300';
      case 'medium':
        return 'text-amber-500 bg-amber-100 dark:bg-amber-900 dark:text-amber-300';
      case 'low':
        return 'text-blue-500 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <PermissionGuard role={UserRole.ADMIN} fallback={<AccessDenied />}>
      <div className="container mx-auto py-8">
        <div className="flex flex-col space-y-2 mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage and monitor your Zenith platform</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in fade-in-50 duration-500">
          <StatsCard
            title="Total Users"
            value={stats?.totalUsers.toString() || '-'}
            description={`${stats?.activeUsers || 0} active in last 30 days`}
            icon={<Users className="h-5 w-5" />}
            loading={loading}
          />
          
          <StatsCard
            title="Total Projects"
            value={stats?.totalProjects.toString() || '-'}
            description={`Across ${stats?.totalTeams || 0} teams`}
            icon={<FileText className="h-5 w-5" />}
            loading={loading}
          />
          
          <StatsCard
            title="Storage Used"
            value={`${stats?.totalStorage || 0} MB`}
            description="Total storage consumption"
            icon={<Database className="h-5 w-5" />}
            loading={loading}
          />
          
          <StatsCard
            title="Paid Subscriptions"
            value={stats ? (stats.subscriptionStats.basic + stats.subscriptionStats.premium + stats.subscriptionStats.enterprise).toString() : '-'}
            description={`${stats?.subscriptionStats.free || 0} free users`}
            icon={<CreditCard className="h-5 w-5" />}
            loading={loading}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-in fade-in-50 duration-500 delay-200">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>Key metrics and management tools</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="users">
                  <TabsList className="mb-4">
                    <TabsTrigger value="users" className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Users
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Audit Logs
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Security
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="users">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">User Management</h3>
                        <Button asChild>
                          <Link href="/dashboard/admin/users">View All Users</Link>
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Subscription Distribution</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {loading ? (
                              <LoadingSkeleton className="h-24 w-full" />
                            ) : (
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Free</span>
                                  <span>{stats?.subscriptionStats.free || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Basic</span>
                                  <span>{stats?.subscriptionStats.basic || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Premium</span>
                                  <span>{stats?.subscriptionStats.premium || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Enterprise</span>
                                  <span>{stats?.subscriptionStats.enterprise || 0}</span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">User Actions</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <Button variant="outline" className="w-full justify-start" asChild>
                                <Link href="/dashboard/admin/users">
                                  Manage Users
                                </Link>
                              </Button>
                              <Button variant="outline" className="w-full justify-start" asChild>
                                <Link href="/dashboard/admin/users?filter=inactive">
                                  View Inactive Users
                                </Link>
                              </Button>
                              <Button variant="outline" className="w-full justify-start" asChild>
                                <Link href="/dashboard/admin/users?filter=admins">
                                  Manage Administrators
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="logs">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Recent Activity</h3>
                        <Button asChild>
                          <Link href="/dashboard/admin/audit-logs">View All Logs</Link>
                        </Button>
                      </div>
                      
                      <div className="border rounded-md">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resource</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {recentLogs.length > 0 ? (
                              recentLogs.map((log) => (
                                <tr key={log.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {formatDate(log.created_at)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {log.user_email}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {log.action}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {log.resource_type}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                  No recent logs found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="security">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Security Overview</h3>
                        <Button variant="outline">Run Security Scan</Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Authentication</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>MFA Enabled Users</span>
                                <span>12</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Failed Login Attempts (24h)</span>
                                <span>3</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Password Resets (24h)</span>
                                <span>2</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Security Actions</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <Button variant="outline" className="w-full justify-start">
                                Configure MFA Settings
                              </Button>
                              <Button variant="outline" className="w-full justify-start">
                                Manage API Keys
                              </Button>
                              <Button variant="outline" className="w-full justify-start">
                                Review Security Policies
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="settings">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">System Settings</h3>
                        <Button variant="outline">Save Changes</Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">General Settings</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <Button variant="outline" className="w-full justify-start">
                                System Configuration
                              </Button>
                              <Button variant="outline" className="w-full justify-start">
                                Email Templates
                              </Button>
                              <Button variant="outline" className="w-full justify-start">
                                Notification Settings
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Advanced Settings</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <Button variant="outline" className="w-full justify-start">
                                API Configuration
                              </Button>
                              <Button variant="outline" className="w-full justify-start">
                                Storage Settings
                              </Button>
                              <Button variant="outline" className="w-full justify-start">
                                Database Management
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                  System Alerts
                </CardTitle>
                <CardDescription>Recent system notifications and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length > 0 ? (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`p-3 rounded-md ${getSeverityColor(alert.severity)}`}
                      >
                        <div className="font-medium">{alert.message}</div>
                        <div className="text-xs mt-1">{formatDate(alert.timestamp)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No alerts at this time</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View All Alerts</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in-50 duration-500 delay-300">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Analytics Overview
              </CardTitle>
              <CardDescription>System performance and usage metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>API Requests (24h)</span>
                    <span>12,458</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Database Queries (24h)</span>
                    <span>45,872</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Storage Operations (24h)</span>
                    <span>2,341</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Authentication Events (24h)</span>
                    <span>876</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View Detailed Analytics</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="bg-gradient-to-r from-muted/50 to-card rounded-t-lg">
              <CardTitle className="flex items-center">
                <span className="bg-primary text-primary-foreground p-1 rounded-md mr-2">
                  <Cpu className="h-4 w-4" />
                </span>
                Quick Actions
              </CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors" asChild>
                  <Link href="/dashboard/admin/users">
                    <Users className="h-6 w-6 mb-2" />
                    <span>Manage Users</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors" asChild>
                  <Link href="/dashboard/admin/audit-logs">
                    <FileText className="h-6 w-6 mb-2" />
                    <span>View Audit Logs</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors" asChild>
                  <Link href="/dashboard/admin/settings">
                    <Settings className="h-6 w-6 mb-2" />
                    <span>System Settings</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors" asChild>
                  <Link href="/dashboard/admin/security">
                    <Shield className="h-6 w-6 mb-2" />
                    <span>Security Center</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors" asChild>
                  <Link href="/dashboard/admin/database">
                    <Database className="h-6 w-6 mb-2" />
                    <span>Database Tools</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors" asChild>
                  <Link href="/dashboard/admin/monitoring">
                    <BarChart3 className="h-6 w-6 mb-2" />
                    <span>System Monitoring</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors" asChild>
                  <Link href="/dashboard/admin/cache">
                    <RefreshCw className="h-6 w-6 mb-2" />
                    <span>Cache Monitoring</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors" asChild>
                  <Link href="/dashboard/admin/jobs">
                    <Clock className="h-6 w-6 mb-2" />
                    <span>Job Queue</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  loading?: boolean;
}

function StatsCard({ title, value, description, icon, loading = false }: StatsCardProps) {
  return (
    <Card className="overflow-hidden border-muted-foreground/20 hover:border-primary/50 transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-muted/30 to-card">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="p-1.5 bg-primary/10 rounded-full">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <LoadingSkeleton className="h-7 w-20 mb-1" />
        ) : (
          <div className="text-2xl font-bold animate-in fade-in-50 slide-in-from-bottom-3 duration-500">{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function AccessDenied() {
  return (
    <div className="container mx-auto py-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
      <p className="mb-6">You do not have permission to access this page.</p>
      <Button asChild>
        <a href="/dashboard">Return to Dashboard</a>
      </Button>
    </div>
  );
}
