import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendEmailVerification, reload } from 'firebase/auth';
import { auth, isFirebaseReady } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { toast } from 'sonner';
import { Mail, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmail = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.emailVerified || (profile && profile.isVerified)) {
      navigate('/dashboard');
    }
  }, [user, profile, navigate]);

  const handleResend = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success('Verification email sent! Check your inbox.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification email.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!auth.currentUser) return;
    setChecking(true);
    try {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        toast.success('Email verified! Redirecting...');
        navigate('/dashboard');
      } else {
        toast.info('Email not verified yet. Please check your inbox.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to check verification status.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  if (!isFirebaseReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-primary/20">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl font-cyber">DEMO MODE VERIFICATION</CardTitle>
            <CardDescription>Email verification is simulated in Demo Mode.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="cyber" className="w-full" onClick={() => navigate('/dashboard')}>
              PROCEED_TO_DASHBOARD
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-dark-navy">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-cyber">VERIFY_EMAIL</CardTitle>
          <CardDescription>
            We've sent a verification link to <span className="text-white font-bold">{user?.email}</span>. 
            Please check your inbox (and spam folder) to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="cyber" className="w-full" onClick={handleCheckStatus} disabled={checking}>
            {checking ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
            I'VE_VERIFIED_MY_EMAIL
          </Button>
          
          <Button variant="outline" className="w-full border-white/10" onClick={handleResend} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
            RESEND_VERIFICATION_LINK
          </Button>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign out and try another account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifyEmail;
