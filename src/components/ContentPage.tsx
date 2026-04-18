import React from 'react';
import { motion } from 'motion/react';

interface ContentPageProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const ContentPage: React.FC<ContentPageProps> = ({ title, subtitle, children }) => {
  return (
    <div className="container mx-auto px-6 py-20 space-y-16">
      <header className="max-w-3xl space-y-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs font-cyber text-primary uppercase tracking-[0.3em]"
        >
          System_Node: {title.toUpperCase()}
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-5xl md:text-7xl font-black font-cyber tracking-tighter"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-muted-foreground leading-relaxed"
        >
          {subtitle}
        </motion.p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default ContentPage;
