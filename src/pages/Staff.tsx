import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Facebook, Linkedin, Instagram, Twitter, Github, Mail, Globe } from 'lucide-react';

import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, isFirebaseReady } from '../lib/firebase';
import { demoStaff } from '../lib/demoData';

const Staff = () => {
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    if (!isFirebaseReady) {
      setStaff(demoStaff);
      return;
    }

    const q = query(collection(db, 'staff'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("Staff posts listener error:", error);
    });
    return () => unsubscribe();
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'facebook': return Facebook;
      case 'linkedin': return Linkedin;
      case 'instagram': return Instagram;
      case 'twitter': return Twitter;
      case 'github': return Github;
      case 'mail': return Mail;
      default: return Globe;
    }
  };

  const categories = Array.from(new Set(staff.map(s => s.category)));

  return (
    <div className="pt-20 md:pt-32 pb-20">
      <div className="px-6 md:px-12">
        <div className="mb-20">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black font-cyber tracking-tighter mb-4 neon-text">Core Operatives</h1>
          <p className="text-muted-foreground">The brilliant minds behind DataCamp Student Club.</p>
        </div>

        {categories.map((cat) => (
          <div key={cat} className="mb-20">
            <div className="flex items-center space-x-4 mb-12">
              <h2 className="text-2xl font-cyber font-bold tracking-widest text-primary">{cat}</h2>
              <div className="h-px flex-grow bg-primary/20" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {staff.filter(s => s.category === cat).map((member, idx) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 50, rotateY: 20 }}
                  whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.8, 
                    delay: idx * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ y: -10 }}
                  className="group relative perspective-1000"
                >
                  <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 glass transition-all duration-500 group-hover:border-primary/50 group-hover:shadow-[0_0_30px_rgba(57,255,20,0.2)]">
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Social Overlay */}
                    <div className="absolute inset-0 bg-dark-navy/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center space-y-6">
                      <div className="flex space-x-4">
                        {member.socials.map((social: any, sIdx: number) => {
                          const Icon = getIcon(social.icon || social.platform);
                          return (
                            <motion.a 
                              key={sIdx} 
                              href={social.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              whileHover={{ scale: 1.2, rotate: 15 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-dark-navy transition-all shadow-lg"
                            >
                              <Icon className="w-6 h-6" />
                            </motion.a>
                          );
                        })}
                      </div>
                      <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-[10px] font-cyber uppercase tracking-[0.3em] text-primary font-bold"
                      >
                        SECURE_LINK_ESTABLISHED
                      </motion.p>
                    </div>
                  </div>
                  
                  <motion.div 
                    className="mt-6 text-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: idx * 0.1 + 0.3 }}
                  >
                    <h3 className="text-xl font-bold font-cyber tracking-tight group-hover:text-primary transition-colors duration-300">{member.name}</h3>
                    <p className="text-sm text-muted-foreground uppercase tracking-widest mt-1 group-hover:text-white transition-colors duration-300">{member.role}</p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Staff;
