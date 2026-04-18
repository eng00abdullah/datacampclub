import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Code, Database, Cpu, Users, Calendar, Award, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

import { doc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseReady } from '../lib/firebase';
import { demoSettings, demoHomeContent } from '../lib/demoData';

const Home = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [homeContent, setHomeContent] = useState<any>(null);

  useEffect(() => {
    if (!isFirebaseReady) {
      setSettings(demoSettings);
      setHomeContent(demoHomeContent);
      return;
    }

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) setSettings(snapshot.data());
    }, (error) => {
      console.warn("Home settings listener error:", error);
    });

    const unsubscribeContent = onSnapshot(doc(db, 'settings', 'home'), (snapshot) => {
      if (snapshot.exists()) setHomeContent(snapshot.data());
    }, (error) => {
      console.warn("Home content listener error:", error);
    });

    return () => {
      unsubscribeSettings();
      unsubscribeContent();
    };
  }, []);

  const stats = homeContent?.stats || [
    { label: 'Active Members', value: '1,200+', icon: Users, color: 'text-neon-green' },
    { label: 'Events Hosted', value: '45+', icon: Calendar, color: 'text-neon-blue' },
    { label: 'Projects Completed', value: '30+', icon: Code, color: 'text-neon-purple' },
    { label: 'Certificates Issued', value: '850+', icon: Award, color: 'text-primary' },
  ];

  const features = homeContent?.features || [
    {
      title: 'Data Science',
      desc: 'Master Python, R, and statistical modeling with our expert-led workshops.',
      icon: Database,
      color: 'border-neon-green/20'
    },
    {
      title: 'AI & ML',
      desc: 'Deep dive into neural networks, computer vision, and natural language processing.',
      icon: Cpu,
      color: 'border-neon-blue/20'
    },
    {
      title: 'Software Engineering',
      desc: 'Build scalable applications using modern stacks and industry best practices.',
      icon: Zap,
      color: 'border-neon-purple/20'
    }
  ];

  return (
    <div className="space-y-32 pb-32">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-10 md:pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-[120px] animate-pulse" />
        </div>

        <div className="px-6 md:px-12 relative z-10 w-full">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-cyber tracking-widest uppercase mb-6">
                Next Generation Tech Community
              </span>
              <h1 className="text-3xl sm:text-6xl md:text-8xl font-black font-cyber tracking-tighter leading-none break-words">
                {homeContent?.heroTitle || 'THE FUTURE OF DATA IS HERE'}
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-muted-foreground leading-relaxed"
            >
              {homeContent?.heroSubtitle || 'Join the elite community of data scientists and software engineers.'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {!user ? (
                <>
                  <Link to="/register">
                    <Button size="lg" variant="cyber" className="w-full sm:w-auto">
                      Initialize Membership
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to="/events">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      Explore Events
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to="/dashboard">
                  <Button size="lg" variant="cyber" className="w-full sm:w-auto">
                    Access Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 md:px-12 w-full overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat: any, i: number) => {
            const Icon = stat.icon || (i === 0 ? Users : i === 1 ? Calendar : i === 2 ? Code : Award);
            const color = stat.color || (i === 0 ? 'text-neon-green' : i === 1 ? 'text-neon-blue' : i === 2 ? 'text-neon-purple' : 'text-primary');
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30, rotateX: 45 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ 
                  duration: 0.8, 
                  delay: i * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                className="glass p-4 md:p-8 rounded-2xl border-white/5 text-center space-y-2 group hover:border-primary/30 transition-all duration-500 overflow-hidden"
              >
                <div className="relative">
                  <Icon className={`w-8 h-8 mx-auto mb-4 ${color} group-hover:scale-125 transition-transform duration-500`} />
                  <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-4xl font-black font-cyber tracking-tighter">{stat.value}</div>
                <div className="text-xs text-muted-foreground tracking-widest">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 md:px-12 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 md:mb-20 space-y-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-cyber tracking-tight break-words">{homeContent?.featuresTitle || 'Core Domains'}</h2>
          <p className="text-muted-foreground">{homeContent?.featuresSubtitle || 'We focus on the most impactful technologies shaping our world today.'}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature: any, i: number) => {
            const Icon = feature.icon || Zap;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.2 }}
              >
                <Card className={`group hover:border-primary/50 transition-all duration-500 ${feature.color} h-full overflow-hidden`}>
                  <CardContent className="p-6 md:p-10 space-y-6">
                    <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                      {typeof Icon === 'string' ? <Zap className="w-8 h-8 text-primary" /> : <Icon className="w-8 h-8 text-primary" />}
                    </div>
                    <h3 className="text-2xl font-bold font-cyber">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                    <div className="pt-4">
                      {/* Learn More link removed */}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 md:px-12 w-full">
        <div className="glass rounded-[2rem] md:rounded-[3rem] p-8 md:p-24 space-y-10 relative overflow-hidden border-primary/20">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-4xl md:text-6xl font-black font-cyber tracking-tighter">
              {user ? 'Welcome back to the grid' : 'Ready to upgrade your skills?'}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              {user 
                ? 'Continue your journey into the future of data and software engineering.' 
                : 'Join 1,000+ students already learning and building together. Membership is free for all university students.'}
            </p>
            <Link to={user ? "/dashboard" : "/register"} className="inline-block w-full sm:w-auto">
              <Button size="lg" variant="cyber" className="w-full sm:px-16 py-8 text-lg md:text-xl">
                {user ? 'Access Dashboard' : 'Join the club now'}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
