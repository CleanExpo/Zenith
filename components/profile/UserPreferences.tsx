import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { profileService, UserPreferences } from '@/lib/services/profileService';

interface UserPreferencesProps {
  userId: string;
  initialPreferences?: UserPreferences;
  onPreferencesSaved?: () => void;
}

export function UserPreferencesComponent({
  userId,
  initialPreferences,
  onPreferencesSaved
}: UserPreferencesProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    emailNotifications: {
      projectUpdates: true,
      securityAlerts: true,
      newsletter: false,
      teamInvites: true
    },
    displayDensity: 'comfortable',
    defaultDashboardView: 'projects',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'en'
  });
  
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (initialPreferences) {
      setPreferences(prev => ({
        ...prev,
        ...initialPreferences
      }));
    }
  }, [initialPreferences]);
  
  const handleThemeChange = (value: string) => {
    setPreferences(prev => ({
      ...prev,
      theme: value as 'light' | 'dark' | 'system'
    }));
  };
  
  const handleDensityChange = (value: string) => {
    setPreferences(prev => ({
      ...prev,
      displayDensity: value as 'compact' | 'comfortable' | 'spacious'
    }));
  };
  
  const handleDashboardViewChange = (value: string) => {
    setPreferences(prev => ({
      ...prev,
      defaultDashboardView: value as 'projects' | 'analytics' | 'teams'
    }));
  };
  
  const handleLanguageChange = (value: string) => {
    setPreferences(prev => ({
      ...prev,
      language: value
    }));
  };
  
  const handleNotificationChange = (key: keyof typeof preferences.emailNotifications, checked: boolean) => {
    setPreferences(prev => {
      // Ensure emailNotifications exists
      const emailNotifications = prev.emailNotifications || {
        projectUpdates: true,
        securityAlerts: true,
        newsletter: false,
        teamInvites: true
      };
      
      return {
        ...prev,
        emailNotifications: {
          ...emailNotifications,
          [key]: checked
        }
      };
    });
  };
  
  const handleSavePreferences = async () => {
    setIsSaving(true);
    
    try {
      const success = await profileService.updatePreferences(userId, preferences);
      
      if (success) {
        toast.success('Preferences saved successfully');
        if (onPreferencesSaved) {
          onPreferencesSaved();
        }
      } else {
        toast.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Preferences</CardTitle>
        <CardDescription>
          Customize your experience with Zenith
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Appearance</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4">
              <Label htmlFor="theme" className="sm:col-span-1 sm:pt-2">Theme</Label>
              <div className="sm:col-span-3">
                <Select
                  value={preferences.theme}
                  onValueChange={handleThemeChange}
                >
                  <SelectTrigger id="theme" className="w-full">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4">
              <Label htmlFor="density" className="sm:col-span-1 sm:pt-2">Display Density</Label>
              <div className="sm:col-span-3">
                <Select
                  value={preferences.displayDensity}
                  onValueChange={handleDensityChange}
                >
                  <SelectTrigger id="density" className="w-full">
                    <SelectValue placeholder="Select density" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4">
              <Label htmlFor="defaultView" className="sm:col-span-1 sm:pt-2">Default Dashboard</Label>
              <div className="sm:col-span-3">
                <Select
                  value={preferences.defaultDashboardView}
                  onValueChange={handleDashboardViewChange}
                >
                  <SelectTrigger id="defaultView" className="w-full">
                    <SelectValue placeholder="Select default view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="projects">Projects</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="teams">Teams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4">
              <Label htmlFor="language" className="sm:col-span-1 sm:pt-2">Language</Label>
              <div className="sm:col-span-3">
                <Select
                  value={preferences.language}
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger id="language" className="w-full">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Email Notifications</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="projectUpdates">Project Updates</Label>
                <p className="text-sm text-gray-500">
                  Receive notifications about changes to your projects
                </p>
              </div>
              <Switch
                id="projectUpdates"
                checked={preferences.emailNotifications?.projectUpdates}
                onCheckedChange={(checked) => handleNotificationChange('projectUpdates', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="securityAlerts">Security Alerts</Label>
                <p className="text-sm text-gray-500">
                  Receive notifications about security events
                </p>
              </div>
              <Switch
                id="securityAlerts"
                checked={preferences.emailNotifications?.securityAlerts}
                onCheckedChange={(checked) => handleNotificationChange('securityAlerts', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="newsletter">Newsletter</Label>
                <p className="text-sm text-gray-500">
                  Receive our monthly newsletter with tips and updates
                </p>
              </div>
              <Switch
                id="newsletter"
                checked={preferences.emailNotifications?.newsletter}
                onCheckedChange={(checked) => handleNotificationChange('newsletter', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="teamInvites">Team Invitations</Label>
                <p className="text-sm text-gray-500">
                  Receive notifications when you're invited to a team
                </p>
              </div>
              <Switch
                id="teamInvites"
                checked={preferences.emailNotifications?.teamInvites}
                onCheckedChange={(checked) => handleNotificationChange('teamInvites', checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleSavePreferences}
          disabled={isSaving}
          className="ml-auto"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardFooter>
    </Card>
  );
}
