import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Logo from '../components/Logo';
import { Button } from '../components/ui/Button';
import { QRCodeSVG } from 'qrcode.react';
import { User, Mail, Phone, GraduationCap, Award, Calendar, Zap, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { isFirebaseReady } from '../lib/firebase';
import { demoEvents } from '../lib/demoData';

const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    points: 0,
    eventsAttended: 0,
    certificates: 0
  });

  useEffect(() => {
    if (!profile) return;

    if (!isFirebaseReady) {
      const attended = demoEvents.filter(e => e.registeredCount > 0).length;
      setStats({
        points: 0,
        eventsAttended: attended,
        certificates: 0
      });
    }
  }, [profile]);

  const downloadIDCard = async () => {
    const element = document.getElementById('id-card');
    if (!element) return;
    const canvas = await html2canvas(element, { backgroundColor: null });
    const link = document.createElement('a');
    link.download = `DataCamp-ID-${profile?.memberId}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  if (!profile) return <div className="p-20 text-center font-cyber animate-pulse">LOADING PROFILE DATA...</div>;

  return (
    <div className="container mx-auto px-6 py-12 space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black font-cyber tracking-tighter">OPERATIVE <span className="text-primary neon-text">DASHBOARD</span></h1>
          <p className="text-muted-foreground">Welcome back, {profile.fullName}. System status: NOMINAL.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-muted-foreground uppercase tracking-widest">Current Rank</div>
            <div className="text-primary font-cyber font-bold">{profile.role.replace('_', ' ').toUpperCase()}</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
            <User className="text-primary w-6 h-6" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Stats & Profile */}
        <div className="lg:col-span-2 space-y-12">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="border-neon-green/20">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-neon-green/10 text-neon-green"><Zap className="w-6 h-6" /></div>
                <div>
                  <div className="text-2xl font-bold font-cyber">{stats.points}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Total Points</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-neon-blue/20">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-neon-blue/10 text-neon-blue"><Calendar className="w-6 h-6" /></div>
                <div>
                  <div className="text-2xl font-bold font-cyber">{stats.eventsAttended}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Events Attended</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-neon-purple/20">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-neon-purple/10 text-neon-purple"><Award className="w-6 h-6" /></div>
                <div>
                  <div className="text-2xl font-bold font-cyber">{stats.certificates}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Certificates</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">IDENTITY DATA</CardTitle>
              <CardDescription>Verified information in the club database</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Mail className="text-primary w-5 h-5" />
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Email Address</div>
                    <div className="text-sm font-medium">{profile.email}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Phone className="text-primary w-5 h-5" />
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Phone Number</div>
                    <div className="text-sm font-medium">{profile.phoneNumber}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <GraduationCap className="text-primary w-5 h-5" />
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Faculty & Year</div>
                    <div className="text-sm font-medium">{profile.faculty} - Year {profile.academicYear}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Zap className="text-primary w-5 h-5" />
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Member ID</div>
                    <div className="text-sm font-mono font-bold text-neon-blue">{profile.memberId}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">RECENT ACTIVITY</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                  <div className="text-muted-foreground italic text-sm">NO_RECENT_ACTIVITY_LOGGED</div>
                  <p className="text-[10px] text-muted-foreground/50 mt-2 uppercase tracking-widest">Perform actions to update your history.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: ID Card */}
        <div className="space-y-8">
          <div className="sticky top-24 space-y-8">
            <h2 className="text-xl font-cyber font-bold text-center uppercase tracking-widest">Digital ID Card</h2>
            
            <div id="id-card" className="relative w-full aspect-[1.586/1] bg-dark-navy rounded-2xl overflow-hidden border-2 border-primary/30 shadow-[0_0_30px_rgba(57,255,20,0.1)]">
              {/* Card Background Patterns */}
              <div className="absolute inset-0 cyber-grid opacity-20" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-blue/10 rounded-full blur-3xl" />
              
              <div className="relative h-full p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <Logo iconSize={24} textSize="text-xs" subtextSize="text-[6px]" />
                  <div className="text-[10px] font-mono text-primary/70">VERIFIED_MEMBER</div>
                </div>

                <div className="flex items-end justify-between">
                  <div className="space-y-4">
                    <div>
                      <div className="text-[8px] text-muted-foreground uppercase tracking-widest">Full Name</div>
                      <div className="text-lg font-black font-cyber leading-none uppercase">{profile.fullName}</div>
                    </div>
                    <div className="flex space-x-6">
                      <div>
                        <div className="text-[8px] text-muted-foreground uppercase tracking-widest">ID Number</div>
                        <div className="text-xs font-mono font-bold text-neon-blue">{profile.memberId}</div>
                      </div>
                      <div>
                        <div className="text-[8px] text-muted-foreground uppercase tracking-widest">Role</div>
                        <div className="text-xs font-mono font-bold text-neon-green">{profile.role.toUpperCase()}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-1 rounded-lg">
                    <QRCodeSVG value={profile.memberId} size={60} level="H" />
                  </div>
                </div>
              </div>
            </div>

            <Button variant="cyber" className="w-full" onClick={downloadIDCard}>
              <Download className="w-4 h-4 mr-2" />
              Download ID Card
            </Button>

            <Card className="border-neon-purple/20">
              <CardHeader className="p-4">
                <CardTitle className="text-sm">SYSTEM NOTIFICATIONS</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="text-[10px] p-4 text-center border border-dashed border-white/10 rounded uppercase tracking-widest text-muted-foreground italic">
                  NO_ACTIVE_NOTIFICATIONS
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
