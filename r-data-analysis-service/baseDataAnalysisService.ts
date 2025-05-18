export abstract class BaseDataAnalysisService {}

export interface DataAnalysisToolCredentials {
  apiKey: string;
  userId: string;
  additionalCredentials?: Record<string, any>;
}

export interface DataColumn {
  name: string;
  type: "numeric" | "text" | "categorical" | "datetime";
  description: string;
  categories?: string[];
  format?: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  columns: DataColumn[];
  rowCount: number;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  isShared: boolean;
  source: string;
  format: string;
  size: number;
}

export interface AnalysisParams {
  type: string;
  datasetId: string;
  [key: string]: any;
}

export interface AnalysisResult {
  id: string;
  type: string;
  datasetId: string;
  params: AnalysisParams;
  createdAt: string;
  ownerId: string;
  status: string;
  results: any;
  executionTime: number;
}

export interface TransformationParams {
  type: string;
  datasetId: string;
  [key: string]: any;
}

export interface TransformationResult {
  id: string;
  type: string;
  datasetId: string;
  params: TransformationParams;
  createdAt: string;
  ownerId: string;
  status: string;
  resultDatasetId: string;
  executionTime: number;
}

export interface VisualizationParams {
  type: string;
  datasetId: string;
  analysisId?: string;
  title?: string;
  xAxis?: string;
  yAxis?: string;
  [key: string]: any;
}

export interface VisualizationResult {
  id: string;
  type: string;
  datasetId: string;
  analysisId?: string;
  params: VisualizationParams;
  createdAt: string;
  ownerId: string;
  status: string;
  imageData?: string;
  htmlContent?: string;
  viewUrl?: string;
  executionTime: number;
}
