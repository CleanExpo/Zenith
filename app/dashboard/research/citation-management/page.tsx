import { Metadata } from 'next';
import { CitationManagementClient } from './client';

export const metadata: Metadata = {
  title: 'Citation Management | Zenith Research Platform',
  description: 'Manage your citations and references across different citation management tools.',
};

export default function CitationManagementPage() {
  return <CitationManagementClient />;
}
