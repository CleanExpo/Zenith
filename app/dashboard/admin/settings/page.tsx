'use client';

import { useState, useEffect } from 'react';
import { UserRole } from '@/lib/auth/types';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Settings, 
  Mail, 
  Shield, 
  Database, 
  Code, 
  Bell, 
  Upload, 
  Save,
  Loader2
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    maxItemsPerPage: number;
    enableMaintenanceMode: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    smtpFromEmail: string;
    smtpFromName: string;
    enableEmailVerification: boolean;
  };
  security: {
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSymbols: boolean;
    sessionTimeoutMinutes: number;
    maxLoginAttempts: number;
    enableMfa: boolean;
  };
  storage: {
    maxUploadSizeMb: number;
    allowedFileTypes: string;
    enableCloudStorage: boolean;
    storageProvider: string;
    storageRegion: string;
  };
  api: {
    enableRateLimiting: boolean;
    maxRequestsPerMinute: number;
    enableApiKeys: boolean;
    apiKeyExpirationDays: number;
  };
  notifications: {
    enableEmailNotifications: boolean;
    enableInAppNotifications: boolean;
    adminEmailNotifications: boolean;
    digestFrequency: string;
  };
}

const defaultSettings: SystemSettings = {
  general: {
    siteName: 'Zenith Research Platform',
    siteDescription: 'A comprehensive platform for research project management',
    contactEmail: 'support@zenithresearch.com',
    maxItemsPerPage: 20,
    enableMaintenanceMode: false,
  },
  email: {
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpUser: 'smtp_user',
    smtpPassword: '********',
    smtpFromEmail: 'no-reply@zenithresearch.com',
    smtpFromName: 'Zenith Research',
    enableEmailVerification: true,
  },
  security: {
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: true,
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    enableMfa: true,
  },
  storage: {
    maxUploadSizeMb: 50,
    allowedFileTypes: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif',
    enableCloudStorage: true,
    storageProvider: 'supabase',
    storageRegion: 'us-east-1',
  },
  api: {
    enableRateLimiting: true,
    maxRequestsPerMinute: 100,
    enableApiKeys: true,
    apiKeyExpirationDays: 90,
  },
  notifications: {
    enableEmailNotifications: true,
    enableInAppNotifications: true,
    adminEmailNotifications: true,
    digestFrequency: 'daily',
  },
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Fetch settings from the database
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, use defaults
          console.log('No settings found, using defaults');
        } else {
          throw error;
        }
      }
      
      if (data) {
        // Parse the settings from the database
        setSettings(data.settings as SystemSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch system settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      
      // Save settings to the database
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 1, // Use a fixed ID for the system settings
          settings,
          updated_at: new Date().toISOString(),
        });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'System settings saved successfully',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save system settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value,
      },
    });
  };

  return (
    <PermissionGuard role={UserRole.ADMIN} fallback={<AccessDenied />}>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">System Settings</h1>
          <Button 
            onClick={saveSettings} 
            disabled={saving}
            className="flex items-center"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="general" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Storage
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center">
              <Code className="h-4 w-4 mr-2" />
              API
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>
                      Configure basic system settings and appearance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="siteName">Site Name</Label>
                      <Input
                        id="siteName"
                        value={settings.general.siteName}
                        onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        The name of your site, displayed in the browser title and emails
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="siteDescription">Site Description</Label>
                      <Textarea
                        id="siteDescription"
                        value={settings.general.siteDescription}
                        onChange={(e) => handleInputChange('general', 'siteDescription', e.target.value)}
                        rows={3}
                      />
                      <p className="text-sm text-muted-foreground">
                        A brief description of your site, used for SEO and metadata
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={settings.general.contactEmail}
                        onChange={(e) => handleInputChange('general', 'contactEmail', e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        The primary contact email for your site
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxItemsPerPage">Items Per Page</Label>
                      <Input
                        id="maxItemsPerPage"
                        type="number"
                        min={5}
                        max={100}
                        value={settings.general.maxItemsPerPage}
                        onChange={(e) => handleInputChange('general', 'maxItemsPerPage', parseInt(e.target.value))}
                      />
                      <p className="text-sm text-muted-foreground">
                        Default number of items to display per page in lists
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableMaintenanceMode">Maintenance Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable maintenance mode to temporarily disable the site
                        </p>
                      </div>
                      <Switch
                        id="enableMaintenanceMode"
                        checked={settings.general.enableMaintenanceMode}
                        onCheckedChange={(checked) => handleInputChange('general', 'enableMaintenanceMode', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="email">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Settings</CardTitle>
                    <CardDescription>
                      Configure email server settings and notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={settings.email.smtpHost}
                        onChange={(e) => handleInputChange('email', 'smtpHost', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={settings.email.smtpPort}
                        onChange={(e) => handleInputChange('email', 'smtpPort', parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtpUser">SMTP Username</Label>
                      <Input
                        id="smtpUser"
                        value={settings.email.smtpUser}
                        onChange={(e) => handleInputChange('email', 'smtpUser', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">SMTP Password</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={settings.email.smtpPassword}
                        onChange={(e) => handleInputChange('email', 'smtpPassword', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtpFromEmail">From Email</Label>
                      <Input
                        id="smtpFromEmail"
                        type="email"
                        value={settings.email.smtpFromEmail}
                        onChange={(e) => handleInputChange('email', 'smtpFromEmail', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtpFromName">From Name</Label>
                      <Input
                        id="smtpFromName"
                        value={settings.email.smtpFromName}
                        onChange={(e) => handleInputChange('email', 'smtpFromName', e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableEmailVerification">Email Verification</Label>
                        <p className="text-sm text-muted-foreground">
                          Require email verification for new accounts
                        </p>
                      </div>
                      <Switch
                        id="enableEmailVerification"
                        checked={settings.email.enableEmailVerification}
                        onCheckedChange={(checked) => handleInputChange('email', 'enableEmailVerification', checked)}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="ml-auto">
                      Test Email Configuration
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Configure security policies and authentication settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                      <Input
                        id="passwordMinLength"
                        type="number"
                        min={6}
                        max={32}
                        value={settings.security.passwordMinLength}
                        onChange={(e) => handleInputChange('security', 'passwordMinLength', parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="passwordRequireUppercase">Require Uppercase</Label>
                        <p className="text-sm text-muted-foreground">
                          Require at least one uppercase letter in passwords
                        </p>
                      </div>
                      <Switch
                        id="passwordRequireUppercase"
                        checked={settings.security.passwordRequireUppercase}
                        onCheckedChange={(checked) => handleInputChange('security', 'passwordRequireUppercase', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="passwordRequireNumbers">Require Numbers</Label>
                        <p className="text-sm text-muted-foreground">
                          Require at least one number in passwords
                        </p>
                      </div>
                      <Switch
                        id="passwordRequireNumbers"
                        checked={settings.security.passwordRequireNumbers}
                        onCheckedChange={(checked) => handleInputChange('security', 'passwordRequireNumbers', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="passwordRequireSymbols">Require Symbols</Label>
                        <p className="text-sm text-muted-foreground">
                          Require at least one special character in passwords
                        </p>
                      </div>
                      <Switch
                        id="passwordRequireSymbols"
                        checked={settings.security.passwordRequireSymbols}
                        onCheckedChange={(checked) => handleInputChange('security', 'passwordRequireSymbols', checked)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeoutMinutes">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeoutMinutes"
                        type="number"
                        min={5}
                        max={1440}
                        value={settings.security.sessionTimeoutMinutes}
                        onChange={(e) => handleInputChange('security', 'sessionTimeoutMinutes', parseInt(e.target.value))}
                      />
                      <p className="text-sm text-muted-foreground">
                        Time in minutes before an inactive session expires
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        min={3}
                        max={10}
                        value={settings.security.maxLoginAttempts}
                        onChange={(e) => handleInputChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                      />
                      <p className="text-sm text-muted-foreground">
                        Maximum number of failed login attempts before account lockout
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableMfa">Multi-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable multi-factor authentication for user accounts
                        </p>
                      </div>
                      <Switch
                        id="enableMfa"
                        checked={settings.security.enableMfa}
                        onCheckedChange={(checked) => handleInputChange('security', 'enableMfa', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="storage">
                <Card>
                  <CardHeader>
                    <CardTitle>Storage Settings</CardTitle>
                    <CardDescription>
                      Configure file storage and upload settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="maxUploadSizeMb">Max Upload Size (MB)</Label>
                      <Input
                        id="maxUploadSizeMb"
                        type="number"
                        min={1}
                        max={500}
                        value={settings.storage.maxUploadSizeMb}
                        onChange={(e) => handleInputChange('storage', 'maxUploadSizeMb', parseInt(e.target.value))}
                      />
                      <p className="text-sm text-muted-foreground">
                        Maximum file size for uploads in megabytes
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                      <Input
                        id="allowedFileTypes"
                        value={settings.storage.allowedFileTypes}
                        onChange={(e) => handleInputChange('storage', 'allowedFileTypes', e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Comma-separated list of allowed file extensions (e.g., .pdf,.jpg,.png)
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableCloudStorage">Cloud Storage</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable cloud storage for file uploads
                        </p>
                      </div>
                      <Switch
                        id="enableCloudStorage"
                        checked={settings.storage.enableCloudStorage}
                        onCheckedChange={(checked) => handleInputChange('storage', 'enableCloudStorage', checked)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="storageProvider">Storage Provider</Label>
                      <Select
                        value={settings.storage.storageProvider}
                        onValueChange={(value) => handleInputChange('storage', 'storageProvider', value)}
                      >
                        <SelectTrigger id="storageProvider">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="supabase">Supabase Storage</SelectItem>
                          <SelectItem value="s3">Amazon S3</SelectItem>
                          <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                          <SelectItem value="azure">Azure Blob Storage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="storageRegion">Storage Region</Label>
                      <Input
                        id="storageRegion"
                        value={settings.storage.storageRegion}
                        onChange={(e) => handleInputChange('storage', 'storageRegion', e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Region for cloud storage (e.g., us-east-1)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="api">
                <Card>
                  <CardHeader>
                    <CardTitle>API Settings</CardTitle>
                    <CardDescription>
                      Configure API access and rate limiting
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableRateLimiting">Rate Limiting</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable rate limiting for API requests
                        </p>
                      </div>
                      <Switch
                        id="enableRateLimiting"
                        checked={settings.api.enableRateLimiting}
                        onCheckedChange={(checked) => handleInputChange('api', 'enableRateLimiting', checked)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxRequestsPerMinute">Max Requests Per Minute</Label>
                      <Input
                        id="maxRequestsPerMinute"
                        type="number"
                        min={10}
                        max={1000}
                        value={settings.api.maxRequestsPerMinute}
                        onChange={(e) => handleInputChange('api', 'maxRequestsPerMinute', parseInt(e.target.value))}
                      />
                      <p className="text-sm text-muted-foreground">
                        Maximum number of API requests allowed per minute per user
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableApiKeys">API Keys</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable API key authentication for external access
                        </p>
                      </div>
                      <Switch
                        id="enableApiKeys"
                        checked={settings.api.enableApiKeys}
                        onCheckedChange={(checked) => handleInputChange('api', 'enableApiKeys', checked)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="apiKeyExpirationDays">API Key Expiration (days)</Label>
                      <Input
                        id="apiKeyExpirationDays"
                        type="number"
                        min={1}
                        max={365}
                        value={settings.api.apiKeyExpirationDays}
                        onChange={(e) => handleInputChange('api', 'apiKeyExpirationDays', parseInt(e.target.value))}
                      />
                      <p className="text-sm text-muted-foreground">
                        Number of days before API keys expire
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="ml-auto">
                      Manage API Keys
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>
                      Configure system notifications and alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableEmailNotifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send notifications via email
                        </p>
                      </div>
                      <Switch
                        id="enableEmailNotifications"
                        checked={settings.notifications.enableEmailNotifications}
                        onCheckedChange={(checked) => handleInputChange('notifications', 'enableEmailNotifications', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableInAppNotifications">In-App Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Show notifications within the application
                        </p>
                      </div>
                      <Switch
                        id="enableInAppNotifications"
                        checked={settings.notifications.enableInAppNotifications}
                        onCheckedChange={(checked) => handleInputChange('notifications', 'enableInAppNotifications', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="adminEmailNotifications">Admin Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send system alerts to administrators
                        </p>
                      </div>
                      <Switch
                        id="adminEmailNotifications"
                        checked={settings.notifications.adminEmailNotifications}
                        onCheckedChange={(checked) => handleInputChange('notifications', 'adminEmailNotifications', checked)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="digestFrequency">Digest Frequency</Label>
                      <Select
                        value={settings.notifications.digestFrequency}
                        onValueChange={(value) => handleInputChange('notifications', 'digestFrequency', value)}
                      >
                        <SelectTrigger id="digestFrequency">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="realtime">Real-time</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        How often to send notification digests
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </PermissionGuard>
  );
}

function AccessDenied() {
  return (
    <div className="container mx-auto py-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
      <p className="mb-6">You do not have permission to access this page.</p>
      <Button asChild>
        <a href="/dashboard">Return to Dashboard</a>
      </Button>
    </div>
  );
}
