'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Save, Trash2, Clock, Edit } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/client';

interface Note {
  id: string;
  project_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface ProjectNotesProps {
  projectId: string;
}

export default function ProjectNotes({ projectId }: ProjectNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchNotes();
  }, [projectId]);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      // Fetch notes from Supabase
      const { data, error } = await supabase
        .from('project_notes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setNotes(data || []);
      setIsLoading(false);
      
      logger.info('Fetched notes for project', { projectId, count: data?.length || 0 });
    } catch (error: any) {
      logger.error('Error fetching project notes', { error: error.message, projectId });
      toast({
        title: 'Error',
        description: 'Failed to load project notes. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) {
      toast({
        title: 'Error',
        description: 'Note content cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create a new note in Supabase
      const newNote = {
        project_id: projectId,
        content: newNoteContent,
      };

      const { data, error } = await supabase
        .from('project_notes')
        .insert(newNote)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Add the new note to the list
      setNotes([data, ...notes]);
      setNewNoteContent('');
      setIsCreating(false);
      
      toast({
        title: 'Success',
        description: 'Note created successfully.',
      });
      
      logger.info('Created new note for project', { projectId, noteId: data.id });
    } catch (error: any) {
      logger.error('Error creating project note', { error: error.message, projectId });
      toast({
        title: 'Error',
        description: 'Failed to create note. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const handleSaveEdit = async () => {
    if (!editingContent.trim()) {
      toast({
        title: 'Error',
        description: 'Note content cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Update the note in Supabase
      const { error } = await supabase
        .from('project_notes')
        .update({ 
          content: editingContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingNoteId);

      if (error) {
        throw error;
      }

      // Update the note in the local state
      const updatedNotes = notes.map(note => 
        note.id === editingNoteId 
          ? { 
              ...note, 
              content: editingContent,
              updated_at: new Date().toISOString()
            } 
          : note
      );

      setNotes(updatedNotes);
      setEditingNoteId(null);
      setEditingContent('');
      
      toast({
        title: 'Success',
        description: 'Note updated successfully.',
      });
      
      logger.info('Updated note for project', { projectId, noteId: editingNoteId });
    } catch (error: any) {
      logger.error('Error updating project note', { error: error.message, projectId, noteId: editingNoteId });
      toast({
        title: 'Error',
        description: 'Failed to update note. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      // Delete the note from Supabase
      const { error } = await supabase
        .from('project_notes')
        .delete()
        .eq('id', noteId);

      if (error) {
        throw error;
      }

      // Remove the note from the local state
      const filteredNotes = notes.filter(note => note.id !== noteId);
      setNotes(filteredNotes);
      
      toast({
        title: 'Success',
        description: 'Note deleted successfully.',
      });
      
      logger.info('Deleted note from project', { projectId, noteId });
    } catch (error: any) {
      logger.error('Error deleting project note', { error: error.message, projectId, noteId });
      toast({
        title: 'Error',
        description: 'Failed to delete note. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Notes</CardTitle>
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project Notes</CardTitle>
        {!isCreating && (
          <Button 
            size="sm" 
            onClick={() => setIsCreating(true)}
            className="h-8"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isCreating && (
            <div className="border p-4 rounded-md bg-muted/50">
              <Textarea
                placeholder="Enter your note here..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="min-h-[100px] mb-4"
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsCreating(false);
                    setNewNoteContent('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleCreateNote}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Note
                </Button>
              </div>
            </div>
          )}

          {notes.length === 0 && !isCreating ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No notes have been added to this project yet.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsCreating(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Your First Note
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div 
                  key={note.id} 
                  className="border rounded-md p-4 transition-colors hover:bg-muted/50"
                >
                  {editingNoteId === note.id ? (
                    <div>
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="min-h-[100px] mb-4"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm"
                          onClick={handleSaveEdit}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>
                            {note.updated_at !== note.created_at 
                              ? `Updated: ${formatDate(note.updated_at)}` 
                              : `Created: ${formatDate(note.created_at)}`}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={() => handleEditNote(note)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive/90" 
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                      <div className="whitespace-pre-wrap">{note.content}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
