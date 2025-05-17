'use client';

import { useState, useEffect } from 'react';
import { teamSettingsService, TeamSettings as TeamSettingsType } from '@/lib/services/teamSettingsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import TeamPermissionGuard from '@/components/auth/TeamPermissionGuard';
import { UserRole } from '@/lib/auth/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface TeamSettingsProps {
  teamId: string;
}

// Define schemas for each settings section
const notificationSchema = z.object({
  email: z.object({
    enabled: z.boolean(),
    daily_digest: z.boolean(),
    weekly_digest: z.boolean(),
    project_updates: z.boolean(),
    report_updates: z.boolean(),
    member_updates: z.boolean(),
  }),
  in_app: z.object({
    enabled: z.boolean(),
    project_updates: z.boolean(),
    report_updates: z.boolean(),
    member_updates: z.boolean(),
  }),
});

const themeSchema = z.object({
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Must be a valid hex color code',
  }),
  logo_url: z.string().nullable(),
  dark_mode: z.boolean(),
});

const privacySchema = z.object({
  project_visibility: z.enum(['team', 'organization', 'public']),
  report_visibility: z.enum(['team', 'organization', 'public']),
  member_visibility: z.enum(['team', 'organization', 'public']),
});

const integrationsSchema = z.object({
  github: z.object({
    enabled: z.boolean(),
    repo_url: z.string().nullable(),
  }),
  slack: z.object({
    enabled: z.boolean(),
    webhook_url: z.string().nullable(),
  }),
});

