import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Save, Globe, Shield, Bell, Palette, Database, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ImagePicker from '../../components/ImagePicker';

import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseReady } from '../../lib/firebase';
import { demoSettings, setDemoSettings } from '../../lib/demoData';

const Settings = () => {
  const [settings, setSettings] = useState(demoSettings);

  useEffect(() => {
    if (!isFirebaseReady) {
      setSettings(demoSettings);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as any);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddSocial = () => {
    setSettings({
      ...settings,
      socialLinks: [...settings.socialLinks, { platform: '', url: '', icon: 'Link' }]
    });
  };

  const updateSocial = (index: number, field: string, value: string) => {
    const newSocials = [...settings.socialLinks];
    newSocials[index] = { ...newSocials[index], [field]: value };
    setSettings({ ...settings, socialLinks: newSocials });
  };

  const removeSocial = (index: number) => {
    setSettings({
      ...settings,
      socialLinks: settings.socialLinks.filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    if (!isFirebaseReady) {
      setDemoSettings(settings);
      toast.success('System settings updated in memory (Demo Mode)');
      return;
    }

    try {
      await setDoc(doc(db, 'settings', 'site'), settings);
      toast.success('System settings updated in cloud');
    } catch (error) {
      toast.error('Failed to update cloud settings');
    }
  };

  // Removed redundant useEffect that was causing extra localStorage reads

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black font-cyber tracking-tighter">System Settings</h1>
        <p className="text-muted-foreground">Configure global platform parameters and branding.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center space-x-2 text-primary mb-2">
              <Globe className="w-5 h-5" />
              <CardTitle className="text-lg">General Branding</CardTitle>
            </div>
            <CardDescription>Update the public identity of the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Platform Main Name (Logo)</label>
              <Input 
                value={settings.siteName} 
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Platform Sub Name</label>
              <Input 
                value={settings.siteSubName} 
                onChange={(e) => setSettings({...settings, siteSubName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <ImagePicker 
                label="Platform Logo"
                currentImage={settings.logoUrl}
                onImageSelected={(base64) => setSettings({...settings, logoUrl: base64})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Tagline / Description</label>
              <Input 
                value={settings.siteDescription} 
                onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Contact Email</label>
                <Input 
                  type="email"
                  value={settings.contactEmail} 
                  onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Contact Phone</label>
                <Input 
                  value={settings.contactPhone} 
                  onChange={(e) => setSettings({...settings, contactPhone: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neon-blue/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-neon-blue mb-2">
                <Globe className="w-5 h-5" />
                <CardTitle className="text-lg">Social Media Grid</CardTitle>
              </div>
              <CardDescription>Manage links to your external platforms.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleAddSocial}>
              <Plus className="w-4 h-4 mr-2" />
              Add Link
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.socialLinks.map((link, idx) => (
              <div key={idx} className="flex gap-2 items-end group">
                <div className="flex-grow grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-muted-foreground">Platform</label>
                    <Input 
                      placeholder="e.g. Facebook"
                      value={link.platform}
                      onChange={(e) => updateSocial(idx, 'platform', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-muted-foreground">URL</label>
                    <Input 
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => updateSocial(idx, 'url', e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeSocial(idx)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-neon-purple/20">
          <CardHeader>
            <div className="flex items-center space-x-2 text-neon-purple mb-2">
              <Palette className="w-5 h-5" />
              <CardTitle className="text-lg">Visual Identity</CardTitle>
            </div>
            <CardDescription>Customize the look and feel of the interface.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Primary Neon Color</label>
              <div className="flex items-center space-x-4">
                <Input 
                  type="color" 
                  className="w-12 h-12 p-1 bg-transparent"
                  value={settings.themeColor}
                  onChange={(e) => setSettings({...settings, themeColor: e.target.value})}
                />
                <span className="font-mono text-xs uppercase">{settings.themeColor}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neon-purple/20">
          <CardHeader>
            <div className="flex items-center space-x-2 text-neon-purple mb-2">
              <Shield className="w-5 h-5" />
              <CardTitle className="text-lg">Access Control</CardTitle>
            </div>
            <CardDescription>Manage registration and system availability.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">Open Registration</div>
                <div className="text-xs text-muted-foreground">Allow new students to initialize accounts.</div>
              </div>
              <button 
                onClick={() => setSettings({...settings, enableRegistration: !settings.enableRegistration})}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.enableRegistration ? 'bg-primary' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.enableRegistration ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-destructive">Maintenance Mode</div>
                <div className="text-xs text-muted-foreground">Lock the platform for system updates.</div>
              </div>
              <button 
                onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.maintenanceMode ? 'bg-destructive' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10">
          <CardHeader>
            <div className="flex items-center space-x-2 text-muted-foreground mb-2">
              <Database className="w-5 h-5" />
              <CardTitle className="text-lg">Data Management</CardTitle>
            </div>
            <CardDescription>Backup and system maintenance tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <Save className="w-4 h-4 mr-2" />
              Download System Backup
            </Button>
            <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10">
              Clear System Cache
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-8 border-t border-white/10">
        <Button variant="cyber" size="lg" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Commit Changes
        </Button>
      </div>
    </div>
  );
};

export default Settings;
