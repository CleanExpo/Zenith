import { describe, it, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { UnsupervisedLearningService, UnsupervisedAlgorithmType } from './unsupervisedLearningService';
import { ClusteringParameters, DimensionalityReductionParameters, AnomalyDetectionParameters } from './unsupervisedLearningService';

describe('UnsupervisedLearningService', () => {
  let service: UnsupervisedLearningService;

  beforeEach(() => {
    service = new UnsupervisedLearningService('testUserId');
  });

  it('should perform clustering', async () => {
    const datasetId = 'testDatasetId';
const algorithm = UnsupervisedAlgorithmType.KMEANS;
const parameters: ClusteringParameters = { k: 3 };

    const result = await service.performClustering(datasetId, algorithm, parameters);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('datasetId', datasetId);
    expect(result).toHaveProperty('algorithm', algorithm);
    expect(result).toHaveProperty('parameters', parameters);
    expect(result).toHaveProperty('clusters');
    expect(result).toHaveProperty('labels');
    expect(result).toHaveProperty('metrics');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('ownerId', 'testUserId');
  });

  it('should perform dimensionality reduction', async () => {
    const datasetId = 'testDatasetId';
const algorithm = UnsupervisedAlgorithmType.PCA;
    const parameters = { components: 2 };

    const result = await service.performDimensionalityReduction(datasetId, algorithm, parameters);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('datasetId', datasetId);
    expect(result).toHaveProperty('algorithm', algorithm);
    expect(result).toHaveProperty('parameters', parameters);
    expect(result).toHaveProperty('components', 2);
    expect(result).toHaveProperty('projectedData');
    expect(result).toHaveProperty('explainedVariance');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('ownerId', 'testUserId');
  });

  it('should perform anomaly detection', async () => {
    const datasetId = 'testDatasetId';
const algorithm = UnsupervisedAlgorithmType.ISOLATION_FOREST;
    const parameters = { contamination: 0.05 };

    const result = await service.performAnomalyDetection(datasetId, algorithm, parameters);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('datasetId', datasetId);
    expect(result).toHaveProperty('algorithm', algorithm);
    expect(result).toHaveProperty('parameters', parameters);
    expect(result).toHaveProperty('anomalies');
    expect(result).toHaveProperty('scores');
    expect(result).toHaveProperty('threshold');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('ownerId', 'testUserId');
  });
});
