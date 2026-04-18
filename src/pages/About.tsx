import React from 'react';
import { motion } from 'motion/react';
import { Target, Users, Zap, Info, Eye } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseReady } from '../lib/firebase';
import { demoAboutData } from '../lib/demoData';

const About = () => {
  const [aboutData, setAboutData] = React.useState(demoAboutData);

  React.useEffect(() => {
    if (!isFirebaseReady) {
      setAboutData(demoAboutData);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'settings', 'about'), (doc) => {
      if (doc.exists()) {
        setAboutData(doc.data() as any);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="pt-20 md:pt-32 pb-20">
      <div className="px-6 md:px-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mb-20"
        >
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black font-cyber tracking-tighter mb-6 neon-text">
            Our Mission
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {aboutData.mission}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          {[
            { icon: Target, title: 'Mission', desc: aboutData.mission },
            { icon: Eye, title: 'Vision', desc: aboutData.vision },
            { icon: Info, title: 'History', desc: aboutData.history },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass p-8 rounded-2xl border border-white/10 hover:border-primary/30 transition-all group"
            >
              <item.icon className="w-12 h-12 text-primary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold font-cyber mb-4 tracking-widest uppercase">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