export default function TeamSettings({ teamId }: TeamSettingsProps) {
  const [settings, setSettings] = useState<TeamSettingsType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // Create forms for each settings section
  const notificationForm = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      email: {
        enabled: true,
        daily_digest: false,
        weekly_digest: true,
        project_updates: true,
        report_updates: true,
        member_updates: true,
      },
      in_app: {
        enabled: true,
        project_updates: true,
        report_updates: true,
        member_updates: true,
      },
    },
  });

  const themeForm = useForm<z.infer<typeof themeSchema>>({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      primary_color: '#0070f3',
      logo_url: null,
      dark_mode: true,
    },
  });

  const privacyForm = useForm<z.infer<typeof privacySchema>>({
    resolver: zodResolver(privacySchema),
    defaultValues: {
      project_visibility: 'team',
      report_visibility: 'team',
      member_visibility: 'team',
    },
  });

  const integrationsForm = useForm<z.infer<typeof integrationsSchema>>({
    resolver: zodResolver(integrationsSchema),
    defaultValues: {
      github: {
        enabled: false,
        repo_url: null,
      },
      slack: {
        enabled: false,
        webhook_url: null,
      },
    },
  });

  // Fetch team settings on component mount
  useEffect(() => {
    fetchTeamSettings();
  }, [teamId]);

  // Fetch team settings
  const fetchTeamSettings = async () => {
    setLoading(true);
    try {
      const settingsData = await teamSettingsService.getAllSettings(teamId);
      setSettings(settingsData);
      
      // Update form values with fetched settings
      if (settingsData) {
        if (settingsData.notifications) {
          notificationForm.reset(settingsData.notifications);
        }
        
        if (settingsData.theme) {
          themeForm.reset(settingsData.theme);
        }
        
        if (settingsData.privacy) {
          privacyForm.reset(settingsData.privacy);
        }
        
        if (settingsData.integrations) {
          integrationsForm.reset(settingsData.integrations);
        }
      }
    } catch (error) {
      console.error('Error fetching team settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch team settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle save settings
  const handleSaveSettings = async (key: string, values: any) => {
    setSavingSettings(true);
    try {
      const success = await teamSettingsService.setSetting(teamId, key, values);
      
      if (success) {
        toast({
          title: 'Success',
          description: `${key.charAt(0).toUpperCase() + key.slice(1)} settings updated successfully`,
        });
        
        // Update local state
        setSettings(prev => prev ? { ...prev, [key]: values } : null);
      } else {
        toast({
          title: 'Error',
          description: `Failed to update ${key} settings`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error(`Error saving ${key} settings:`, error);
      toast({
        title: 'Error',
        description: `Failed to update ${key} settings`,
        variant: 'destructive',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Settings</CardTitle>
        <CardDescription>
          Configure your team settings and preferences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications">
            <TeamPermissionGuard
              teamId={teamId}
              anyRole={[UserRole.ADMIN, UserRole.MANAGER]}
              fallback={
                <div className="text-center py-6">
                  <p className="text-muted-foreground">You don't have permission to modify notification settings.</p>
                </div>
              }
            >
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit((values) => handleSaveSettings('notifications', values))} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Email Notifications</h3>
                    
                    <FormField
                      control={notificationForm.control}
                      name="email.enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Enable Email Notifications
                            </FormLabel>
                            <FormDescription>
                              Receive notifications via email.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" disabled={savingSettings}>
                    {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Notification Settings
                  </Button>
                </form>
              </Form>
            </TeamPermissionGuard>
          </TabsContent>
          
          <TabsContent value="theme">
            <TeamPermissionGuard
              teamId={teamId}
              anyRole={[UserRole.ADMIN, UserRole.MANAGER]}
              fallback={
                <div className="text-center py-6">
                  <p className="text-muted-foreground">You don't have permission to modify theme settings.</p>
                </div>
              }
            >
              <Form {...themeForm}>
                <form onSubmit={themeForm.handleSubmit((values) => handleSaveSettings('theme', values))} className="space-y-6">
                  <FormField
                    control={themeForm.control}
                    name="primary_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Color</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Input
                              {...field}
                              type="text"
                              placeholder="#0070f3"
                            />
                            <div
                              className="h-8 w-8 rounded-full border"
                              style={{ backgroundColor: field.value }}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          The primary color for your team's branding.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={savingSettings}>
                    {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Theme Settings
                  </Button>
                </form>
              </Form>
            </TeamPermissionGuard>
          </TabsContent>
          
          <TabsContent value="privacy">
            <TeamPermissionGuard
              teamId={teamId}
              anyRole={[UserRole.ADMIN, UserRole.MANAGER]}
              fallback={
                <div className="text-center py-6">
                  <p className="text-muted-foreground">You don't have permission to modify privacy settings.</p>
                </div>
              }
            >
              <Form {...privacyForm}>
                <form onSubmit={privacyForm.handleSubmit((values) => handleSaveSettings('privacy', values))} className="space-y-6">
                  <FormField
                    control={privacyForm.control}
                    name="project_visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Visibility</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project visibility" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="team">Team Only</SelectItem>
                            <SelectItem value="organization">Organization</SelectItem>
                            <SelectItem value="public">Public</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Who can see your team's projects.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={savingSettings}>
                    {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Privacy Settings
                  </Button>
                </form>
              </Form>
            </TeamPermissionGuard>
          </TabsContent>
          
          <TabsContent value="integrations">
            <TeamPermissionGuard
              teamId={teamId}
              anyRole={[UserRole.ADMIN, UserRole.MANAGER]}
              fallback={
                <div className="text-center py-6">
                  <p className="text-muted-foreground">You don't have permission to modify integration settings.</p>
                </div>
              }
            >
              <Form {...integrationsForm}>
                <form onSubmit={integrationsForm.handleSubmit((values) => handleSaveSettings('integrations', values))} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">GitHub Integration</h3>
                    
                    <FormField
                      control={integrationsForm.control}
                      name="github.enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Enable GitHub Integration
                            </FormLabel>
                            <FormDescription>
                              Connect your team to a GitHub repository.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" disabled={savingSettings}>
                    {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Integration Settings
                  </Button>
                </form>
              </Form>
            </TeamPermissionGuard>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
