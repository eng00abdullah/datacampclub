import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, isFirebaseReady } from '../../lib/firebase';
import { logAction } from '../../lib/logger';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Calendar, Plus, Search, MapPin, Users, 
  Clock, MoreVertical, Edit, Trash2, ExternalLink,
  QrCode, Scan, UserPlus, X, Image as ImageIcon
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'sonner';
import { UserIdentityInput, validateUserIdentity } from '../../components/UserIdentityInput';
import { demoUsers, demoEvents, setDemoEvents } from '../../lib/demoData';

const EventManagement = () => {
  const { profile, isHR } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showOrganizersModal, setShowOrganizersModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [organizerValue, setOrganizerValue] = useState('');
  const [identityType, setIdentityType] = useState<'email' | 'id'>('email');

  const canScan = isHR || profile?.role === 'organizer';

  useEffect(() => {
    if (!isFirebaseReady) {
      setUsers(demoUsers);
      return;
    }
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const onScanSuccess = React.useCallback(async (decodedText: string) => {
    toast.info(`Verifying identity: ${decodedText}`);
    
    if (!isFirebaseReady) {
      const user = demoUsers.find((u: any) => u.email === decodedText || u.memberId === decodedText);
      
      if (user) {
        toast.success(`Access Granted: ${user.fullName}`);
        await logAction('EVENT_CHECKIN', profile?.fullName || 'Admin', `${user.fullName} checked into ${selectedEvent?.title}`, 'success');
      } else {
        toast.error('Identity not found in database');
      }
      return;
    }

    try {
      // In a real app, you'd check a 'registrations' collection
      // For now, we'll just verify the user exists
      const { getDocs } = await import('firebase/firestore');
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      const user = snap.docs.find(d => d.data().email === decodedText || d.data().memberId === decodedText);
      
      if (user) {
        toast.success(`Access Granted: ${user.data().fullName}`);
        await logAction('EVENT_CHECKIN', profile?.fullName || 'Admin', `${user.data().fullName} checked into ${selectedEvent?.title}`, 'success');
      } else {
        toast.error('Identity not found in database');
      }
    } catch (error) {
      toast.error('Verification failed');
    }
  }, [profile, selectedEvent]);

  const onScanError = React.useCallback((err: any) => {
    // console.warn(err);
  }, []);

  useEffect(() => {
    if (showScanModal) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
      scanner.render(onScanSuccess, onScanError);
      return () => {
        scanner.clear().catch(e => console.error("Error clearing scanner:", e));
      };
    }
  }, [showScanModal, onScanSuccess, onScanError]);

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseReady) {
      const newEvents = events.map(ev => ev.id === editingEvent.id ? editingEvent : ev);
      updateDemoEvents(newEvents);
      toast.success('Event updated (Demo Mode)');
      setEditingEvent(null);
      return;
    }
    try {
      await updateDoc(doc(db, 'events', editingEvent.id), editingEvent);
      toast.success('Event updated');
      setEditingEvent(null);
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleAddOrganizer = async () => {
    if (!validateUserIdentity(organizerValue, identityType)) return;

    const organizerLabel = identityType === 'email' ? organizerValue : `ID: ${organizerValue}`;
    const updatedOrganizers = [...(selectedEvent.organizers || []), organizerLabel];
    
    if (!isFirebaseReady) {
      const newEvents = events.map(ev => ev.id === selectedEvent.id ? { ...ev, organizers: updatedOrganizers } : ev);
      updateDemoEvents(newEvents);
      setSelectedEvent({ ...selectedEvent, organizers: updatedOrganizers });
      setOrganizerValue('');
      toast.success('Organizer added (Demo Mode)');
      return;
    }

    try {
      await updateDoc(doc(db, 'events', selectedEvent.id), { organizers: updatedOrganizers });
      setSelectedEvent({ ...selectedEvent, organizers: updatedOrganizers });
      setOrganizerValue('');
      toast.success('Organizer added');
    } catch (error) {
      toast.error('Failed to add organizer');
    }
  };
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    capacity: 50,
    status: 'published'
  });

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
    });
    return () => unsubscribe();
  }, []);

  const updateDemoEvents = (newEvents: any[]) => {
    setDemoEvents(newEvents);
    setEvents(newEvents);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const eventData = {
      ...newEvent,
      registeredCount: 0,
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseReady) {
      const newEvents = [{ id: 'demo_' + Date.now(), ...eventData }, ...events];
      updateDemoEvents(newEvents);
      toast.success('Event published successfully (Demo Mode)');
      setShowAddModal(false);
      return;
    }

    try {
      await addDoc(collection(db, 'events'), eventData);
      await logAction('EVENT_CREATED', profile?.fullName || 'Admin', eventData.title, 'success');
      toast.success('Event published successfully');
      setShowAddModal(false);
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!isFirebaseReady) {
      const newEvents = events.filter(e => e.id !== id);
      updateDemoEvents(newEvents);
      toast.success('Event deleted (Demo Mode)');
      setDeleteConfirmId(null);
      return;
    }

    try {
      await deleteDoc(doc(db, 'events', id));
      await logAction('EVENT_DELETED', profile?.fullName || 'Admin', id, 'warning');
      toast.success('Event deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-cyber tracking-tighter">EVENT LOGISTICS</h1>
          <p className="text-muted-foreground">Schedule and manage club workshops and summits.</p>
        </div>
        <Button variant="cyber" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          CREATE EVENT
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center p-20 animate-pulse font-cyber text-primary">SCANNING EVENT HORIZON...</div>
        ) : events.length === 0 ? (
          <div className="col-span-full text-center p-20 border-2 border-dashed border-white/10 rounded-2xl">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">No events found. Initialize your first mission.</p>
          </div>
        ) : events.map((event) => (
          <Card key={event.id} className="group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setEditingEvent(event)}
                  className="h-9 w-9 bg-black/50 backdrop-blur-md border border-white/10 hover:text-primary hover:border-primary/30"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setDeleteConfirmId(event.id)} 
                  className="h-9 w-9 bg-black/50 backdrop-blur-md border border-white/10 text-destructive hover:bg-destructive/20 hover:border-destructive/30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-[10px] font-cyber text-primary uppercase tracking-widest mb-2 flex items-center">
                <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
                {event.status}
              </div>
              <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors">{event.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="w-3 h-3 mr-2 text-neon-blue" />
                  {new Date(event.date).toLocaleDateString()}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Clock className="w-3 h-3 mr-2 text-neon-blue" />
                  {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-3 h-3 mr-2 text-neon-purple" />
                  {event.location}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Users className="w-3 h-3 mr-2 text-neon-green" />
                  {event.registeredCount} / {event.capacity}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {canScan && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-[10px] h-8 border-primary/30"
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowScanModal(true);
                    }}
                  >
                    <Scan className="w-3.5 h-3.5 mr-2" />
                    SCAN QR
                  </Button>
                )}
                {isHR && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-[10px] h-8 border-neon-purple/30"
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowOrganizersModal(true);
                    }}
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-2" />
                    ORGANIZERS
                  </Button>
                )}
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                <Button variant="ghost" size="sm" className="text-[10px] h-8" onClick={() => window.open(`/events/${event.id}`, '_blank')}>
                  <ExternalLink className="w-3.5 h-3.5 mr-2" />
                  PUBLIC LINK
                </Button>
                <Button variant="ghost" size="sm" className="text-[10px] h-8">
                  <ImageIcon className="w-3.5 h-3.5 mr-2" />
                  VIEW POSTER
                </Button>
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
              <CardTitle className="text-xl font-cyber">CONFIRM DELETION</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">This action is irreversible. All event data and registrations will be purged from the grid.</p>
            </CardHeader>
            <CardContent className="flex gap-4 pt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setDeleteConfirmId(null)}>ABORT</Button>
              <Button variant="destructive" className="flex-1" onClick={() => handleDeleteEvent(deleteConfirmId)}>PURGE DATA</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {editingEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-dark-navy/90 backdrop-blur-md">
          <Card className="w-full max-w-lg border-primary/30 shadow-[0_0_50px_rgba(57,255,20,0.1)]">
            <CardHeader>
              <CardTitle className="text-2xl font-cyber">EDIT EVENT PARAMETERS</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateEvent} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Event Title</label>
                  <Input 
                    value={editingEvent.title} 
                    onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Description</label>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[100px]"
                    value={editingEvent.description}
                    onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Date & Time</label>
                    <Input 
                      type="datetime-local" 
                      value={editingEvent.date} 
                      onChange={(e) => setEditingEvent({...editingEvent, date: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Location</label>
                    <Input 
                      value={editingEvent.location} 
                      onChange={(e) => setEditingEvent({...editingEvent, location: e.target.value})} 
                      required 
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-6">
                  <Button variant="ghost" type="button" onClick={() => setEditingEvent(null)}>ABORT</Button>
                  <Button variant="cyber" type="submit">UPDATE PARAMETERS</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {showScanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-dark-navy/90 backdrop-blur-md">
          <Card className="w-full max-w-md border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-cyber">QR SCANNER ACTIVE</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowScanModal(false)}><X className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent>
              <div id="reader" className="w-full rounded-lg overflow-hidden border border-white/10"></div>
              <p className="text-center text-xs text-muted-foreground mt-4">Scan visitor QR code to verify registration</p>
            </CardContent>
          </Card>
        </div>
      )}

      {showOrganizersModal && selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-dark-navy/90 backdrop-blur-md">
          <Card className="w-full max-w-md border-neon-purple/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-cyber">MANAGE ORGANIZERS</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowOrganizersModal(false)}><X className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2 items-end">
                <div className="flex-grow">
                  <UserIdentityInput 
                    suggestions={users}
                    onValueChange={(val, type) => {
                      setOrganizerValue(val);
                      setIdentityType(type);
                    }}
                  />
                </div>
                <Button variant="cyber" onClick={handleAddOrganizer} className="h-10">ADD</Button>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Authorized Organizers</p>
                {selectedEvent.organizers?.length > 0 ? (
                  selectedEvent.organizers.map((label: string, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10">
                      <span className="text-xs">{label}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-destructive"
                        onClick={async () => {
                          const updated = selectedEvent.organizers.filter((_: any, index: number) => index !== i);
                          if (!isFirebaseReady) {
                            const newEvents = events.map(e => e.id === selectedEvent.id ? { ...e, organizers: updated } : e);
                            updateDemoEvents(newEvents);
                            setSelectedEvent({ ...selectedEvent, organizers: updated });
                            return;
                          }
                          await updateDoc(doc(db, 'events', selectedEvent.id), { organizers: updated });
                          setSelectedEvent({ ...selectedEvent, organizers: updated });
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">No organizers assigned yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-10 bg-dark-navy/90 backdrop-blur-md overflow-y-auto custom-scrollbar">
          <Card className="w-full max-w-lg border-primary/30 shadow-[0_0_50px_rgba(57,255,20,0.1)] my-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-cyber">NEW EVENT INITIALIZATION</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddEvent} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Event Title</label>
                  <Input 
                    placeholder="e.g. Data Science Summit" 
                    value={newEvent.title} 
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Description</label>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[100px] transition-all focus:border-primary/50"
                    placeholder="What is this event about?"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Date & Time</label>
                    <Input 
                      type="datetime-local" 
                      value={newEvent.date} 
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Location</label>
                    <Input 
                      placeholder="Room or Link" 
                      value={newEvent.location} 
                      onChange={(e) => setNewEvent({...newEvent, location: e.target.value})} 
                      required 
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-6">
                  <Button variant="ghost" type="button" onClick={() => setShowAddModal(false)}>ABORT MISSION</Button>
                  <Button variant="cyber" type="submit">PUBLISH TO GRID</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EventManagement;
