'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';
import { fileService, ProjectFile } from '@/lib/services/fileService';
import { createClient } from '@/lib/supabase/client';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  File, 
  Image, 
  Archive, 
  Music, 
  Video, 
  FileType, 
  Table, 
  Code, 
  Edit, 
  Save, 
  X 
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';

interface ProjectFilesProps {
  projectId: string;
}

export default function ProjectFiles({ projectId }: ProjectFilesProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [fileDescription, setFileDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchFiles();
  }, [projectId]);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const files = await fileService.getProjectFiles(projectId);
      setFiles(files);
      logger.info('Fetched project files', { projectId, count: files.length });
    } catch (error: any) {
      logger.error('Error fetching project files', { error: error.message, projectId });
      toast({
        title: 'Error',
        description: 'Failed to load project files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Upload the file
      const uploadedFile = await fileService.uploadFile({
        file: selectedFile,
        projectId,
        userId: user.id,
        description: fileDescription,
      });

      // Add the new file to the list
      setFiles([uploadedFile, ...files]);
      
      // Reset the form
      setSelectedFile(null);
      setFileDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: 'Success',
        description: 'File uploaded successfully.',
      });
    } catch (error: any) {
      logger.error('Error uploading file', { error: error.message, projectId });
      toast({
        title: 'Error',
        description: `Failed to upload file: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteClick = (fileId: string) => {
    setFileToDelete(fileId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;

    try {
      await fileService.deleteFile(fileToDelete);
      
      // Remove the file from the list
      setFiles(files.filter(file => file.id !== fileToDelete));
      
      toast({
        title: 'Success',
        description: 'File deleted successfully.',
      });
    } catch (error: any) {
      logger.error('Error deleting file', { error: error.message, fileId: fileToDelete });
      toast({
        title: 'Error',
        description: `Failed to delete file: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setFileToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleDownload = async (file: ProjectFile) => {
    try {
      const downloadUrl = await fileService.getFileDownloadUrl(file.storage_path);
      
      // Create a temporary link and click it to download the file
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      logger.info('File download initiated', { fileId: file.id });
    } catch (error: any) {
      logger.error('Error downloading file', { error: error.message, fileId: file.id });
      toast({
        title: 'Error',
        description: `Failed to download file: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleEditClick = (file: ProjectFile) => {
    setEditingFileId(file.id);
    setEditingDescription(file.description || '');
  };

  const handleSaveDescription = async () => {
    if (!editingFileId) return;

    try {
      const updatedFile = await fileService.updateFileDescription(editingFileId, editingDescription);
      
      // Update the file in the list
      setFiles(files.map(file => 
        file.id === editingFileId ? updatedFile : file
      ));
      
      toast({
        title: 'Success',
        description: 'File description updated successfully.',
      });
    } catch (error: any) {
      logger.error('Error updating file description', { error: error.message, fileId: editingFileId });
      toast({
        title: 'Error',
        description: `Failed to update file description: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setEditingFileId(null);
      setEditingDescription('');
    }
  };

  const cancelEdit = () => {
    setEditingFileId(null);
    setEditingDescription('');
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-6 w-6 text-blue-500" />;
    } else if (fileType.startsWith('audio/')) {
      return <Music className="h-6 w-6 text-green-500" />;
    } else if (fileType.startsWith('video/')) {
      return <Video className="h-6 w-6 text-red-500" />;
    } else if (fileType === 'application/pdf') {
      return <FileType className="h-6 w-6 text-red-600" />;
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) {
      return <Table className="h-6 w-6 text-green-600" />;
    } else if (fileType.includes('zip') || fileType.includes('compressed') || fileType.includes('archive')) {
      return <Archive className="h-6 w-6 text-yellow-600" />;
    } else if (fileType.includes('javascript') || fileType.includes('typescript') || fileType.includes('html') || fileType.includes('css')) {
      return <Code className="h-6 w-6 text-purple-600" />;
    } else {
      return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md"></div>
            <div className="h-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Files</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4 border p-4 rounded-md bg-muted/50">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="flex-grow"
                  disabled={isUploading}
                />
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || isUploading}
                  className="whitespace-nowrap"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
              {selectedFile && (
                <div className="text-sm text-muted-foreground">
                  Selected file: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </div>
              )}
            </div>
            <Textarea
              placeholder="File description (optional)"
              value={fileDescription}
              onChange={(e) => setFileDescription(e.target.value)}
              className="min-h-[80px]"
              disabled={isUploading}
            />
          </div>

          {files.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No files have been uploaded to this project yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your first file using the form above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <div 
                  key={file.id} 
                  className="border rounded-md p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getFileIcon(file.file_type)}
                      <div>
                        <h4 className="font-medium">{file.file_name}</h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => handleEditClick(file)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive/90" 
                        onClick={() => handleDeleteClick(file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>

                  {editingFileId === file.id ? (
                    <div className="mt-3">
                      <Textarea
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        className="min-h-[80px] mb-2"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={cancelEdit}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button 
                          size="sm"
                          onClick={handleSaveDescription}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    file.description && (
                      <div className="mt-3 text-sm">
                        <p className="text-muted-foreground">{file.description}</p>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this file?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The file will be permanently deleted from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
