/**
 * Data Analysis Demo Component
 * 
 * This component demonstrates how to use the data analysis services in a React component.
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataAnalysisToolFactory } from '@/lib/services/dataAnalysis/dataAnalysisToolFactory';
import { Dataset, AnalysisResult, VisualizationResult } from '@/lib/services/dataAnalysis/baseDataAnalysisService';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton'; // Changed from loading-skeleton to skeleton

/**
 * Data Analysis Demo Component
 */
export default function DataAnalysisDemo() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [visualization, setVisualization] = useState<VisualizationResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('datasets');

  // Initialize the data analysis service
  const pythonService = DataAnalysisToolFactory.createTool('python', {
    apiKey: process.env.NEXT_PUBLIC_PYTHON_DATA_ANALYSIS_API_KEY || '',
    userId: 'demo-user',
    additionalCredentials: {},
    toolType: 'python' // Added toolType property
  });

  // Load datasets on component mount
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        setLoading(true);
        const datasets = await pythonService.getDatasets();
        setDatasets(datasets);
        
        if (datasets.length > 0) {
          setSelectedDataset(datasets[0]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading datasets:', error);
        toast({
          title: 'Error',
          description: 'Failed to load datasets. Please try again.',
          variant: 'destructive'
        });
        setLoading(false);
      }
    };

    loadDatasets();
  }, [pythonService, toast]);

  // Perform descriptive analysis on the selected dataset
  const performAnalysis = async () => {
    if (!selectedDataset) return;

    try {
      setLoading(true);
      const result = await pythonService.performAnalysis({
        type: 'descriptive',
        datasetId: selectedDataset.id
      });
      
      setAnalysisResult(result);
      setActiveTab('analysis');
      setLoading(false);
    } catch (error) {
      console.error('Error performing analysis:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform analysis. Please try again.',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  // Create a visualization for the selected dataset
  const createVisualization = async () => {
    if (!selectedDataset) return;

    try {
      setLoading(true);
      const result = await pythonService.createVisualization({
        type: 'bar',
        datasetId: selectedDataset.id,
        title: `${selectedDataset.name} Bar Chart`,
        xAxis: selectedDataset.columns[0].name,
        yAxis: selectedDataset.columns[2].name
      });
      
      setVisualization(result);
      setActiveTab('visualization');
      setLoading(false);
    } catch (error) {
      console.error('Error creating visualization:', error);
      toast({
        title: 'Error',
        description: 'Failed to create visualization. Please try again.',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  // Handle dataset selection
  const handleDatasetSelect = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setAnalysisResult(null);
    setVisualization(null);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Data Analysis Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Datasets Panel */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Datasets</CardTitle>
            <CardDescription>Select a dataset to analyze</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && datasets.length === 0 ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                {datasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedDataset?.id === dataset.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card hover:bg-muted'
                    }`}
                    onClick={() => handleDatasetSelect(dataset)}
                  >
                    <h3 className="font-medium">{dataset.name}</h3>
                    <p className="text-sm opacity-80">{dataset.description}</p>
                    <div className="text-xs mt-1">
                      {dataset.rowCount} rows, {dataset.columns.length} columns
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setActiveTab('datasets')}
            >
              View Details
            </Button>
            <Button
              disabled={!selectedDataset || loading}
              onClick={performAnalysis}
            >
              Analyze
            </Button>
          </CardFooter>
        </Card>

        {/* Main Content Panel */}
        <Card className="md:col-span-2">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="datasets">Dataset Details</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="visualization">Visualization</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="min-h-[400px]">
            {loading && !selectedDataset ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <>
                <TabsContent value="datasets">
                  {selectedDataset ? (
                    <div>
                      <h2 className="text-2xl font-bold mb-4">{selectedDataset.name}</h2>
                      <p className="mb-4">{selectedDataset.description}</p>
                      
                      <h3 className="text-xl font-semibold mb-2">Columns</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-muted">
                              <th className="p-2 text-left">Name</th>
                              <th className="p-2 text-left">Type</th>
                              <th className="p-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedDataset.columns.map((column, index) => (
                              <tr key={index} className="border-b border-muted">
                                <td className="p-2">{column.name}</td>
                                <td className="p-2">{column.type}</td>
                                <td className="p-2">{column.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-muted p-3 rounded-md">
                          <div className="text-sm font-medium">Rows</div>
                          <div className="text-2xl font-bold">{selectedDataset.rowCount}</div>
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                          <div className="text-sm font-medium">Size</div>
                          <div className="text-2xl font-bold">{(selectedDataset.size / 1024).toFixed(2)} KB</div>
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                          <div className="text-sm font-medium">Format</div>
                          <div className="text-2xl font-bold">{selectedDataset.format}</div>
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                          <div className="text-sm font-medium">Created</div>
                          <div className="text-2xl font-bold">
                            {new Date(selectedDataset.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Select a dataset to view details</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="analysis">
                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-8 w-1/2" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : analysisResult ? (
                    <div>
                      <h2 className="text-2xl font-bold mb-4">
                        {analysisResult.type.charAt(0).toUpperCase() + analysisResult.type.slice(1)} Analysis
                      </h2>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        {Object.entries(analysisResult.results).map(([key, value]) => (
                          <div key={key} className="bg-muted p-3 rounded-md">
                            <div className="text-sm font-medium">{key}</div>
                            <div className="text-2xl font-bold">
                              {typeof value === 'number' ? value.toFixed(2) : String(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6">
                        <h3 className="text-xl font-semibold mb-2">Execution Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted p-3 rounded-md">
                            <div className="text-sm font-medium">Execution Time</div>
                            <div className="text-2xl font-bold">{analysisResult.executionTime} ms</div>
                          </div>
                          <div className="bg-muted p-3 rounded-md">
                            <div className="text-sm font-medium">Status</div>
                            <div className="text-2xl font-bold">{analysisResult.status}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <Button onClick={createVisualization}>Create Visualization</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">
                        {selectedDataset
                          ? 'Click "Analyze" to perform analysis on the selected dataset'
                          : 'Select a dataset to perform analysis'}
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="visualization">
                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-64 w-full" />
                    </div>
                  ) : visualization ? (
                    <div>
                      <h2 className="text-2xl font-bold mb-4">{visualization.params.title}</h2>
                      
                      <div className="bg-card border rounded-lg p-4 mb-6">
                        <div
                          className="w-full"
                          dangerouslySetInnerHTML={{ __html: visualization.htmlContent || '' }}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted p-3 rounded-md">
                          <div className="text-sm font-medium">Chart Type</div>
                          <div className="text-2xl font-bold">{visualization.type}</div>
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                          <div className="text-sm font-medium">Execution Time</div>
                          <div className="text-2xl font-bold">{visualization.executionTime} ms</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">
                        {analysisResult
                          ? 'Click "Create Visualization" to visualize the analysis results'
                          : 'Perform analysis first to create visualizations'}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
