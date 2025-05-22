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
    service = new SupervisedLearningService('testUserId');
  });

  describe('createDataset', () => {
    it('should create a new dataset', async () => {
      const dataset = await service.createDataset(
        'Test Dataset',
        'This is a test dataset',
        [{ name: 'feature1', type: 'numeric' }],
        'feature1',
        100
      );

      expect(dataset.id).toBeDefined();
      expect(dataset.name).toBe('Test Dataset');
      expect(dataset.description).toBe('This is a test dataset');
      expect(dataset.features).toEqual([{ name: 'feature1', type: 'numeric' }]);
      expect(dataset.targetFeature).toBe('feature1');
      expect(dataset.rowCount).toBe(100);
      expect(dataset.createdAt).toBeDefined();
      expect(dataset.updatedAt).toBeDefined();
      expect(dataset.ownerId).toBe('testUserId');
      expect(dataset.tags).toBeUndefined();
      expect(dataset.dataSource).toBeUndefined();
    });
  });

  describe('getDataset', () => {
    it('should throw an error if dataset is not found', async () => {
      await expect(service.getDataset('nonExistentId')).rejects.toThrow('Dataset not found: nonExistentId');
    });
  });

  describe('updateDataset', () => {
    it('should update an existing dataset', async () => {
      const dataset = await service.createDataset(
        'Test Dataset',
        'This is a test dataset',
        [{ name: 'feature1', type: 'numeric' }],
        'feature1',
        100
      );

      const updatedDataset = await service.updateDataset(
        dataset.id,
        'Updated Test Dataset',
        'This is an updated test dataset',
        [{ name: 'feature1', type: 'numeric', importance: 1 }],
        'feature1',
        ['tag1', 'tag2']
      );

      expect(updatedDataset.name).toBe('Updated Test Dataset');
      expect(updatedDataset.description).toBe('This is an updated test dataset');
      expect(updatedDataset.features).toEqual([{ name: 'feature1', type: 'numeric', importance: 1 }]);
      expect(updatedDataset.targetFeature).toBe('feature1');
      expect(updatedDataset.tags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('deleteDataset', () => {
    it('should delete a dataset', async () => {
      const dataset = await service.createDataset(
        'Test Dataset',
        'This is a test dataset',
        [{ name: 'feature1', type: 'numeric' }],
        'feature1',
        100
      );

      const result = await service.deleteDataset(dataset.id);
      expect(result).toBe(true);
    });
  });

  describe('trainModel', () => {
    it('should create and train a new model', async () => {
      const dataset = await service.createDataset(
        'Test Dataset',
        'This is a test dataset',
        [{ name: 'feature1', type: 'numeric' }],
        'feature1',
        100
      );

      const model = await service.trainModel(
        'Test Model',
        'This is a test model',
        'classification',
        'logistic_regression',
        dataset.id,
        { param1: 'value1' }
      );

      expect(model.id).toBeDefined();
      expect(model.name).toBe('Test Model');
      expect(model.description).toBe('This is a test model');
      expect(model.type).toBe('classification');
      expect(model.algorithm).toBe('logistic_regression');
      expect(model.datasetId).toBe(dataset.id);
      expect(model.parameters).toEqual({ param1: 'value1' });
      expect(model.metrics).toEqual({});
      expect(model.featureImportance).toBeUndefined();
      expect(model.createdAt).toBeDefined();
      expect(model.updatedAt).toBeDefined();
      expect(model.ownerId).toBe('testUserId');
      expect(model.status).toBe('training');
      expect(model.errorMessage).toBeUndefined();
      expect(model.version).toBe(1);

      // Wait for the model to be trained
      await new Promise(resolve => setTimeout(resolve, 3000));

      const trainedModel = await service.getModel(model.id);
      expect(trainedModel.status).toBe('trained');
      expect(trainedModel.metrics).toBeDefined();
      expect(trainedModel.featureImportance).toBeDefined();
    });
  });

  describe('getModel', () => {
    it('should throw an error if model is not found', async () => {
      await expect(service.getModel('nonExistentId')).rejects.toThrow('Model not found: nonExistentId');
    });
  });

  describe('updateModel', () => {
    it('should update an existing model', async () => {
      const dataset = await service.createDataset(
        'Test Dataset',
        'This is a test dataset',
        [{ name: 'feature1', type: 'numeric' }],
        'feature1',
        100
      );

      const model = await service.trainModel(
        'Test Model',
        'This is a test model',
        'classification',
        'logistic_regression',
        dataset.id,
        { param1: 'value1' }
      );

      // Wait for the model to be trained
      await new Promise(resolve => setTimeout(resolve, 3000));

      const updatedModel = await service.updateModel(
        model.id,
        'Updated Test Model',
        'This is an updated test model'
      );

      expect(updatedModel.name).toBe('Updated Test Model');
      expect(updatedModel.description).toBe('This is an updated test model');
    });
  });

  describe('deleteModel', () => {
    it('should delete a model', async () => {
      const dataset = await service.createDataset(
        'Test Dataset',
        'This is a test dataset',
        [{ name: 'feature1', type: 'numeric' }],
        'feature1',
        100
      );

      const model = await service.trainModel(
        'Test Model',
        'This is a test model',
        'classification',
        'logistic_regression',
        dataset.id,
        { param1: 'value1' }
      );

      // Wait for the model to be trained
      await new Promise(resolve => setTimeout(resolve, 3000));

      const result = await service.deleteModel(model.id);
      expect(result).toBe(true);
    });
  });

  describe('predict', () => {
    it('should make a prediction with a trained model', async () => {
      const dataset = await service.createDataset(
        'Test Dataset',
        'This is a test dataset',
        [{ name: 'feature1', type: 'numeric' }],
        'feature1',
        100
      );

      const model = await service.trainModel(
        'Test Model',
        'This is a test model',
        'classification',
        'logistic_regression',
        dataset.id,
        { param1: 'value1' }
      );

      // Wait for the model to be trained
      await new Promise(resolve => setTimeout(resolve, 3000));

      const prediction = await service.predict(
        model.id,
        { feature1: 10 }
      );

      expect(prediction.id).toBeDefined();
      expect(prediction.modelId).toBe(model.id);
      expect(prediction.input).toEqual({ feature1: 10 });
      expect(prediction.output).toBeDefined();
      expect(prediction.confidence).toBeDefined();
      expect(prediction.explanation).toBeDefined();
      expect(prediction.createdAt).toBeDefined();
    });

    it('should throw an error if the model is not trained', async () => {
      const dataset = await service.createDataset(
        'Test Dataset',
        'This is a test dataset',
        [{ name: 'feature1', type: 'numeric' }],
        'feature1',
        100
      );

      const model = await service.trainModel(
        'Test Model',
        'This is a test model',
        'classification',
        'logistic_regression',
        dataset.id,
        { param1: 'value1' }
      );

      await expect(service.predict(
        model.id,
        { feature1: 10 }
      )).rejects.toThrow('Model is not trained: ' + model.id);
    });
  });

  describe('evaluateModel', () => {
    it('should evaluate a trained model', async () => {
      const dataset = await service.createDataset(
        'Test Dataset',
        'This is a test dataset',
        [{ name: 'feature1', type: 'numeric' }],
        'feature1',
        100
      );

      const model = await service.trainModel(
        'Test Model',
        'This is a test model',
        'classification',
        'logistic_regression',
        dataset.id,
        { param1: 'value1' }
      );

      // Wait for the model to be trained
      await new Promise(resolve => setTimeout(resolve, 3000));

      const testDataset = await service.createDataset(
        'Test Dataset 2',
        'This is a test dataset 2',
        [{ name: 'feature1', type: 'numeric' }],
        'feature1',
        100
      );

      const metrics = await service.evaluateModel(
        model.id,
        testDataset.id
      );

      expect(metrics).toBeDefined();
    });

    it('should throw an error if the model is not trained', async () => {
      const dataset = await service.createDataset(
        'Test Dataset',
        'This is a test dataset',
        [{ name: 'feature1', type: 'numeric' }],
        'feature1',
        100
      );

      const model = await service.trainModel(
        'Test Model',
        'This is a test model',
        'classification',
        'logistic_regression',
        dataset.id,
        { param1: 'value1' }
      );

      const testDataset = await service.createDataset(
        'Test Dataset 2',
        'This is a test dataset 2',
        [{ name: 'feature1', type: 'numeric' }],
        'feature1',
        100
      );

      await expect(service.evaluateModel(
        model.id,
        testDataset.id
      )).rejects.toThrow('Model is not trained: ' + model.id);
    });
  });
});
