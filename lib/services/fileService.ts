import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

export interface FileUploadParams {
  file: File;
  projectId: string;
  userId: string;
  description?: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  storage_path: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export class FileService {
  private supabase = createClient();
  private bucketName = 'project-files';

  /**
   * Upload a file to Supabase Storage and create a record in the project_files table
   */
  async uploadFile({ file, projectId, userId, description }: FileUploadParams): Promise<ProjectFile> {
    try {
      // Create a unique file path: userId/projectId/timestamp-filename
      const timestamp = new Date().getTime();
      // const fileExtension = file.name.split('.').pop(); // Unused variable
      const fileName = `${timestamp}-${file.name}`;
      const filePath = `${userId}/${projectId}/${fileName}`;

      // Upload the file to Supabase Storage
      const { error: storageError } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file);

      if (storageError) {
        if (storageError instanceof Error) {
          logger.error('Error uploading file to storage', { error: storageError.message, projectId, userId });
        } else {
          logger.error('Error uploading file to storage', { error: storageError, projectId, userId });
        }
        throw new Error(`Failed to upload file: ${storageError.message}`);
      }

      // Get the public URL for the file
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      // Create a record in the project_files table
      const fileRecord = {
        project_id: projectId,
        user_id: userId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_path: publicUrl,
        storage_path: filePath,
        description: description || null
      };

      const { data: fileData, error: fileError } = await this.supabase
        .from('project_files')
        .insert(fileRecord)
        .select()
        .single();

      if (fileError) {
        // If there was an error creating the record, delete the uploaded file
        await this.supabase.storage
          .from(this.bucketName)
          .remove([filePath]);

        logger.error('Error creating file record', { error: fileError.message, projectId, userId });
        throw new Error(`Failed to create file record: ${fileError.message}`);
      }

      logger.info('File uploaded successfully', { projectId, userId, fileId: fileData.id });
      return fileData;
} catch (error: unknown) {
      if (error instanceof Error) {
        logger.error('Error in uploadFile', { error: error.message, projectId, userId });
      } else {
        logger.error('Error in uploadFile', { error, projectId, userId });
      }
      throw error;
    }
  }

  /**
   * Get all files for a project
   */
  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    try {
      const { data, error } = await this.supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching project files', { error: error.message, projectId });
        throw new Error(`Failed to fetch project files: ${error.message}`);
      }

      return data || [];
} catch (error: unknown) {
      if (error instanceof Error) {
        logger.error('Error in getProjectFiles', { error: error.message, projectId });
      } else {
        logger.error('Error in getProjectFiles', { error, projectId });
      }
      throw error;
    }
  }

  /**
   * Delete a file from Supabase Storage and remove the record from the project_files table
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      // Get the file record to get the storage path
      const { data: fileData, error: fileError } = await this.supabase
        .from('project_files')
        .select('storage_path')
        .eq('id', fileId)
        .single();

      if (fileError) {
        logger.error('Error fetching file record', { error: fileError.message, fileId });
        throw new Error(`Failed to fetch file record: ${fileError.message}`);
      }

      // Delete the file from Supabase Storage
      const { error: storageError } = await this.supabase.storage
        .from(this.bucketName)
        .remove([fileData.storage_path]);

      if (storageError) {
        logger.error('Error deleting file from storage', { error: storageError.message, fileId });
        throw new Error(`Failed to delete file from storage: ${storageError.message}`);
      }

      // Delete the record from the project_files table
      const { error: deleteError } = await this.supabase
        .from('project_files')
        .delete()
        .eq('id', fileId);

      if (deleteError) {
        logger.error('Error deleting file record', { error: deleteError.message, fileId });
        throw new Error(`Failed to delete file record: ${deleteError.message}`);
      }

      logger.info('File deleted successfully', { fileId });
} catch (error: unknown) {
      if (error instanceof Error) {
        logger.error('Error in deleteFile', { error: error.message, fileId });
      } else {
        logger.error('Error in deleteFile', { error, fileId });
      }
      throw error;
    }
  }

  /**
   * Update a file's description
   */
  async updateFileDescription(fileId: string, description: string): Promise<ProjectFile> {
    try {
      const { data, error } = await this.supabase
        .from('project_files')
        .update({ description, updated_at: new Date().toISOString() })
        .eq('id', fileId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating file description', { error: error.message, fileId });
        throw new Error(`Failed to update file description: ${error.message}`);
      }

      logger.info('File description updated successfully', { fileId });
      return data;
} catch (error: unknown) {
      if (error instanceof Error) {
        logger.error('Error in updateFileDescription', { error: error.message, fileId });
      } else {
        logger.error('Error in updateFileDescription', { error, fileId });
      }
      throw error;
    }
  }

  /**
   * Get a download URL for a file
   */
  async getFileDownloadUrl(storagePath: string): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(storagePath, 60 * 60); // 1 hour expiry

      if (error) {
        logger.error('Error creating signed URL', { error: error.message, storagePath });
        throw new Error(`Failed to create signed URL: ${error.message}`);
      }

      return data.signedUrl;
} catch (error: unknown) {
      if (error instanceof Error) {
        logger.error('Error in getFileDownloadUrl', { error: error.message, storagePath });
      } else {
        logger.error('Error in getFileDownloadUrl', { error, storagePath });
      }
      throw error;
    }
  }
}

export const fileService = new FileService();
