import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

export interface SearchResult {
  id: string;
  type: 'project' | 'task' | 'note' | 'file';
  title: string;
  content?: string;
  project_id?: string;
  project_title?: string;
  created_at: string;
  updated_at?: string;
  url: string;
  match_details?: string | null;
}

export interface SearchOptions {
  types?: ('project' | 'task' | 'note' | 'file')[];
  projectId?: string;
  limit?: number;
  offset?: number;
}

export class SearchService {
  private supabase = createClient();

  /**
   * Search across projects, tasks, notes, and files
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    try {
      if (!query.trim()) {
        return [];
      }

      const searchQuery = query.trim().toLowerCase();
      const types = options.types || ['project', 'task', 'note', 'file'];
      const limit = options.limit || 20;
      const offset = options.offset || 0;
      const projectId = options.projectId;

      const results: SearchResult[] = [];

      // Search in parallel for better performance
      const searchPromises: Promise<any>[] = [];

      // Search projects
      if (types.includes('project')) {
        searchPromises.push(this.searchProjects(searchQuery, limit, offset, projectId));
      }

      // Search tasks
      if (types.includes('task')) {
        searchPromises.push(this.searchTasks(searchQuery, limit, offset, projectId));
      }

      // Search notes
      if (types.includes('note')) {
        searchPromises.push(this.searchNotes(searchQuery, limit, offset, projectId));
      }

      // Search files
      if (types.includes('file')) {
        searchPromises.push(this.searchFiles(searchQuery, limit, offset, projectId));
      }

      // Wait for all search operations to complete
      const searchResults = await Promise.all(searchPromises);

      // Combine and flatten results
      searchResults.forEach(items => {
        if (items && items.length) {
          results.push(...items);
        }
      });

      // Sort by relevance (for now, just use updated_at as a proxy for relevance)
      results.sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at);
        const dateB = new Date(b.updated_at || b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      logger.info('Search completed', { query: searchQuery, resultCount: results.length });
      return results;
    } catch (error: any) {
      logger.error('Error in search', { error: error.message, query });
      throw error;
    }
  }

  /**
   * Search projects
   */
  private async searchProjects(
    query: string,
    limit: number,
    offset: number,
    projectId?: string
  ): Promise<SearchResult[]> {
    try {
      let queryBuilder = this.supabase
        .from('research_projects')
        .select('id, title, description, created_at, updated_at')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (projectId) {
        queryBuilder = queryBuilder.eq('id', projectId);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        throw error;
      }

      return (data || []).map(project => ({
        id: project.id,
        type: 'project' as const,
        title: project.title,
        content: project.description,
        created_at: project.created_at,
        updated_at: project.updated_at,
        url: `/dashboard/projects/${project.id}`,
        match_details: this.highlightMatch(project.title, query) || 
                       this.highlightMatch(project.description || '', query)
      }));
    } catch (error: any) {
      logger.error('Error searching projects', { error: error.message, query });
      return [];
    }
  }

  /**
   * Search tasks
   */
  private async searchTasks(
    query: string,
    limit: number,
    offset: number,
    projectId?: string
  ): Promise<SearchResult[]> {
    try {
      let queryBuilder = this.supabase
        .from('project_tasks')
        .select(`
          id, title, description, due_date, completed, created_at, updated_at,
          project_id, research_projects(title)
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (projectId) {
        queryBuilder = queryBuilder.eq('project_id', projectId);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        throw error;
      }

      return (data || []).map(task => {
        // Extract project title from the nested research_projects object
        const projectTitle = task.research_projects && 
                            Array.isArray(task.research_projects) && 
                            task.research_projects.length > 0 ? 
                            task.research_projects[0].title : 
                            (task.research_projects as any)?.title || '';

        return {
          id: task.id,
          type: 'task' as const,
          title: task.title,
          content: task.description,
          project_id: task.project_id,
          project_title: projectTitle,
          created_at: task.created_at,
          updated_at: task.updated_at,
          url: `/dashboard/projects/${task.project_id}?tab=tasks`,
          match_details: this.highlightMatch(task.title, query) || 
                        this.highlightMatch(task.description || '', query)
        };
      });
    } catch (error: any) {
      logger.error('Error searching tasks', { error: error.message, query });
      return [];
    }
  }

  /**
   * Search notes
   */
  private async searchNotes(
    query: string,
    limit: number,
    offset: number,
    projectId?: string
  ): Promise<SearchResult[]> {
    try {
      let queryBuilder = this.supabase
        .from('project_notes')
        .select(`
          id, title, content, created_at, updated_at,
          project_id, research_projects(title)
        `)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (projectId) {
        queryBuilder = queryBuilder.eq('project_id', projectId);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        throw error;
      }

      return (data || []).map(note => {
        // Extract project title from the nested research_projects object
        const projectTitle = note.research_projects && 
                            Array.isArray(note.research_projects) && 
                            note.research_projects.length > 0 ? 
                            note.research_projects[0].title : 
                            (note.research_projects as any)?.title || '';

        return {
          id: note.id,
          type: 'note' as const,
          title: note.title,
          content: note.content,
          project_id: note.project_id,
          project_title: projectTitle,
          created_at: note.created_at,
          updated_at: note.updated_at,
          url: `/dashboard/projects/${note.project_id}?tab=notes`,
          match_details: this.highlightMatch(note.title, query) || 
                        this.highlightMatch(note.content || '', query)
        };
      });
    } catch (error: any) {
      logger.error('Error searching notes', { error: error.message, query });
      return [];
    }
  }

  /**
   * Search files
   */
  private async searchFiles(
    query: string,
    limit: number,
    offset: number,
    projectId?: string
  ): Promise<SearchResult[]> {
    try {
      let queryBuilder = this.supabase
        .from('project_files')
        .select(`
          id, file_name, file_path, description, created_at, updated_at,
          project_id, research_projects(title)
        `)
        .or(`file_name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (projectId) {
        queryBuilder = queryBuilder.eq('project_id', projectId);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        throw error;
      }

      return (data || []).map(file => {
        // Extract project title from the nested research_projects object
        const projectTitle = file.research_projects && 
                            Array.isArray(file.research_projects) && 
                            file.research_projects.length > 0 ? 
                            file.research_projects[0].title : 
                            (file.research_projects as any)?.title || '';

        return {
          id: file.id,
          type: 'file' as const,
          title: file.file_name,
          content: file.description,
          project_id: file.project_id,
          project_title: projectTitle,
          created_at: file.created_at,
          updated_at: file.updated_at,
          url: `/dashboard/projects/${file.project_id}?tab=files`,
          match_details: this.highlightMatch(file.file_name, query) || 
                        this.highlightMatch(file.description || '', query)
        };
      });
    } catch (error: any) {
      logger.error('Error searching files', { error: error.message, query });
      return [];
    }
  }

  /**
   * Highlight matching text in a string
   */
  private highlightMatch(text: string, query: string): string | null {
    if (!text) return null;
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    const index = lowerText.indexOf(lowerQuery);
    if (index === -1) return null;
    
    // Get a snippet of text around the match
    const snippetStart = Math.max(0, index - 30);
    const snippetEnd = Math.min(text.length, index + query.length + 30);
    let snippet = text.substring(snippetStart, snippetEnd);
    
    // Add ellipsis if we're not at the beginning or end
    if (snippetStart > 0) snippet = '...' + snippet;
    if (snippetEnd < text.length) snippet = snippet + '...';
    
    return snippet;
  }
}

export const searchService = new SearchService();
