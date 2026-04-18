import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Shield, Lock, Eye, EyeOff, Key, AlertTriangle, History, RefreshCw, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { doc, onSnapshot, setDoc, collection, query, orderBy, limit } from 'firebase/firestore';
import { db, isFirebaseReady, auth } from '../../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { logAction } from '../../lib/logger';

const Security = () => {
  const { profile, user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [securitySettings, setSecuritySettings] = useState({
    mfaEnforced: false,
    threatLevel: 'STABLE',
    firewallActive: true,
    blockedIpsCount: 0,
    activeConnections: 0
  });

  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!isFirebaseReady) {
      // Mock data for demo mode
      setAuditLogs([
        { id: 1, action: 'ADMIN_LOGIN', user: profile?.fullName || 'Abdullah Hossam', ip: '192.168.1.1', time: '2 mins ago', status: 'success' },
        { id: 2, action: 'USER_ROLE_CHANGE', user: 'System', target: 'Demo Member', ip: 'INTERNAL', time: '15 mins ago', status: 'success' },
        { id: 3, action: 'FAILED_LOGIN_ATTEMPT', user: 'unknown', ip: '45.12.33.102', time: '1 hour ago', status: 'warning' },
      ]);
      return;
    }

    // Listen to security settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'security'), (snapshot) => {
      if (snapshot.exists()) {
        setSecuritySettings(snapshot.data() as any);
      }
    }, (error) => {
      console.warn("Security settings listener error:", error);
    });

    // Listen to recent audit logs
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(5));
    const unsubLogs = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().timestamp?.toDate()?.toLocaleTimeString() || 'Just now'
      }));
      setAuditLogs(logs);
    }, (error) => {
      console.warn("Audit logs listener error:", error);
    });

    return () => {
      unsubSettings();
      unsubLogs();
    };
  }, [profile]);

  const handleUpdateSecurity = async () => {
    if (!isFirebaseReady) {
      toast.success('Security settings updated (Demo Mode)');
      return;
    }

    try {
      await setDoc(doc(db, 'settings', 'security'), securitySettings);
      await logAction('SECURITY_SETTINGS_UPDATE', profile?.fullName || 'Admin', 'Global Policy', 'success');
      toast.success('Security protocol updated in cloud');
    } catch (error) {
      toast.error('Failed to update security protocol');
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      await logAction('PASSWORD_RESET_REQUEST', profile?.fullName || 'Admin', user.email, 'success');
      toast.success(`Password reset email sent to ${user.email}`);
    } catch (error) {
      toast.error('Failed to send reset email');
    }
  };

  const handleRefreshLogs = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Security metrics synchronized');
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-cyber tracking-tighter flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            SECURITY PROTOCOL
          </h1>
          <p className="text-muted-foreground">Monitor system access and configure defensive measures.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefreshLogs} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>Real-time stream of system-wide administrative actions.</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <History className="w-4 h-4 mr-2" />
                Full History
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.length > 0 ? auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 glass rounded-xl border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${log.status === 'warning' ? 'bg-destructive animate-pulse' : 'bg-primary'}`} />
                      <div>
                        <div className="text-xs font-cyber tracking-widest uppercase">{log.action}</div>
                        <div className="text-sm font-bold">{log.user} {log.target ? `→ ${log.target}` : ''}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-muted-foreground">{log.ip || 'INTERNAL'}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{log.time}</div>
                    </div>
                  </div>
                )) : (
                  <p className="text-center py-8 text-muted-foreground italic">No recent activity detected.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-neon-blue/20">
              <CardHeader>
                <CardTitle className="text-lg">Firewall Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Connections</span>
                  <div className="text-right">
                    <span className="font-mono text-primary">{securitySettings.activeConnections}</span>
                    <span className="block text-[8px] text-muted-foreground italic">(DEMO DATA)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Blocked IPs (24h)</span>
                  <div className="text-right">
                    <span className="font-mono text-destructive">{securitySettings.blockedIpsCount}</span>
                    <span className="block text-[8px] text-muted-foreground italic">(DEMO DATA)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Firewall Active</span>
                  <button 
                    onClick={() => setSecuritySettings({...securitySettings, firewallActive: !securitySettings.firewallActive})}
                    className={`w-10 h-5 rounded-full transition-colors relative ${securitySettings.firewallActive ? 'bg-primary' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${securitySettings.firewallActive ? 'left-5.5' : 'left-0.5'}`} />
                  </button>
                </div>
                <Button variant="outline" className="w-full text-xs" onClick={handleUpdateSecurity}>Save Firewall Config</Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <div className="flex items-center space-x-2 text-destructive mb-2">
                <AlertTriangle className="w-5 h-5" />
                <CardTitle className="text-lg">Threat Level</CardTitle>
              </div>
              <CardDescription className="text-destructive/70">System is currently under normal load.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-black font-cyber text-destructive animate-pulse">{securitySettings.threatLevel}</div>
              <div className="flex flex-wrap gap-2">
                {['STABLE', 'MEDIUM', 'HIGH', 'CRITICAL'].map(level => (
                  <button
                    key={level}
                    onClick={() => setSecuritySettings({...securitySettings, threatLevel: level})}
                    className={`px-2 py-1 text-[10px] font-cyber border rounded transition-all ${
                      securitySettings.threatLevel === level 
                        ? 'bg-destructive text-white border-destructive' 
                        : 'border-destructive/30 text-destructive/50 hover:border-destructive'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <Button variant="destructive" size="sm" className="w-full" onClick={handleUpdateSecurity}>
                Update Threat Level
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Admin MFA</CardTitle>
              <CardDescription>Multi-factor authentication for all administrative accounts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold">Enforce MFA</div>
                <button 
                  onClick={() => {
                    const newVal = !securitySettings.mfaEnforced;
                    setSecuritySettings({...securitySettings, mfaEnforced: newVal});
                    toast.info(`MFA ${newVal ? 'Enabled' : 'Disabled'}`);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ${securitySettings.mfaEnforced ? 'bg-primary' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${securitySettings.mfaEnforced ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <Button variant="cyber" className="w-full" onClick={handleUpdateSecurity}>
                <Key className="w-4 h-4 mr-2" />
                Save MFA Policy
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Security;
