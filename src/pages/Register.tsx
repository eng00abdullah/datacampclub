import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { doc, setDoc, runTransaction, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseReady, googleProvider, githubProvider, linkedinProvider } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { toast } from 'sonner';
import { User, Mail, Lock, Phone, GraduationCap, Github, Linkedin, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hashPassword, validatePasswordStrength } from '../lib/utils';
import { demoUsers, setDemoUsers } from '../lib/demoData';
import { generateMemberId } from '../lib/memberUtils';

import { registerSchema } from '../lib/schemas';

const Register = () => {
  const { setMockUser, settings } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    faculty: '',
    academicYear: '',
  });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [processingRedirect, setProcessingRedirect] = useState(false);
  const navigate = useNavigate();

  // Handle Redirect Result
  useEffect(() => {
    if (!isFirebaseReady) return;

    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setProcessingRedirect(true);
          const user = result.user;
          
          // 1. First check if the user already exists in Firestore by UID
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            toast.success('Welcome back!');
            // Complete operations before navigating
            navigate('/dashboard');
            return;
          }

          // 2. If not, create the user document
          // Check for existing "pre-created" record by email (migration/cleanup check)
          const existingDoc = await checkExistingUser(user.email || '');
          let existingData: any = {};
          
          if (existingDoc) {
            existingData = existingDoc.data();
            if (existingDoc.id !== user.uid) {
              const { deleteDoc, doc: firestoreDoc } = await import('firebase/firestore');
              await deleteDoc(firestoreDoc(db, 'users', existingDoc.id));
            }
          }

          const memberId = await generateMemberId(demoUsers);
          const role = 'member';

          await setDoc(userRef, {
            email: user.email?.toLowerCase().trim(),
            fullName: user.displayName || 'New Member',
            phoneNumber: user.phoneNumber || '',
            faculty: '',
            academicYear: '',
            ...existingData,
            role: 'member',
            memberId,
            status: 'active',
            isVerified: user.emailVerified,
            createdAt: existingData?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            uid: user.uid,
          });

          // 3. The navigate must happen AFTER all Firestore operations complete
          toast.success('Account initialized successfully.');
          navigate('/dashboard');
        }
      } catch (error: any) {
        if (error.code !== 'auth/null-user' && error.code !== 'auth/no-auth-event') {
          console.error("Social Registration error:", error);
          toast.error(error.message || 'Social Registration failed.');
        }
      } finally {
        setProcessingRedirect(false);
      }
    };

    handleRedirect();
  }, [navigate]);

  if (processingRedirect) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <h2 className="text-xl font-cyber text-primary animate-pulse tracking-widest">INITIALIZING_SECURE_SESSION...</h2>
        <p className="text-muted-foreground text-xs uppercase tracking-tighter">Please wait while your profile is being synchronized</p>
      </div>
    );
  }

  const isRegistrationClosed = settings && !settings.enableRegistration;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePhone = (phone: string) => {
    return /^(\+20|0)?1[0125][0-9]{8}$/.test(phone);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    const trimmedData = {
      ...formData,
      email: formData.email.trim(),
      password: formData.password.trim()
    };

    try {
      registerSchema.parse(trimmedData);
      
      const memberId = await generateMemberId(demoUsers);
      const role = 'member';

      if (!isFirebaseReady) {
        const hashedPassword = await hashPassword(formData.password);
        const mockUser = {
          uid: 'mock_uid_' + Date.now(),
          email: formData.email,
          fullName: formData.fullName,
          phoneNumber: formData.phone,
          password: hashedPassword, // Store hash for login verification
          role,
          memberId,
          faculty: formData.faculty,
          academicYear: formData.academicYear,
          status: 'active',
          isVerified: false,
        };
        
        // Save to demo users (in-memory)
        setDemoUsers([...demoUsers, mockUser]);
        
        setMockUser(mockUser);
        toast.success('Registration Successful (Demo Mode)');
        toast.info('In Demo Mode, a simulated verification link was "sent" to your email. Real emails require Firebase setup.', { duration: 6000 });
        navigate('/dashboard');
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      // Check for existing "pre-created" record by email
      let existingData: any = {};
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(db, 'users'), where('email', '==', formData.email.toLowerCase().trim()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          existingData = snap.docs[0].data();
          // Delete the old "orphan" doc if it has a different ID than user.uid
          if (snap.docs[0].id !== user.uid) {
            const { deleteDoc, doc } = await import('firebase/firestore');
            await deleteDoc(doc(db, 'users', snap.docs[0].id));
          }
        }
      } catch (err) {
        console.warn("Could not check for existing record:", err);
      }

      // Send verification email
      await sendEmailVerification(user);
      
      await setDoc(doc(db, 'users', user.uid), {
        ...existingData,
        email: formData.email.toLowerCase().trim(),
        fullName: formData.fullName,
        phoneNumber: formData.phone,
        faculty: formData.faculty,
        academicYear: formData.academicYear,
        role: 'member', // Sensitive: Always member on public register
        memberId,
        status: 'active', // Sensitive: Always active
        isVerified: false, // Sensitive: Must re-verify email
        createdAt: existingData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        uid: user.uid, // Sensitive: Force Auth UID
      });

      toast.success('Registration Successful! A verification link has been sent to your email.');
      navigate('/dashboard');
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        toast.error(error.errors[0]?.message || 'Validation failed');
      } else {
        toast.error(error.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Check for existing "pre-created" record by email
  const checkExistingUser = async (email: string) => {
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase().trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0];
      }
    } catch (err) {
      console.warn("Could not check for existing record:", err);
    }
    return null;
  };

  const handleSocialRegister = async (provider: any) => {
    if (loading || socialLoading) return;
    if (!isFirebaseReady) {
      return toast.error('Social login is disabled in Demo Mode. Please use email registration.');
    }
    
    setSocialLoading(true);
    
    // Safety timeout: If redirect doesn't happen in 8 seconds, unlock the UI
    const timeout = setTimeout(() => {
      setSocialLoading(false);
      toast.error('Identity provider is taking too long. Please ensure third-party cookies are enabled or try another browser.');
    }, 8000);

    try {
      // Switch to Redirect for better reliability across domains
      await signInWithRedirect(auth, provider);
      // If we reach here, the redirect has started, but the page will soon reload anyway.
    } catch (error: any) {
      clearTimeout(timeout);
      toast.error(error.message || 'Social Registration failed to initialize.');
      setSocialLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <Card className="w-full max-w-2xl border-primary/20">
        {isRegistrationClosed ? (
          <div className="p-12 text-center space-y-6">
            <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-4" />
            <div className="space-y-4">
              <h2 className="text-3xl font-black font-cyber tracking-tighter">REGISTRATION_CLOSED</h2>
              <p className="text-muted-foreground leading-relaxed">
                New membership applications are currently suspended by complex command. 
                Please contact the administration for access keys.
              </p>
            </div>
            <Button variant="outline" className="w-full h-12 border-primary/20" onClick={() => navigate('/login')}>RETURN_TO_LOGIN_PORTAL</Button>
          </div>
        ) : (
          <>
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-3xl">INITIALIZE MEMBERSHIP</CardTitle>
              <CardDescription>Join the elite data science community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Social Logins */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="border-primary/20 hover:bg-primary/10 relative overflow-hidden"
                  onClick={() => handleSocialRegister(googleProvider)}
                  disabled={loading || socialLoading}
                >
                  {socialLoading && <div className="absolute inset-0 bg-primary/20 animate-pulse" />}
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4 mr-2" alt="Google" />
                  GOOGLE
                </Button>
                <Button 
                  variant="outline" 
                  className="border-primary/20 hover:bg-primary/10 relative overflow-hidden"
                  onClick={() => handleSocialRegister(githubProvider)}
                  disabled={loading || socialLoading}
                >
                  {socialLoading && <div className="absolute inset-0 bg-primary/20 animate-pulse" />}
                  <Github className="w-4 h-4 mr-2" />
                  GITHUB
                </Button>
                <Button 
                  variant="outline" 
                  className="border-primary/20 hover:bg-primary/10 relative overflow-hidden"
                  onClick={() => handleSocialRegister(linkedinProvider)}
                  disabled={loading || socialLoading}
                >
                  {socialLoading && <div className="absolute inset-0 bg-primary/20 animate-pulse" />}
                  <Linkedin className="w-4 h-4 mr-2" />
                  LINKEDIN
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-dark-navy px-2 text-muted-foreground">Or continue with email</span></div>
              </div>

              <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-cyber uppercase tracking-widest text-muted-foreground">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input name="fullName" placeholder="John Doe" className="pl-10" onChange={handleChange} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-cyber uppercase tracking-widest text-muted-foreground">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input name="email" type="email" placeholder="name@example.com" className="pl-10" onChange={handleChange} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-cyber uppercase tracking-widest text-muted-foreground">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input name="phone" placeholder="+20 123 456 7890" className="pl-10" onChange={handleChange} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-cyber uppercase tracking-widest text-muted-foreground">Faculty</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select 
                      name="faculty" 
                      className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 pl-10 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      onChange={handleChange as any}
                      required
                    >
                      <option value="" className="bg-dark-navy">Select Faculty</option>
                      <option value="Computer Science" className="bg-dark-navy">Computer Science</option>
                      <option value="Engineering" className="bg-dark-navy">Engineering</option>
                      <option value="Nursing" className="bg-dark-navy">Nursing</option>
                      <option value="Physical Therapy" className="bg-dark-navy">Physical Therapy</option>
                      <option value="Business" className="bg-dark-navy">Business</option>
                      <option value="Arts" className="bg-dark-navy">Arts</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-cyber uppercase tracking-widest text-muted-foreground">Academic Year</label>
                  <select 
                    name="academicYear" 
                    className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    onChange={handleChange as any}
                    required
                  >
                    <option value="" className="bg-dark-navy">Select Year</option>
                    <option value="1" className="bg-dark-navy">Year 1</option>
                    <option value="2" className="bg-dark-navy">Year 2</option>
                    <option value="3" className="bg-dark-navy">Year 3</option>
                    <option value="4" className="bg-dark-navy">Year 4</option>
                    <option value="5" className="bg-dark-navy">Year 5</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-cyber uppercase tracking-widest text-muted-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input name="password" type="password" placeholder="••••••••" className="pl-10" onChange={handleChange} required />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-cyber uppercase tracking-widest text-muted-foreground">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input name="confirmPassword" type="password" placeholder="••••••••" className="pl-10" onChange={handleChange} required />
                  </div>
                </div>
                <Button type="submit" variant="cyber" className="md:col-span-2 w-full mt-4" disabled={loading}>
                  {loading ? 'PROCESSING UPLOAD...' : 'INITIALIZE ACCOUNT'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="justify-center">
              <p className="text-sm text-muted-foreground">
                Already have an identity? <Link to="/login" className="text-primary hover:underline font-bold">Access Portal</Link>
              </p>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
};

export default Register;
