/**
 * Machine Learning Demo Component
 * 
 * This component demonstrates the machine learning capabilities of the Zenith platform.
 */

'use client';

import { useState } from 'react';
import { useMachineLearning } from '@/hooks/useMachineLearning';
import { ModelType, AlgorithmType, Feature } from '@/lib/services/machineLearning/supervisedLearningService';
import { UnsupervisedAlgorithmType } from '@/lib/services/machineLearning/unsupervisedLearningService';
import { MachineLearningServiceType } from '@/lib/services/machineLearning/machineLearningServiceFactory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { LoadingIndicator } from '@/components/ui/loading-indicator';

/**
 * Machine learning demo component
 */
export function MachineLearningDemo() {
  const {
    loading,
    error,
    createSupervisedDataset,
    createUnsupervisedDataset,
    trainModel,
    predict,
    performClustering,
    performDimensionalityReduction,
    performAnomalyDetection
  } = useMachineLearning();
  
  const [activeTab, setActiveTab] = useState('supervised');
  const [datasetName, setDatasetName] = useState('');
  const [datasetDescription, setDatasetDescription] = useState('');
  const [modelName, setModelName] = useState('');
  const [modelDescription, setModelDescription] = useState('');
  const [selectedModelType, setSelectedModelType] = useState<ModelType>(ModelType.CLASSIFICATION);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>(AlgorithmType.LOGISTIC_REGRESSION);
  const [selectedUnsupervisedAlgorithm, setSelectedUnsupervisedAlgorithm] = useState<UnsupervisedAlgorithmType>(UnsupervisedAlgorithmType.K_MEANS);
  const [datasetId, setDatasetId] = useState('');
  const [modelId, setModelId] = useState('');
  const [resultId, setResultId] = useState('');
  const [predictionInput, setPredictionInput] = useState('');
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [clusteringResult, setClusteringResult] = useState<any>(null);
  const [dimensionalityReductionResult, setDimensionalityReductionResult] = useState<any>(null);
  const [anomalyDetectionResult, setAnomalyDetectionResult] = useState<any>(null);
  
  /**
   * Create a sample dataset for supervised learning
   */
  const handleCreateSupervisedDataset = async () => {
    // Create sample features
    const features: Feature[] = [
      {
        name: 'feature1',
        type: 'numeric',
        statistics: {
          min: 0,
          max: 100,
          mean: 50,
          median: 50,
          stdDev: 15,
          uniqueValues: 100,
          missingValues: 0
        }
      },
      {
        name: 'feature2',
        type: 'numeric',
        statistics: {
          min: 0,
          max: 100,
          mean: 50,
          median: 50,
          stdDev: 15,
          uniqueValues: 100,
          missingValues: 0
        }
      },
      {
        name: 'target',
        type: 'categorical',
        statistics: {
          uniqueValues: 2,
          missingValues: 0
        }
      }
    ];
    
    // Create the dataset
    const dataset = await createSupervisedDataset(
      datasetName || 'Sample Classification Dataset',
      datasetDescription || 'A sample dataset for classification',
      features,
      'target',
      1000,
      ['sample', 'classification']
    );
    
    if (dataset) {
      setDatasetId(dataset.id);
    }
  };
  
  /**
   * Create a sample dataset for unsupervised learning
   */
  const handleCreateUnsupervisedDataset = async () => {
    // Create sample features
    const features: Feature[] = [
      {
        name: 'feature1',
        type: 'numeric',
        statistics: {
          min: 0,
          max: 100,
          mean: 50,
          median: 50,
          stdDev: 15,
          uniqueValues: 100,
          missingValues: 0
        }
      },
      {
        name: 'feature2',
        type: 'numeric',
        statistics: {
          min: 0,
          max: 100,
          mean: 50,
          median: 50,
          stdDev: 15,
          uniqueValues: 100,
          missingValues: 0
        }
      }
    ];
    
    // Create the dataset
    const dataset = await createUnsupervisedDataset(
      datasetName || 'Sample Clustering Dataset',
      datasetDescription || 'A sample dataset for clustering',
      features,
      1000,
      ['sample', 'clustering']
    );
    
    if (dataset) {
      setDatasetId(dataset.id);
    }
  };
  
  /**
   * Train a model
   */
  const handleTrainModel = async () => {
    if (!datasetId) {
      alert('Please create a dataset first');
      return;
    }
    
    // Train the model
    const model = await trainModel(
      modelName || 'Sample Model',
      modelDescription || 'A sample model',
      selectedModelType,
      selectedAlgorithm,
      datasetId,
      {}
    );
    
    if (model) {
      setModelId(model.id);
    }
  };
  
  /**
   * Make a prediction
   */
  const handlePredict = async () => {
    if (!modelId) {
      alert('Please train a model first');
      return;
    }
    
    // Parse the prediction input
    let input: Record<string, any> = {};
    
    try {
      input = JSON.parse(predictionInput || '{"feature1": 50, "feature2": 75}');
    } catch (error) {
      alert('Invalid JSON input');
      return;
    }
    
    // Make the prediction
    const prediction = await predict(modelId, input);
    
    if (prediction) {
      setPredictionResult(prediction);
    }
  };
  
  /**
   * Perform clustering
   */
  const handlePerformClustering = async () => {
    if (!datasetId) {
      alert('Please create a dataset first');
      return;
    }
    
    // Perform clustering
    const result = await performClustering(
      datasetId,
      selectedUnsupervisedAlgorithm,
      { k: 3 }
    );
    
    if (result) {
      setResultId(result.id);
      setClusteringResult(result);
    }
  };
  
  /**
   * Perform dimensionality reduction
   */
  const handlePerformDimensionalityReduction = async () => {
    if (!datasetId) {
      alert('Please create a dataset first');
      return;
    }
    
    // Perform dimensionality reduction
    const result = await performDimensionalityReduction(
      datasetId,
      selectedUnsupervisedAlgorithm,
      { components: 2 }
    );
    
    if (result) {
      setResultId(result.id);
      setDimensionalityReductionResult(result);
    }
  };
  
  /**
   * Perform anomaly detection
   */
  const handlePerformAnomalyDetection = async () => {
    if (!datasetId) {
      alert('Please create a dataset first');
      return;
    }
    
    // Perform anomaly detection
    const result = await performAnomalyDetection(
      datasetId,
      selectedUnsupervisedAlgorithm,
      { contamination: 0.05 }
    );
    
    if (result) {
      setResultId(result.id);
      setAnomalyDetectionResult(result);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Machine Learning Demo</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error.message}</p>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="supervised">Supervised Learning</TabsTrigger>
          <TabsTrigger value="unsupervised">Unsupervised Learning</TabsTrigger>
        </TabsList>
        
        <TabsContent value="supervised">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Dataset</CardTitle>
                <CardDescription>Create a sample dataset for supervised learning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataset-name">Dataset Name</Label>
                    <Input
                      id="dataset-name"
                      placeholder="Sample Classification Dataset"
                      value={datasetName}
                      onChange={(e) => setDatasetName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataset-description">Dataset Description</Label>
                    <Input
                      id="dataset-description"
                      placeholder="A sample dataset for classification"
                      value={datasetDescription}
                      onChange={(e) => setDatasetDescription(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleCreateSupervisedDataset} disabled={loading}>
                  {loading ? <LoadingIndicator /> : 'Create Dataset'}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Train Model</CardTitle>
                <CardDescription>Train a model on the dataset</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="model-name">Model Name</Label>
                    <Input
                      id="model-name"
                      placeholder="Sample Model"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model-description">Model Description</Label>
                    <Input
                      id="model-description"
                      placeholder="A sample model"
                      value={modelDescription}
                      onChange={(e) => setModelDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model-type">Model Type</Label>
                    <Select
                      value={selectedModelType}
                      onValueChange={(value) => setSelectedModelType(value as ModelType)}
                    >
                      <SelectTrigger id="model-type">
                        <SelectValue placeholder="Select model type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ModelType.CLASSIFICATION}>Classification</SelectItem>
                        <SelectItem value={ModelType.REGRESSION}>Regression</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="algorithm">Algorithm</Label>
                    <Select
                      value={selectedAlgorithm}
                      onValueChange={(value) => setSelectedAlgorithm(value as AlgorithmType)}
                    >
                      <SelectTrigger id="algorithm">
                        <SelectValue placeholder="Select algorithm" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedModelType === ModelType.CLASSIFICATION ? (
                          <>
                            <SelectItem value={AlgorithmType.LOGISTIC_REGRESSION}>Logistic Regression</SelectItem>
                            <SelectItem value={AlgorithmType.DECISION_TREE}>Decision Tree</SelectItem>
                            <SelectItem value={AlgorithmType.RANDOM_FOREST}>Random Forest</SelectItem>
                            <SelectItem value={AlgorithmType.SVM}>SVM</SelectItem>
                            <SelectItem value={AlgorithmType.NAIVE_BAYES}>Naive Bayes</SelectItem>
                            <SelectItem value={AlgorithmType.KNN}>KNN</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value={AlgorithmType.LINEAR_REGRESSION}>Linear Regression</SelectItem>
                            <SelectItem value={AlgorithmType.RIDGE_REGRESSION}>Ridge Regression</SelectItem>
                            <SelectItem value={AlgorithmType.LASSO_REGRESSION}>Lasso Regression</SelectItem>
                            <SelectItem value={AlgorithmType.SVR}>SVR</SelectItem>
                            <SelectItem value={AlgorithmType.GRADIENT_BOOSTING}>Gradient Boosting</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleTrainModel} disabled={loading || !datasetId}>
                  {loading ? <LoadingIndicator /> : 'Train Model'}
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Make Prediction</CardTitle>
                <CardDescription>Make a prediction with the trained model</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prediction-input">Input (JSON)</Label>
                    <Input
                      id="prediction-input"
                      placeholder='{"feature1": 50, "feature2": 75}'
                      value={predictionInput}
                      onChange={(e) => setPredictionInput(e.target.value)}
                    />
                  </div>
                  
                  {predictionResult && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold mb-2">Prediction Result</h3>
                      <div className="bg-gray-100 p-4 rounded">
                        <p><strong>Output:</strong> {JSON.stringify(predictionResult.output)}</p>
                        {predictionResult.confidence && (
                          <p><strong>Confidence:</strong> {(predictionResult.confidence * 100).toFixed(2)}%</p>
                        )}
                        {predictionResult.explanation && (
                          <div>
                            <p><strong>Explanation:</strong></p>
                            <pre className="text-xs overflow-auto p-2 bg-gray-200 rounded">
                              {JSON.stringify(predictionResult.explanation, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handlePredict} disabled={loading || !modelId}>
                  {loading ? <LoadingIndicator /> : 'Make Prediction'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="unsupervised">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Dataset</CardTitle>
                <CardDescription>Create a sample dataset for unsupervised learning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataset-name-unsupervised">Dataset Name</Label>
                    <Input
                      id="dataset-name-unsupervised"
                      placeholder="Sample Clustering Dataset"
                      value={datasetName}
                      onChange={(e) => setDatasetName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataset-description-unsupervised">Dataset Description</Label>
                    <Input
                      id="dataset-description-unsupervised"
                      placeholder="A sample dataset for clustering"
                      value={datasetDescription}
                      onChange={(e) => setDatasetDescription(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleCreateUnsupervisedDataset} disabled={loading}>
                  {loading ? <LoadingIndicator /> : 'Create Dataset'}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Select Algorithm</CardTitle>
                <CardDescription>Select an unsupervised learning algorithm</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="unsupervised-algorithm">Algorithm</Label>
                    <Select
                      value={selectedUnsupervisedAlgorithm}
                      onValueChange={(value) => setSelectedUnsupervisedAlgorithm(value as UnsupervisedAlgorithmType)}
                    >
                      <SelectTrigger id="unsupervised-algorithm">
                        <SelectValue placeholder="Select algorithm" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UnsupervisedAlgorithmType.K_MEANS}>K-Means</SelectItem>
                        <SelectItem value={UnsupervisedAlgorithmType.HIERARCHICAL}>Hierarchical</SelectItem>
                        <SelectItem value={UnsupervisedAlgorithmType.DBSCAN}>DBSCAN</SelectItem>
                        <SelectItem value={UnsupervisedAlgorithmType.PCA}>PCA</SelectItem>
                        <SelectItem value={UnsupervisedAlgorithmType.T_SNE}>t-SNE</SelectItem>
                        <SelectItem value={UnsupervisedAlgorithmType.ISOLATION_FOREST}>Isolation Forest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button onClick={handlePerformClustering} disabled={loading || !datasetId}>
                  {loading ? <LoadingIndicator /> : 'Clustering'}
                </Button>
                <Button onClick={handlePerformDimensionalityReduction} disabled={loading || !datasetId}>
                  {loading ? <LoadingIndicator /> : 'Dim. Reduction'}
                </Button>
                <Button onClick={handlePerformAnomalyDetection} disabled={loading || !datasetId}>
                  {loading ? <LoadingIndicator /> : 'Anomaly Detection'}
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>Results of the unsupervised learning algorithm</CardDescription>
              </CardHeader>
              <CardContent>
                {clusteringResult && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Clustering Result</h3>
                    <div className="bg-gray-100 p-4 rounded">
                      <p><strong>Algorithm:</strong> {clusteringResult.algorithm}</p>
                      <p><strong>Number of Clusters:</strong> {clusteringResult.clusters.length}</p>
                      <p><strong>Metrics:</strong></p>
                      <pre className="text-xs overflow-auto p-2 bg-gray-200 rounded">
                        {JSON.stringify(clusteringResult.metrics, null, 2)}
                      </pre>
                      
                      <div className="mt-4">
                        <p><strong>Clusters:</strong></p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                          {clusteringResult.clusters.map((cluster: any) => (
                            <div key={cluster.id} className="border p-3 rounded">
                              <p><strong>Cluster {cluster.id}</strong></p>
                              <p>Size: {cluster.size}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {dimensionalityReductionResult && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Dimensionality Reduction Result</h3>
                    <div className="bg-gray-100 p-4 rounded">
                      <p><strong>Algorithm:</strong> {dimensionalityReductionResult.algorithm}</p>
                      <p><strong>Components:</strong> {dimensionalityReductionResult.components}</p>
                      
                      {dimensionalityReductionResult.explainedVariance && (
                        <div className="mt-2">
                          <p><strong>Explained Variance:</strong></p>
                          <div className="h-8 w-full bg-gray-200 rounded overflow-hidden mt-1">
                            {dimensionalityReductionResult.explainedVariance.map((variance: number, index: number) => (
                              <div
                                key={index}
                                className="h-full bg-blue-500 float-left"
                                style={{ width: `${variance * 100}%` }}
                                title={`Component ${index + 1}: ${(variance * 100).toFixed(2)}%`}
                              />
                            ))}
                          </div>
                          <div className="text-xs mt-1">
                            {dimensionalityReductionResult.explainedVariance.map((variance: number, index: number) => (
                              <span key={index} className="mr-4">
                                Component {index + 1}: {(variance * 100).toFixed(2)}%
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <p className="mt-2"><strong>Projected Data Sample:</strong></p>
                      <pre className="text-xs overflow-auto p-2 bg-gray-200 rounded">
                        {JSON.stringify(dimensionalityReductionResult.projectedData.slice(0, 5), null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {anomalyDetectionResult && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Anomaly Detection Result</h3>
                    <div className="bg-gray-100 p-4 rounded">
                      <p><strong>Algorithm:</strong> {anomalyDetectionResult.algorithm}</p>
                      <p><strong>Threshold:</strong> {anomalyDetectionResult.threshold.toFixed(4)}</p>
                      <p><strong>Anomalies Found:</strong> {anomalyDetectionResult.anomalies.length}</p>
                      <p><strong>Anomaly Rate:</strong> {(anomalyDetectionResult.anomalies.length / anomalyDetectionResult.scores.length * 100).toFixed(2)}%</p>
                      
                      <div className="mt-4">
                        <p><strong>Anomaly Indices (first 10):</strong></p>
                        <pre className="text-xs overflow-auto p-2 bg-gray-200 rounded">
                          {JSON.stringify(anomalyDetectionResult.anomalies.slice(0, 10), null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
                
                {!clusteringResult && !dimensionalityReductionResult && !anomalyDetectionResult && (
                  <p className="text-gray-500">No results yet. Run an algorithm to see results.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Current State</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="font-medium">Dataset ID:</p>
            <p className="font-mono text-sm">{datasetId || 'None'}</p>
          </div>
          <div>
            <p className="font-medium">Model ID:</p>
            <p className="font-mono text-sm">{modelId || 'None'}</p>
          </div>
          <div>
            <p className="font-medium">Result ID:</p>
            <p className="font-mono text-sm">{resultId || 'None'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
