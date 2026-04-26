import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';

// Google SVG Icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FeatureItem = ({ icon, text }: { icon: string; text: string }) => (
  <div className="flex items-center gap-3 text-sm text-muted-foreground">
    <span className="text-primary font-mono text-xs">{icon}</span>
    <span className="font-mono text-xs tracking-wide">{text}</span>
  </div>
);

const Register = () => {
  const { user, loading: authLoading, loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();

  // ✅ Redirect بعد ما onAuthStateChanged يسجّل الـ user
  React.useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // ✅ لو الـ popup اتقفل من غير تسجيل → وقف الـ loading
  React.useEffect(() => {
    if (isLoading && !authLoading && !user) {
      setIsLoading(false);
    }
  }, [authLoading, isLoading, user]);

  const handleGoogleSignUp = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch {
      setIsLoading(false);
    }
  };

  const showSpinner = isLoading || authLoading;

  if (authLoading && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary font-cyber animate-pulse text-sm tracking-widest">
          SYNCHRONIZING...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 gap-6">
      <Card className="w-full max-w-md border-primary/20 bg-dark-navy/60 backdrop-blur-2xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-cyber text-primary tracking-tighter">
            INITIALIZE_MEMBERSHIP
          </CardTitle>
          <CardDescription className="font-mono text-xs">
            Join the DataCamp Student Club community
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="rounded-md border border-primary/10 bg-primary/5 p-4 space-y-3">
            <p className="text-[10px] font-cyber text-primary/60 uppercase tracking-widest mb-3">
              MEMBERSHIP_INCLUDES
            </p>
            <FeatureItem icon="▸" text="Access to exclusive events & workshops" />
            <FeatureItem icon="▸" text="Collaborate on data science projects" />
            <FeatureItem icon="▸" text="Connect with the club community" />
            <FeatureItem icon="▸" text="Track your learning progress" />
          </div>

          <Button
            variant="cyber"
            className="w-full h-14 gap-3 text-sm font-cyber tracking-wider"
            onClick={handleGoogleSignUp}
            disabled={showSpinner}
          >
            {showSpinner ? (
              <>
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span>CREATING_ACCOUNT...</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span>JOIN_WITH_GOOGLE</span>
              </>
            )}
          </Button>

          <p className="text-center text-[10px] text-muted-foreground font-mono leading-relaxed px-2">
            By joining, you agree to our community guidelines.
            <br />
            Your profile will be set up automatically using your Google account.
          </p>
        </CardContent>

        <CardFooter className="justify-center pt-0">
          <p className="text-xs text-muted-foreground tracking-widest font-mono">
            ALREADY_IDENTIFIED?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              ACCESS_PORTAL
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
