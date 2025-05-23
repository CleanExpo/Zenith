"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  RefreshCw, 
  Trash2, 
  Database, 
  Clock, 
  Tag, 
  Zap, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  CachePrefix, 
  CacheExpiration,
  getCacheStats, 
  clearAllCache, 
  invalidateByTags, 
  warmupCache
} from '@/lib/utils/clientSafeCacheUtils';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  avgAccessCount: number;
  tagStats: { [tag: string]: number };
}

export default function CacheMonitoring() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);
  const [invalidating, setInvalidating] = useState<boolean>(false);
  const [warming, setWarming] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [customTag, setCustomTag] = useState<string>('');
  const [warmupType, setWarmupType] = useState<string>('research_projects');

  useEffect(() => {
    fetchCacheStats();
  }, []);

  const fetchCacheStats = async () => {
    setLoading(true);
    try {
      const cacheStats = await getCacheStats();
      setStats(cacheStats);
    } catch (error: any) {
      console.error('Error fetching cache stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch cache statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCacheStats();
      toast({
        title: 'Success',
        description: 'Cache statistics refreshed',
      });
    } catch (error) {
      console.error('Error refreshing cache stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear all cache entries? This action cannot be undone.')) {
      setClearing(true);
      try {
        const success = await clearAllCache();
        if (success) {
          toast({
            title: 'Success',
            description: 'Cache cleared successfully',
          });
          await fetchCacheStats();
        } else {
          toast({
            title: 'Error',
            description: 'Failed to clear cache',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error clearing cache:', error);
        toast({
          title: 'Error',
          description: 'Failed to clear cache',
          variant: 'destructive',
        });
      } finally {
        setClearing(false);
      }
    }
  };

  const handleInvalidateTags = async () => {
    if (selectedTags.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one tag to invalidate',
        variant: 'destructive',
      });
      return;
    }

    setInvalidating(true);
    try {
      const success = await invalidateByTags(selectedTags);
      if (success) {
        toast({
          title: 'Success',
          description: `Invalidated ${selectedTags.length} tag(s) successfully`,
        });
        await fetchCacheStats();
        setSelectedTags([]);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to invalidate tags',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error invalidating tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to invalidate tags',
        variant: 'destructive',
      });
    } finally {
      setInvalidating(false);
    }
  };

  const handleAddCustomTag = () => {
    if (!customTag) return;
    
    if (!selectedTags.includes(customTag)) {
      setSelectedTags([...selectedTags, customTag]);
    }
    
    setCustomTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleWarmupCache = async () => {
    setWarming(true);
    try {
      // This is a simplified example - in a real application, you would have
      // specific data fetching functions for each type of data
      const keys: Array<{ key: string, fetch: () => Promise<any> }> = [];
      
      if (warmupType === 'research_projects') {
        // Example: Warm up research projects cache
        keys.push({
          key: `${CachePrefix.RESEARCH_PROJECTS}:list`,
          fetch: async () => {
            // Simulate fetching data
            await new Promise(resolve => setTimeout(resolve, 500));
            return { items: [], total: 0 };
          }
        });
      } else if (warmupType === 'teams') {
        // Example: Warm up teams cache
        keys.push({
          key: `${CachePrefix.TEAMS}:list`,
          fetch: async () => {
            // Simulate fetching data
            await new Promise(resolve => setTimeout(resolve, 500));
            return { items: [], total: 0 };
          }
        });
      } else if (warmupType === 'analytics') {
        // Example: Warm up analytics cache
        keys.push({
          key: `${CachePrefix.ANALYTICS}:summary`,
          fetch: async () => {
            // Simulate fetching data
            await new Promise(resolve => setTimeout(resolve, 500));
            return { data: {} };
          }
        });
      }
      
      await warmupCache(keys, {
        expiration: CacheExpiration.MEDIUM,
        tags: [warmupType]
      });
      
      toast({
        title: 'Success',
        description: `Cache warmed up for ${warmupType}`,
      });
      
      await fetchCacheStats();
    } catch (error) {
      console.error('Error warming up cache:', error);
      toast({
        title: 'Error',
        description: 'Failed to warm up cache',
        variant: 'destructive',
      });
    } finally {
      setWarming(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(2) + '%';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Cache Monitoring</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[200px] bg-muted animate-pulse rounded-lg" />
          <div className="h-[200px] bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Cache Monitoring</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="flex items-center"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleClearCache} 
            disabled={clearing}
            className="flex items-center"
          >
            {clearing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Clear All Cache
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center">
            <BarChart className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center">
            <Database className="h-4 w-4 mr-2" />
            Management
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-muted-foreground/20 hover:border-primary/50 transition-all duration-300 hover:shadow-md">
              <CardHeader className="bg-gradient-to-r from-muted/30 to-card">
                <CardTitle className="flex items-center">
                  <span className="bg-primary/10 p-1.5 rounded-full mr-2">
                    <Database className="h-4 w-4 text-primary" />
                  </span>
                  Cache Overview
                </CardTitle>
                <CardDescription>
                  Current cache statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Total Entries</span>
                      <span className="text-sm font-bold">{stats?.totalEntries || 0}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Total Size</span>
                      <span className="text-sm font-bold">{formatBytes(stats?.totalSize || 0)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Hit Rate</span>
                      <span className="text-sm font-bold">{formatPercentage(stats?.hitRate || 0)}</span>
                    </div>
                    <Progress value={stats ? stats.hitRate * 100 : 0} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Average Access Count</span>
                      <span className="text-sm font-bold">{stats?.avgAccessCount.toFixed(2) || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-muted-foreground/20 hover:border-primary/50 transition-all duration-300 hover:shadow-md">
              <CardHeader className="bg-gradient-to-r from-muted/30 to-card">
                <CardTitle className="flex items-center">
                  <span className="bg-primary/10 p-1.5 rounded-full mr-2">
                    <Clock className="h-4 w-4 text-primary" />
                  </span>
                  Cache Health
                </CardTitle>
                <CardDescription>
                  Cache performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {stats && stats.hitRate < 0.5 && (
                    <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertTitle>Low Hit Rate</AlertTitle>
                      <AlertDescription>
                        Your cache hit rate is below 50%. Consider warming up the cache or reviewing your caching strategy.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {stats && stats.totalEntries === 0 && (
                    <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertTitle>Empty Cache</AlertTitle>
                      <AlertDescription>
                        Your cache is empty. Consider warming up the cache to improve application performance.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {stats && stats.hitRate >= 0.8 && (
                    <Alert variant="default" className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                      <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertTitle>Excellent Hit Rate</AlertTitle>
                      <AlertDescription>
                        Your cache hit rate is above 80%. Your caching strategy is working effectively.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="pt-2">
                    <h3 className="text-sm font-medium mb-2">Cache Expiration Settings</h3>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="p-2 bg-muted rounded-md">
                        <div className="font-medium">Short</div>
                        <div className="text-muted-foreground">{CacheExpiration.SHORT}s</div>
                      </div>
                      <div className="p-2 bg-muted rounded-md">
                        <div className="font-medium">Medium</div>
                        <div className="text-muted-foreground">{CacheExpiration.MEDIUM}s</div>
                      </div>
                      <div className="p-2 bg-muted rounded-md">
                        <div className="font-medium">Long</div>
                        <div className="text-muted-foreground">{CacheExpiration.LONG}s</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tags">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-muted-foreground/20 hover:border-primary/50 transition-all duration-300 hover:shadow-md">
              <CardHeader className="bg-gradient-to-r from-muted/30 to-card">
                <CardTitle className="flex items-center">
                  <span className="bg-primary/10 p-1.5 rounded-full mr-2">
                    <Tag className="h-4 w-4 text-primary" />
                  </span>
                  Cache Tags
                </CardTitle>
                <CardDescription>
                  Tags and associated entries
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {stats && Object.keys(stats.tagStats).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(stats.tagStats).map(([tag, count]) => (
                      <div key={tag} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm font-medium">{tag}</span>
                        </div>
                        <span className="text-sm bg-muted px-2 py-1 rounded-full">
                          {count} {count === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No tags found in cache
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="border-muted-foreground/20 hover:border-primary/50 transition-all duration-300 hover:shadow-md">
              <CardHeader className="bg-gradient-to-r from-muted/30 to-card">
                <CardTitle className="flex items-center">
                  <span className="bg-primary/10 p-1.5 rounded-full mr-2">
                    <Trash2 className="h-4 w-4 text-primary" />
                  </span>
                  Invalidate Tags
                </CardTitle>
                <CardDescription>
                  Clear cache entries by tag
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tag-select">Select Tags</Label>
                    <Select
                      onValueChange={(value) => {
                        if (!selectedTags.includes(value)) {
                          setSelectedTags([...selectedTags, value]);
                        }
                      }}
                      value=""
                    >
                      <SelectTrigger id="tag-select">
                        <SelectValue placeholder="Select a tag" />
                      </SelectTrigger>
                      <SelectContent>
                        {stats && Object.keys(stats.tagStats).map((tag) => (
                          <SelectItem key={tag} value={tag}>
                            {tag} ({stats.tagStats[tag]} {stats.tagStats[tag] === 1 ? 'entry' : 'entries'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Label htmlFor="custom-tag">Custom Tag</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="custom-tag"
                          value={customTag}
                          onChange={(e) => setCustomTag(e.target.value)}
                          placeholder="Enter custom tag"
                        />
                        <Button type="button" onClick={handleAddCustomTag} variant="outline">
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {selectedTags.length > 0 && (
                    <div className="pt-2">
                      <Label>Selected Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedTags.map((tag) => (
                          <div
                            key={tag}
                            className="flex items-center bg-muted px-3 py-1 rounded-full text-sm"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-2 text-muted-foreground hover:text-destructive"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleInvalidateTags}
                  disabled={invalidating || selectedTags.length === 0}
                  className="w-full"
                >
                  {invalidating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Invalidate Selected Tags
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="management">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-muted-foreground/20 hover:border-primary/50 transition-all duration-300 hover:shadow-md">
              <CardHeader className="bg-gradient-to-r from-muted/30 to-card">
                <CardTitle className="flex items-center">
                  <span className="bg-primary/10 p-1.5 rounded-full mr-2">
                    <Zap className="h-4 w-4 text-primary" />
                  </span>
                  Cache Warmup
                </CardTitle>
                <CardDescription>
                  Pre-populate cache with frequently accessed data
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="warmup-type">Data Type</Label>
                    <Select
                      value={warmupType}
                      onValueChange={setWarmupType}
                    >
                      <SelectTrigger id="warmup-type">
                        <SelectValue placeholder="Select data type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="research_projects">Research Projects</SelectItem>
                        <SelectItem value="teams">Teams</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="stale-while-revalidate" defaultChecked />
                    <Label htmlFor="stale-while-revalidate">Use Stale-While-Revalidate Strategy</Label>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleWarmupCache}
                  disabled={warming}
                  className="w-full"
                >
                  {warming ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Warm Up Cache
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-muted-foreground/20 hover:border-primary/50 transition-all duration-300 hover:shadow-md">
              <CardHeader className="bg-gradient-to-r from-muted/30 to-card">
                <CardTitle className="flex items-center">
                  <span className="bg-primary/10 p-1.5 rounded-full mr-2">
                    <Database className="h-4 w-4 text-primary" />
                  </span>
                  Cache Configuration
                </CardTitle>
                <CardDescription>
                  Configure cache settings
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="short-expiration">Short Expiration (seconds)</Label>
                    <Input
                      id="short-expiration"
                      type="number"
                      defaultValue={CacheExpiration.SHORT}
                      disabled
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="medium-expiration">Medium Expiration (seconds)</Label>
                    <Input
                      id="medium-expiration"
                      type="number"
                      defaultValue={CacheExpiration.MEDIUM}
                      disabled
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="long-expiration">Long Expiration (seconds)</Label>
                    <Input
                      id="long-expiration"
                      type="number"
                      defaultValue={CacheExpiration.LONG}
                      disabled
                    />
                  </div>
                  
                  <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertTitle>Configuration Note</AlertTitle>
                    <AlertDescription>
                      Cache expiration settings can be modified in the codebase. These values are shown for reference only.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
