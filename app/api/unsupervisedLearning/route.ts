import { NextRequest, NextResponse } from 'next/server';
import { UnsupervisedLearningService } from '@/lib/services/machineLearning/unsupervisedLearningService';

// Helper function to get user ID from request
function getUserId(request: NextRequest): string | null {
  return request.headers.get('x-user-id');
}

// Helper function to handle errors
function handleError(error: unknown) {
  console.error('API error:', error);
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Unknown error occurred' },
    { status: 500 }
  );
}

// POST handler for datasets
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
  }
  
  const unsupervisedLearningService = new UnsupervisedLearningService(userId);
  
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';
    const body = await request.json();
    
    // Handle different endpoints
    if (path === 'datasets') {
      const { name, description, features, rowCount, tags, dataSource } = body;
      const dataset = await unsupervisedLearningService.createDataset(
        name, description, features, rowCount, tags, dataSource
      );
      return NextResponse.json(dataset, { status: 201 });
    } 
    else if (path === 'clustering') {
      const { datasetId, algorithm, parameters } = body;
      const result = await unsupervisedLearningService.performClustering(
        datasetId, algorithm, parameters
      );
      return NextResponse.json(result, { status: 201 });
    } 
    else if (path === 'dimensionalityReduction') {
      const { datasetId, algorithm, parameters } = body;
      const result = await unsupervisedLearningService.performDimensionalityReduction(
        datasetId, algorithm, parameters
      );
      return NextResponse.json(result, { status: 201 });
    } 
    else if (path === 'anomalyDetection') {
      const { datasetId, algorithm, parameters } = body;
      const result = await unsupervisedLearningService.performAnomalyDetection(
        datasetId, algorithm, parameters
      );
      return NextResponse.json(result, { status: 201 });
    } 
    else {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } catch (error) {
    return handleError(error);
  }
}

// GET handler
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
  }
  
  const unsupervisedLearningService = new UnsupervisedLearningService(userId);
  
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    // Handle different endpoints
    if (path === 'datasets') {
      const dataset = await unsupervisedLearningService.getDataset(id);
      return NextResponse.json(dataset);
    } 
    else if (path === 'clustering') {
      const result = await unsupervisedLearningService.getClusteringResult(id);
      return NextResponse.json(result);
    } 
    else if (path === 'dimensionalityReduction') {
      const result = await unsupervisedLearningService.getDimensionalityReductionResult(id);
      return NextResponse.json(result);
    } 
    else if (path === 'anomalyDetection') {
      const result = await unsupervisedLearningService.getAnomalyDetectionResult(id);
      return NextResponse.json(result);
    } 
    else {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } catch (error) {
    return handleError(error);
  }
}

// DELETE handler
export async function DELETE(request: NextRequest) {
  const userId = getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
  }
  
  const unsupervisedLearningService = new UnsupervisedLearningService(userId);
  
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    // Handle different endpoints
      if (path === 'datasets') {
        return new NextResponse(null, { status: 204 });
      } 
    else if (path === 'clustering') {
      await unsupervisedLearningService.deleteClusteringResult(id);
      return new NextResponse(null, { status: 204 });
    } 
    else if (path === 'dimensionalityReduction') {
      await unsupervisedLearningService.deleteDimensionalityReductionResult(id);
      return new NextResponse(null, { status: 204 });
    } 
    else if (path === 'anomalyDetection') {
      await unsupervisedLearningService.deleteAnomalyDetectionResult(id);
      return new NextResponse(null, { status: 204 });
    } 
    else {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } catch (error) {
    return handleError(error);
  }
}
