'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2, Calendar, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';

interface Task {
  id: string;
  project_id: string;
  title: string;
  completed: boolean;
  due_date?: string | null;
  created_at: string;
}

interface ProjectTasksProps {
  projectId: string;
}

export default function ProjectTasks({ projectId }: ProjectTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      // Fetch tasks from Supabase
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('due_date', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setTasks(data || []);
      setIsLoading(false);
      
      logger.info('Fetched tasks for project', { projectId, count: data?.length || 0 });
    } catch (error: any) {
      logger.error('Error fetching project tasks', { error: error.message, projectId });
      toast({
        title: 'Error',
        description: 'Failed to load project tasks. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTaskTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Task title cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create a new task in Supabase
      const newTask = {
        project_id: projectId,
        title: newTaskTitle,
        completed: false,
        due_date: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : null,
      };

      const { data, error } = await supabase
        .from('project_tasks')
        .insert(newTask)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Add the new task to the list
      setTasks([...tasks, data]);
      setNewTaskTitle('');
      setNewTaskDueDate('');
      
      toast({
        title: 'Success',
        description: 'Task created successfully.',
      });
      
      logger.info('Created new task for project', { projectId, taskId: data.id });
    } catch (error: any) {
      logger.error('Error creating project task', { error: error.message, projectId });
      toast({
        title: 'Error',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleTaskCompletion = async (taskId: string) => {
    try {
      // Find the task to toggle
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      const newCompletedState = !task.completed;
      
      // Update the task in Supabase
      const { error } = await supabase
        .from('project_tasks')
        .update({ completed: newCompletedState })
        .eq('id', taskId);

      if (error) {
        throw error;
      }

      // Update the task in the local state
      const updatedTasks = tasks.map(t => 
        t.id === taskId 
          ? { ...t, completed: newCompletedState } 
          : t
      );

      setTasks(updatedTasks);
      
      toast({
        title: newCompletedState ? 'Task Completed' : 'Task Reopened',
        description: task.title,
      });
      
      logger.info('Updated task completion status', { 
        projectId, 
        taskId, 
        completed: newCompletedState 
      });
    } catch (error: any) {
      logger.error('Error updating task completion', { error: error.message, projectId, taskId });
      toast({
        title: 'Error',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      // Delete the task from Supabase
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        throw error;
      }

      // Remove the task from the local state
      const filteredTasks = tasks.filter(task => task.id !== taskId);
      setTasks(filteredTasks);
      
      toast({
        title: 'Success',
        description: 'Task deleted successfully.',
      });
      
      logger.info('Deleted task from project', { projectId, taskId });
    } catch (error: any) {
      logger.error('Error deleting project task', { error: error.message, projectId, taskId });
      toast({
        title: 'Error',
        description: 'Failed to delete task. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.completed) return false;
    
    const dueDate = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return dueDate < today;
  };

  const getDueDateStatus = (task: Task) => {
    if (!task.due_date) return null;
    
    if (task.completed) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Completed
        </Badge>
      );
    }
    
    if (isOverdue(task)) {
      return (
        <Badge variant="destructive">
          Overdue
        </Badge>
      );
    }
    
    const dueDate = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dueDate.toDateString() === today.toDateString()) {
      return (
        <Badge variant="outline" className="bg-amber-500 text-white border-amber-500">
          Due Today
        </Badge>
      );
    }
    
    if (dueDate.toDateString() === tomorrow.toDateString()) {
      return (
        <Badge variant="outline" className="bg-amber-400 text-white border-amber-400">
          Due Tomorrow
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline">
        Due {formatDate(task.due_date)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md"></div>
            <div className="h-10 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md"></div>
            <div className="h-10 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <form onSubmit={handleCreateTask} className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-grow"
            />
            <Input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="sm:w-40"
              min={new Date().toISOString().split('T')[0]}
            />
            <Button type="submit" size="sm" className="whitespace-nowrap">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </form>

          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tasks have been added to this project yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first task using the form above.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Incomplete tasks first */}
              {tasks
                .filter(task => !task.completed)
                .sort((a, b) => {
                  // Sort by due date (overdue first)
                  if (a.due_date && b.due_date) {
                    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                  }
                  // Tasks with due dates come before tasks without due dates
                  if (a.due_date && !b.due_date) return -1;
                  if (!a.due_date && b.due_date) return 1;
                  return 0;
                })
                .map((task) => (
                  <div 
                    key={task.id} 
                    className={`flex items-start justify-between p-3 border rounded-md ${
                      isOverdue(task) ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20' : 
                      'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => handleToggleTaskCompletion(task.id)}
                        className="mt-1"
                      />
                      <div>
                        <p className={task.completed ? 'line-through text-muted-foreground' : ''}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getDueDateStatus(task)}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive/90" 
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                ))}
              
              {/* Completed tasks */}
              {tasks.filter(task => task.completed).length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Completed Tasks
                  </h3>
                  <div className="space-y-2">
                    {tasks
                      .filter(task => task.completed)
                      .map((task) => (
                        <div 
                          key={task.id} 
                          className="flex items-start justify-between p-3 border rounded-md bg-muted/30"
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => handleToggleTaskCompletion(task.id)}
                              className="mt-1"
                            />
                            <div>
                              <p className="line-through text-muted-foreground">
                                {task.title}
                              </p>
                              {task.due_date && (
                                <div className="flex items-center gap-2 mt-1">
                                  {getDueDateStatus(task)}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive/90" 
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
