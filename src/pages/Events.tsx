import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import { db, isFirebaseReady, auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, Clock, Users, Search, Filter, CheckCircle2, QrCode, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { demoEvents, setDemoEvents } from '../lib/demoData';

const Events = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [registering, setRegistering] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<any>(null);

  useEffect(() => {
    if (!isFirebaseReady) {
      setEvents(demoEvents);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'events'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      console.warn("Events listener permission error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRegister = async (event: any) => {
    if (!auth.currentUser) {
      toast.error('Please login to register for events.');
      return;
    }

    setRegistering(event.id);
    try {
      const registrationData = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        eventId: event.id,
        eventTitle: event.title,
        registeredAt: new Date().toISOString(),
        qrCode: `REG-${event.id}-${auth.currentUser.uid}`
      };

      if (!isFirebaseReady) {
        // Mock registration
        const updatedEvents = events.map(e => 
          e.id === event.id ? { ...e, registeredCount: (e.registeredCount || 0) + 1 } : e
        );
        setDemoEvents(updatedEvents);
        setEvents(updatedEvents);
        
        setShowSuccess(registrationData);
        toast.success('Registration Confirmed! Check your QR code.');
        return;
      }

      // Real Firebase Transaction
      await runTransaction(db, async (transaction) => {
        const eventRef = doc(db, 'events', event.id);
        const eventDoc = await transaction.get(eventRef);
        
        if (!eventDoc.exists()) throw new Error("Event does not exist!");
        
        const currentCount = eventDoc.data().registeredCount || 0;
        if (currentCount >= eventDoc.data().capacity) throw new Error("Event is full!");

        transaction.update(eventRef, { 
          registeredCount: currentCount + 1,
          registrations: arrayUnion(registrationData)
        });
      });

      setShowSuccess(registrationData);
      toast.success('Registration Confirmed! QR code generated.');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed.');
    } finally {
      setRegistering(null);
    }
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-20 px-6 lg:px-12">
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-dark-navy/90 backdrop-blur-md"
          >
            <Card className="w-full max-w-md border-primary/30 shadow-[0_0_50px_rgba(57,255,20,0.2)]">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-cyber">Mission Confirmed</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">You are now registered for: <br/><span className="text-white font-bold">{showSuccess.eventTitle}</span></p>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-6">
                <div className="p-4 bg-white rounded-xl">
                  <QRCodeSVG value={showSuccess.qrCode} size={180} />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-[10px] font-cyber uppercase tracking-widest text-primary">Your Personal Access Code</p>
                  <p className="text-[10px] text-muted-foreground">A confirmation email with this QR code has been "sent" to your terminal.</p>
                </div>
                <Button variant="cyber" className="w-full" onClick={() => setShowSuccess(null)}>DISMISS</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl md:text-7xl font-black font-cyber tracking-tighter"
          >
            Upcoming <span className="text-primary">Events</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Join our missions to decode the future. From workshops to summits, 
            stay updated with the latest in data science and AI.
          </motion.p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass p-4 rounded-2xl border-white/10">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search missions..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="ghost" size="sm" className="flex-grow md:flex-grow-0">
              <Filter className="w-4 h-4 mr-2" />
              FILTER
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-80 glass rounded-2xl animate-pulse" />
            ))
          ) : filteredEvents.length === 0 ? (
            <div className="col-span-full text-center py-20 glass rounded-2xl border-dashed border-white/10">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">No missions found in this sector.</p>
            </div>
          ) : filteredEvents.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="group h-full flex flex-col relative overflow-hidden border-white/10 hover:border-primary/30 transition-all duration-500">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-right from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader>
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-[10px] font-cyber text-primary uppercase tracking-widest px-2 py-1 bg-primary/10 rounded border border-primary/20">
                      {event.status}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      ID: {event.id.slice(0, 8)}
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-cyber group-hover:text-primary transition-colors">
                    {event.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow space-y-6">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {event.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-3 text-primary" />
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="w-4 h-4 mr-3 text-primary" />
                      {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-3 text-primary" />
                      {event.location}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Users className="w-4 h-4 mr-3 text-primary" />
                      {event.registeredCount} / {event.capacity} OPERATIVES
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button 
                      variant="cyber" 
                      className="w-full"
                      disabled={registering === event.id || event.registeredCount >= event.capacity}
                      onClick={() => handleRegister(event)}
                    >
                      {registering === event.id ? 'PROCESSING...' : 
                       event.registeredCount >= event.capacity ? 'MISSION FULL' : 'INITIALIZE REGISTRATION'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Events;
