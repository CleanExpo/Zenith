/**
 * Data Analysis Page
 * 
 * This page displays the data analysis client component.
 */

import { Metadata } from 'next';
import DataAnalysisClient from './client';

export const metadata: Metadata = {
  title: 'Data Analysis | Zenith',
  description: 'Analyze your research data with powerful data analysis tools.',
};

/**
 * Data Analysis Page
 */
export default function DataAnalysisPage() {
  return <DataAnalysisClient />;
}
