'use client';

import { useState, useEffect } from 'react';
import { UserRole } from '@/lib/auth/types';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { 
  BarChart3, 
  Activity, 
  Database, 
  Server, 
  Users, 
  RefreshCw,
  Loader2,
  Clock,
  HardDrive,
  Cpu,
  Network
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    load: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  network: {
    rx: number;
    tx: number;
    connections: number;
  };
  database: {
    connections: number;
    size: number;
    queryCount: number;
    slowQueries: number;
  };
  api: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
  };
  users: {
    activeUsers: number;
    registrationsToday: number;
    totalUsers: number;
  };
  uptime: {
    server: number;
    database: number;
    api: number;
  };
}

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  statusColor: string;
}

function MetricCard({ title, value, description, icon, statusColor }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${statusColor}`}>{value}</div>
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

// Mock data for demonstration purposes
const mockMetrics: SystemMetrics = {
  cpu: {
    usage: 32,
    cores: 8,
    load: [1.2, 1.5, 1.1],
  },
  memory: {
    total: 16384, // MB
    used: 8192, // MB
    free: 8192, // MB
    usagePercent: 50,
  },
  disk: {
    total: 512000, // MB
    used: 256000, // MB
    free: 256000, // MB
    usagePercent: 50,
  },
  network: {
    rx: 1024, // KB/s
    tx: 512, // KB/s
    connections: 42,
  },
  database: {
    connections: 15,
    size: 1024, // MB
    queryCount: 1250,
    slowQueries: 3,
  },
  api: {
    requestsPerMinute: 350,
    averageResponseTime: 120, // ms
    errorRate: 0.5, // %
  },
  users: {
    activeUsers: 78,
    registrationsToday: 12,
    totalUsers: 1250,
  },
  uptime: {
    server: 99.98,
    database: 99.99,
    api: 99.95,
  },
};

export default function AdminMonitoringPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchMetrics();

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchMetrics(false);
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  const fetchMetrics = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      // In a real application, this would fetch metrics from an API
      // For demonstration, we'll use mock data with slight variations
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

      // Add some random variations to the mock data
      const variation = () => Math.random() * 10 - 5; // -5 to +5
      const newMetrics = { ...mockMetrics };
      
      newMetrics.cpu.usage = Math.min(100, Math.max(0, mockMetrics.cpu.usage + variation()));
      newMetrics.memory.usagePercent = Math.min(100, Math.max(0, mockMetrics.memory.usagePercent + variation()));
      newMetrics.disk.usagePercent = Math.min(100, Math.max(0, mockMetrics.disk.usagePercent + variation() / 2));
      newMetrics.api.requestsPerMinute = Math.max(0, mockMetrics.api.requestsPerMinute + variation() * 10);
      newMetrics.api.averageResponseTime = Math.max(0, mockMetrics.api.averageResponseTime + variation() * 5);
      newMetrics.users.activeUsers = Math.max(0, mockMetrics.users.activeUsers + Math.round(variation()));
      
      setMetrics(newMetrics);
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch system metrics',
        variant: 'destructive',
      });
    } finally {
      if (showLoading) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const handleRefresh = () => {
    fetchMetrics(false);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatUptime = (uptime: number) => {
    return uptime.toFixed(2) + '%';
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) {
      return 'text-red-500';
    } else if (value >= thresholds.warning) {
      return 'text-amber-500';
    } else {
      return 'text-green-500';
    }
  };

  const getInverseStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value <= thresholds.critical) {
      return 'text-red-500';
    } else if (value <= thresholds.warning) {
      return 'text-amber-500';
    } else {
      return 'text-green-500';
    }
  };

  return (
    <PermissionGuard role={UserRole.ADMIN} fallback={<AccessDenied />}>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={toggleAutoRefresh}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="autoRefresh" className="text-sm">
                Auto-refresh (30s)
              </label>
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing || loading}
              variant="outline"
              className="flex items-center"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="server" className="flex items-center">
              <Server className="h-4 w-4 mr-2" />
              Server
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Database
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center">
              <Network className="h-4 w-4 mr-2" />
              API
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
          </TabsList>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <MetricCard
                    title="CPU Usage"
                    value={`${metrics?.cpu.usage.toFixed(1)}%`}
                    description={`${metrics?.cpu.cores} Cores | Load: ${metrics?.cpu.load.join(', ')}`}
                    icon={<Cpu className="h-5 w-5" />}
                    statusColor={getStatusColor(metrics?.cpu.usage || 0, { warning: 70, critical: 90 })}
                  />
                  
                  <MetricCard
                    title="Memory Usage"
                    value={`${metrics?.memory.usagePercent.toFixed(1)}%`}
                    description={`${formatBytes(metrics?.memory.used || 0)} / ${formatBytes(metrics?.memory.total || 0)}`}
                    icon={<HardDrive className="h-5 w-5" />}
                    statusColor={getStatusColor(metrics?.memory.usagePercent || 0, { warning: 80, critical: 95 })}
                  />
                  
                  <MetricCard
                    title="Disk Usage"
                    value={`${metrics?.disk.usagePercent.toFixed(1)}%`}
                    description={`${formatBytes(metrics?.disk.used || 0)} / ${formatBytes(metrics?.disk.total || 0)}`}
                    icon={<Database className="h-5 w-5" />}
                    statusColor={getStatusColor(metrics?.disk.usagePercent || 0, { warning: 80, critical: 95 })}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <MetricCard
                    title="API Requests"
                    value={`${Math.round(metrics?.api.requestsPerMinute || 0)}/min`}
                    description={`Avg Response: ${metrics?.api.averageResponseTime.toFixed(0)} ms`}
                    icon={<Activity className="h-5 w-5" />}
                    statusColor={getStatusColor(metrics?.api.averageResponseTime || 0, { warning: 200, critical: 500 })}
                  />
                  
                  <MetricCard
                    title="Active Users"
                    value={`${metrics?.users.activeUsers}`}
                    description={`${metrics?.users.registrationsToday} new today`}
                    icon={<Users className="h-5 w-5" />}
                    statusColor="text-primary"
                  />
                  
                  <MetricCard
                    title="System Uptime"
                    value={formatUptime(metrics?.uptime.server || 0)}
                    description={`DB: ${formatUptime(metrics?.uptime.database || 0)} | API: ${formatUptime(metrics?.uptime.api || 0)}`}
                    icon={<Clock className="h-5 w-5" />}
                    statusColor={getInverseStatusColor(metrics?.uptime.server || 0, { warning: 99.9, critical: 99.5 })}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>System Health</CardTitle>
                      <CardDescription>
                        Overall system health and performance metrics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>CPU Usage</span>
                            <span className={getStatusColor(metrics?.cpu.usage || 0, { warning: 70, critical: 90 })}>
                              {metrics?.cpu.usage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                metrics?.cpu.usage || 0 >= 90 ? 'bg-red-500' : 
                                metrics?.cpu.usage || 0 >= 70 ? 'bg-amber-500' : 'bg-green-500'
                              }`} 
                              style={{ width: `${metrics?.cpu.usage || 0}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Memory Usage</span>
                            <span className={getStatusColor(metrics?.memory.usagePercent || 0, { warning: 80, critical: 95 })}>
                              {metrics?.memory.usagePercent.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                metrics?.memory.usagePercent || 0 >= 95 ? 'bg-red-500' : 
                                metrics?.memory.usagePercent || 0 >= 80 ? 'bg-amber-500' : 'bg-green-500'
                              }`} 
                              style={{ width: `${metrics?.memory.usagePercent || 0}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Disk Usage</span>
                            <span className={getStatusColor(metrics?.disk.usagePercent || 0, { warning: 80, critical: 95 })}>
                              {metrics?.disk.usagePercent.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                metrics?.disk.usagePercent || 0 >= 95 ? 'bg-red-500' : 
                                metrics?.disk.usagePercent || 0 >= 80 ? 'bg-amber-500' : 'bg-green-500'
                              }`} 
                              style={{ width: `${metrics?.disk.usagePercent || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>System Alerts</CardTitle>
                      <CardDescription>
                        Recent system alerts and notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {metrics?.api.errorRate && metrics.api.errorRate > 1 ? (
                        <div className="p-3 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                          <div className="font-medium">API Error Rate Above Threshold</div>
                          <div className="text-xs mt-1">Current error rate: {metrics.api.errorRate.toFixed(2)}%</div>
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
              </TabsContent>
              
              <TabsContent value="server">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>CPU Metrics</CardTitle>
                      <CardDescription>
                        CPU usage and performance metrics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>CPU Usage</span>
                          <span className={getStatusColor(metrics?.cpu.usage || 0, { warning: 70, critical: 90 })}>
                            {metrics?.cpu.usage.toFixed(1)}%
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>CPU Cores</span>
                          <span>{metrics?.cpu.cores}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Load Average (1m, 5m, 15m)</span>
                          <span>{metrics?.cpu.load.join(', ')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Memory Metrics</CardTitle>
                      <CardDescription>
                        Memory usage and allocation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Memory Usage</span>
                          <span className={getStatusColor(metrics?.memory.usagePercent || 0, { warning: 80, critical: 95 })}>
                            {metrics?.memory.usagePercent.toFixed(1)}%
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Total Memory</span>
                          <span>{formatBytes(metrics?.memory.total || 0)}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Used Memory</span>
                          <span>{formatBytes(metrics?.memory.used || 0)}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Free Memory</span>
                          <span>{formatBytes(metrics?.memory.free || 0)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="database">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Database Metrics</CardTitle>
                      <CardDescription>
                        Database performance and connections
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Active Connections</span>
                          <span>{metrics?.database.connections}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Database Size</span>
                          <span>{formatBytes((metrics?.database.size || 0) * 1024 * 1024)}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Query Count (24h)</span>
                          <span>{metrics?.database.queryCount.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Slow Queries (24h)</span>
                          <span className={metrics?.database.slowQueries ? 'text-amber-500' : 'text-green-500'}>
                            {metrics?.database.slowQueries}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Database Actions</CardTitle>
                      <CardDescription>
                        Common database management tasks
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" className="w-full justify-start">
                        View Slow Queries
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Database Backup
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Optimize Database
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        View Query Logs
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="api">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>API Metrics</CardTitle>
                      <CardDescription>
                        API performance and usage statistics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Requests Per Minute</span>
                          <span>{Math.round(metrics?.api.requestsPerMinute || 0)}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Average Response Time</span>
                          <span className={getStatusColor(metrics?.api.averageResponseTime || 0, { warning: 200, critical: 500 })}>
                            {metrics?.api.averageResponseTime.toFixed(0)} ms
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Error Rate</span>
                          <span className={getStatusColor(metrics?.api.errorRate || 0, { warning: 1, critical: 5 })}>
                            {metrics?.api.errorRate.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>API Actions</CardTitle>
                      <CardDescription>
                        Common API management tasks
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" className="w-full justify-start">
                        View API Logs
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Manage Rate Limits
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        API Documentation
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Test API Endpoints
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="users">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Metrics</CardTitle>
                      <CardDescription>
                        User activity and statistics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Total Users</span>
                          <span>{metrics?.users.totalUsers}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Active Users</span>
                          <span>{metrics?.users.activeUsers}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>New Registrations Today</span>
                          <span>{metrics?.users.registrationsToday}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>User Actions</CardTitle>
                      <CardDescription>
                        Common user management tasks
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/dashboard/admin/users">
                          Manage Users
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        User Activity Report
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Manage Permissions
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Send Notifications
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </PermissionGuard>
  );
}
