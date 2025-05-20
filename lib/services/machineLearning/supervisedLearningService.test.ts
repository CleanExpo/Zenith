import { SupervisedLearningService } from './supervisedLearningService';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

// Mock logger
jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('SupervisedLearningService', () => {
  let service: SupervisedLearningService;

  beforeEach(() => {
    service = new SupervisedLearningService('test-user-id');
    (globalThis as any).cache = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('cacheDataset', () => {
    it('should cache a dataset', async () => {
      const dataset = {
        id: uuidv4(),
        name: 'Test Dataset',
        description: 'A test dataset',
        features: [],
        targetFeature: 'target',
        rowCount: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 'test-user-id',
        tags: ['test'],
        dataSource: 'test-source'
      };

      await service.cacheDataset(dataset);

      expect((globalThis as any).cache).toHaveProperty(`supervised-learning:dataset:${dataset.id}`, JSON.stringify(dataset));
      expect(logger.info).toHaveBeenCalledWith('Cached dataset', {
        userId: 'test-user-id',
        datasetId: dataset.id,
        cacheKey: `supervised-learning:dataset:${dataset.id}`
      });
    });
  });

  describe('getCachedDataset', () => {
    it('should retrieve a cached dataset', async () => {
      const dataset = {
        id: uuidv4(),
        name: 'Test Dataset',
        description: 'A test dataset',
        features: [],
        targetFeature: 'target',
        rowCount: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 'test-user-id',
        tags: ['test'],
        dataSource: 'test-source'
      };

      (globalThis as any).cache[`supervised-learning:dataset:${dataset.id}`] = JSON.stringify(dataset);

      const cachedDataset = await service.getCachedDataset(dataset.id);

      expect(cachedDataset).toEqual(dataset);
      expect(logger.info).toHaveBeenCalledWith('Retrieved dataset from cache', {
        userId: 'test-user-id',
        datasetId: dataset.id
      });
    });

    it('should return null if dataset is not cached', async () => {
      const datasetId = uuidv4();

      const cachedDataset = await service.getCachedDataset(datasetId);

      expect(cachedDataset).toBeNull();
    });
  });

  describe('cacheModel', () => {
    it('should cache a model', async () => {
      const model = {
        id: uuidv4(),
        name: 'Test Model',
        description: 'A test model',
        type: 'classification',
        algorithm: 'logistic_regression',
        datasetId: uuidv4(),
        parameters: {},
        metrics: {},
        featureImportance: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 'test-user-id',
        status: 'training',
        version: 1
      };

      await service.cacheModel(model);

      expect((globalThis as any).cache).toHaveProperty(`supervised-learning:model:${model.id}`, JSON.stringify(model));
      expect(logger.info).toHaveBeenCalledWith('Cached model', {
        userId: 'test-user-id',
        modelId: model.id,
        cacheKey: `supervised-learning:model:${model.id}`
      });
    });
  });

  describe('getCachedModel', () => {
    it('should retrieve a cached model', async () => {
      const model = {
        id: uuidv4(),
        name: 'Test Model',
        description: 'A test model',
        type: 'classification',
        algorithm: 'logistic_regression',
        datasetId: uuidv4(),
        parameters: {},
        metrics: {},
        featureImportance: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 'test-user-id',
        status: 'training',
        version: 1
      };

      (globalThis as any).cache[`supervised-learning:model:${model.id}`] = JSON.stringify(model);

      const cachedModel = await service.getCachedModel(model.id);

      expect(cachedModel).toEqual(model);
      expect(logger.info).toHaveBeenCalledWith('Retrieved model from cache', {
        userId: 'test-user-id',
        modelId: model.id
      });
    });

    it('should return null if model is not cached', async () => {
      const modelId = uuidv4();

      const cachedModel = await service.getCachedModel(modelId);

      expect(cachedModel).toBeNull();
    });
  });

  describe('cachePrediction', () => {
    it('should cache a prediction', async () => {
      const prediction = {
        id: uuidv4(),
        modelId: uuidv4(),
        input: {},
        output: {},
        confidence: 0.85,
        explanation: {},
        createdAt: new Date().toISOString()
      };

      await service.cachePrediction(prediction);

      expect((globalThis as any).cache).toHaveProperty(`supervised-learning:prediction:${prediction.id}`, JSON.stringify(prediction));
      expect(logger.info).toHaveBeenCalledWith('Cached prediction', {
        userId: 'test-user-id',
        predictionId: prediction.id,
        cacheKey: `supervised-learning:prediction:${prediction.id}`
      });
    });
  });

  describe('getCachedPrediction', () => {
    it('should retrieve a cached prediction', async () => {
      const prediction = {
        id: uuidv4(),
        modelId: uuidv4(),
        input: {},
        output: {},
        confidence: 0.85,
        explanation: {},
        createdAt: new Date().toISOString()
      };

      (globalThis as any).cache[`supervised-learning:prediction:${prediction.id}`] = JSON.stringify(prediction);

      const cachedPrediction = await service.getCachedPrediction(prediction.id);

      expect(cachedPrediction).toEqual(prediction);
      expect(logger.info).toHaveBeenCalledWith('Retrieved prediction from cache', {
        userId: 'test-user-id',
        predictionId: prediction.id
      });
    });

    it('should return null if prediction is not cached', async () => {
      const predictionId = uuidv4();

      const cachedPrediction = await service.getCachedPrediction(predictionId);

      expect(cachedPrediction).toBeNull();
    });
  });
});
