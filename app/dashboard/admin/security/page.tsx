'use client';

import { useState, useEffect } from 'react';
import { UserRole } from '@/lib/auth/types';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Lock, 
  Key, 
  AlertTriangle, 
  UserCheck, 
  FileText,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import Link from 'next/link';

interface SecurityStats {
  mfaEnabledUsers: number;
  totalUsers: number;
  failedLoginAttempts: number;
  passwordResets: number;
  apiKeyCount: number;
  vulnerabilities: {
    high: number;
    medium: number;
    low: number;
  };
}

export default function AdminSecurityPage() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchSecurityStats();
    fetchSecurityLogs();
  }, []);

  const fetchSecurityStats = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // In a real application, these would be actual database queries
      // For demonstration, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      setStats({
        mfaEnabledUsers: 12,
        totalUsers: 150,
        failedLoginAttempts: 8,
        passwordResets: 3,
        apiKeyCount: 5,
        vulnerabilities: {
          high: 0,
          medium: 2,
          low: 5
        }
      });
    } catch (error) {
      console.error('Error fetching security stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch security statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityLogs = async () => {
    try {
      const supabase = createClient();
      
      // In a real application, this would fetch from a security logs table
      // For demonstration, we'll use mock data
      setSecurityLogs([
        {
          id: 1,
          event: 'Failed login attempt',
          user: 'user@example.com',
          ip: '192.168.1.1',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          details: 'Invalid password'
        },
        {
          id: 2,
          event: 'Password reset',
          user: 'admin@example.com',
          ip: '192.168.1.2',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          details: 'Password reset requested'
        },
        {
          id: 3,
          event: 'MFA enabled',
          user: 'user2@example.com',
          ip: '192.168.1.3',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          details: 'Multi-factor authentication enabled'
        },
        {
          id: 4,
          event: 'API key created',
          user: 'admin@example.com',
          ip: '192.168.1.2',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          details: 'New API key created'
        },
        {
          id: 5,
          event: 'Failed login attempt',
          user: 'unknown@example.com',
          ip: '192.168.1.4',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          details: 'User not found'
        }
      ]);
    } catch (error) {
      console.error('Error fetching security logs:', error);
    }
  };

  const runSecurityScan = async () => {
    setScanning(true);
    try {
      // In a real application, this would trigger a security scan
      // For demonstration, we'll simulate a scan
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate scan duration
      
      toast({
        title: 'Security Scan Complete',
        description: 'Security scan completed successfully',
      });
      
      // Update stats with new vulnerabilities
      if (stats) {
        setStats({
          ...stats,
          vulnerabilities: {
            high: 0,
            medium: 2,
            low: 5
          }
        });
      }
    } catch (error) {
      console.error('Error running security scan:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete security scan',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getVulnerabilityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-amber-500';
      case 'low':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <PermissionGuard role={UserRole.ADMIN} fallback={<AccessDenied />}>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Security Center</h1>
          <Button 
            onClick={runSecurityScan} 
            disabled={scanning}
            className="flex items-center"
          >
            {scanning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            Run Security Scan
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SecurityCard
            title="MFA Adoption"
            value={stats ? `${Math.round((stats.mfaEnabledUsers / stats.totalUsers) * 100)}%` : '-'}
            description={`${stats?.mfaEnabledUsers || 0} of ${stats?.totalUsers || 0} users`}
            icon={<UserCheck className="h-5 w-5" />}
            loading={loading}
          />
          
          <SecurityCard
            title="Failed Logins (24h)"
            value={stats?.failedLoginAttempts.toString() || '-'}
            description="Unsuccessful login attempts"
            icon={<Lock className="h-5 w-5" />}
            loading={loading}
            status={stats && stats.failedLoginAttempts > 5 ? 'warning' : 'good'}
          />
          
          <SecurityCard
            title="API Keys"
            value={stats?.apiKeyCount.toString() || '-'}
            description="Active API keys"
            icon={<Key className="h-5 w-5" />}
            loading={loading}
          />
          
          <SecurityCard
            title="Vulnerabilities"
            value={stats ? (stats.vulnerabilities.high + stats.vulnerabilities.medium + stats.vulnerabilities.low).toString() : '-'}
            description={stats ? `${stats.vulnerabilities.high} high, ${stats.vulnerabilities.medium} medium, ${stats.vulnerabilities.low} low` : ''}
            icon={<AlertTriangle className="h-5 w-5" />}
            loading={loading}
            status={stats && stats.vulnerabilities.high > 0 ? 'critical' : stats && stats.vulnerabilities.medium > 0 ? 'warning' : 'good'}
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="authentication" className="flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              Authentication
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center">
              <Key className="h-4 w-4 mr-2" />
              API Security
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Security Logs
            </TabsTrigger>
          </TabsList>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Status</CardTitle>
                      <CardDescription>
                        Overall security status and recommendations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Overall Security Score</span>
                          <span className="font-bold text-green-500">85/100</span>
                        </div>
                        
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        
                        <div className="pt-4">
                          <h3 className="font-medium mb-2">Recommendations</h3>
                          <ul className="space-y-2">
                            <li className="flex items-start">
                              <AlertTriangle className="h-5 w-5 mr-2 text-amber-500 flex-shrink-0 mt-0.5" />
                              <span>Increase MFA adoption among users (currently at {stats ? Math.round((stats.mfaEnabledUsers / stats.totalUsers) * 100) : 0}%)</span>
                            </li>
                            <li className="flex items-start">
                              <AlertTriangle className="h-5 w-5 mr-2 text-amber-500 flex-shrink-0 mt-0.5" />
                              <span>Address {stats?.vulnerabilities.medium || 0} medium severity vulnerabilities</span>
                            </li>
                            <li className="flex items-start">
                              <AlertTriangle className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                              <span>Review and rotate API keys (last rotation: 45 days ago)</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/dashboard/admin/security/vulnerabilities">
                          View All Vulnerabilities
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Security Events</CardTitle>
                      <CardDescription>
                        Latest security-related activities
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {securityLogs.slice(0, 3).map((log) => (
                          <div key={log.id} className="border-b pb-3 last:border-0">
                            <div className="flex justify-between">
                              <span className="font-medium">{log.event}</span>
                              <span className="text-sm text-muted-foreground">{formatDate(log.timestamp)}</span>
                            </div>
                            <div className="text-sm mt-1">User: {log.user}</div>
                            <div className="text-sm text-muted-foreground">IP: {log.ip}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" onClick={() => setActiveTab('logs')}>
                        View All Security Logs
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="authentication">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Authentication Settings</CardTitle>
                      <CardDescription>
                        Configure authentication security settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Password Requirements</div>
                          <div className="text-sm text-muted-foreground">Minimum 8 characters, uppercase, number, symbol</div>
                        </div>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Multi-Factor Authentication</div>
                          <div className="text-sm text-muted-foreground">Optional for all users</div>
                        </div>
                        <Button variant="outline" size="sm">Configure</Button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Session Timeout</div>
                          <div className="text-sm text-muted-foreground">60 minutes of inactivity</div>
                        </div>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Login Attempts</div>
                          <div className="text-sm text-muted-foreground">5 attempts before lockout (10 minutes)</div>
                        </div>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>MFA Status</CardTitle>
                      <CardDescription>
                        Multi-factor authentication adoption
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>MFA Adoption Rate</span>
                          <span className="font-bold">{stats ? Math.round((stats.mfaEnabledUsers / stats.totalUsers) * 100) : 0}%</span>
                        </div>
                        
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              stats && (stats.mfaEnabledUsers / stats.totalUsers) >= 0.8 ? 'bg-green-500' : 
                              stats && (stats.mfaEnabledUsers / stats.totalUsers) >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
                            }`} 
                            style={{ width: `${stats ? (stats.mfaEnabledUsers / stats.totalUsers) * 100 : 0}%` }}
                          ></div>
                        </div>
                        
                        <div className="pt-4 space-y-2">
                          <div className="flex justify-between">
                            <span>Users with MFA</span>
                            <span>{stats?.mfaEnabledUsers || 0}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span>Users without MFA</span>
                            <span>{stats ? stats.totalUsers - stats.mfaEnabledUsers : 0}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span>Admin users with MFA</span>
                            <span>3/3 (100%)</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        Require MFA for All Users
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="api">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>API Security</CardTitle>
                      <CardDescription>
                        API keys and access management
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">Active API Keys</div>
                            <div className="text-sm text-muted-foreground">{stats?.apiKeyCount || 0} keys in use</div>
                          </div>
                          <Button variant="outline" size="sm">Manage Keys</Button>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">API Rate Limiting</div>
                            <div className="text-sm text-muted-foreground">100 requests per minute per key</div>
                          </div>
                          <Button variant="outline" size="sm">Configure</Button>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">API Key Expiration</div>
                            <div className="text-sm text-muted-foreground">90 days (automatic rotation)</div>
                          </div>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">API Access Logs</div>
                            <div className="text-sm text-muted-foreground">Retained for 30 days</div>
                          </div>
                          <Button variant="outline" size="sm">View Logs</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>API Keys</CardTitle>
                      <CardDescription>
                        Active API keys and their status
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border-b pb-3">
                          <div className="flex justify-between">
                            <span className="font-medium">Main API Key</span>
                            <span className="text-sm text-amber-500">Expires in 15 days</span>
                          </div>
                          <div className="text-sm mt-1">Created by: admin@example.com</div>
                          <div className="text-sm text-muted-foreground">Last used: 2 hours ago</div>
                        </div>
                        
                        <div className="border-b pb-3">
                          <div className="flex justify-between">
                            <span className="font-medium">Analytics API Key</span>
                            <span className="text-sm text-green-500">Expires in 45 days</span>
                          </div>
                          <div className="text-sm mt-1">Created by: admin@example.com</div>
                          <div className="text-sm text-muted-foreground">Last used: 1 day ago</div>
                        </div>
                        
                        <div className="border-b pb-3">
                          <div className="flex justify-between">
                            <span className="font-medium">Integration API Key</span>
                            <span className="text-sm text-green-500">Expires in 60 days</span>
                          </div>
                          <div className="text-sm mt-1">Created by: admin@example.com</div>
                          <div className="text-sm text-muted-foreground">Last used: 3 days ago</div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        Create New API Key
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="logs">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Logs</CardTitle>
                    <CardDescription>
                      Recent security-related events and activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP Address</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {securityLogs.length > 0 ? (
                            securityLogs.map((log) => (
                              <tr key={log.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {formatDate(log.timestamp)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {log.event}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {log.user}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {log.ip}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {log.details}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                No security logs found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">
                      Export Logs
                    </Button>
                    <Button variant="outline">
                      Clear Filters
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </PermissionGuard>
  );
}

interface SecurityCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  loading?: boolean;
  status?: 'good' | 'warning' | 'critical';
}

function SecurityCard({ title, value, description, icon, loading = false, status = 'good' }: SecurityCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'critical':
        return 'text-red-500';
      case 'warning':
        return 'text-amber-500';
      case 'good':
      default:
        return 'text-green-500';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSkeleton className="h-7 w-20 mb-1" />
        ) : (
          <div className={`text-2xl font-bold ${getStatusColor()}`}>{value}</div>
        )}
        <p className="text-xs text-muted-foreground">{description}</p>
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
