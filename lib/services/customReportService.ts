import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { externalDataService } from './externalDataService';
import { enhancedAnalyticsService } from './enhancedAnalyticsService';
import { enhancedMlPredictionService } from './enhancedMlPredictionService';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: any[];
  created_by: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomReport {
  id: string;
  title: string;
  description: string;
  template_id: string | null;
  project_id: string | null;
  user_id: string;
  config: any;
  data: any;
  external_data_included: boolean;
  is_public: boolean;
  last_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportSection {
  id: string;
  report_id: string;
  section_type: string;
  title: string;
  content: any;
  external_data_source_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ReportExport {
  id: string;
  report_id: string;
  format: string;
  file_path: string | null;
  file_size: number | null;
  created_by: string | null;
  created_at: string;
  download_count: number;
}

export interface ReportShare {
  id: string;
  report_id: string;
  shared_with: string;
  shared_by: string | null;
  permission_level: string;
  created_at: string;
  expires_at: string | null;
}

export class CustomReportService {
  private supabase = createClient();

  /**
   * Get all report templates
   */
  async getReportTemplates(): Promise<ReportTemplate[]> {
    try {
      const { data, error } = await this.supabase
        .from('report_templates')
        .select('*')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting report templates', { error: error.message });
      return [];
    }
  }

  /**
   * Get report template by ID
   */
  async getReportTemplateById(templateId: string): Promise<ReportTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('report_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error getting report template by ID', { error: error.message, templateId });
      return null;
    }
  }

  /**
   * Create a new report template
   */
  async createReportTemplate(template: Omit<ReportTemplate, 'id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<ReportTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('report_templates')
        .insert(template)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error creating report template', { error: error.message });
      return null;
    }
  }

  /**
   * Get all custom reports for a user
   */
  async getUserReports(userId: string): Promise<CustomReport[]> {
    try {
      const { data, error } = await this.supabase
        .from('custom_reports')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting user reports', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Get all custom reports for a project
   */
  async getProjectReports(projectId: string): Promise<CustomReport[]> {
    try {
      const { data, error } = await this.supabase
        .from('custom_reports')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting project reports', { error: error.message, projectId });
      return [];
    }
  }

  /**
   * Get custom report by ID
   */
  async getReportById(reportId: string): Promise<CustomReport | null> {
    try {
      const { data, error } = await this.supabase
        .from('custom_reports')
        .select('*')
        .eq('id', reportId)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error getting report by ID', { error: error.message, reportId });
      return null;
    }
  }

  /**
   * Create a new custom report
   */
  async createReport(report: Omit<CustomReport, 'id' | 'data' | 'external_data_included' | 'last_generated_at' | 'created_at' | 'updated_at'>): Promise<CustomReport | null> {
    try {
      const { data, error } = await this.supabase
        .from('custom_reports')
        .insert({
          ...report,
          external_data_included: false,
          data: null
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error creating report', { error: error.message });
      return null;
    }
  }

  /**
   * Update a custom report
   */
  async updateReport(reportId: string, updates: Partial<CustomReport>): Promise<CustomReport | null> {
    try {
      const { data, error } = await this.supabase
        .from('custom_reports')
        .update(updates)
        .eq('id', reportId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error updating report', { error: error.message, reportId });
      return null;
    }
  }

  /**
   * Delete a custom report
   */
  async deleteReport(reportId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('custom_reports')
        .delete()
        .eq('id', reportId);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error: any) {
      logger.error('Error deleting report', { error: error.message, reportId });
      return false;
    }
  }

  /**
   * Get report sections
   */
  async getReportSections(reportId: string): Promise<ReportSection[]> {
    try {
      const { data, error } = await this.supabase
        .from('report_sections')
        .select('*')
        .eq('report_id', reportId)
        .order('display_order');
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting report sections', { error: error.message, reportId });
      return [];
    }
  }

  /**
   * Create a report section
   */
  async createReportSection(section: Omit<ReportSection, 'id' | 'created_at' | 'updated_at'>): Promise<ReportSection | null> {
    try {
      const { data, error } = await this.supabase
        .from('report_sections')
        .insert(section)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error creating report section', { error: error.message });
      return null;
    }
  }

  /**
   * Update a report section
   */
  async updateReportSection(sectionId: string, updates: Partial<ReportSection>): Promise<ReportSection | null> {
    try {
      const { data, error } = await this.supabase
        .from('report_sections')
        .update(updates)
        .eq('id', sectionId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error updating report section', { error: error.message, sectionId });
      return null;
    }
  }

  /**
   * Delete a report section
   */
  async deleteReportSection(sectionId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('report_sections')
        .delete()
        .eq('id', sectionId);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error: any) {
      logger.error('Error deleting report section', { error: error.message, sectionId });
      return false;
    }
  }

  /**
   * Generate a report
   */
  async generateReport(reportId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.rpc(
        'generate_report_with_external_data',
        { p_report_id: reportId }
      );
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error generating report', { error: error.message, reportId });
      return null;
    }
  }

  /**
   * Export report to JSON
   */
  async exportReportToJson(reportId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.rpc(
        'export_report_to_json',
        { p_report_id: reportId }
      );
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error exporting report to JSON', { error: error.message, reportId });
      return null;
    }
  }

  /**
   * Export report to specified format
   */
  async exportReport(reportId: string, format: string): Promise<string | null> {
    try {
      if (format.toLowerCase() === 'json') {
        return this.exportReportToJson(reportId);
      }
      
      const { data, error } = await this.supabase.rpc(
        'export_report',
        { 
          p_report_id: reportId,
          p_format: format.toLowerCase()
        }
      );
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error exporting report', { error: error.message, reportId, format });
      return null;
    }
  }

  /**
   * Share a report with a user
   */
  async shareReport(reportId: string, sharedWith: string, permissionLevel: string, expiresAt?: string): Promise<ReportShare | null> {
    try {
      const { data, error } = await this.supabase
        .from('report_shares')
        .insert({
          report_id: reportId,
          shared_with: sharedWith,
          permission_level: permissionLevel,
          expires_at: expiresAt
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error sharing report', { error: error.message, reportId, sharedWith });
      return null;
    }
  }

  /**
   * Get report shares
   */
  async getReportShares(reportId: string): Promise<ReportShare[]> {
    try {
      const { data, error } = await this.supabase
        .from('report_shares')
        .select('*')
        .eq('report_id', reportId);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting report shares', { error: error.message, reportId });
      return [];
    }
  }

  /**
   * Remove a report share
   */
  async removeReportShare(shareId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('report_shares')
        .delete()
        .eq('id', shareId);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error: any) {
      logger.error('Error removing report share', { error: error.message, shareId });
      return false;
    }
  }

  /**
   * Create a report from template
   */
  async createReportFromTemplate(templateId: string, projectId: string, title: string, description?: string): Promise<CustomReport | null> {
    try {
      // Get template
      const template = await this.getReportTemplateById(templateId);
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Create report
      const report = await this.createReport({
        title,
        description: description || template.description,
        template_id: templateId,
        project_id: projectId,
        user_id: '', // Will be set by RLS
        config: {
          template: template.name,
          created_from_template: true
        },
        is_public: false
      });
      
      if (!report) {
        throw new Error('Failed to create report');
      }
      
      // Create sections from template
      const sectionPromises = template.sections.map(async (section: any, index: number) => {
        return this.createReportSection({
          report_id: report.id,
          section_type: section.type,
          title: section.title,
          content: null,
          external_data_source_id: null,
          display_order: index
        });
      });
      
      await Promise.all(sectionPromises);
      
      // Generate report
      await this.generateReport(report.id);
      
      // Get updated report
      return await this.getReportById(report.id);
    } catch (error: any) {
      logger.error('Error creating report from template', { error: error.message, templateId, projectId });
      return null;
    }
  }

  /**
   * Create a comprehensive report with all external data
   */
  async createComprehensiveReport(projectId: string, title: string): Promise<CustomReport | null> {
    try {
      // Get comprehensive template
      const { data: templates, error } = await this.supabase
        .from('report_templates')
        .select('*')
        .eq('name', 'Comprehensive Project Report')
        .single();
      
      if (error) {
        throw error;
      }
      
      // Create report from template
      return await this.createReportFromTemplate(
        templates.id,
        projectId,
        title,
        'A comprehensive report including all internal and external data sources'
      );
    } catch (error: any) {
      logger.error('Error creating comprehensive report', { error: error.message, projectId });
      return null;
    }
  }

  /**
   * Create an external data report
   */
  async createExternalDataReport(projectId: string, title: string): Promise<CustomReport | null> {
    try {
      // Get external data template
      const { data: templates, error } = await this.supabase
        .from('report_templates')
        .select('*')
        .eq('name', 'External Data Report')
        .single();
      
      if (error) {
        throw error;
      }
      
      // Create report from template
      return await this.createReportFromTemplate(
        templates.id,
        projectId,
        title,
        'A report focusing on external data sources'
      );
    } catch (error: any) {
      logger.error('Error creating external data report', { error: error.message, projectId });
      return null;
    }
  }

  /**
   * Get report data with external sources
   */
  async getReportWithExternalData(reportId: string): Promise<any> {
    try {
      // Get report
      const report = await this.getReportById(reportId);
      
      if (!report) {
        throw new Error('Report not found');
      }
      
      // If report is not generated or needs regeneration, generate it
      if (!report.last_generated_at || new Date(report.updated_at) > new Date(report.last_generated_at)) {
        await this.generateReport(reportId);
      }
      
      // Get updated report
      const updatedReport = await this.getReportById(reportId);
      
      if (!updatedReport) {
        throw new Error('Failed to get updated report');
      }
      
      // Get report sections
      const sections = await this.getReportSections(reportId);
      
      // Return report with sections
      return {
        ...updatedReport,
        sections
      };
    } catch (error: any) {
      logger.error('Error getting report with external data', { error: error.message, reportId });
      return null;
    }
  }
}

export const customReportService = new CustomReportService();
