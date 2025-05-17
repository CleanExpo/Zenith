import { Metadata } from 'next';
import { UserRole } from '@/lib/auth/types';
import PermissionGuard from '@/components/auth/PermissionGuard';
import CacheMonitoring from '@/components/admin/CacheMonitoring';

export const metadata: Metadata = {
  title: 'Cache Monitoring | Admin Dashboard',
  description: 'Monitor and manage application cache',
};

export default function CachePage() {
  return (
    <PermissionGuard role={UserRole.ADMIN} fallback={<AccessDenied />}>
      <div className="container mx-auto py-8">
        <CacheMonitoring />
      </div>
    </PermissionGuard>
  );
}

function AccessDenied() {
  return (
    <div className="container mx-auto py-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
      <p className="mb-6">You do not have permission to access this page.</p>
      <a 
        href="/dashboard" 
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
      >
        Return to Dashboard
      </a>
    </div>
  );
}
