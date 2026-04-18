import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, User, ArrowRight, Tag } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, isFirebaseReady } from '../lib/firebase';
import { demoBlog } from '../lib/demoData';

const Blog = () => {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!isFirebaseReady) {
      setPosts(demoBlog);
      return;
    }

    const q = query(collection(db, 'blog_posts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="pt-20 md:pt-32 pb-20">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mb-20">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black font-cyber tracking-tighter mb-4 neon-text">Tech Insights</h1>
          <p className="text-muted-foreground text-lg">Articles, tutorials, and thought leadership from our community.</p>
        </div>

        <div className="space-y-12">
          {posts.map((post, idx) => (
            <motion.article
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="group glass p-8 rounded-3xl border border-white/10 hover:border-primary/30 transition-all flex flex-col md:flex-row gap-8"
            >
              <div className="w-full md:w-1/3 aspect-video bg-white/5 rounded-2xl overflow-hidden">
                <img 
                  src={`https://picsum.photos/seed/blog${idx}/800/600`} 
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-grow flex flex-col justify-center">
                <div className="flex items-center space-x-4 mb-4 text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">
                  <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {post.date}</span>
                  <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {post.author}</span>
                  <span className="flex items-center text-primary"><Tag className="w-3 h-3 mr-1" /> {post.tag}</span>
                </div>
                <h2 className="text-3xl font-bold font-cyber mb-4 group-hover:text-primary transition-colors">{post.title}</h2>
                <p className="text-muted-foreground mb-6 line-clamp-2">{post.excerpt}</p>
                <Button variant="ghost" className="w-fit p-0 hover:bg-transparent hover:text-primary group/btn">
                  Read Full Transmission
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-2 transition-transform" />
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blog;
