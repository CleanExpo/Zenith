/**
 * Machine Learning Client Component
 * 
 * This is the client-side component for the machine learning page.
 */

'use client';

import { MachineLearningDemo } from '@/components/machine-learning/MachineLearningDemo';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Machine learning client component
 */
export function MachineLearningClient() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Machine Learning</h1>
          <p className="text-muted-foreground mt-2">
            Leverage advanced machine learning capabilities for your research projects
          </p>
        </div>
        
        <FeatureGate feature="machineLearning">
          <MachineLearningDemo />
        </FeatureGate>
        
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>About Machine Learning in Zenith</CardTitle>
            <CardDescription>
              Understanding the machine learning capabilities available to you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Supervised Learning</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Supervised learning algorithms learn from labeled training data to make predictions or decisions.
                Zenith provides a range of supervised learning algorithms for classification and regression tasks.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">Unsupervised Learning</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Unsupervised learning algorithms find patterns in unlabeled data. Zenith offers clustering,
                dimensionality reduction, and anomaly detection algorithms to help you discover insights in your data.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">Model Deployment</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Once you've trained a model, you can deploy it to make predictions on new data. Zenith provides
                tools for model deployment, monitoring, and management.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">Integration with Research Projects</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Machine learning models can be integrated with your research projects to automate analysis,
                make predictions, and discover insights. Use the API to connect your models to your research workflows.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
