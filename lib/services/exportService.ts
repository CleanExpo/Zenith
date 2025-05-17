import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { format } from 'date-fns';

interface ExportOptions {
  includeNotes?: boolean;
  includeTasks?: boolean;
  includeFiles?: boolean;
  includeComments?: boolean;
  includeAnalytics?: boolean;
}

export class ExportService {
  private supabase = createClient();

  /**
   * Export a project to JSON format
   */
  async exportProjectToJson(projectId: string, options: ExportOptions = {}): Promise<void> {
    try {
      // Get project data
      const projectData = await this.getProjectData(projectId, options);
      
      // Convert to JSON and create blob
      const jsonString = JSON.stringify(projectData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Generate filename with date
      const filename = `${projectData.project.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.json`;
      
      // Save file
      saveAs(blob, filename);
      
      logger.info('Project exported to JSON', { projectId });
    } catch (error: any) {
      logger.error('Error exporting project to JSON', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Export a project to CSV format
   */
  async exportProjectToCsv(projectId: string, options: ExportOptions = {}): Promise<void> {
    try {
      // Get project data
      const projectData = await this.getProjectData(projectId, options);
      
      // Create CSV for project details
      const projectCsv = Papa.unparse([{
        Project_ID: projectData.project.id,
        Title: projectData.project.title,
        Description: projectData.project.description,
        Created_At: projectData.project.created_at,
        Updated_At: projectData.project.updated_at
      }]);
      
      // Create CSV for tasks if included
      let tasksCsv = '';
      if (options.includeTasks && projectData.tasks && projectData.tasks.length > 0) {
        tasksCsv = Papa.unparse(projectData.tasks.map((task: any) => ({
          Task_ID: task.id,
          Title: task.title,
          Description: task.description,
          Due_Date: task.due_date,
          Completed: task.completed ? 'Yes' : 'No',
          Created_At: task.created_at,
          Updated_At: task.updated_at
        })));
      }
      
      // Create CSV for notes if included
      let notesCsv = '';
      if (options.includeNotes && projectData.notes && projectData.notes.length > 0) {
        notesCsv = Papa.unparse(projectData.notes.map((note: any) => ({
          Note_ID: note.id,
          Title: note.title,
          Content: note.content,
          Created_At: note.created_at,
          Updated_At: note.updated_at
        })));
      }
      
      // Combine all CSVs with headers
      const combinedCsv = [
        '# PROJECT DETAILS',
        projectCsv,
        '',
        options.includeTasks && projectData.tasks && projectData.tasks.length > 0 ? '# TASKS' : '',
        options.includeTasks && projectData.tasks && projectData.tasks.length > 0 ? tasksCsv : '',
        '',
        options.includeNotes && projectData.notes && projectData.notes.length > 0 ? '# NOTES' : '',
        options.includeNotes && projectData.notes && projectData.notes.length > 0 ? notesCsv : ''
      ].filter(Boolean).join('\n');
      
      // Create blob and save
      const blob = new Blob([combinedCsv], { type: 'text/csv;charset=utf-8' });
      const filename = `${projectData.project.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      saveAs(blob, filename);
      
      logger.info('Project exported to CSV', { projectId });
    } catch (error: any) {
      logger.error('Error exporting project to CSV', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Export a project to PDF format
   */
  async exportProjectToPdf(projectId: string, options: ExportOptions = {}): Promise<void> {
    try {
      // Get project data
      const projectData = await this.getProjectData(projectId, options);
      
      // Create PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text(projectData.project.title, 14, 22);
      
      // Add project details
      doc.setFontSize(12);
      doc.text('Project Details', 14, 35);
      doc.setFontSize(10);
      
      // Add description with word wrap
      const splitDescription = doc.splitTextToSize(
        `Description: ${projectData.project.description || 'No description'}`, 
        180
      );
      doc.text(splitDescription, 14, 45);
      
      let yPosition = 45 + (splitDescription.length * 5);
      
      // Add created/updated dates
      doc.text(`Created: ${format(new Date(projectData.project.created_at), 'PPP')}`, 14, yPosition + 5);
      doc.text(`Last Updated: ${format(new Date(projectData.project.updated_at || projectData.project.created_at), 'PPP')}`, 14, yPosition + 10);
      
      yPosition += 20;
      
      // Add tasks if included
      if (options.includeTasks && projectData.tasks && projectData.tasks.length > 0) {
        doc.setFontSize(12);
        doc.text('Tasks', 14, yPosition);
        yPosition += 10;
        
        // Create task table
        (doc as any).autoTable({
          startY: yPosition,
          head: [['Title', 'Description', 'Due Date', 'Status']],
          body: projectData.tasks.map((task: any) => [
            task.title,
            task.description || '',
            task.due_date ? format(new Date(task.due_date), 'PP') : 'No due date',
            task.completed ? 'Completed' : 'Pending'
          ]),
          margin: { top: 10 },
          styles: { overflow: 'linebreak' },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 70 },
            2: { cellWidth: 30 },
            3: { cellWidth: 30 }
          }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // Add notes if included
      if (options.includeNotes && projectData.notes && projectData.notes.length > 0) {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(12);
        doc.text('Notes', 14, yPosition);
        yPosition += 10;
        
        // Add each note
        projectData.notes.forEach((note: any, index: number) => {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(11);
          doc.text(note.title, 14, yPosition);
          yPosition += 5;
          
          doc.setFontSize(10);
          const splitContent = doc.splitTextToSize(note.content || 'No content', 180);
          doc.text(splitContent, 14, yPosition);
          yPosition += (splitContent.length * 5) + 10;
          
          // Add separator except for last note
          if (index < projectData.notes.length - 1) {
            doc.setDrawColor(200, 200, 200);
            doc.line(14, yPosition - 5, 196, yPosition - 5);
            yPosition += 5;
          }
        });
      }
      
      // Add analytics summary if included
      if (options.includeAnalytics && projectData.analytics) {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(12);
        doc.text('Analytics Summary', 14, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        if (projectData.analytics.taskCompletion) {
          doc.text(`Task Completion Rate: ${projectData.analytics.taskCompletion.rate}%`, 14, yPosition);
          yPosition += 5;
          doc.text(`Completed Tasks: ${projectData.analytics.taskCompletion.completed}`, 14, yPosition);
          yPosition += 5;
          doc.text(`Total Tasks: ${projectData.analytics.taskCompletion.total}`, 14, yPosition);
          yPosition += 10;
        }
        
        if (projectData.analytics.activitySummary) {
          doc.text(`Total Activities: ${projectData.analytics.activitySummary.total}`, 14, yPosition);
          yPosition += 5;
          doc.text(`Last Activity: ${projectData.analytics.activitySummary.lastActivity}`, 14, yPosition);
          yPosition += 10;
        }
      }
      
      // Save the PDF
      const filename = `${projectData.project.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(filename);
      
      logger.info('Project exported to PDF', { projectId });
    } catch (error: any) {
      logger.error('Error exporting project to PDF', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Get all project data for export
   */
  private async getProjectData(projectId: string, options: ExportOptions = {}): Promise<any> {
    try {
      // Get project details
      const { data: project, error: projectError } = await this.supabase
        .from('research_projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (projectError) {
        throw projectError;
      }
      
      if (!project) {
        throw new Error('Project not found');
      }
      
      // Initialize result object
      const result: any = { project };
      
      // Get tasks if requested
      if (options.includeTasks) {
        const { data: tasks, error: tasksError } = await this.supabase
          .from('project_tasks')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });
        
        if (tasksError) {
          logger.error('Error fetching tasks for export', { error: tasksError.message, projectId });
        } else {
          result.tasks = tasks;
        }
      }
      
      // Get notes if requested
      if (options.includeNotes) {
        const { data: notes, error: notesError } = await this.supabase
          .from('project_notes')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });
        
        if (notesError) {
          logger.error('Error fetching notes for export', { error: notesError.message, projectId });
        } else {
          result.notes = notes;
        }
      }
      
      // Get files metadata if requested
      if (options.includeFiles) {
        const { data: files, error: filesError } = await this.supabase
          .from('project_files')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });
        
        if (filesError) {
          logger.error('Error fetching files for export', { error: filesError.message, projectId });
        } else {
          result.files = files;
        }
      }
      
      // Get comments if requested
      if (options.includeComments) {
        const { data: comments, error: commentsError } = await this.supabase
          .from('comments')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });
        
        if (commentsError) {
          logger.error('Error fetching comments for export', { error: commentsError.message, projectId });
        } else {
          result.comments = comments;
        }
      }
      
      // Get analytics if requested
      if (options.includeAnalytics) {
        // Get task completion rate
        const { data: tasks, error: tasksError } = await this.supabase
          .from('project_tasks')
          .select('id, completed')
          .eq('project_id', projectId);
        
        if (!tasksError && tasks) {
          const totalTasks = tasks.length;
          const completedTasks = tasks.filter(task => task.completed).length;
          const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          
          result.analytics = {
            taskCompletion: {
              total: totalTasks,
              completed: completedTasks,
              rate: completionRate
            }
          };
        }
        
        // Get activity summary
        const { data: activities, error: activitiesError } = await this.supabase
          .from('activity_logs')
          .select('id, created_at')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (!activitiesError && activities) {
          const { count, error: countError } = await this.supabase
            .from('activity_logs')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId);
          
          if (!countError) {
            result.analytics = {
              ...result.analytics,
              activitySummary: {
                total: count,
                lastActivity: activities.length > 0 ? format(new Date(activities[0].created_at), 'PPP p') : 'No activities'
              }
            };
          }
        }
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error getting project data for export', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Import a project from JSON
   */
  async importProjectFromJson(file: File): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string;
            const projectData = JSON.parse(content);
            
            // Validate project data
            if (!projectData.project || !projectData.project.title) {
              throw new Error('Invalid project data: Missing project title');
            }
            
            // Create new project
            const { data: newProject, error: projectError } = await this.supabase
              .from('research_projects')
              .insert({
                title: projectData.project.title,
                description: projectData.project.description,
                // Don't copy over the original IDs or timestamps
              })
              .select()
              .single();
            
            if (projectError || !newProject) {
              throw projectError || new Error('Failed to create project');
            }
            
            // Import tasks if available
            if (projectData.tasks && projectData.tasks.length > 0) {
              const tasksToInsert = projectData.tasks.map((task: any) => ({
                project_id: newProject.id,
                title: task.title,
                description: task.description,
                due_date: task.due_date,
                completed: task.completed
              }));
              
              const { error: tasksError } = await this.supabase
                .from('project_tasks')
                .insert(tasksToInsert);
              
              if (tasksError) {
                logger.error('Error importing tasks', { error: tasksError.message });
              }
            }
            
            // Import notes if available
            if (projectData.notes && projectData.notes.length > 0) {
              const notesToInsert = projectData.notes.map((note: any) => ({
                project_id: newProject.id,
                title: note.title,
                content: note.content
              }));
              
              const { error: notesError } = await this.supabase
                .from('project_notes')
                .insert(notesToInsert);
              
              if (notesError) {
                logger.error('Error importing notes', { error: notesError.message });
              }
            }
            
            logger.info('Project imported from JSON', { projectId: newProject.id });
            resolve(newProject.id);
          } catch (error: any) {
            logger.error('Error processing import file', { error: error.message });
            reject(error);
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Error reading file'));
        };
        
        reader.readAsText(file);
      });
    } catch (error: any) {
      logger.error('Error importing project from JSON', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a new project from a template
   */
  async createProjectFromTemplate(templateId: string): Promise<string> {
    try {
      // Get template data
      const { data: template, error: templateError } = await this.supabase
        .from('project_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (templateError || !template) {
        throw templateError || new Error('Template not found');
      }
      
      // Create new project from template
      const { data: newProject, error: projectError } = await this.supabase
        .from('research_projects')
        .insert({
          title: template.title,
          description: template.description
        })
        .select()
        .single();
      
      if (projectError || !newProject) {
        throw projectError || new Error('Failed to create project from template');
      }
      
      // Import template tasks
      if (template.tasks && template.tasks.length > 0) {
        const tasksToInsert = template.tasks.map((task: any) => ({
          project_id: newProject.id,
          title: task.title,
          description: task.description,
          due_date: task.due_date ? new Date(task.due_date) : null,
          completed: false // Always set as incomplete for new projects
        }));
        
        const { error: tasksError } = await this.supabase
          .from('project_tasks')
          .insert(tasksToInsert);
        
        if (tasksError) {
          logger.error('Error importing template tasks', { error: tasksError.message });
        }
      }
      
      // Import template notes
      if (template.notes && template.notes.length > 0) {
        const notesToInsert = template.notes.map((note: any) => ({
          project_id: newProject.id,
          title: note.title,
          content: note.content
        }));
        
        const { error: notesError } = await this.supabase
          .from('project_notes')
          .insert(notesToInsert);
        
        if (notesError) {
          logger.error('Error importing template notes', { error: notesError.message });
        }
      }
      
      logger.info('Project created from template', { projectId: newProject.id, templateId });
      return newProject.id;
    } catch (error: any) {
      logger.error('Error creating project from template', { error: error.message, templateId });
      throw error;
    }
  }

  /**
   * Save current project as a template
   */
  async saveProjectAsTemplate(
    projectId: string, 
    templateName: string, 
    description?: string,
    isPublic: boolean = false
  ): Promise<string> {
    try {
      // Get project data
      const projectData = await this.getProjectData(projectId, {
        includeTasks: true,
        includeNotes: true
      });
      
      // Create template
      const { data: template, error: templateError } = await this.supabase
        .from('project_templates')
        .insert({
          title: templateName,
          description: description || projectData.project.description,
          tasks: projectData.tasks || [],
          notes: projectData.notes || [],
          created_by: (await this.supabase.auth.getUser()).data.user?.id,
          is_public: isPublic
        })
        .select()
        .single();
      
      if (templateError || !template) {
        throw templateError || new Error('Failed to save template');
      }
      
      logger.info('Project saved as template', { projectId, templateId: template.id });
      return template.id;
    } catch (error: any) {
      logger.error('Error saving project as template', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Get available project templates
   */
  async getProjectTemplates(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('project_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting project templates', { error: error.message });
      throw error;
    }
  }
}

export const exportService = new ExportService();
