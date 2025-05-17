/**
 * Data Analysis Client Component
 * 
 * This component handles client-side functionality for the data analysis page.
 */

'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import DataAnalysisDemo from '@/components/data-analysis/DataAnalysisDemo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FeatureGate } from '@/components/subscription/FeatureGate';

/**
 * Data Analysis Client Component
 */
export default function DataAnalysisClient() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('python');
  const { hasAccess: hasAdvancedAnalyticsAccess } = useFeatureAccess('advanced_analytics');
  
  // Show a welcome toast when the component mounts
  useEffect(() => {
    toast({
      title: 'Data Analysis Tools',
      description: 'Analyze your research data with powerful Python and R data analysis tools.',
    });
  }, [toast]);
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Data Analysis</h1>
        <p className="text-muted-foreground">
          Analyze your research data with powerful data analysis tools. Select a dataset, perform analysis, and create visualizations.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Analysis Tools</CardTitle>
          <CardDescription>
            Choose a data analysis tool to analyze your research data.
          </CardDescription>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="r" disabled={!hasAdvancedAnalyticsAccess}>
                R {!hasAdvancedAnalyticsAccess && '(Premium)'}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <TabsContent value="python" className="mt-0">
            <DataAnalysisDemo />
          </TabsContent>
          <TabsContent value="r" className="mt-0">
            {hasAdvancedAnalyticsAccess ? (
              <DataAnalysisDemo />
            ) : (
              <div className="p-8 text-center">
                <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
                <p className="text-muted-foreground mb-4">
                  Upgrade your subscription to access R data analysis tools.
                </p>
                <FeatureGate feature="advanced_analytics">
                  <Button>Upgrade Subscription</Button>
                </FeatureGate>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Analysis Documentation</CardTitle>
          <CardDescription>
            Learn how to use the data analysis tools effectively.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Our data analysis tools provide a powerful way to analyze your research data. You can:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Upload and manage datasets</li>
            <li>Perform descriptive statistics</li>
            <li>Create correlation matrices</li>
            <li>Run regression analyses</li>
            <li>Generate visualizations</li>
            <li>Execute custom scripts</li>
          </ul>
          <div className="flex gap-4 mt-6">
            <Button variant="outline" onClick={() => window.open('/docs/data-analysis', '_blank')}>
              View Documentation
            </Button>
            <Button variant="outline" onClick={() => window.open('/tutorials/data-analysis', '_blank')}>
              Watch Tutorial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
