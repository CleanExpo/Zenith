/**
 * Machine Learning Hook
 * 
 * This hook provides access to machine learning services.
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { MachineLearningServiceFactory, MachineLearningServiceType } from '@/lib/services/machineLearning/machineLearningServiceFactory';
import { 
  ModelType, 
  AlgorithmType, 
  Dataset, 
  Model, 
  Prediction, 
  Feature 
} from '@/lib/services/machineLearning/supervisedLearningService';
import { 
  UnsupervisedAlgorithmType, 
  UnsupervisedModelType, 
  ClusteringResult, 
  DimensionalityReductionResult, 
  AnomalyDetectionResult 
} from '@/lib/services/machineLearning/unsupervisedLearningService';

/**
 * Machine learning hook
 */
export function useMachineLearning() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  /**
   * Create a dataset for supervised learning
   */
  const createSupervisedDataset = useCallback(async (
    name: string,
    description: string,
    features: Feature[],
    targetFeature: string,
    rowCount: number,
    tags?: string[],
    dataSource?: string
  ): Promise<Dataset | null> => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const service = MachineLearningServiceFactory.getSupervisedLearningService(user.id);
      
      const dataset = await service.createDataset(
        name,
        description,
        features,
        targetFeature,
        rowCount,
        tags,
        dataSource
      );
      
      toast({
        title: 'Dataset Created',
        description: `Dataset "${name}" has been created successfully.`
      });
      
      return dataset;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      setError(new Error(errorMessage));
      
      toast({
        title: 'Error Creating Dataset',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  
  /**
   * Create a dataset for unsupervised learning
   */
  const createUnsupervisedDataset = useCallback(async (
    name: string,
    description: string,
    features: Feature[],
    rowCount: number,
    tags?: string[],
    dataSource?: string
  ): Promise<Dataset | null> => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const service = MachineLearningServiceFactory.getUnsupervisedLearningService(user.id);
      
      const dataset = await service.createDataset(
        name,
        description,
        features,
        rowCount,
        tags,
        dataSource
      );
      
      toast({
        title: 'Dataset Created',
        description: `Dataset "${name}" has been created successfully.`
      });
      
      return dataset;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      setError(new Error(errorMessage));
      
      toast({
        title: 'Error Creating Dataset',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  
  /**
   * Train a supervised learning model
   */
  const trainModel = useCallback(async (
    name: string,
    description: string,
    type: ModelType,
    algorithm: AlgorithmType,
    datasetId: string,
    parameters: Record<string, any>
  ): Promise<Model | null> => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const service = MachineLearningServiceFactory.getSupervisedLearningService(user.id);
      
      const model = await service.trainModel(
        name,
        description,
        type,
        algorithm,
        datasetId,
        parameters
      );
      
      toast({
        title: 'Model Training Started',
        description: `Model "${name}" is now training. You will be notified when it's ready.`
      });
      
      return model;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      setError(new Error(errorMessage));
      
      toast({
        title: 'Error Training Model',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  
  /**
   * Make a prediction with a supervised learning model
   */
  const predict = useCallback(async (
    modelId: string,
    input: Record<string, any>
  ): Promise<Prediction | null> => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const service = MachineLearningServiceFactory.getSupervisedLearningService(user.id);
      
      const prediction = await service.predict(modelId, input);
      
      toast({
        title: 'Prediction Made',
        description: 'The prediction has been made successfully.'
      });
      
      return prediction;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      setError(new Error(errorMessage));
      
      toast({
        title: 'Error Making Prediction',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  
  /**
   * Perform clustering
   */
  const performClustering = useCallback(async (
    datasetId: string,
    algorithm: UnsupervisedAlgorithmType,
    parameters: Record<string, any>
  ): Promise<ClusteringResult | null> => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const service = MachineLearningServiceFactory.getUnsupervisedLearningService(user.id);
      
      const result = await service.performClustering(datasetId, algorithm, parameters);
      
      toast({
        title: 'Clustering Completed',
        description: `Clustering with ${algorithm} has been completed successfully.`
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      setError(new Error(errorMessage));
      
      toast({
        title: 'Error Performing Clustering',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  
  /**
   * Perform dimensionality reduction
   */
  const performDimensionalityReduction = useCallback(async (
    datasetId: string,
    algorithm: UnsupervisedAlgorithmType,
    parameters: Record<string, any>
  ): Promise<DimensionalityReductionResult | null> => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const service = MachineLearningServiceFactory.getUnsupervisedLearningService(user.id);
      
      const result = await service.performDimensionalityReduction(datasetId, algorithm, parameters);
      
      toast({
        title: 'Dimensionality Reduction Completed',
        description: `Dimensionality reduction with ${algorithm} has been completed successfully.`
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      setError(new Error(errorMessage));
      
      toast({
        title: 'Error Performing Dimensionality Reduction',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  
  /**
   * Perform anomaly detection
   */
  const performAnomalyDetection = useCallback(async (
    datasetId: string,
    algorithm: UnsupervisedAlgorithmType,
    parameters: Record<string, any>
  ): Promise<AnomalyDetectionResult | null> => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const service = MachineLearningServiceFactory.getUnsupervisedLearningService(user.id);
      
      const result = await service.performAnomalyDetection(datasetId, algorithm, parameters);
      
      toast({
        title: 'Anomaly Detection Completed',
        description: `Anomaly detection with ${algorithm} has been completed successfully.`
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      setError(new Error(errorMessage));
      
      toast({
        title: 'Error Performing Anomaly Detection',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  
  /**
   * Get a dataset
   */
  const getDataset = useCallback(async (
    datasetId: string,
    type: MachineLearningServiceType
  ): Promise<Dataset | null> => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const service = MachineLearningServiceFactory.getService(type, user.id);
      
      const dataset = await service.getDataset(datasetId);
      
      return dataset;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      setError(new Error(errorMessage));
      
      toast({
        title: 'Error Getting Dataset',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  
  /**
   * Get a model
   */
  const getModel = useCallback(async (
    modelId: string
  ): Promise<Model | null> => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const service = MachineLearningServiceFactory.getSupervisedLearningService(user.id);
      
      const model = await service.getModel(modelId);
      
      return model;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      setError(new Error(errorMessage));
      
      toast({
        title: 'Error Getting Model',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  
  /**
   * Get a clustering result
   */
  const getClusteringResult = useCallback(async (
    resultId: string
  ): Promise<ClusteringResult | null> => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const service = MachineLearningServiceFactory.getUnsupervisedLearningService(user.id);
      
      const result = await service.getClusteringResult(resultId);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      setError(new Error(errorMessage));
      
      toast({
        title: 'Error Getting Clustering Result',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  
  /**
   * Get a dimensionality reduction result
   */
  const getDimensionalityReductionResult = useCallback(async (
    resultId: string
  ): Promise<DimensionalityReductionResult | null> => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const service = MachineLearningServiceFactory.getUnsupervisedLearningService(user.id);
      
      const result = await service.getDimensionalityReductionResult(resultId);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      setError(new Error(errorMessage));
      
      toast({
        title: 'Error Getting Dimensionality Reduction Result',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  
  /**
   * Get an anomaly detection result
   */
  const getAnomalyDetectionResult = useCallback(async (
    resultId: string
  ): Promise<AnomalyDetectionResult | null> => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const service = MachineLearningServiceFactory.getUnsupervisedLearningService(user.id);
      
      const result = await service.getAnomalyDetectionResult(resultId);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      setError(new Error(errorMessage));
      
      toast({
        title: 'Error Getting Anomaly Detection Result',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  
  return {
    loading,
    error,
    createSupervisedDataset,
    createUnsupervisedDataset,
    trainModel,
    predict,
    performClustering,
    performDimensionalityReduction,
    performAnomalyDetection,
    getDataset,
    getModel,
    getClusteringResult,
    getDimensionalityReductionResult,
    getAnomalyDetectionResult
  };
}
