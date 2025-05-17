/**
 * Academic Databases Page
 * 
 * This page provides a user interface for searching academic databases
 * like PubMed, Scopus, IEEE, etc. It allows users to search for publications
 * and view the results.
 */

import { Metadata } from 'next';
import { AcademicDatabasesClient } from './client';

export const metadata: Metadata = {
  title: 'Academic Databases | Zenith',
  description: 'Search academic databases for research publications',
};

export default function AcademicDatabasesPage() {
  return <AcademicDatabasesClient />;
}
