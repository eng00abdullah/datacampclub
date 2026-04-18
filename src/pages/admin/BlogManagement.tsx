import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Trash2, Edit3, Save, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, isFirebaseReady } from '../../lib/firebase';
import { UserIdentityInput, validateUserIdentity } from '../../components/UserIdentityInput';
import { demoUsers, demoBlog, setDemoBlog } from '../../lib/demoData';

const BlogManagement = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', excerpt: '', author: '', date: new Date().toISOString().split('T')[0] });
  const [authorType, setAuthorType] = useState<'email' | 'id'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseReady) {
      setPosts(demoBlog);
      setUsers(demoUsers);
      return;
    }

    // Fetch Posts
    const postsQuery = query(collection(db, 'blog_posts'));
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("Blog posts listener error:", error);
    });

    // Fetch Users
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("Users listener error:", error);
    });

    return () => {
      unsubscribePosts();
      unsubscribeUsers();
    };
  }, []);

  const resetForm = () => {
    setNewPost({ 
      title: '', 
      excerpt: '', 
      author: '', 
      date: new Date().toISOString().split('T')[0] 
    });
    setAuthorType('email');
  };

  const addPost = async () => {
    if (!newPost.title) {
      toast.error('Post title is required');
      return;
    }

    setIsSubmitting(true);
    const authorLabel = newPost.author 
      ? (authorType === 'email' ? newPost.author : `ID: ${newPost.author}`)
      : 'Club Admin';

    const postData = { ...newPost, author: authorLabel, createdAt: new Date().toISOString() };

    if (!isFirebaseReady) {
      const updated = [{ ...postData, id: Date.now().toString() }, ...posts];
      setDemoBlog(updated);
      setPosts(updated);
      setShowAddModal(false);
      resetForm();
      setIsSubmitting(false);
      toast.success('New transmission published (Demo Mode)');
      return;
    }

    try {
      await addDoc(collection(db, 'blog_posts'), postData);
      setShowAddModal(false);
      resetForm();
      toast.success('New transmission published to cloud');
    } catch (error) {
      console.error('Error adding post:', error);
      toast.error('Failed to publish transmission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePost = async (id: string) => {
    if (!isFirebaseReady) {
      const updated = posts.filter(p => p.id !== id);
      setDemoBlog(updated);
      setPosts(updated);
      toast.success('Transmission redacted (Demo Mode)');
      return;
    }

    try {
      await deleteDoc(doc(db, 'blog_posts', id));
      toast.success('Transmission redacted from cloud');
    } catch (error) {
      toast.error('Failed to redact transmission');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-cyber tracking-tighter">BLOG MANAGEMENT</h1>
          <p className="text-muted-foreground">Manage articles and news transmissions.</p>
        </div>
        <Button variant="cyber" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          NEW_POST
        </Button>
      </div>

      <div className="grid gap-6">
        {posts.map((post) => (
          <Card key={post.id} className="group relative overflow-hidden border-white/10 hover:border-primary/30 transition-all">
            <CardContent className="p-6 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{post.title}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">{post.date} • BY {post.author}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="hover:text-primary"><Edit3 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirmId(post.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-dark-navy/95 backdrop-blur-xl">
          <Card className="w-full max-w-sm border-destructive/30 shadow-[0_0_50px_rgba(255,0,0,0.1)]">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-destructive/20">
                <Trash2 className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl font-cyber">CONFIRM_REDACTION</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">Are you sure you want to redact this transmission? It will be permanently wiped from the grid.</p>
            </CardHeader>
            <CardContent className="flex gap-4 pt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setDeleteConfirmId(null)}>ABORT</Button>
              <Button variant="destructive" className="flex-1" onClick={() => {
                deletePost(deleteConfirmId);
                setDeleteConfirmId(null);
              }}>CONFIRM_PURGE</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-10 bg-dark-navy/90 backdrop-blur-md overflow-y-auto custom-scrollbar">
          <Card className="w-full max-w-lg border-primary/30 my-auto">
            <CardHeader><CardTitle className="font-cyber">INITIALIZE_POST</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Title</label>
                <Input value={newPost.title} onChange={(e) => setNewPost({...newPost, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Excerpt / Summary</label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[80px]"
                  value={newPost.excerpt}
                  onChange={(e) => setNewPost({...newPost, excerpt: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Author Identification (Optional)</label>
                <UserIdentityInput 
                  suggestions={users}
                  onValueChange={(val, type) => {
                    setNewPost({...newPost, author: val});
                    setAuthorType(type);
                  }}
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <Button variant="ghost" onClick={() => { setShowAddModal(false); resetForm(); }}>ABORT</Button>
                <Button variant="cyber" onClick={addPost} disabled={isSubmitting}>
                  {isSubmitting ? 'PUBLISHING...' : 'PUBLISH'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BlogManagement;
