import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Assuming @ is configured for src path
import type { Database } from '@/lib/database.types';

export async function GET(request: Request) {
  const supabase = createClient();

  try {
    // First, check if the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('API: research-projects GET - Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // User is authenticated, fetch their research projects
    // RLS policies on the 'research_projects' table should ensure
    // that only projects belonging to the authenticated user are returned
    // if the policy `auth.uid() = user_id` is in place.
    const { data: projects, error: dbError } = await supabase
      .from('research_projects')
      .select('*');

    if (dbError) {
      console.error('API: research-projects GET - DB error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json(projects);

  } catch (e: any) {
    console.error('API: research-projects GET - Unexpected error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred: ' + e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('API: research-projects POST - Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // The user_id will be the id of the authenticated user
    const { data: newProject, error: dbError } = await supabase
      .from('research_projects')
      .insert([{ title, description, user_id: user.id }])
      .select()
      .single(); // .single() to get the inserted row back

    if (dbError) {
      console.error('API: research-projects POST - DB error:', dbError);
      // Consider more specific error handling, e.g., for unique constraint violations
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json(newProject, { status: 201 });

  } catch (e: any) {
    console.error('API: research-projects POST - Unexpected error:', e);
    if (e instanceof SyntaxError) { // Handle cases where request.json() fails
      return NextResponse.json({ error: 'Invalid JSON in request body: ' + e.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred: ' + e.message }, { status: 500 });
  }
}
