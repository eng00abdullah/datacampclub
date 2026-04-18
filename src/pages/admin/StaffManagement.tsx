import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Trash2, Save, User, Link as LinkIcon, Facebook, Linkedin, Instagram, Twitter, Github, Globe } from 'lucide-react';
import { toast } from 'sonner';
import ImagePicker from '../../components/ImagePicker';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, isFirebaseReady } from '../../lib/firebase';
import { logAction } from '../../lib/logger';
import { UserIdentityInput, validateUserIdentity } from '../../components/UserIdentityInput';
import { demoUsers, demoStaff, setDemoStaff } from '../../lib/demoData';

const StaffManagement = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    category: 'Leaders',
    image: '',
    socials: [] as any[],
    linkedUser: '',
    linkedUserType: 'email' as 'email' | 'id'
  });

  useEffect(() => {
    if (!isFirebaseReady) {
      setStaff(demoStaff);
      setUsers(demoUsers);
      return;
    }

    // Fetch Staff
    const staffQuery = query(collection(db, 'staff'));
    const unsubscribeStaff = onSnapshot(staffQuery, (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("Staff listener error:", error);
    });

    // Fetch Users for linking
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("Users listener error:", error);
    });

    return () => {
      unsubscribeStaff();
      unsubscribeUsers();
    };
  }, []);

  const handleSave = () => {
    if (!isFirebaseReady) {
      toast.success('Demo Mode: Roster updated in memory.');
    }
  };

  const handleAddMember = async () => {
    if (newMember.linkedUser && !validateUserIdentity(newMember.linkedUser, newMember.linkedUserType)) return;
    
    const linkedUserLabel = newMember.linkedUser 
      ? (newMember.linkedUserType === 'email' ? newMember.linkedUser : `ID: ${newMember.linkedUser}`)
      : '';

    const memberData = { ...newMember, linkedUser: linkedUserLabel, createdAt: new Date().toISOString() };

    if (!isFirebaseReady) {
      const updated = [...staff, { ...memberData, id: Date.now().toString() }];
      setDemoStaff(updated);
      setStaff(updated);
      setShowAddModal(false);
      setNewMember({ name: '', role: '', category: 'Leaders', image: '', socials: [], linkedUser: '', linkedUserType: 'email' });
      toast.success('New operative initialized (Demo Mode)');
      return;
    }

    try {
      await addDoc(collection(db, 'staff'), memberData);
      await logAction('STAFF_MEMBER_ADDED', 'Admin', memberData.name, 'success');
      setShowAddModal(false);
      setNewMember({ name: '', role: '', category: 'Leaders', image: '', socials: [], linkedUser: '', linkedUserType: 'email' });
      toast.success('New operative initialized in cloud database');
    } catch (error) {
      toast.error('Failed to initialize operative');
    }
  };

  const removeMember = async (id: string) => {
    if (!isFirebaseReady) {
      const updated = staff.filter(s => s.id !== id);
      setDemoStaff(updated);
      setStaff(updated);
      toast.success('Operative decommissioned (Demo Mode)');
      return;
    }

    try {
      const memberToDelete = staff.find(s => s.id === id);
      if (memberToDelete?.image) {
        const { deleteFile } = await import('../../services/storageService');
        await deleteFile(memberToDelete.image);
      }
      await deleteDoc(doc(db, 'staff', id));
      await logAction('STAFF_MEMBER_REMOVED', 'Admin', id, 'warning');
      toast.success('Operative decommissioned from cloud');
    } catch (error) {
      toast.error('Failed to decommission operative');
    }
  };

  const addSocialToNew = () => {
    setNewMember({
      ...newMember,
      socials: [...newMember.socials, { platform: 'linkedin', url: '', icon: 'Linkedin' }]
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-cyber tracking-tighter">STAFF COMMAND</h1>
          <p className="text-muted-foreground">Manage the core team and their public profiles.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Commit Changes
          </Button>
          <Button variant="cyber" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Operative
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {staff.map((member) => (
          <Card key={member.id} className="group relative overflow-hidden">
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteConfirmId(member.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <CardHeader className="flex flex-row items-center space-x-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10">
                <img src={member.image || 'https://picsum.photos/seed/placeholder/200/200'} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <CardTitle className="text-lg">{member.name}</CardTitle>
                <CardDescription className="uppercase text-[10px] tracking-widest">{member.role}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {member.socials.map((s: any, idx: number) => (
                  <div key={idx} className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono border border-white/10">
                    {s.platform}
                  </div>
                ))}
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
              <CardTitle className="text-xl font-cyber">DECOMMISSION_OPERATIVE</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">Are you sure you want to remove this operative from the roster? Access to the command grid will be revoked for this profile.</p>
            </CardHeader>
            <CardContent className="flex gap-4 pt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setDeleteConfirmId(null)}>ABORT</Button>
              <Button variant="destructive" className="flex-1" onClick={() => {
                removeMember(deleteConfirmId);
                setDeleteConfirmId(null);
              }}>CONFIRM_PURGE</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-10 bg-dark-navy/90 backdrop-blur-md overflow-y-auto custom-scrollbar">
          <Card className="w-full max-w-2xl border-primary/30 my-auto">
            <CardHeader>
              <CardTitle className="font-cyber">INITIALIZE_NEW_OPERATIVE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Full Name</label>
                  <Input value={newMember.name} onChange={(e) => setNewMember({...newMember, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Role / Title</label>
                  <Input value={newMember.role} onChange={(e) => setNewMember({...newMember, role: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Category</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm outline-none focus:border-primary"
                    value={newMember.category}
                    onChange={(e) => setNewMember({...newMember, category: e.target.value})}
                  >
                    <option value="Leaders" className="bg-dark-navy">Leaders</option>
                    <option value="Technical" className="bg-dark-navy">Technical</option>
                    <option value="HR & Events" className="bg-dark-navy">HR & Events</option>
                    <option value="Mentors" className="bg-dark-navy">Mentors</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <ImagePicker 
                    label="Operative Image"
                    currentImage={newMember.image}
                    onImageSelected={(base64) => setNewMember({...newMember, image: base64})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Linked User (Optional)</label>
                <UserIdentityInput 
                  suggestions={users}
                  onValueChange={(val, type) => setNewMember({...newMember, linkedUser: val, linkedUserType: type})}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Social Links</label>
                  <Button variant="ghost" size="sm" onClick={addSocialToNew}>
                    <Plus className="w-3 h-3 mr-2" /> Add Link
                  </Button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {newMember.socials.map((s, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input 
                        placeholder="Platform" 
                        className="w-1/3"
                        value={s.platform}
                        onChange={(e) => {
                          const updated = [...newMember.socials];
                          updated[idx].platform = e.target.value;
                          updated[idx].icon = e.target.value;
                          setNewMember({...newMember, socials: updated});
                        }}
                      />
                      <Input 
                        placeholder="URL" 
                        value={s.url}
                        onChange={(e) => {
                          const updated = [...newMember.socials];
                          updated[idx].url = e.target.value;
                          setNewMember({...newMember, socials: updated});
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Button variant="ghost" onClick={() => setShowAddModal(false)}>ABORT</Button>
                <Button variant="cyber" onClick={handleAddMember}>INITIALIZE</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
