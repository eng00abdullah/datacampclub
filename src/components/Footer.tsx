import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { Github, Twitter, Linkedin, Facebook, Mail, Phone, MapPin, Instagram, Link as LinkIcon } from 'lucide-react';

import { doc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseReady } from '../lib/firebase';
import { demoSettings } from '../lib/demoData';

const Footer = () => {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    if (!isFirebaseReady) {
      setSettings(demoSettings);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data());
      }
    }, (error) => {
      console.warn("Footer settings listener error:", error);
    });
    return () => unsubscribe();
  }, []);

  const getIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return Facebook;
      case 'twitter': return Twitter;
      case 'instagram': return Instagram;
      case 'linkedin': return Linkedin;
      case 'github': return Github;
      default: return LinkIcon;
    }
  };

  return (
    <footer className="bg-dark-navy border-t border-white/10 pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-6">
            <Link to="/" className="inline-block">
              <Logo iconSize={32} textSize="text-xl" subtextSize="text-[8px]" />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {settings?.siteDescription || 'Empowering students with data science, AI, and software engineering skills.'}
            </p>
            <div className="flex space-x-4">
              {settings?.socialLinks?.map((link: any, idx: number) => {
                const Icon = getIcon(link.platform);
                return (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <Icon className="w-5 h-5" />
                  </a>
                );
              }) || (
                <>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Github className="w-5 h-5" /></a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="w-5 h-5" /></a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin className="w-5 h-5" /></a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Facebook className="w-5 h-5" /></a>
                </>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-cyber text-sm font-bold mb-6 tracking-widest text-neon-blue">Quick Links</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/events" className="hover:text-primary transition-colors">Events</Link></li>
              <li><Link to="/projects" className="hover:text-primary transition-colors">Projects Showcase</Link></li>
              <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link to="/staff" className="hover:text-primary transition-colors">Our Staff</Link></li>
              <li><Link to="/gallery" className="hover:text-primary transition-colors">Gallery</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-cyber text-sm font-bold mb-6 tracking-widest text-neon-purple">Support</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-cyber text-sm font-bold mb-6 tracking-widest text-neon-green">Contact Info</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-primary" />
                <span>{settings?.contactEmail || 'contact@datacamp.club'}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-primary" />
                <span>{settings?.contactPhone || '+20 123 456 7890'}</span>
              </li>
              <li className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-primary" />
                <span>University Campus, Tech Building</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground space-y-4 md:space-y-0">
          <p>© 2026 {settings?.siteName || 'DataCamp'}. All rights reserved.</p>
          <p className="font-mono">SYSTEM_VERSION: 2.0.4-STABLE</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
