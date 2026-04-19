import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { signInWithRedirect, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, googleProvider, db, isFirebaseReady } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { toast } from 'sonner';
import { User, Mail, Lock, Phone, GraduationCap, Chrome } from 'lucide-react';
import { generateMemberId } from '../lib/memberUtils';
import { demoUsers } from '../lib/demoData';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({ fullName: '', email: '', phone: '', password: '', faculty: '' });

  if (user) return <Navigate to="/dashboard" />;

  const handleGoogle = () => {
    if (!isFirebaseReady) return toast.error('Firebase not ready');
    setLoading(true);
    signInWithRedirect(auth, googleProvider);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await sendEmailVerification(user);
      const memberId = await generateMemberId(demoUsers);
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: formData.email,
        fullName: formData.fullName,
        phoneNumber: formData.phone,
        faculty: formData.faculty,
        role: 'member',
        memberId,
        status: 'active',
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success('Registration Initiated. Verify your email.');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <Card className="w-full max-w-2xl border-primary/20 bg-dark-navy/60 backdrop-blur-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-cyber text-primary tracking-tighter">INITIALIZE_MEMBERSHIP</CardTitle>
          <CardDescription>Join the elite data science community</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <Button 
            variant="outline" 
            className="w-full border-primary/20 hover:bg-primary/10 h-12"
            onClick={handleGoogle}
            disabled={loading}
          >
            <Chrome className="w-4 h-4 mr-2" />
            INITIALIZE_VIA_GOOGLE
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-dark-navy px-2 text-muted-foreground font-mono">OR_MANUAL_INIT</span></div>
          </div>

          <form onSubmit={handleEmailSignup} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-cyber text-muted-foreground uppercase opacity-50">Full_Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                <Input placeholder="John Doe" className="pl-10" onChange={e => setFormData({...formData, fullName: e.target.value})} required />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-cyber text-muted-foreground uppercase opacity-50">Email_Address</label>
              <Input type="email" placeholder="agent@network.sys" onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-cyber text-muted-foreground uppercase opacity-50">Phone_Number</label>
              <Input placeholder="+20 123 456 7890" onChange={e => setFormData({...formData, phone: e.target.value})} required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-cyber text-muted-foreground uppercase opacity-50">Faculty</label>
              <select 
                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                onChange={e => setFormData({...formData, faculty: e.target.value})}
                required
              >
                <option value="" className="bg-dark-navy">Select Faculty</option>
                <option value="Computer Science" className="bg-dark-navy">Computer Science</option>
                <option value="Engineering" className="bg-dark-navy">Engineering</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-cyber text-muted-foreground uppercase opacity-50">Access_Key</label>
              <Input type="password" placeholder="••••••••" onChange={e => setFormData({...formData, password: e.target.value})} required />
            </div>
            <Button type="submit" variant="cyber" className="md:col-span-2 w-full h-12 mt-4" disabled={loading}>
              {loading ? 'PROCESSING_UPLOAD...' : 'CREATE_ACCOUNT'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground tracking-widest">
            ALREADY_IDENTIFIED? <Link to="/login" className="text-primary font-bold hover:underline">ACCESS_PORTAL</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
