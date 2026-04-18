import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Database } from 'lucide-react';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
  subtextSize?: string;
  isCollapsed?: boolean;
}

import { doc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseReady } from '../lib/firebase';
import { demoSettings } from '../lib/demoData';

const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  iconSize = 32, 
  textSize = "text-lg", 
  subtextSize = "text-[7px]",
  isCollapsed = false 
}) => {
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
      console.warn("Logo settings listener error:", error);
    });
    return () => unsubscribe();
  }, []);

  const siteName = settings?.siteName || 'DataCamp';
  const subText = settings?.siteSubName || 'STUDENT CLUB';
  const mainText = siteName;

  return (
    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} ${className}`}>
      {settings?.logoUrl ? (
        <motion.div 
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="shrink-0 flex items-center justify-center overflow-hidden rounded-lg neon-glow bg-white/5 border border-white/10"
          style={{ width: iconSize + 8, height: iconSize + 8 }}
        >
          <img 
            src={settings.logoUrl} 
            alt="Logo" 
            className="max-w-full max-h-full object-contain" 
            referrerPolicy="no-referrer" 
          />
        </motion.div>
      ) : (
        <motion.div 
          whileHover={{ rotate: 360, scale: 1.1 }}
          className="shrink-0 bg-primary rounded-lg flex items-center justify-center neon-glow"
          style={{ width: iconSize + 8, height: iconSize + 8 }}
        >
          <Database className="text-dark-navy" size={iconSize} />
        </motion.div>
      )}
      
      {!isCollapsed && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col leading-none"
        >
          <span className={`font-bold font-cyber tracking-tighter neon-text whitespace-nowrap ${textSize}`}>
            {mainText}
          </span>
          <span className={`font-cyber tracking-[0.2em] text-primary/80 uppercase whitespace-nowrap ${subtextSize}`}>
            {subText}
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default Logo;
