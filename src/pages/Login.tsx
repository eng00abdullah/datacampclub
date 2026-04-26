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
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const navigate = useNavigate();

  if (user) return <Navigate to="/dashboard" />;

  const handleGoogle = async () => {
    if (!isFirebaseReady) return toast.error('Firebase not ready');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        toast.success('Identity Verified.');
        // The AuthContext will handle the redirect to dashboard
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Access Granted.');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
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
            disabled={loading || authLoading}
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
            <Button type="submit" variant="cyber" className="w-full h-12" disabled={loading}>
              {loading ? 'SYNCHRONIZING...' : 'ESTABLISH_SESSION'}
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
