import React from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { signInWithRedirect, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, isFirebaseReady } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { toast } from 'sonner';
import { Mail, Lock, Chrome } from 'lucide-react';

const Login = () => {
  const { user, loading: authLoading, loginWithGoogle, authError } = useAuth();
  const [localLoading, setLocalLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleGoogle = async () => {
    setLocalLoading(true);
    try {
      await loginWithGoogle();
    } finally {
      setLocalLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Access Granted.');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLocalLoading(false);
    }
  };

  const isWorking = localLoading || authLoading;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-6">
      {authError === 'unauthorized-domain' && (
        <Card className="max-w-md w-full border-red-500/50 bg-red-500/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center gap-2">
              <span className="animate-pulse">⚠️</span> CONFIGURATION_ERROR
            </CardTitle>
            <CardDescription className="text-red-400/80">
              The current domain is not authorized in Firebase settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-black/40 rounded border border-red-500/20">
              <p className="text-muted-foreground mb-4">To fix this, go to Firebase Console:</p>
              <a 
                href="https://console.firebase.google.com/project/datacampclub/authentication/settings" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline font-bold mb-6"
              >
                OPEN AUTH_SETTINGS_GATEWAY ↗
              </a>
              <p className="text-muted-foreground mb-2 whitespace-nowrap">Add this exact domain to authorized list:</p>
              <code className="bg-primary/10 text-primary px-3 py-2 rounded inline-block w-full truncate select-all border border-primary/20">
                {window.location.hostname}
              </code>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="w-full max-w-md border-primary/20 bg-dark-navy/50 backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-cyber text-primary tracking-tighter">ESTABLISH_CONNECTION</CardTitle>
          <CardDescription>Enter credentials for identity verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            variant="outline" 
            className="w-full border-primary/20 hover:bg-primary/10 h-12"
            onClick={handleGoogle}
            disabled={isWorking}
          >
            <Chrome className="w-4 h-4 mr-2" />
            GOOGLE_AUTH_PROTOCOL
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-dark-navy px-2 text-muted-foreground font-mono">OR_ENCRYPTED_AUTH</span></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-cyber text-muted-foreground uppercase opacity-50">Email_Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                <Input type="email" placeholder="agent@network.sys" className="pl-10" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-cyber text-muted-foreground uppercase opacity-50">Access_Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                <Input type="password" placeholder="••••••••" className="pl-10" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>
            <Button type="submit" variant="cyber" className="w-full h-12" disabled={isWorking}>
              {isWorking ? 'SYNCHRONIZING...' : 'ESTABLISH_SESSION'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground tracking-widest">
            UNKNOWN_ID? <Link to="/register" className="text-primary font-bold hover:underline">INITIALIZE_MEMBERSHIP</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
