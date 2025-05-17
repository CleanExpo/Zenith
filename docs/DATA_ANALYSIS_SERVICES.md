# Data Analysis Services

This document provides an overview of the data analysis services in the Zenith platform, including their architecture, capabilities, and usage.

## Architecture

The data analysis services follow a modular architecture with the following components:

1. **BaseDataAnalysisService**: An abstract base class that defines the common interface and functionality for all data analysis services.
2. **PythonDataAnalysisService**: A concrete implementation for Python-based data analysis.
3. **RDataAnalysisService**: A concrete implementation for R-based data analysis.
4. **DataAnalysisToolFactory**: A factory class for creating instances of specific data analysis services.

### Class Diagram

```
┌───────────────────────┐
│DataAnalysisToolFactory│
└───────────┬───────────┘
            │ creates
            ▼
┌───────────────────────┐
│BaseDataAnalysisService│◄────────────┐
└───────────────────────┘             │
            ▲                         │
            │                         │
            │ extends                 │ extends
            │                         │
┌───────────┴───────────┐   ┌─────────┴─────────┐
│PythonDataAnalysisService│   │RDataAnalysisService│
└───────────────────────┘   └───────────────────┘
```

## Capabilities

The data analysis services provide the following capabilities:

### Dataset Management

- **Create**: Create new datasets from various sources (API, file upload, etc.)
- **Read**: Retrieve datasets and their metadata
- **Update**: Modify dataset properties
- **Delete**: Remove datasets
- **Upload**: Upload datasets from files
- **Download**: Download datasets in various formats (CSV, JSON, Excel)

### Data Analysis

- **Descriptive Statistics**: Calculate basic statistics (mean, median, min, max, etc.)
- **Correlation Analysis**: Compute correlation matrices
- **Regression Analysis**: Perform linear and non-linear regression

### Data Transformation

- **Filtering**: Filter datasets based on conditions
- **Aggregation**: Group and aggregate data
- **Joining**: Combine multiple datasets
- **Reshaping**: Pivot, melt, and reshape data

### Visualization

- **Bar Charts**: Create bar charts for categorical data
- **Line Charts**: Generate line charts for time series data
- **Scatter Plots**: Create scatter plots for correlation analysis
- **Custom Visualizations**: Generate custom visualizations based on specific requirements

### Custom Script Execution

- Execute custom Python or R scripts on datasets
- Support for various libraries and packages (pandas, NumPy, scikit-learn, etc.)

## Usage

### Creating a Data Analysis Service

To create a data analysis service, use the `DataAnalysisToolFactory`:

```typescript
import { DataAnalysisToolFactory } from '@/lib/services/dataAnalysis/dataAnalysisToolFactory';

// Create a Python data analysis service
const pythonService = DataAnalysisToolFactory.createTool('python', {
  apiKey: 'your-api-key',
  userId: 'user-id',
  additionalCredentials: {
    // Additional credentials if needed
  }
});

// Create an R data analysis service
const rService = DataAnalysisToolFactory.createTool('r', {
  apiKey: 'your-api-key',
  userId: 'user-id',
  additionalCredentials: {
    // Additional credentials if needed
  }
});
```

### Working with Datasets

```typescript
// Create a new dataset
const dataset = await pythonService.createDataset(
  'My Dataset',
  'A sample dataset',
  [
    { name: 'id', type: 'numeric', description: 'Unique identifier' },
    { name: 'name', type: 'text', description: 'Name of the item' },
    { name: 'value', type: 'numeric', description: 'Value of the item' }
  ],
  [
    { id: 1, name: 'Item 1', value: 10 },
    { id: 2, name: 'Item 2', value: 20 },
    { id: 3, name: 'Item 3', value: 30 }
  ]
);

// Get all datasets
const datasets = await pythonService.getDatasets();

// Get a specific dataset
const dataset = await pythonService.getDataset('dataset-id');

// Update a dataset
const updatedDataset = await pythonService.updateDataset(
  'dataset-id',
  'New Name',
  'New Description'
);

// Delete a dataset
const deleted = await pythonService.deleteDataset('dataset-id');

// Upload a dataset from a file
const uploadedDataset = await pythonService.uploadDataset(
  file,
  'Uploaded Dataset',
  'A dataset uploaded from a file'
);

// Download a dataset
const blob = await pythonService.downloadDataset('dataset-id', 'csv');
```

