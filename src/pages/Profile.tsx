import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';
import { 
  User, Mail, Lock, Phone, GraduationCap, Save, 
  Shield, Camera, Key, CheckCircle2, AlertCircle, 
  Smartphone, ArrowRight, X
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db, auth, isFirebaseReady } from '../lib/firebase';
import ImagePicker from '../components/ImagePicker';
import { sendOTP, verifyOTP } from '../lib/otp';
import { motion, AnimatePresence } from 'motion/react';
import { hashPassword, validatePasswordStrength } from '../lib/utils';
import { uploadFile, getStoragePath } from '../services/storageService';
import { demoUsers, setDemoUsers } from '../lib/demoData';

import { profileSchema } from '../lib/schemas';

const Profile = () => {
  const { user, profile, setMockUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Profile Info State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    faculty: '',
    academicYear: '',
    photoURL: '',
  });

  // OTP Flow State
  const [otpStep, setOtpStep] = useState<'none' | 'verify' | 'success'>('none');
  const [otpAction, setOtpAction] = useState<'password' | 'email' | 'none'>('none');
  const [otpTarget, setOtpTarget] = useState('');
  const [otpType, setOtpType] = useState<'email' | 'phone'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  
  const MAX_ATTEMPTS = 5;

  // Re-auth State
  const [showReauth, setShowReauth] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  
  // New Data State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phone: profile.phoneNumber || '',
        faculty: profile.faculty || '',
        academicYear: profile.academicYear || '',
        photoURL: profile.photoURL || '',
      });
      setNewEmail(profile.email || '');
    }
  }, [profile]);

  useEffect(() => {
    let timer: any;
    if (timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft]);

  const validatePhone = (phone: string) => {
    return /^(\+20|0)?1[0125][0-9]{8}$/.test(phone);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);

    try {
      profileSchema.parse(formData);
      
      let finalPhotoURL = formData.photoURL;

      // Check if photo is a base64 string (meaning it was just selected)
      if (formData.photoURL.startsWith('data:image')) {
        if (isFirebaseReady && user) {
          try {
            const response = await fetch(formData.photoURL);
            const blob = await response.blob();
            
            // Delete old photo if it exists
            if (profile?.photoURL) {
              const { deleteFile } = await import('../services/storageService');
              await deleteFile(profile.photoURL);
            }
            
            const path = getStoragePath('profile_photos', user.uid, `profile_${Date.now()}.jpg`);
            finalPhotoURL = await uploadFile(path, blob);
          } catch (uploadErr) {
            console.error("Storage upload failed, falling back to original:", uploadErr);
          }
        }
      }

      if (!isFirebaseReady) {
        if (profile) {
          const updatedUsers = demoUsers.map((u: any) => 
            u.uid === profile.uid ? { ...u, ...formData, phoneNumber: formData.phone, photoURL: finalPhotoURL } : u
          );
          setDemoUsers(updatedUsers);

          const updatedProfile = { ...profile, ...formData, phoneNumber: formData.phone, photoURL: finalPhotoURL };
          setMockUser(updatedProfile);
        }
        toast.success('Profile updated (Demo Mode)');
      } else if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          fullName: formData.fullName,
          phoneNumber: formData.phone,
          faculty: formData.faculty,
          academicYear: formData.academicYear,
          photoURL: finalPhotoURL,
          updatedAt: new Date().toISOString(),
        });
        toast.success('Profile updated successfully');
      }
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        toast.error(error.errors[0]?.message || 'Validation failed');
      } else {
        toast.error(error.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const startOtpFlow = async (action: 'password' | 'email', type: 'email' | 'phone' = 'email') => {
    if (isBlocked) {
      return toast.error('Too many failed attempts. Please try again later.');
    }
    if (timeLeft > 0) {
      return toast.error(`Please wait ${timeLeft}s before requesting a new code.`);
    }

    const target = type === 'email' ? profile?.email : profile?.phoneNumber;
    
    if (!target) {
      toast.error(`No ${type} associated with this account.`);
      return;
    }

    setLoading(true);
    const success = await sendOTP(target, type);
    setLoading(false);

    if (success) {
      setOtpAction(action);
      setOtpTarget(target);
      setOtpType(type);
      setOtpStep('verify');
      setTimeLeft(60);
      setAttempts(0);
      toast.success(`OTP sent to ${target}`);
    } else {
      toast.error('Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6 || isBlocked) return;
    
    setLoading(true);
    const isValid = await verifyOTP(otpTarget, otpCode);
    setLoading(false);

    if (isValid) {
      setOtpStep('success');
      toast.success('Identity verified');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setIsBlocked(true);
        toast.error('Maximum attempts reached. Access blocked.');
      } else {
        toast.error(`Invalid or expired OTP. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
      }
      setOtpCode('');
    }
  };

  const finalizeAction = async () => {
    if (otpAction === 'password') {
      const passwordCheck = validatePasswordStrength(newPassword);
      if (!passwordCheck.isValid) {
        return toast.error(passwordCheck.message);
      }
      if (newPassword !== confirmPassword) throw new Error('Passwords do not match');
    }

    setLoading(true);
    try {
      // Re-authentication check for real Firebase
      if (isFirebaseReady && auth.currentUser && auth.currentUser.email) {
        try {
          const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
          await reauthenticateWithCredential(auth.currentUser, credential);
        } catch (error: any) {
          if (error.code === 'auth/wrong-password') {
            throw new Error('Incorrect current password. Re-authentication failed.');
          }
          throw error;
        }
      }

      if (otpAction === 'password') {
        if (!isFirebaseReady) {
          const hashedPassword = await hashPassword(newPassword);
          const updatedUsers = demoUsers.map((u: any) => 
            u.uid === profile?.uid ? { ...u, password: hashedPassword } : u
          );
          setDemoUsers(updatedUsers);
          toast.success('Password updated (Demo Mode)');
        } else if (auth.currentUser) {
          await updatePassword(auth.currentUser, newPassword);
          toast.success('Password updated successfully');
        }
      } else if (otpAction === 'email') {
        if (!newEmail || newEmail === profile?.email) throw new Error('Please enter a new email');

        if (!isFirebaseReady) {
          const updatedUsers = demoUsers.map((u: any) => 
            u.uid === profile?.uid ? { ...u, email: newEmail } : u
          );
          setDemoUsers(updatedUsers);

          const updatedProfile = { ...profile!, email: newEmail };
          setMockUser(updatedProfile);
          toast.success('Email updated (Demo Mode)');
        } else if (auth.currentUser) {
          await updateEmail(auth.currentUser, newEmail);
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userRef, { email: newEmail });
          toast.success('Email updated successfully');
        }
      }
      
      // Reset flow
      setOtpStep('none');
      setOtpAction('none');
      setNewPassword('');
      setConfirmPassword('');
      setOtpCode('');
      setCurrentPassword('');
      setShowReauth(false);
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-cyber tracking-tighter">USER PROFILE</h1>
          <p className="text-muted-foreground">Manage your identity and security settings.</p>
        </div>
        <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-[10px] font-cyber uppercase tracking-widest text-primary">Member ID: {profile?.memberId}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center space-x-2 text-primary mb-2">
                <User className="w-5 h-5" />
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </div>
              <CardDescription>Update your public profile details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <ImagePicker 
                  label="Profile Picture"
                  currentImage={formData.photoURL}
                  onImageSelected={(base64) => setFormData({ ...formData, photoURL: base64 })}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        value={formData.fullName} 
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} 
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        value={formData.phone} 
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                        className="pl-10"
                        placeholder="+20 123 456 7890"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Faculty</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <select 
                        className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 pl-10 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        value={formData.faculty}
                        onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
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
                    <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Academic Year</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    >
                      <option value="" className="bg-dark-navy">Select Year</option>
                      <option value="1" className="bg-dark-navy">Year 1</option>
                      <option value="2" className="bg-dark-navy">Year 2</option>
                      <option value="3" className="bg-dark-navy">Year 3</option>
                      <option value="4" className="bg-dark-navy">Year 4</option>
                      <option value="5" className="bg-dark-navy">Year 5</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="cyber" disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    SAVE_CHANGES
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Security */}
        <div className="space-y-8">
          <Card className="border-neon-blue/20">
            <CardHeader>
              <div className="flex items-center space-x-2 text-neon-blue mb-2">
                <Shield className="w-5 h-5" />
                <CardTitle className="text-lg">Security Controls</CardTitle>
              </div>
              <CardDescription>Manage your access credentials securely via OTP.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 glass rounded-xl border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-neon-purple/10 rounded-lg">
                      <Lock className="w-4 h-4 text-neon-purple" />
                    </div>
                    <span className="text-sm font-bold">Password</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-[10px] font-cyber h-8"
                    onClick={() => startOtpFlow('password')}
                  >
                    CHANGE
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-neon-blue/10 rounded-lg">
                      <Mail className="w-4 h-4 text-neon-blue" />
                    </div>
                    <span className="text-sm font-bold">Email</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-[10px] font-cyber h-8"
                    onClick={() => startOtpFlow('email')}
                  >
                    CHANGE
                  </Button>
                </div>
              </div>

              <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-[10px] font-cyber uppercase tracking-widest">Security Note</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Sensitive actions require identity verification. If you cannot access your email, use the SMS fallback option.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* OTP Verification Overlay */}
      <AnimatePresence>
        {otpStep !== 'none' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-navy/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md"
            >
              <Card className="border-primary/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-neon-blue to-neon-purple" />
                <button 
                  onClick={() => setOtpStep('none')}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    {otpStep === 'verify' ? <Shield className="w-8 h-8 text-primary" /> : <CheckCircle2 className="w-8 h-8 text-primary" />}
                  </div>
                  <CardTitle className="font-cyber tracking-tighter">
                    {otpStep === 'verify' ? 'IDENTITY_VERIFICATION' : 'VERIFICATION_SUCCESS'}
                  </CardTitle>
                  <CardDescription>
                    {otpStep === 'verify' 
                      ? `Enter the 6-digit code sent to ${otpTarget}`
                      : `You can now finalize your ${otpAction} update.`}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {otpStep === 'verify' ? (
                    <div className="space-y-6">
                      <div className="flex justify-center gap-2">
                        <Input 
                          className="text-center text-2xl font-black tracking-[1em] h-14 font-mono"
                          maxLength={6}
                          placeholder="000000"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                      <div className="flex flex-col gap-3">
                        <Button variant="cyber" className="w-full" onClick={handleVerifyOTP} disabled={loading || otpCode.length !== 6}>
                          VERIFY_CODE
                        </Button>
                        <div className="flex justify-between items-center text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">
                          <span>Didn't receive code?</span>
                          <button 
                            className={`text-primary hover:underline ${timeLeft > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => startOtpFlow(otpAction as any, otpType)}
                            disabled={timeLeft > 0}
                          >
                            {timeLeft > 0 ? `RESEND (${timeLeft}s)` : 'RESEND'}
                          </button>
                        </div>
                        {otpType === 'email' && profile?.phoneNumber && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-[10px] font-cyber text-neon-blue"
                            onClick={() => startOtpFlow(otpAction as any, 'phone')}
                          >
                            <Smartphone className="w-3 h-3 mr-2" />
                            USE SMS FALLBACK
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {otpAction === 'email' ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">New Email Address</label>
                            <Input 
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="new@example.com"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">New Password</label>
                            <Input 
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="••••••••"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Confirm New Password</label>
                            <Input 
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                            />
                          </div>
                        </div>
                      )}

                      {isFirebaseReady && (
                        <div className="space-y-2 pt-4 border-t border-white/10">
                          <div className="flex items-center gap-2 text-neon-blue mb-2">
                            <Key className="w-3 h-3" />
                            <label className="text-[10px] font-cyber uppercase tracking-widest">Confirm Current Password</label>
                          </div>
                          <Input 
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password to confirm"
                            required
                          />
                          <p className="text-[10px] text-muted-foreground italic">
                            Required by security protocols for sensitive updates.
                          </p>
                        </div>
                      )}

                      <Button variant="cyber" className="w-full" onClick={finalizeAction} disabled={loading || (isFirebaseReady && !currentPassword)}>
                        FINALIZE_UPDATE
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
