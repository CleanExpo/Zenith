import { PythonDataAnalysisService } from './pythonDataAnalysisService';
import { DataAnalysisToolCredentials, Dataset, VisualizationParams, VisualizationResult } from './baseDataAnalysisService';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

// Mock logger
jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

// Mock cache methods
jest.mock('./baseDataAnalysisService', () => {
  const originalModule = jest.requireActual('./baseDataAnalysisService');
  return {
    ...originalModule,
    BaseDataAnalysisService: class {
      protected toolName: string;
      protected baseUrl: string;
      protected apiKey: string;
      protected userId: string;
      protected cacheKeyPrefix: string;
      protected additionalCredentials?: Record<string, any>;

      constructor(credentials: DataAnalysisToolCredentials) {
        this.toolName = credentials.toolName;
        this.apiKey = credentials.apiKey;
        this.userId = credentials.userId;
        this.cacheKeyPrefix = credentials.cacheKeyPrefix;
        this.additionalCredentials = credentials.additionalCredentials;
        this.baseUrl = process.env.PYTHON_DATA_ANALYSIS_API_URL || 'https://api.example.com/python-data-analysis';
      }

      async getCachedDatasets(): Promise<Dataset[] | null> {
        return null;
      }

      async cacheDatasets(datasets: Dataset[]): Promise<void> {
        // Mock implementation
      }

      async getCachedDataset(id: string): Promise<Dataset | null> {
        return null;
      }

      async cacheDataset(dataset: Dataset): Promise<void> {
        // Mock implementation
      }

      async cacheVisualizationResult(visualizationResult: VisualizationResult): Promise<void> {
        // Mock implementation
      }
    }
  };
});

describe('PythonDataAnalysisService', () => {
  let service: PythonDataAnalysisService;
  const credentials: DataAnalysisToolCredentials = {
    toolName: 'Python',
    apiKey: 'test-api-key',
    userId: 'test-user-id',
    cacheKeyPrefix: 'python-data-analysis'
  };

  beforeEach(() => {
    service = new PythonDataAnalysisService(credentials);
  });

  describe('getDatasets', () => {
    it('should return datasets from cache if available', async () => {
      const mockDatasets: Dataset[] = [
        {
          id: '1',
          name: 'Sample Python Dataset 1',
          description: 'A sample dataset for testing with Python',
          columns: [
            { name: 'id', type: 'numeric', description: 'Unique identifier' },
            { name: 'name', type: 'text', description: 'Name of the item' },
            { name: 'value', type: 'numeric', description: 'Value of the item' }
          ],
          rowCount: 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ownerId: 'test-user-id',
          isShared: false,
          source: 'upload',
          format: 'csv',
          size: 1024
        }
      ];

      jest.spyOn(service, 'getCachedDatasets').mockResolvedValue(mockDatasets);

      const datasets = await service.getDatasets();

      expect(datasets).toEqual(mockDatasets);
      expect(logger.info).toHaveBeenCalledWith('Retrieved datasets from cache', {
        userId: 'test-user-id',
        count: mockDatasets.length
      });
    });

    it('should return datasets from API if cache is not available', async () => {
      const mockDatasets: Dataset[] = [
        {
          id: '1',
          name: 'Sample Python Dataset 1',
          description: 'A sample dataset for testing with Python',
          columns: [
            { name: 'id', type: 'numeric', description: 'Unique identifier' },
            { name: 'name', type: 'text', description: 'Name of the item' },
            { name: 'value', type: 'numeric', description: 'Value of the item' }
          ],
          rowCount: 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ownerId: 'test-user-id',
          isShared: false,
          source: 'upload',
          format: 'csv',
          size: 1024
        }
      ];

      jest.spyOn(service, 'getCachedDatasets').mockResolvedValue(null);
      jest.spyOn(service, 'cacheDatasets').mockResolvedValue(undefined);

      const datasets = await service.getDatasets();

      expect(datasets).toEqual(mockDatasets);
      expect(logger.info).toHaveBeenCalledWith('Retrieved datasets from API', {
        userId: 'test-user-id',
        count: mockDatasets.length
      });
    });
  });

  describe('getDataset', () => {
    it('should return dataset from cache if available', async () => {
      const mockDataset: Dataset = {
        id: '1',
        name: 'Python Dataset 1',
        description: 'A Python dataset with ID 1',
        columns: [
          { name: 'id', type: 'numeric', description: 'Unique identifier' },
          { name: 'name', type: 'text', description: 'Name of the item' },
          { name: 'value', type: 'numeric', description: 'Value of the item' }
        ],
        rowCount: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 'test-user-id',
        isShared: false,
        source: 'upload',
        format: 'csv',
        size: 1024
      };

      jest.spyOn(service, 'getCachedDataset').mockResolvedValue(mockDataset);

      const dataset = await service.getDataset('1');

      expect(dataset).toEqual(mockDataset);
      expect(logger.info).toHaveBeenCalledWith('Retrieved dataset from cache', {
        userId: 'test-user-id',
        datasetId: '1'
      });
    });

    it('should return dataset from API if cache is not available', async () => {
      const mockDataset: Dataset = {
        id: '1',
        name: 'Python Dataset 1',
        description: 'A Python dataset with ID 1',
        columns: [
          { name: 'id', type: 'numeric', description: 'Unique identifier' },
          { name: 'name', type: 'text', description: 'Name of the item' },
          { name: 'value', type: 'numeric', description: 'Value of the item' }
        ],
        rowCount: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 'test-user-id',
        isShared: false,
        source: 'upload',
        format: 'csv',
        size: 1024
      };

      jest.spyOn(service, 'getCachedDataset').mockResolvedValue(null);
      jest.spyOn(service, 'cacheDataset').mockResolvedValue(undefined);

      const dataset = await service.getDataset('1');

      expect(dataset).toEqual(mockDataset);
      expect(logger.info).toHaveBeenCalledWith('Retrieved dataset from API', {
        userId: 'test-user-id',
        datasetId: '1'
      });
    });
  });

  describe('createVisualization', () => {
    it('should create a visualization and return the result', async () => {
      const params: VisualizationParams = {
        title: 'Test Visualization',
        type: 'bar',
        datasetId: '1',
        analysisId: '1',
        params: {}
      };

      const visualizationResult: VisualizationResult = {
        id: expect.any(String),
        type: 'bar',
        datasetId: '1',
        analysisId: '1',
        params: {},
        createdAt: expect.any(String),
        ownerId: 'test-user-id',
        status: 'completed',
        imageData: `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="50" height="100" fill="blue" />
          <rect x="70" y="60" width="50" height="50" fill="blue" />
          <rect x="130" y="30" width="50" height="80" fill="blue" />
          <rect x="190" y="80" width="50" height="30" fill="blue" />
        </svg>`,
        htmlContent: `<div id="visualization-${expect.any(String)}" class="visualization">
          <h3>Test Visualization</h3>
          <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="50" height="100" fill="blue" />
            <rect x="70" y="60" width="50" height="50" fill="blue" />
            <rect x="130" y="30" width="50" height="80" fill="blue" />
            <rect x="190" y="80" width="50" height="30" fill="blue" />
          </svg>
        </div>`,
        viewUrl: `/visualizations/${expect.any(String)}`,
        executionTime: 1000
      };

      const result = await service.createVisualization(params);

      expect(result).toEqual(visualizationResult);
      expect(logger.info).toHaveBeenCalledWith('Created visualization', {
        userId: 'test-user-id',
        visualizationId: result.id,
        type: 'bar',
        datasetId: '1'
      });
    });
  });
});
