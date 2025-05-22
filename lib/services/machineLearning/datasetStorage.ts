import fs from 'fs';
import path from 'path';
import { Dataset } from './supervisedLearningService';

const DATASET_STORAGE_FILE = path.join(__dirname, 'datasets.json');

// Load existing datasets from the file
let datasets: Record<string, Dataset> = {};
if (fs.existsSync(DATASET_STORAGE_FILE)) {
  const data = fs.readFileSync(DATASET_STORAGE_FILE, 'utf-8');
  datasets = JSON.parse(data);
}

/**
 * Save datasets to the file
 */
const saveDatasets = () => {
  fs.writeFileSync(DATASET_STORAGE_FILE, JSON.stringify(datasets, null, 2));
};

/**
 * Add a dataset to storage
 * @param dataset The dataset to add
 */
export const addDataset = (dataset: Dataset) => {
  datasets[dataset.id] = dataset;
  saveDatasets();
};

/**
 * Get a dataset by ID
 * @param id The dataset ID
 * @returns The dataset, or undefined if not found
 */
export const getDataset = (id: string): Dataset | undefined => {
  return datasets[id];
};

/**
 * Delete a dataset by ID
 * @param id The dataset ID
 */
export const deleteDataset = (id: string) => {
  delete datasets[id];
  saveDatasets();
};
