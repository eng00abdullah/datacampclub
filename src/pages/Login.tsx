import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db, isFirebaseReady } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { toast } from 'sonner';
import { Mail, Lock, Chrome } from 'lucide-react';
import { generateMemberId } from '../lib/memberUtils';
import { demoUsers } from '../lib/demoData';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    if (!isFirebaseReady) return toast.error('Firebase not configured');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        const memberId = await generateMemberId(demoUsers);
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          fullName: user.displayName || 'New Member',
          role: 'member',
          memberId,
          status: 'active',
          isVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      
      toast.success('Welcome to DataCamp Club!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login Successful');
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
          <CardTitle className="text-2xl font-cyber text-primary">ACCESS_PORTAL</CardTitle>
          <CardDescription>Enter credentials to establish connection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            variant="outline" 
            className="w-full border-primary/20 hover:bg-primary/10 h-12"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <Chrome className="w-4 h-4 mr-2 text-primary" />
            CONTINUE_WITH_GOOGLE
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-dark-navy px-2 text-muted-foreground font-mono">OR_ENCRYPTED_AUTH</span></div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-cyber text-muted-foreground uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                <Input type="email" placeholder="agent@datacamp.club" className="pl-10" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-cyber text-muted-foreground uppercase tracking-widest">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                <Input type="password" placeholder="••••••••" className="pl-10" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>
            <Button type="submit" variant="cyber" className="w-full h-12" disabled={loading}>
              {loading ? 'SYNCHRONIZING...' : 'ESTABLISH_SESSION'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Link to="/forgot-password" size="sm" className="text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Forgot Access Codes?</Link>
          <p className="text-xs text-muted-foreground">
            UNREGISTERED_IDENTITY? <Link to="/register" className="text-primary font-bold hover:underline">INITIALIZE_MEMBERSHIP</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
