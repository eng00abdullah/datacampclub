import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Layout, Edit3, Image as ImageIcon, Link as LinkIcon, Plus, Trash2, Save, Target, Info, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseReady } from '../../lib/firebase';
import { demoHomeContent, demoAboutData, setDemoHomeContent, setDemoAboutData } from '../../lib/demoData';

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState('home');
  
  const pages = [
    { id: 'home', name: 'Home Page', icon: Layout },
    { id: 'about', name: 'About Us', icon: Info },
  ];

  const [homeContent, setHomeContent] = useState(demoHomeContent);
  const [aboutData, setAboutData] = useState(demoAboutData);

  useEffect(() => {
    if (!isFirebaseReady) {
      setHomeContent(demoHomeContent);
      setAboutData(demoAboutData);
      return;
    }

    const unsubHome = onSnapshot(doc(db, 'settings', 'home'), (snapshot) => {
      if (snapshot.exists()) setHomeContent(snapshot.data() as any);
    });

    const unsubAbout = onSnapshot(doc(db, 'settings', 'about'), (snapshot) => {
      if (snapshot.exists()) setAboutData(snapshot.data() as any);
    });

    return () => {
      unsubHome();
      unsubAbout();
    };
  }, []);

  const handleSave = async () => {
    if (!isFirebaseReady) {
      if (activeTab === 'home') setDemoHomeContent(homeContent);
      if (activeTab === 'about') setDemoAboutData(aboutData);
      toast.success(`Content for ${activeTab} updated in memory (Demo Mode)`);
      return;
    }

    try {
      if (activeTab === 'home') await setDoc(doc(db, 'settings', 'home'), homeContent);
      if (activeTab === 'about') await setDoc(doc(db, 'settings', 'about'), aboutData);
      toast.success(`Content for ${activeTab} updated in cloud`);
    } catch (error) {
      toast.error(`Failed to update ${activeTab} content`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-cyber tracking-tighter">CONTENT CONTROL</h1>
          <p className="text-muted-foreground">Manage the text and media across all public pages.</p>
        </div>
        <Button variant="cyber" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => setActiveTab(page.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all border ${
              activeTab === page.id 
                ? 'bg-primary/10 border-primary text-primary' 
                : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
            }`}
          >
            <page.icon className="w-4 h-4" />
            <span className="text-xs font-cyber uppercase tracking-widest">{page.name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-6">
          {activeTab === 'home' && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>The first thing visitors see on the home page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Main Heading</label>
                  <Input 
                    value={homeContent.heroTitle} 
                    onChange={(e) => setHomeContent({...homeContent, heroTitle: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Sub-heading</label>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[80px]"
                    value={homeContent.heroSubtitle}
                    onChange={(e) => setHomeContent({...homeContent, heroSubtitle: e.target.value})}
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Statistics Counters</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {homeContent.stats.map((stat, idx) => (
                      <div key={idx} className="p-4 glass rounded-xl border-white/10 space-y-2">
                        <Input 
                          value={stat.value} 
                          className="h-8 text-center font-bold"
                          onChange={(e) => {
                            const newStats = [...homeContent.stats];
                            newStats[idx].value = e.target.value;
                            setHomeContent({...homeContent, stats: newStats});
                          }}
                        />
                        <Input 
                          value={stat.label} 
                          className="h-6 text-[10px] text-center uppercase tracking-widest"
                          onChange={(e) => {
                            const newStats = [...homeContent.stats];
                            newStats[idx].label = e.target.value;
                            setHomeContent({...homeContent, stats: newStats});
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'about' && (
            <div className="grid gap-6">
              <Card className="border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Mission & Vision
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Club Mission</label>
                    <textarea 
                      className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[100px]"
                      value={aboutData.mission}
                      onChange={(e) => setAboutData({...aboutData, mission: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Club Vision</label>
                    <textarea 
                      className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[100px]"
                      value={aboutData.vision}
                      onChange={(e) => setAboutData({...aboutData, vision: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-neon-blue" />
                    Our History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">History Text</label>
                    <textarea 
                      className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[150px]"
                      value={aboutData.history}
                      onChange={(e) => setAboutData({...aboutData, history: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentManagement;
