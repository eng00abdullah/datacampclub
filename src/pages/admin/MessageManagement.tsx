import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Mail, Trash2, Eye, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseReady } from '../../lib/firebase';
import { demoMessages, setDemoMessages } from '../../lib/demoData';

const MessageManagement = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingMessage, setViewingMessage] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseReady) {
      setMessages(demoMessages);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const deleteMessage = async (id: string) => {
    if (!isFirebaseReady) {
      const updated = messages.filter(m => m.id !== id);
      setDemoMessages(updated);
      setMessages(updated);
      toast.success('Message deleted (Demo Mode)');
      return;
    }

    try {
      await deleteDoc(doc(db, 'messages', id));
      toast.success('Message deleted from cloud');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const markAsRead = async (id: string) => {
    if (!isFirebaseReady) {
      const updated = messages.map(m => m.id === id ? { ...m, status: 'read' } : m);
      setDemoMessages(updated);
      setMessages(updated);
      return;
    }

    try {
      await updateDoc(doc(db, 'messages', id), { status: 'read' });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black font-cyber tracking-tighter">INBOX_COMMAND</h1>
        <p className="text-muted-foreground">Manage incoming transmissions from the contact portal.</p>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="p-8 text-center animate-pulse">SCANNING_INBOX...</div>
        ) : messages.length === 0 ? (
          <Card className="border-dashed border-white/10">
            <CardContent className="p-12 text-center text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>NO_TRANSMISSIONS_FOUND</p>
            </CardContent>
          </Card>
        ) : messages.map((msg) => (
          <Card 
            key={msg.id} 
            className={`group border-white/10 hover:border-primary/30 transition-all ${msg.status === 'unread' ? 'bg-primary/5' : ''}`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${msg.status === 'unread' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'}`}>
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{msg.name}</h3>
                    {msg.status === 'unread' && <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />}
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">{msg.subject}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex flex-col items-end text-[10px] text-muted-foreground uppercase tracking-widest">
                  <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(msg.timestamp).toLocaleDateString()}</span>
                  <span>{msg.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => { setViewingMessage(msg); markAsRead(msg.id); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirmId(msg.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
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
              <CardTitle className="text-xl font-cyber">CONFIRM_DELETION</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">Are you sure you want to delete this message? This action is permanent.</p>
            </CardHeader>
            <CardContent className="flex gap-4 pt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setDeleteConfirmId(null)}>CANCEL</Button>
              <Button variant="destructive" className="flex-1" onClick={() => {
                deleteMessage(deleteConfirmId);
                setDeleteConfirmId(null);
              }}>DELETE</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {viewingMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-dark-navy/90 backdrop-blur-md">
          <Card className="w-full max-w-lg border-primary/30">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-cyber">{viewingMessage.subject}</CardTitle>
                  <p className="text-xs text-primary font-mono mt-1">FROM: {viewingMessage.name} &lt;{viewingMessage.email}&gt;</p>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {new Date(viewingMessage.timestamp).toLocaleString()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-sm leading-relaxed whitespace-pre-wrap">
                {viewingMessage.message}
              </div>
              <div className="flex justify-end gap-4">
                <Button variant="ghost" onClick={() => setViewingMessage(null)}>CLOSE</Button>
                <Button variant="cyber" onClick={() => window.location.href = `mailto:${viewingMessage.email}`}>
                  REPLY_VIA_EMAIL
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MessageManagement;
