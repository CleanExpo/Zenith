'use client';

import { useState, useEffect } from 'react';
import { teamAnalyticsService, TeamAnalyticsSummary, TeamActivityLog, TeamMemberActivity } from '@/lib/services/teamAnalyticsService';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Calendar, Users, Activity, BarChart, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface TeamAnalyticsProps {
  teamId: string;
}

export default function TeamAnalytics({ teamId }: TeamAnalyticsProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<TeamAnalyticsSummary | null>(null);
  const [activityLogs, setActivityLogs] = useState<TeamActivityLog[]>([]);
  const [memberActivity, setMemberActivity] = useState<TeamMemberActivity[]>([]);
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  const [activityPage, setActivityPage] = useState<number>(1);
  const [activityPageSize] = useState<number>(10);
  const [activityTotalPages, setActivityTotalPages] = useState<number>(1);
  
  const [activityFilter, setActivityFilter] = useState<{
    action: string | null;
    entityType: string | null;
  }>({
    action: null,
    entityType: null,
  });

  // Fetch analytics data on component mount and when date range changes
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchAnalyticsData();
    }
  }, [teamId, dateRange]);

  // Fetch activity logs when page or filters change
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchActivityLogs();
    }
  }, [teamId, dateRange, activityPage, activityFilter]);

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    setLoading(true);
    try {
      // Format dates for API
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      
      // Fetch analytics summary
      const summaryData = await teamAnalyticsService.getAnalyticsSummary(
        teamId,
        startDate,
        endDate
      );
      
      if (summaryData) {
        setSummary(summaryData);
      }
      
      // Fetch member activity
      const memberActivityData = await teamAnalyticsService.getMemberActivitySummary(
        teamId,
        startDate,
        endDate
      );
      
      if (memberActivityData) {
        setMemberActivity(memberActivityData);
      }
      
      // Fetch activity logs (first page)
      await fetchActivityLogs();
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch activity logs
  const fetchActivityLogs = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    try {
      // Format dates for API
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      
      // Fetch activity logs with pagination and filters
      const logsData = await teamAnalyticsService.getActivityLogs(
        teamId,
        {
          startDate: `${startDate}T00:00:00Z`,
          endDate: `${endDate}T23:59:59Z`,
          limit: activityPageSize,
          offset: (activityPage - 1) * activityPageSize,
          action: activityFilter.action || undefined,
          entityType: activityFilter.entityType || undefined,
        }
      );
      
      if (logsData) {
        setActivityLogs(logsData);
        
        // Get total count for pagination
        const totalCount = await teamAnalyticsService.getActivityLogs(
          teamId,
          {
            startDate: `${startDate}T00:00:00Z`,
            endDate: `${endDate}T23:59:59Z`,
            action: activityFilter.action || undefined,
            entityType: activityFilter.entityType || undefined,
            limit: 1000000, // Large number to get total count
          }
        );
        
        if (totalCount) {
          setActivityTotalPages(Math.ceil(totalCount.length / activityPageSize));
        }
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch activity logs',
        variant: 'destructive',
      });
    }
  };

  // Handle date range preset selection
  const handleDateRangePreset = (preset: string) => {
    const now = new Date();
    
    switch (preset) {
      case 'last7days':
        setDateRange({
          from: subDays(now, 7),
          to: now,
        });
        break;
      case 'last30days':
        setDateRange({
          from: subDays(now, 30),
          to: now,
        });
        break;
      case 'thisMonth':
        setDateRange({
          from: startOfMonth(now),
          to: endOfMonth(now),
        });
        break;
      case 'lastMonth':
        const lastMonth = subDays(startOfMonth(now), 1);
        setDateRange({
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        });
        break;
      case 'thisWeek':
        setDateRange({
          from: startOfWeek(now, { weekStartsOn: 1 }),
          to: endOfWeek(now, { weekStartsOn: 1 }),
        });
        break;
      default:
        break;
    }
  };

  // Format activity log details for display
  const formatActivityDetails = (log: TeamActivityLog) => {
    if (!log.details) return '-';
    
    try {
      const details = log.details;
      
      // Format based on entity type and action
      if (log.entity_type === 'team_member') {
        if (log.action === 'add_member') {
          return `Added user with role: ${details.role}`;
        } else if (log.action === 'remove_member') {
          return `Removed user with role: ${details.role}`;
        } else if (log.action === 'update_member_role') {
          return `Changed role from ${details.old_role} to ${details.new_role}`;
        }
      } else if (log.entity_type === 'team_resource') {
        if (log.action === 'create') {
          return `Created ${details.type} resource: ${details.name}`;
        } else if (log.action === 'update') {
          return `Updated ${details.type} resource: ${details.name}`;
        } else if (log.action === 'delete') {
          return `Deleted ${details.type} resource: ${details.name}`;
        }
      } else if (log.entity_type === 'team_setting') {
        return `${log.action.charAt(0).toUpperCase() + log.action.slice(1)} setting: ${details.key}`;
      } else if (log.entity_type === 'team_invitation') {
        if (log.action === 'create_invitation') {
          return `Invited ${details.email} with role: ${details.role}`;
        } else if (log.action === 'delete_invitation') {
          return `Deleted invitation for ${details.email}`;
        }
      }
      
      // Generic fallback
      return JSON.stringify(details);
    } catch (error) {
      return '-';
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Analytics</CardTitle>
        <CardDescription>
          View analytics and activity for your team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateRangePreset('last7days')}
            >
              Last 7 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateRangePreset('last30days')}
            >
              Last 30 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateRangePreset('thisMonth')}
            >
              This Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateRangePreset('lastMonth')}
            >
              Last Month
            </Button>
          </div>
          
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
        
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Period</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{summary.period.days} days</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(summary.period.start_date), 'MMM d, yyyy')} - {format(new Date(summary.period.end_date), 'MMM d, yyyy')}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <BarChart className="h-4 w-4 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{summary.projects.total}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.projects.active} active, {summary.projects.completed} completed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Activity className="h-4 w-4 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{summary.activity?.total_logs || 0}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.activity?.unique_users || 0} active users
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="activity">Activity Logs</TabsTrigger>
            <TabsTrigger value="members">Member Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity">
            <div className="mb-4 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select
                  value={activityFilter.action || ''}
                  onValueChange={(value) => setActivityFilter({ ...activityFilter, action: value || null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="add_member">Add Member</SelectItem>
                    <SelectItem value="remove_member">Remove Member</SelectItem>
                    <SelectItem value="update_member_role">Update Role</SelectItem>
                    <SelectItem value="create_invitation">Create Invitation</SelectItem>
                    <SelectItem value="delete_invitation">Delete Invitation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Select
                  value={activityFilter.entityType || ''}
                  onValueChange={(value) => setActivityFilter({ ...activityFilter, entityType: value || null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Entity Types</SelectItem>
                    <SelectItem value="team_member">Team Member</SelectItem>
                    <SelectItem value="team_resource">Team Resource</SelectItem>
                    <SelectItem value="team_setting">Team Setting</SelectItem>
                    <SelectItem value="team_invitation">Team Invitation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {activityLogs.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No activity logs found for the selected period.</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity Type</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>{log.user_name || log.user_email}</TableCell>
                        <TableCell>
                          <span className="capitalize">{log.action.replace(/_/g, ' ')}</span>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{log.entity_type.replace(/_/g, ' ')}</span>
                        </TableCell>
                        <TableCell>{formatActivityDetails(log)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                          disabled={activityPage === 1}
                          className="gap-1 pl-2.5"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span>Previous</span>
                        </Button>
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, activityTotalPages) }, (_, i) => {
                        const pageNumber = activityPage <= 3
                          ? i + 1
                          : activityPage + i - 2;
                          
                        if (pageNumber <= activityTotalPages) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink
                                onClick={() => setActivityPage(pageNumber)}
                                isActive={pageNumber === activityPage}
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      
                      <PaginationItem>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setActivityPage(p => Math.min(activityTotalPages, p + 1))}
                          disabled={activityPage === activityTotalPages}
                          className="gap-1 pr-2.5"
                        >
                          <span>Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="members">
            {memberActivity.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No member activity found for the selected period.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Activity Count</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberActivity.map((member) => (
                    <TableRow key={member.user_id}>
                      <TableCell>{member.user_name || member.user_email}</TableCell>
                      <TableCell>{member.activity_count}</TableCell>
                      <TableCell>
                        {format(new Date(member.last_active), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {Object.entries(member.actions).map(([action, count]) => (
                            <div key={action} className="mb-1">
                              <span className="capitalize">{action.replace(/_/g, ' ')}</span>: {count}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
