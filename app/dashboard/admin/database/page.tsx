'use client';

import { useState, useEffect } from 'react';
import { UserRole } from '@/lib/auth/types';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Table, 
  FileText, 
  RefreshCw, 
  Download, 
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Cpu
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import Link from 'next/link';

interface DatabaseStats {
  size: number;
  tables: number;
  connections: number;
  uptime: number;
  lastBackup: string;
  slowQueries: number;
}

interface TableInfo {
  name: string;
  schema: string;
  rows: number;
  size: number;
  lastVacuum: string;
}

export default function AdminDatabasePage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [backupInProgress, setBackupInProgress] = useState<boolean>(false);
  const [vacuumInProgress, setVacuumInProgress] = useState<boolean>(false);
  const [selectedTable, setSelectedTable] = useState<string>('');

  useEffect(() => {
    fetchDatabaseStats();
    fetchTableInfo();
  }, []);

  const fetchDatabaseStats = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // In a real application, these would be actual database queries
      // For demonstration, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      setStats({
        size: 1024, // MB
        tables: 25,
        connections: 12,
        uptime: 99.98,
        lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        slowQueries: 3
      });
    } catch (error) {
      console.error('Error fetching database stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch database statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTableInfo = async () => {
    try {
      const supabase = createClient();
      
      // In a real application, this would fetch from the database
      // For demonstration, we'll use mock data
      setTables([
        {
          name: 'users',
          schema: 'public',
          rows: 1250,
          size: 32, // MB
          lastVacuum: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
        },
        {
          name: 'research_projects',
          schema: 'public',
          rows: 450,
          size: 64, // MB
          lastVacuum: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
        },
        {
          name: 'project_files',
          schema: 'public',
          rows: 2800,
          size: 128, // MB
          lastVacuum: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
        },
        {
          name: 'teams',
          schema: 'public',
          rows: 75,
          size: 8, // MB
          lastVacuum: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
        },
        {
          name: 'audit_logs',
          schema: 'public',
          rows: 15000,
          size: 256, // MB
          lastVacuum: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
        }
      ]);
    } catch (error) {
      console.error('Error fetching table info:', error);
    }
  };

  const handleBackupDatabase = async () => {
    setBackupInProgress(true);
    try {
      // In a real application, this would trigger a database backup
      // For demonstration, we'll simulate a backup
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate backup duration
      
      toast({
        title: 'Backup Complete',
        description: 'Database backup completed successfully',
      });
      
      // Update last backup time
      if (stats) {
        setStats({
          ...stats,
          lastBackup: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error backing up database:', error);
      toast({
        title: 'Error',
        description: 'Failed to backup database',
        variant: 'destructive',
      });
    } finally {
      setBackupInProgress(false);
    }
  };

  const handleVacuumTable = async () => {
    if (!selectedTable) {
      toast({
        title: 'Error',
        description: 'Please select a table to vacuum',
        variant: 'destructive',
      });
      return;
    }
    
    setVacuumInProgress(true);
    try {
      // In a real application, this would trigger a VACUUM operation
      // For demonstration, we'll simulate a vacuum
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate vacuum duration
      
      toast({
        title: 'Vacuum Complete',
        description: `Table ${selectedTable} vacuumed successfully`,
      });
      
      // Update last vacuum time for the selected table
      setTables(tables.map(table => {
        if (table.name === selectedTable) {
          return {
            ...table,
            lastVacuum: new Date().toISOString()
          };
        }
        return table;
      }));
    } catch (error) {
      console.error('Error vacuuming table:', error);
      toast({
        title: 'Error',
        description: 'Failed to vacuum table',
        variant: 'destructive',
      });
    } finally {
      setVacuumInProgress(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getDaysSinceLastVacuum = (lastVacuumDate: string) => {
    const now = new Date();
    const lastVacuum = new Date(lastVacuumDate);
    const diffTime = Math.abs(now.getTime() - lastVacuum.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getVacuumStatusColor = (lastVacuumDate: string) => {
    const days = getDaysSinceLastVacuum(lastVacuumDate);
    if (days > 14) return 'text-red-500';
    if (days > 7) return 'text-amber-500';
    return 'text-green-500';
  };

  return (
    <PermissionGuard role={UserRole.ADMIN} fallback={<AccessDenied />}>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex flex-col space-y-1">
              <h1 className="text-3xl font-bold">Database Tools</h1>
              <p className="text-muted-foreground">Manage and optimize your database</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleBackupDatabase} 
                disabled={backupInProgress}
                className="flex items-center bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
              >
                {backupInProgress ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Backup Database
              </Button>
            </div>
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-primary/20 via-primary/40 to-transparent rounded-full mt-4"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in fade-in-50 duration-500">
          <DatabaseCard
            title="Database Size"
            value={stats ? `${stats.size} MB` : '-'}
            description="Total storage used"
            icon={<Database className="h-5 w-5" />}
            loading={loading}
          />
          
          <DatabaseCard
            title="Tables"
            value={stats?.tables.toString() || '-'}
            description="Total tables in database"
            icon={<Table className="h-5 w-5" />}
            loading={loading}
          />
          
          <DatabaseCard
            title="Active Connections"
            value={stats?.connections.toString() || '-'}
            description="Current database connections"
            icon={<RefreshCw className="h-5 w-5" />}
            loading={loading}
          />
          
          <DatabaseCard
            title="Last Backup"
            value={stats ? formatDate(stats.lastBackup) : '-'}
            description="Most recent database backup"
            icon={<FileText className="h-5 w-5" />}
            loading={loading}
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-in fade-in-50 duration-500 delay-200">
          <TabsList className="mb-6 p-1 bg-muted/50">
          <TabsTrigger value="overview" className="flex items-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Database className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
          <TabsTrigger value="tables" className="flex items-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Table className="h-4 w-4 mr-2" />
              Tables
            </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <RefreshCw className="h-4 w-4 mr-2" />
              Maintenance
            </TabsTrigger>
          <TabsTrigger value="backups" className="flex items-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Download className="h-4 w-4 mr-2" />
              Backups
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
                  <Card className="border-muted-foreground/20 hover:border-primary/50 transition-all duration-300 hover:shadow-md">
                    <CardHeader className="bg-gradient-to-r from-muted/30 to-card">
                      <CardTitle className="flex items-center">
                        <span className="bg-primary/10 p-1.5 rounded-full mr-2">
                          <Database className="h-4 w-4 text-primary" />
                        </span>
                        Database Health
                      </CardTitle>
                      <CardDescription>
                        Overall database health and performance
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Database Uptime</span>
                          <span className="font-bold text-green-500">{stats?.uptime}%</span>
                        </div>
                        
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${stats?.uptime || 0}%` }}></div>
                        </div>
                        
                        <div className="pt-4">
                          <h3 className="font-medium mb-2">Status</h3>
                          <ul className="space-y-2">
                            <li className="flex items-start">
                              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>Database is online and healthy</span>
                            </li>
                            <li className="flex items-start">
                              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>Connection pool is operating normally</span>
                            </li>
                            {stats && stats.slowQueries > 0 ? (
                              <li className="flex items-start">
                                <AlertTriangle className="h-5 w-5 mr-2 text-amber-500 flex-shrink-0 mt-0.5" />
                                <span>{stats.slowQueries} slow queries detected in the last 24 hours</span>
                              </li>
                            ) : (
                              <li className="flex items-start">
                                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>No slow queries detected</span>
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        View Database Logs
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="border-muted-foreground/20 hover:border-primary/50 transition-all duration-300 hover:shadow-md">
                    <CardHeader className="bg-gradient-to-r from-muted/30 to-card">
                      <CardTitle className="flex items-center">
                        <span className="bg-primary/10 p-1.5 rounded-full mr-2">
                          <Cpu className="h-4 w-4 text-primary" />
                        </span>
                        Quick Actions
                      </CardTitle>
                      <CardDescription>
                        Common database management tasks
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                      <Button variant="outline" className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-colors">
                          Run Database Diagnostics
                        </Button>
                      <Button variant="outline" className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-colors">
                          View Slow Queries
                        </Button>
                      <Button variant="outline" className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-colors">
                          Manage Indexes
                        </Button>
                      <Button variant="outline" className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-colors">
                          Configure Connection Pool
                        </Button>
                      <Button variant="outline" className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-colors">
                          View Query Statistics
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="tables">
                <Card className="border-muted-foreground/20 hover:border-primary/50 transition-all duration-300 hover:shadow-md">
                  <CardHeader className="bg-gradient-to-r from-muted/30 to-card">
                    <CardTitle className="flex items-center">
                      <span className="bg-primary/10 p-1.5 rounded-full mr-2">
                        <Table className="h-4 w-4 text-primary" />
                      </span>
                      Database Tables
                    </CardTitle>
                    <CardDescription>
                      Table statistics and information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Table Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Schema</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rows</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Vacuum</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {tables.length > 0 ? (
                            tables.map((table) => (
                              <tr key={table.name} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  {table.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {table.schema}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {table.rows.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {formatBytes(table.size * 1024 * 1024)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${getVacuumStatusColor(table.lastVacuum)}`}>
                                  {getDaysSinceLastVacuum(table.lastVacuum)} days ago
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                No tables found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" className="flex items-center hover:bg-primary hover:text-primary-foreground transition-colors">
                      <Download className="h-4 w-4 mr-2" />
                      Export Table List
                    </Button>
                    <Button variant="outline" className="flex items-center hover:bg-primary hover:text-primary-foreground transition-colors">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="maintenance">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-muted-foreground/20 hover:border-primary/50 transition-all duration-300 hover:shadow-md">
                    <CardHeader className="bg-gradient-to-r from-muted/30 to-card">
                      <CardTitle className="flex items-center">
                        <span className="bg-primary/10 p-1.5 rounded-full mr-2">
                          <RefreshCw className="h-4 w-4 text-primary" />
                        </span>
                        Vacuum Tables
                      </CardTitle>
                      <CardDescription>
                        Reclaim storage and update statistics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="table-select" className="block text-sm font-medium">
                            Select Table
                          </label>
                          <select
                            id="table-select"
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                            value={selectedTable}
                            onChange={(e) => setSelectedTable(e.target.value)}
                          >
                            <option value="">Select a table</option>
                            {tables.map((table) => (
                              <option key={table.name} value={table.name}>
                                {table.name} ({getDaysSinceLastVacuum(table.lastVacuum)} days since last vacuum)
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="pt-4">
                          <Button 
                            onClick={handleVacuumTable} 
                            disabled={vacuumInProgress || !selectedTable}
                            className="w-full"
                          >
                            {vacuumInProgress ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Vacuum Selected Table
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-muted-foreground/20 hover:border-primary/50 transition-all duration-300 hover:shadow-md">
                    <CardHeader className="bg-gradient-to-r from-muted/30 to-card">
                      <CardTitle className="flex items-center">
                        <span className="bg-primary/10 p-1.5 rounded-full mr-2">
                          <Database className="h-4 w-4 text-primary" />
                        </span>
                        Maintenance Tasks
                      </CardTitle>
                      <CardDescription>
                        Database maintenance operations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Button variant="outline" className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-colors">
                          Reindex Database
                        </Button>
                        <Button variant="outline" className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-colors">
                          Vacuum Full Database
                        </Button>
                        <Button variant="outline" className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-colors">
                          Analyze Database
                        </Button>
                        <Button variant="outline" className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-colors">
                          Check Database Integrity
                        </Button>
                        <Button variant="outline" className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-colors">
                          Reset Query Statistics
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="backups">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-muted-foreground/20 hover:border-primary/50 transition-all duration-300 hover:shadow-md">
                    <CardHeader className="bg-gradient-to-r from-muted/30 to-card">
                      <CardTitle className="flex items-center">
                        <span className="bg-primary/10 p-1.5 rounded-full mr-2">
                          <FileText className="h-4 w-4 text-primary" />
                        </span>
                        Backup History
                      </CardTitle>
                      <CardDescription>
                        Recent database backups
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border-b pb-3">
                          <div className="flex justify-between">
                            <span className="font-medium">Full Backup</span>
                            <span className="text-sm text-green-500">Completed</span>
                          </div>
                          <div className="text-sm mt-1">Size: 1.2 GB</div>
                          <div className="text-sm text-muted-foreground">
                            {stats ? formatDate(stats.lastBackup) : '-'}
                          </div>
                        </div>
                        
                        <div className="border-b pb-3">
                          <div className="flex justify-between">
                            <span className="font-medium">Incremental Backup</span>
                            <span className="text-sm text-green-500">Completed</span>
                          </div>
                          <div className="text-sm mt-1">Size: 250 MB</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())}
                          </div>
                        </div>
                        
                        <div className="border-b pb-3">
                          <div className="flex justify-between">
                            <span className="font-medium">Incremental Backup</span>
                            <span className="text-sm text-green-500">Completed</span>
                          </div>
                          <div className="text-sm mt-1">Size: 180 MB</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())}
                          </div>
                        </div>
                        
                        <div className="border-b pb-3">
                          <div className="flex justify-between">
                            <span className="font-medium">Full Backup</span>
                            <span className="text-sm text-green-500">Completed</span>
                          </div>
                          <div className="text-sm mt-1">Size: 1.1 GB</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-colors">
                        <FileText className="h-4 w-4 mr-2" />
                        View All Backups
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="border-muted-foreground/20 hover:border-primary/50 transition-all duration-300 hover:shadow-md">
                    <CardHeader className="bg-gradient-to-r from-muted/30 to-card">
                      <CardTitle className="flex items-center">
                        <span className="bg-primary/10 p-1.5 rounded-full mr-2">
                          <Download className="h-4 w-4 text-primary" />
                        </span>
                        Backup Settings
                      </CardTitle>
                      <CardDescription>
                        Configure database backup settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">Automatic Backups</div>
                            <div className="text-sm text-muted-foreground">Daily at 2:00 AM</div>
                          </div>
                          <Button variant="outline" size="sm">Configure</Button>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">Backup Retention</div>
                            <div className="text-sm text-muted-foreground">30 days</div>
                          </div>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">Backup Storage</div>
                            <div className="text-sm text-muted-foreground">Amazon S3</div>
                          </div>
                          <Button variant="outline" size="sm">Configure</Button>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">Backup Encryption</div>
                            <div className="text-sm text-muted-foreground">AES-256</div>
                          </div>
                          <Button variant="outline" size="sm">Configure</Button>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" className="flex items-center hover:bg-primary hover:text-primary-foreground transition-colors">
                        <Upload className="h-4 w-4 mr-2" />
                        Restore Backup
                      </Button>
                      <Button className="flex items-center bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary">
                        <Download className="h-4 w-4 mr-2" />
                        Create Backup
                      </Button>
                    </CardFooter>
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

interface DatabaseCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  loading?: boolean;
}

function DatabaseCard({ title, value, description, icon, loading = false }: DatabaseCardProps) {
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
