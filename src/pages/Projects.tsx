import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Github, Code, Eye } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, isFirebaseReady } from '../lib/firebase';
import { demoProjects } from '../lib/demoData';

const Projects = () => {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (!isFirebaseReady) {
      setProjects(demoProjects);
      return;
    }

    const q = query(collection(db, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="pt-20 md:pt-32 pb-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black font-cyber tracking-tighter mb-4 neon-text">Project Repository</h1>
          <p className="text-muted-foreground">Showcasing the technical prowess of our club members.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {projects.map((project, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="group relative overflow-hidden rounded-3xl border border-white/10"
            >
              <img 
                src={project.image} 
                alt={project.title}
                className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-navy via-dark-navy/40 to-transparent opacity-90" />
              <div className="absolute bottom-0 left-0 w-full p-8">
                <span className="text-[10px] font-cyber uppercase tracking-widest text-primary mb-2 block">{project.category}</span>
                <h3 className="text-3xl font-bold font-cyber mb-2">{project.title}</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6">By {project.author || 'Club Member'}</p>
                <div className="flex space-x-4">
                  <Button variant="cyber" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Case Study
                  </Button>
                  <Button variant="outline" size="sm">
                    <Github className="w-4 h-4 mr-2" />
                    Source
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Projects;
