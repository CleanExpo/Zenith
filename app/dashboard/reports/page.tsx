import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  Calendar, 
  ExternalLink, 
  BookOpen, 
  DollarSign, 
  Award, 
  BarChart2, 
  FileBarChart, 
  PieChart 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const metadata: Metadata = {
  title: 'Reports | Zenith',
  description: 'View and manage your research reports',
};

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try { cookieStore.set({ name, value, ...options }); } catch (error) {}
        },
        remove: (name, options) => {
          try { cookieStore.set({ name, value: '', ...options }); } catch (error) {}
        },
      },
    }
  );
  
  // Temporarily bypass authentication check
  // const { data: { user }, error: userError } = await supabase.auth.getUser();
  // if (userError || !user) {
  //   logger.warn('User not authenticated on reports page, redirecting to login.', { error: userError?.message });
  //   redirect('/auth/login');
  // }

  // Mock user for display purposes while auth is bypassed
  const user = { id: '00000000-0000-4000-a000-000000000000', email: 'user@example.com' };
  
  // Get all reports for the user
  const { data: reports, error: reportsError } = await supabase
    .from('custom_reports')
    .select(`
      id,
      title,
      description,
      project_id,
      external_data_included,
      is_public,
      created_at,
      updated_at,
      last_generated_at,
      research_projects (
        id,
        title
      )
    `)
    .order('updated_at', { ascending: false });
  
  if (reportsError) {
    throw new Error(`Failed to fetch reports: ${reportsError.message}`);
  }
  
  // Get all projects for the user
  const { data: projects, error: projectsError } = await supabase
    .from('research_projects')
    .select('id, title')
    .order('title');
  
  if (projectsError) {
    throw new Error(`Failed to fetch projects: ${projectsError.message}`);
  }
  
  // Group reports by project
  const reportsByProject: Record<string, any[]> = {};
  
  reports?.forEach(report => {
    const projectId = report.project_id || 'none';
    if (!reportsByProject[projectId]) {
      reportsByProject[projectId] = [];
    }
    reportsByProject[projectId].push(report);
  });
  
  // Count reports with external data
  const externalDataReportsCount = reports?.filter(report => report.external_data_included).length || 0;
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            View and manage your research reports
          </p>
        </div>
        
        {projects && projects.length > 0 && (
          <div className="flex items-center space-x-2">
            <Button asChild>
              <Link href={`/dashboard/reports/new?projectId=${projects[0].id}`}>
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Link>
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reports?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">With External Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{externalDataReportsCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projects?.length || 0}</div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="external">With External Data</TabsTrigger>
          <TabsTrigger value="by-project">By Project</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {reports && reports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map(report => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No reports found</h3>
              <p className="mt-2 text-muted-foreground">
                Create your first report to get started
              </p>
              {projects && projects.length > 0 && (
                <Button className="mt-4" asChild>
                  <Link href={`/dashboard/reports/new?projectId=${projects[0].id}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Report
                  </Link>
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="external" className="mt-6">
          {reports && reports.filter(r => r.external_data_included).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports
                .filter(report => report.external_data_included)
                .map(report => (
                  <ReportCard key={report.id} report={report} />
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ExternalLink className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No reports with external data</h3>
              <p className="mt-2 text-muted-foreground">
                Create a report with external data to enhance your research
              </p>
              {projects && projects.length > 0 && (
                <Button className="mt-4" asChild>
                  <Link href={`/dashboard/reports/new?projectId=${projects[0].id}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Report
                  </Link>
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="by-project" className="mt-6">
          {projects && projects.length > 0 ? (
            <div className="space-y-8">
              {projects.map(project => {
                const projectReports = reportsByProject[project.id] || [];
                
                return (
                  <div key={project.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">{project.title}</h3>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/reports/new?projectId=${project.id}`}>
                          <Plus className="h-4 w-4 mr-2" />
                          New Report
                        </Link>
                      </Button>
                    </div>
                    
                    {projectReports.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectReports.map(report => (
                          <ReportCard key={report.id} report={report} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border rounded-md bg-muted/30">
                        <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          No reports for this project
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No projects found</h3>
              <p className="mt-2 text-muted-foreground">
                Create a project first to create reports
              </p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/projects/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportCard({ report }: { report: any }) {
  // Determine report type based on external_data_included
  const reportType = report.external_data_included ? 'Enhanced Report' : 'Standard Report';
  
  // Format dates
  const createdAt = parseISO(report.created_at);
  const updatedAt = parseISO(report.updated_at);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium truncate">{report.title}</CardTitle>
          {report.external_data_included && (
            <Badge variant="outline" className="ml-2">External Data</Badge>
          )}
        </div>
        <CardDescription className="line-clamp-2">
          {report.description || 'No description'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center mb-1">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Created: {format(createdAt, 'MMM d, yyyy')}</span>
          </div>
          {report.research_projects && (
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              <span>Project: {report.research_projects.title}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/dashboard/reports/${report.id}`}>
            View Report
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
