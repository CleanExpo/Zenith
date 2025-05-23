import { Dataset } from './supervisedLearningService';

// In-memory storage for datasets (in a real app, this would be a database)
let datasets: Record<string, Dataset> = {};

/**
 * Add a dataset to storage
 * @param dataset The dataset to add
 */
export const addDataset = (dataset: Dataset) => {
  datasets[dataset.id] = dataset;
  
  // In a real application, you would save to a database here
  if (typeof window === 'undefined') {
    // Server-side: could save to database
    console.log(`Dataset ${dataset.id} added to storage`);
  } else {
    // Client-side: could save to localStorage
    try {
      localStorage.setItem('ml_datasets', JSON.stringify(datasets));
    } catch (error) {
      console.warn('Failed to save datasets to localStorage:', error);
    }
  }
};

/**
 * Get a dataset by ID
 * @param id The dataset ID
 * @returns The dataset, or undefined if not found
 */
export const getDataset = (id: string): Dataset | undefined => {
  // Try to load from localStorage on client-side if datasets is empty
  if (typeof window !== 'undefined' && Object.keys(datasets).length === 0) {
    try {
      const stored = localStorage.getItem('ml_datasets');
      if (stored) {
        datasets = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load datasets from localStorage:', error);
    }
  }
  
  return datasets[id];
};

/**
 * Get all datasets
 * @returns All datasets
 */
export const getAllDatasets = (): Dataset[] => {
  // Try to load from localStorage on client-side if datasets is empty
  if (typeof window !== 'undefined' && Object.keys(datasets).length === 0) {
    try {
      const stored = localStorage.getItem('ml_datasets');
      if (stored) {
        datasets = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load datasets from localStorage:', error);
    }
  }
  
  return Object.values(datasets);
};

/**
 * Delete a dataset by ID
 * @param id The dataset ID
 */
export const deleteDataset = (id: string) => {
  delete datasets[id];
  
  // In a real application, you would delete from database here
  if (typeof window === 'undefined') {
    // Server-side: could delete from database
    console.log(`Dataset ${id} deleted from storage`);
  } else {
    // Client-side: update localStorage
    try {
      localStorage.setItem('ml_datasets', JSON.stringify(datasets));
    } catch (error) {
      console.warn('Failed to update datasets in localStorage:', error);
    }
  }
};

/**
 * Clear all datasets
 */
export const clearAllDatasets = () => {
  datasets = {};
  
  if (typeof window === 'undefined') {
    // Server-side: could clear database
    console.log('All datasets cleared from storage');
  } else {
    // Client-side: clear localStorage
    try {
      localStorage.removeItem('ml_datasets');
    } catch (error) {
      console.warn('Failed to clear datasets from localStorage:', error);
    }
  }
};
