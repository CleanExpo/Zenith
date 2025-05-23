import React, { useState, useEffect, useCallback } from 'react';
import LoadingButton from 'ui-components/LoadingButton';
import { toast } from 'react-toastify';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertTriangle } from '@radix-ui/react-icons';
import { BarChart, Clock, Database, RefreshCw, Tag, Trash2, Zap } from 'ui-components';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Input, Switch, Progress, LoadingSkeleton, Tabs, TabsList, TabsTrigger, TabsContent } from 'ui-components';
import { CacheExpiration } from '@/lib/utils/advancedCacheUtils';
import { getCacheStats, clearAllCache, invalidateByTags, warmupCache } from 'lib/services/cacheService';

const CacheMonitoring = () => {
const handleRefresh = useCallback(async () => {
  setRefreshing(true);
  try {
    const data = await getCacheStats();
    setStats(data);
  } catch (error) {
    toast.error('Failed to refresh cache stats', {
      id: 'refresh-error',
    });
  } finally {
    setRefreshing(false);
  }
}, [getCacheStats, setStats, setRefreshing, toast]);
const [stats, setStats] = useState<{ totalEntries: number; totalSize: number; hitRate: number; avgAccessCount: number; tagStats: { [key: string]: number } } | null>(null);
const [error, setError] = useState<Error | null>(null);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [clearing, setClearing] = useState(false);
const [invalidating, setInvalidating] = useState(false);
const [warming, setWarming] = useState(false);
const [activeTab, setActiveTab] = useState('overview');
const [selectedTags, setSelectedTags] = useState<string[]>([]);
const [customTag, setCustomTag] = useState('');
const [warmupType, setWarmupType] = useState('research_projects');

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getCacheStats();
      setStats(data);
    } catch (error) {
      toast.error('Failed to fetch cache stats', {
        id: 'fetch-error',
      });
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

const handleClearCache = async () => {
  setClearing(true);
  try {
    const success = await clearAllCache();
    if (success) {
      await handleRefresh();
    }
  } catch (error) {
toast.error('Failed to clear cache', {
  id: 'clear-error',
});
  } finally {
    setClearing(false);
  }
};

const handleInvalidateTags = async () => {
  setInvalidating(true);
  try {
    const success = await invalidateByTags(selectedTags);
    if (success) {
      setSelectedTags([]);
      await handleRefresh();
    }
  } catch (error) {
toast.error('Failed to invalidate tags', {
  id: 'invalidate-error',
});
  } finally {
    setInvalidating(false);
  }
};

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag)) {
      setSelectedTags([...selectedTags, customTag]);
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const handleWarmupCache = async () => {
    setWarming(true);
    try {
      const success = await warmupCache(warmupType);
      if (success) {
        await handleRefresh();
      }
    } catch (error) {
toast.error('Failed to warm up cache', {
  id: 'warmup-error',
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Cache Monitoring</h2>
        <div className="flex space-x-2">
<LoadingButton
  variant="outline"
  onClick={handleRefresh}
  disabled={refreshing}
  loading={refreshing}
  icon={<RefreshCw className="h-4 w-4 mr-2" />}
>
  Refresh
</LoadingButton>
<LoadingButton
  variant="destructive"
  onClick={handleClearCache}
  disabled={clearing}
  loading={clearing}
  icon={<Trash2 className="h-4 w-4 mr-2" />}
>
  Clear All Cache
</LoadingButton>
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
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LoadingSkeleton className="h-[200px]" />
            <LoadingSkeleton className="h-[200px]" />
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
<AlertDialog.Root>
  <AlertDialog.Trigger>
    <Button variant="destructive">Delete</Button>
  </AlertDialog.Trigger>
  <AlertDialog.Portal>
    <AlertDialog.Overlay className="bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <AlertDialog.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:scale-100">
<AlertDialogHeader className="flex flex-col space-y-1.5 text-center sm:text-left">
  <AlertDialogTitle className="text-lg font-semibold">Low Hit Rate</AlertDialogTitle>
  <AlertDialogDescription className="text-sm text-muted-foreground">
    Your cache hit rate is below 50%. Consider warming up the cache or reviewing your caching strategy.
  </AlertDialogDescription>
</AlertDialogHeader>
      <div className="flex justify-end space-x-2">
        <AlertDialog.Cancel>
          <Button variant="outline">Cancel</Button>
        </AlertDialog.Cancel>
        <AlertDialog.Action>
          <Button variant="destructive">Continue</Button>
        </AlertDialog.Action>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
                      )}
                      
                      {stats && stats.totalEntries === 0 && (
<AlertDialog.Root>
  <AlertDialog.Trigger>
    <Button variant="destructive">Delete</Button>
  </AlertDialog.Trigger>
  <AlertDialog.Portal>
    <AlertDialog.Overlay className="bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <AlertDialog.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:scale-100">
<AlertDialogHeader className="flex flex-col space-y-1.5 text-center sm:text-left">
  <AlertDialogTitle className="text-lg font-semibold">Empty Cache</AlertDialogTitle>
  <AlertDialogDescription className="text-sm text-muted-foreground">
    Your cache is empty. Consider warming up the cache to improve application performance.
  </AlertDialogDescription>
</AlertDialogHeader>
      <div className="flex justify-end space-x-2">
        <AlertDialog.Cancel>
          <Button variant="outline">Cancel</Button>
        </AlertDialog.Cancel>
        <AlertDialog.Action>
          <Button variant="destructive">Continue</Button>
        </AlertDialog.Action>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
                      )}
                      
                      {stats && stats.hitRate >= 0.8 && (
<AlertDialog.Root>
  <AlertDialog.Trigger>
    <Button variant="destructive">Delete</Button>
  </AlertDialog.Trigger>
  <AlertDialog.Portal>
    <AlertDialog.Overlay className="bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <AlertDialog.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:scale-100">
<AlertDialogHeader className="flex flex-col space-y-1.5 text-center sm:text-left">
  <AlertDialogTitle className="text-lg font-semibold">Excellent Hit Rate</AlertDialogTitle>
  <AlertDialogDescription className="text-sm text-muted-foreground">
    Your cache hit rate is above 80%. Your caching strategy is working effectively.
  </AlertDialogDescription>
</AlertDialogHeader>
      <div className="flex justify-end space-x-2">
        <AlertDialog.Cancel>
          <Button variant="outline">Cancel</Button>
        </AlertDialog.Cancel>
        <AlertDialog.Action>
          <Button variant="destructive">Continue</Button>
        </AlertDialog.Action>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
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
<LoadingButton
  onClick={handleInvalidateTags}
  disabled={invalidating || selectedTags.length === 0}
  loading={invalidating}
  icon={<Trash2 className="h-4 w-4 mr-2" />}
>
  Invalidate Selected Tags
</LoadingButton>
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
<LoadingButton
  onClick={handleWarmupCache}
  disabled={warming}
  loading={warming}
  icon={<Zap className="h-4 w-4 mr-2" />}
>
  Warm Up Cache
</LoadingButton>
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
          </>
        )}
      </Tabs>
    </div>
  );
};

export default CacheMonitoring;
