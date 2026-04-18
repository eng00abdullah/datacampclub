import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, X, Camera } from 'lucide-react';

import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, isFirebaseReady } from '../lib/firebase';
import { demoGallery } from '../lib/demoData';

const Gallery = () => {
  const [images, setImages] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseReady) {
      setImages(demoGallery);
      return;
    }

    const q = query(collection(db, 'gallery'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setImages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="pt-20 md:pt-32 pb-20">
      <div className="px-6 md:px-12">
        <div className="mb-20">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black font-cyber tracking-tighter mb-4 neon-text">Visual Archive</h1>
          <p className="text-muted-foreground">Capturing the moments that define our community.</p>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {images.map((img, idx) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 30, filter: "blur(5px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.6, 
                delay: idx * 0.1,
                ease: "easeOut"
              }}
              whileHover={{ scale: 1.02 }}
              className="relative group cursor-pointer overflow-hidden rounded-2xl border border-white/10 glass"
              onClick={() => setSelectedImage(img.url)}
            >
              <img 
                src={img.url} 
                alt={img.title} 
                className="w-full h-auto object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/broken/800/600?blur=10';
                  (e.target as HTMLImageElement).classList.add('opacity-50');
                }}
              />
              <div className="absolute inset-0 bg-dark-navy/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                <div className="text-center p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Maximize2 className="w-10 h-10 text-primary mx-auto mb-3" />
                  </motion.div>
                  <p className="text-xs font-cyber uppercase tracking-[0.2em] font-bold text-white">{img.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {images.length === 0 && (
          <div className="text-center py-40 glass rounded-3xl border-white/10">
            <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">The archive is currently empty.</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-dark-navy/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button className="absolute top-8 right-8 text-white hover:text-primary transition-colors">
              <X className="w-8 h-8" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={selectedImage}
              className="max-w-full max-h-[90vh] rounded-xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
