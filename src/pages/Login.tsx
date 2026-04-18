import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, githubProvider, linkedinProvider, isFirebaseReady } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { toast } from 'sonner';
import { Mail, Lock, Chrome, Github, Linkedin } from 'lucide-react';
import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { hashPassword } from '../lib/utils';
import { demoUsers } from '../lib/demoData';
import { generateMemberId } from '../lib/memberUtils';

const Login = () => {
  const { setMockUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    try {
      if (!isFirebaseReady) {
        // Fetch real role from demoUsers (in-memory)
        const existingUser = demoUsers.find((u: any) => u.email === trimmedEmail);
        
        if (!existingUser) {
          throw new Error('User not found in demo database.');
        }

        if (existingUser.password) {
          const hashedInput = await hashPassword(trimmedPassword);
          if (existingUser.password !== hashedInput) {
            throw new Error('Invalid password for demo account.');
          }
        }

        setMockUser(existingUser);
        toast.success('Demo Mode: Access Granted.');
        navigate('/dashboard');
        return;
      }
      await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      toast.success('Access Granted. Welcome back.');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: any) => {
    if (!isFirebaseReady) {
      return toast.error('Social login is disabled in Demo Mode. Please use email login.');
    }
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const memberId = await generateMemberId(demoUsers);
        const role = 'member';

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          fullName: user.displayName || 'New Member',
          role,
          memberId,
          status: 'active',
          isVerified: user.emailVerified,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      toast.success('Authentication Successful.');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Social Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl">SYSTEM LOGIN</CardTitle>
          <CardDescription>Enter your credentials to access the portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-cyber uppercase tracking-widest text-muted-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="name@datacamp.club" 
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-cyber uppercase tracking-widest text-muted-foreground">Password</label>
                <Link to="/forgot-password" title="Reset Password" className="text-[10px] text-primary hover:underline uppercase tracking-widest">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" variant="cyber" className="w-full" disabled={loading}>
              {loading ? 'AUTHENTICATING...' : 'AUTHORIZE ACCESS'}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground tracking-widest">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-3 gap-4">
              <Button variant="outline" onClick={() => handleSocialLogin(googleProvider)} className="border-white/10" disabled={loading}>
                <Chrome className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => handleSocialLogin(githubProvider)} className="border-white/10" disabled={loading}>
                <Github className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => handleSocialLogin(linkedinProvider)} className="border-white/10" disabled={loading}>
                <Linkedin className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            New operative? <Link to="/register" className="text-primary hover:underline font-bold">Initialize Account</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
