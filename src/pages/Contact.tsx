import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Mail, Phone, MapPin, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';
import { isFirebaseReady } from '../lib/firebase';
import { demoMessages, setDemoMessages } from '../lib/demoData';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    
    const trimmedData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
    };

    const messageData = {
      ...trimmedData,
      timestamp: new Date().toISOString(),
      status: 'unread'
    };

    try {
      if (!isFirebaseReady) {
        const updated = [...demoMessages, { ...messageData, id: Date.now().toString() }];
        setDemoMessages(updated);
      } else {
        const { collection, addDoc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        await addDoc(collection(db, 'messages'), messageData);
      }
      
      toast.success('Transmission received. We will contact you shortly.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send transmission. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-20 md:pt-32 pb-20">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black font-cyber tracking-tighter mb-4 neon-text uppercase">ESTABLISH CONTACT</h1>
            <p className="text-muted-foreground">Send us a secure transmission or visit our physical coordinates.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass p-8 md:p-12 rounded-3xl border border-white/10"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Full Name</label>
                    <Input 
                      placeholder="John Doe" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Email Address</label>
                    <Input 
                      type="email" 
                      placeholder="john@example.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Subject</label>
                  <Input 
                    placeholder="General Inquiry" 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Message Body</label>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[150px] transition-all focus:border-primary/50"
                    placeholder="Type your transmission here..."
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    required
                  />
                </div>
                <Button variant="cyber" type="submit" className="w-full py-6 text-lg" disabled={submitting}>
                  <Send className={`w-5 h-5 mr-2 ${submitting ? 'animate-pulse' : ''}`} />
                  {submitting ? 'TRANSMITTING...' : 'SEND TRANSMISSION'}
                </Button>
              </form>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-12"
            >
              <div className="space-y-8">
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-cyber font-bold uppercase tracking-widest text-primary mb-1">Direct Email</h4>
                    <p className="text-muted-foreground">contact@datacamp.club</p>
                  </div>
                </div>
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-neon-blue" />
                  </div>
                  <div>
                    <h4 className="text-sm font-cyber font-bold uppercase tracking-widest text-neon-blue mb-1">Voice Line</h4>
                    <p className="text-muted-foreground">+20 123 456 7890</p>
                  </div>
                </div>
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 rounded-xl bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-neon-purple" />
                  </div>
                  <div>
                    <h4 className="text-sm font-cyber font-bold uppercase tracking-widest text-neon-purple mb-1">Coordinates</h4>
                    <p className="text-muted-foreground">University Campus, Tech Wing<br />Room 404, Digital District</p>
                  </div>
                </div>
              </div>

              <div className="glass p-8 rounded-3xl border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
                <h4 className="text-lg font-cyber font-bold mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-primary" />
                  LIVE_SUPPORT
                </h4>
                <p className="text-sm text-muted-foreground mb-6">
                  Our neural network is active 24/7. For urgent inquiries, use the priority channel in our Discord.
                </p>
                <Button variant="outline" className="w-full">Join Discord Server</Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
