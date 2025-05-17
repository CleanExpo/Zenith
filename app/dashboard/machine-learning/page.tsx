/**
 * Machine Learning Page
 * 
 * This page displays the machine learning capabilities of the Zenith platform.
 */

import { Metadata } from 'next';
import { MachineLearningClient } from './client';

export const metadata: Metadata = {
  title: 'Machine Learning | Zenith',
  description: 'Advanced machine learning capabilities for research projects'
};

/**
 * Machine learning page
 */
export default function MachineLearningPage() {
  return <MachineLearningClient />;
}
