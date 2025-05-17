// Zenith/app/dashboard/page.tsx
import DashboardClientPage from './page.client';

export default function DashboardPage() {
  // This is a simple wrapper that renders the client component
  // This avoids the "Dynamic server usage" error with cookies()
  return <DashboardClientPage />;
}
