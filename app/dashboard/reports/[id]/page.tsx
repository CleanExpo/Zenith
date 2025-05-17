import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import EnhancedReportDisplay from '@/components/dashboard/reports/EnhancedReportDisplay';

export const dynamic = 'force-dynamic';

interface ReportPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try { cookieStore.set({ name, value, ...options }); } catch (error) {}
        },
        remove: (name, options) => {
          try { cookieStore.set({ name, value: '', ...options }); } catch (error) {}
        },
      },
    }
  );
  
  try {
    const { data: report } = await supabase
      .from('custom_reports')
      .select('title, description')
      .eq('id', params.id)
      .single();
    
    if (!report) {
      return {
        title: 'Report Not Found',
      };
    }
    
    return {
      title: `${report.title} | Zenith`,
      description: report.description || 'Enhanced report with external data',
    };
  } catch (error) {
    return {
      title: 'Report | Zenith',
    };
  }
}

export default async function ReportPage({ params }: ReportPageProps) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try { cookieStore.set({ name, value, ...options }); } catch (error) {}
        },
        remove: (name, options) => {
          try { cookieStore.set({ name, value: '', ...options }); } catch (error) {}
        },
      },
    }
  );
  
  // Check if report exists
  const { data: report, error } = await supabase
    .from('custom_reports')
    .select('id')
    .eq('id', params.id)
    .single();
  
  if (error || !report) {
    notFound();
  }
  
  return (
    <div className="container mx-auto py-6">
      <EnhancedReportDisplay reportId={params.id} />
    </div>
  );
}