### Performing Analysis

```typescript
// Perform descriptive statistics analysis
const descriptiveAnalysis = await pythonService.performAnalysis({
  type: 'descriptive',
  datasetId: 'dataset-id'
});

// Perform correlation analysis
const correlationAnalysis = await pythonService.performAnalysis({
  type: 'correlation',
  datasetId: 'dataset-id',
  columns: ['column1', 'column2', 'column3']
});

// Perform regression analysis
const regressionAnalysis = await pythonService.performAnalysis({
  type: 'regression',
  datasetId: 'dataset-id',
  dependent: 'dependent-column',
  independent: ['independent-column1', 'independent-column2']
});

// Get an analysis result
const analysisResult = await pythonService.getAnalysisResult('analysis-id');

// Delete an analysis result
const deleted = await pythonService.deleteAnalysisResult('analysis-id');
```

### Transforming Data

```typescript
// Filter a dataset
const filteredDataset = await pythonService.transformDataset({
  type: 'filter',
  datasetId: 'dataset-id',
  filter: 'value > 10'
});

// Aggregate a dataset
const aggregatedDataset = await pythonService.transformDataset({
  type: 'aggregate',
  datasetId: 'dataset-id',
  groupBy: 'category',
  aggregations: [
    { column: 'value', function: 'sum' },
    { column: 'value', function: 'mean' }
  ]
});

// Get a transformation result
const transformationResult = await pythonService.getTransformationResult('transformation-id');

// Delete a transformation result
const deleted = await pythonService.deleteTransformationResult('transformation-id');
```

### Creating Visualizations

```typescript
// Create a bar chart
const barChart = await pythonService.createVisualization({
  type: 'bar',
  datasetId: 'dataset-id',
  title: 'Sample Bar Chart',
  xAxis: 'name',
  yAxis: 'value'
});

// Create a line chart
const lineChart = await pythonService.createVisualization({
  type: 'line',
  datasetId: 'dataset-id',
  title: 'Sample Line Chart',
  xAxis: 'date',
  yAxis: 'value'
});

// Create a scatter plot
const scatterPlot = await pythonService.createVisualization({
  type: 'scatter',
  datasetId: 'dataset-id',
  title: 'Sample Scatter Plot',
  xAxis: 'column1',
  yAxis: 'column2'
});

// Get a visualization result
const visualizationResult = await pythonService.getVisualizationResult('visualization-id');

// Delete a visualization result
const deleted = await pythonService.deleteVisualizationResult('visualization-id');
```

### Executing Custom Scripts

```typescript
// Execute a custom Python script
const pythonScriptResult = await pythonService.executeScript(
  `
  import pandas as pd
  import numpy as np
  
  # Load the dataset
  df = pd.read_json(datasets[0])
  
  # Perform some analysis
  result = df.describe().to_dict()
  
  # Return the result
  result
  `,
  'python',
  ['dataset-id']
);

// Execute a custom R script
const rScriptResult = await rService.executeScript(
  `
  # Load the dataset
  df <- read.json(datasets[1])
  
  # Perform some analysis
  result <- summary(df)
  
  # Return the result
  result
  `,
  'r',
  ['dataset-id']
);
```

## Caching

The data analysis services use Redis for caching to improve performance. The following items are cached:

- Datasets
- Analysis results
- Transformation results
- Visualization results

The cache is automatically invalidated when items are updated or deleted.

## Error Handling

The data analysis services use a consistent error handling approach:

1. All errors are logged using the logger
2. Errors are propagated to the caller with appropriate context
3. The original error is preserved for debugging purposes

Example:

```typescript
try {
  // Perform some operation
} catch (error) {
  logger.error('Error performing operation', {
    error: error instanceof Error ? error.message : String(error),
    userId: this.userId,
    // Additional context
  });
  
  throw error;
}
```

## Future Enhancements

The data analysis services are designed to be extensible and can be enhanced with additional features:

- **Machine Learning**: Add support for training and using machine learning models
- **Time Series Analysis**: Implement specialized time series analysis functions
- **Text Mining**: Add text mining and natural language processing capabilities
- **Network Analysis**: Implement graph and network analysis functions
- **Geospatial Analysis**: Add support for geospatial data and analysis

## Conclusion

The data analysis services provide a flexible and powerful foundation for data analysis in the Zenith platform. They can be easily extended with additional features and optimizations to meet evolving requirements.
