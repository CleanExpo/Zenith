'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileUpload } from '@/components/ui/file-upload';
import { UserPreferencesComponent } from '@/components/profile/UserPreferences';
import { profileService, UserProfile } from '@/lib/services/profileService';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userProfile = await profileService.getCurrentProfile();
        
        if (!userProfile) {
          toast.error('Unable to fetch user profile');
          router.push('/auth/login');
          return;
        }
        
        setProfile(userProfile);
        setFullName(userProfile.full_name);
        setAvatarUrl(userProfile.avatar_url || '');
      } catch (error) {
        console.error('Unexpected error fetching profile:', error);
        toast.error('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;
    
    setIsSaving(true);
    
    try {
      const success = await profileService.updateProfile(fullName, avatarUrl);
      
      if (!success) {
        toast.error('Failed to update profile');
        return;
      }
      
      // Update local state
      setProfile(prev => prev ? { ...prev, full_name: fullName, avatar_url: avatarUrl } : null);
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Unexpected error updating profile:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleFileUpload = async (file: File) => {
    if (!profile) return;
    
    setIsUploadingAvatar(true);
    
    try {
      const publicUrl = await profileService.uploadProfilePicture(file, profile.id);
      
      if (!publicUrl) {
        toast.error('Failed to upload profile picture');
        return;
      }
      
      setAvatarUrl(publicUrl);
      toast.success('Profile picture uploaded successfully');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const validatePasswords = () => {
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords()) return;
    
    setIsChangingPassword(true);
    
    try {
      const success = await profileService.changePassword(currentPassword, newPassword);
      
      if (!success) {
        setPasswordError('Current password is incorrect');
        return;
      }
      
      toast.success('Password changed successfully');
      
      // Clear the form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Unexpected error changing password:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <Button asChild>
          <Link href="/dashboard/subscription">
            <CreditCard className="h-4 w-4 mr-2" />
            Manage Subscription
          </Link>
        </Button>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="sessions" onClick={() => router.push('/dashboard/profile/sessions')}>Sessions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information and how others see you on the platform
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="flex flex-col items-center space-y-4 sm:flex-row sm:items-start sm:space-x-6 sm:space-y-0">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={avatarUrl || undefined} alt={fullName} />
                      <AvatarFallback>{fullName.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <FileUpload 
                      onFileSelected={handleFileUpload}
                      accept="image/*"
                      maxSizeMB={2}
                      buttonText="Upload Profile Picture"
                      className="w-full max-w-xs"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">
                        To change your email address, please contact support
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="avatarUrl">Avatar URL</Label>
                      <Input
                        id="avatarUrl"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        disabled={isUploadingAvatar}
                      />
                      <p className="text-xs text-gray-500">
                        This field is automatically updated when you upload a profile picture
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences">
          {profile && (
            <UserPreferencesComponent 
              userId={profile.id}
              initialPreferences={profile.preferences}
              onPreferencesSaved={() => {
                // Refresh profile data after preferences are saved
                profileService.getCurrentProfile().then(userProfile => {
                  if (userProfile) {
                    setProfile(userProfile);
                  }
                });
              }}
            />
          )}
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        type="button"
                      >
                        {showCurrentPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        type="button"
                      >
                        {showNewPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        type="button"
                      >
                        {showConfirmPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  
                  {passwordError && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                      {passwordError}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/dashboard/profile/mfa')}
                  >
                    Manage Two-Factor Authentication
                  </Button>
                  
                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
            
            <CardFooter className="flex flex-col items-start space-y-4 border-t px-6 py-4">
              <div>
                <h3 className="text-sm font-medium">Account Security Tips</h3>
                <ul className="mt-2 list-inside list-disc text-sm text-gray-600">
                  <li>Use a strong, unique password that you don't use elsewhere</li>
                  <li>Include a mix of letters, numbers, and special characters</li>
                  <li>Change your password regularly</li>
                  <li>Never share your password with anyone</li>
                </ul>
              </div>
              
              <div className="w-full border-t pt-4">
                <h3 className="mb-2 text-sm font-medium text-red-600">Danger Zone</h3>
                <p className="mb-2 text-sm text-gray-600">
                  If you want to permanently delete your account and all associated data:
                </p>
                <Button 
                  variant="outline" 
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => router.push('/dashboard/profile/delete-account')}
                >
                  Delete Account
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
