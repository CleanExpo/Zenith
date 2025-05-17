'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, AlertTriangle } from 'lucide-react';

export default function MFAPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMfaEnabled, setIsMfaEnabled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Recovery codes
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  
  useEffect(() => {
    const checkMfaStatus = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('Error fetching user:', userError);
          toast.error('You must be logged in to manage MFA');
          router.push('/auth/login');
          return;
        }
        
        // Check if MFA is already enabled
        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        
        if (factorsError) {
          console.error('Error fetching MFA factors:', factorsError);
          toast.error('Unable to check MFA status');
          return;
        }
        
        const totp = factors.totp.find(factor => factor.status === 'verified');
        
        if (totp) {
          setIsMfaEnabled(true);
          setFactorId(totp.id);
        }
      } catch (error) {
        console.error('Unexpected error checking MFA status:', error);
        toast.error('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkMfaStatus();
  }, [router, supabase.auth]);
  
  const handleEnrollMfa = async () => {
    setIsEnrolling(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });
      
      if (error) {
        toast.error(error.message);
        console.error('MFA enrollment error:', error);
        setIsEnrolling(false);
        return;
      }
      
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (error) {
      console.error('Unexpected error during MFA enrollment:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsEnrolling(false);
    }
  };
  
  const handleVerifyMfa = async () => {
    if (!verificationCode || verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }
    
    setIsVerifying(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: factorId!,
      });
      
      if (error) {
        toast.error(error.message);
        console.error('MFA challenge error:', error);
        setIsVerifying(false);
        return;
      }
      
      const challengeId = data.id;
      
      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factorId!,
        challengeId,
        code: verificationCode,
      });
      
      if (verifyError) {
        setError('Invalid verification code. Please try again.');
        console.error('MFA verification error:', verifyError);
        setIsVerifying(false);
        return;
      }
      
      // Generate mock recovery codes for demonstration
      // In a real implementation, you would get these from the Supabase API
      const mockRecoveryCodes = [
        'ABCD-EFGH-IJKL-MNOP',
        'QRST-UVWX-YZ12-3456',
        '7890-ABCD-EFGH-IJKL',
        'MNOP-QRST-UVWX-YZ12',
        '3456-7890-ABCD-EFGH',
        'IJKL-MNOP-QRST-UVWX',
        'YZ12-3456-7890-ABCD',
        'EFGH-IJKL-MNOP-QRST'
      ];
      
      setRecoveryCodes(mockRecoveryCodes);
      setShowRecoveryCodes(true);
      setIsMfaEnabled(true);
      toast.success('Two-factor authentication enabled successfully');
      
      // Reset the form
      setQrCode(null);
      setSecret(null);
      setVerificationCode('');
    } catch (error) {
      console.error('Unexpected error during MFA verification:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleDisableMfa = async () => {
    if (!factorId) return;
    
    setIsUnenrolling(true);
    
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });
      
      if (error) {
        toast.error(error.message);
        console.error('MFA unenrollment error:', error);
        return;
      }
      
      setIsMfaEnabled(false);
      setFactorId(null);
      setQrCode(null);
      setSecret(null);
      setVerificationCode('');
      setRecoveryCodes([]);
      setShowRecoveryCodes(false);
      
      toast.success('Two-factor authentication disabled successfully');
    } catch (error) {
      console.error('Unexpected error during MFA unenrollment:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsUnenrolling(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
          <p className="text-gray-600">Loading MFA settings...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Two-Factor Authentication</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/profile')}
        >
          Back to Profile
        </Button>
      </div>
      
      <Alert className="mb-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Enhance Your Account Security</AlertTitle>
        <AlertDescription>
          Two-factor authentication adds an extra layer of security to your account by requiring a verification code from your authenticator app in addition to your password.
        </AlertDescription>
      </Alert>
      
      {!isMfaEnabled && !qrCode && (
        <Card>
          <CardHeader>
            <CardTitle>Enable Two-Factor Authentication</CardTitle>
            <CardDescription>
              Protect your account with an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">
                  Require a verification code when signing in
                </p>
              </div>
              <Button 
                onClick={handleEnrollMfa}
                disabled={isEnrolling}
              >
                {isEnrolling ? 'Setting up...' : 'Set up'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {!isMfaEnabled && qrCode && (
        <Card>
          <CardHeader>
            <CardTitle>Set Up Two-Factor Authentication</CardTitle>
            <CardDescription>
              Scan the QR code with your authenticator app or enter the setup key manually
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4 sm:flex-row sm:items-start sm:space-x-6 sm:space-y-0">
                <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-white p-2">
                  <QRCodeSVG value={qrCode || ''} size={160} />
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">1. Scan QR Code</h3>
                    <p className="text-sm text-gray-500">
                      Open your authenticator app and scan the QR code to add your account
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">2. Or Enter Setup Key Manually</h3>
                    <div className="mt-1 flex items-center space-x-2">
                      <code className="rounded bg-gray-100 px-2 py-1 text-sm">{secret}</code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(secret || '')}
                        className="h-8 w-8 p-0"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">3. Enter Verification Code</h3>
                    <p className="text-sm text-gray-500">
                      Enter the 6-digit code from your authenticator app
                    </p>
                    <div className="mt-2 space-y-2">
                      <Input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.slice(0, 6))}
                        placeholder="000000"
                        className="w-full max-w-[200px]"
                        maxLength={6}
                      />
                      
                      {error && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                          {error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setQrCode(null);
                    setSecret(null);
                    setVerificationCode('');
                    setError('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleVerifyMfa}
                  disabled={isVerifying || !verificationCode}
                >
                  {isVerifying ? 'Verifying...' : 'Verify and Enable'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {showRecoveryCodes && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recovery Codes</CardTitle>
            <CardDescription>
              Save these recovery codes in a secure place. You can use them to access your account if you lose your authenticator device.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md bg-gray-50 p-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {recoveryCodes.map((code, index) => (
                    <div key={index} className="font-mono text-sm">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(recoveryCodes.join('\n'))}
                >
                  {copied ? 'Copied!' : 'Copy Codes'}
                </Button>
                <Button onClick={() => setShowRecoveryCodes(false)}>
                  Done
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {isMfaEnabled && !showRecoveryCodes && (
        <Card>
          <CardHeader>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>
              Your account is protected with two-factor authentication
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">
                  A verification code is required when signing in
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-green-600">Enabled</span>
                <Switch checked={true} disabled />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <Button 
              variant="outline" 
              onClick={() => setShowRecoveryCodes(true)}
            >
              View Recovery Codes
            </Button>
            
            <Button 
              variant="destructive"
              onClick={handleDisableMfa}
              disabled={isUnenrolling}
            >
              {isUnenrolling ? 'Disabling...' : 'Disable Two-Factor Authentication'}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      <div className="mt-8 rounded-md bg-gray-50 p-4">
        <h3 className="mb-2 font-medium">Security Tips</h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
          <li>Use a trusted authenticator app like Google Authenticator, Authy, or Microsoft Authenticator</li>
          <li>Store your recovery codes in a secure location, separate from your authenticator device</li>
          <li>If you lose access to your authenticator app and recovery codes, you may be locked out of your account</li>
          <li>Consider enabling two-factor authentication for all your important accounts</li>
        </ul>
      </div>
    </div>
  );
}
