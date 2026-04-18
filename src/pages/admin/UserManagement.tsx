import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, runTransaction, addDoc } from 'firebase/firestore';
import { auth, db, isFirebaseReady } from '../../lib/firebase';
import { logAction } from '../../lib/logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Search, Filter, Download, Upload, MoreVertical, 
  CheckCircle, XCircle, UserPlus, FileSpreadsheet, Trash2, ShieldAlert, Eye, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { hashPassword } from '../../lib/utils';
import { demoUsers, setDemoUsers, demoEvents, demoStaff } from '../../lib/demoData';
import { generateMemberId } from '../../lib/memberUtils';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json';

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    if (!isFirebaseReady) {
      setEvents(demoEvents);
    } else {
      const q = query(collection(db, 'events'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        console.warn("Events listener permission denied or error:", error);
      });
      return () => unsubscribe();
    }
  }, []);

  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'member',
    faculty: 'Engineering',
    status: 'active'
  });

  useEffect(() => {
    if (!isFirebaseReady) {
      setUsers(demoUsers);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.warn("Users listener permission denied:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isFirebaseReady]);

  const updateDemoUsers = (newUsers: any[]) => {
    setDemoUsers(newUsers);
    setUsers(newUsers);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return;
    setLoading(true);

    const memberId = await generateMemberId(users);

    const { password: newUserPassword, ...safeUserData } = newUser;
    const userData = {
      ...safeUserData,
      memberId,
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseReady) {
      const hashedPassword = await hashPassword(newUserPassword || 'temp_pass');
      const mockUser = { 
        id: 'mock_' + Date.now(), 
        ...userData, 
        password: hashedPassword,
        uid: 'mock_uid_' + Date.now() 
      };
      const updatedUsers = [mockUser, ...users];
      updateDemoUsers(updatedUsers);
      toast.success('Operative added to database (Demo Mode)');
      setShowAddModal(false);
      setLoading(false);
      return;
    }

    let secondaryAuth;
    let secondaryApp;
    
    try {
      // Create user in Firebase Auth using a secondary instance to avoid logging out admin
      const appName = `SecondaryApp_${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, appName);
      secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        newUser.email.trim(), 
        newUserPassword || Math.random().toString(36).slice(-10) + '!'
      );
      
      const uid = userCredential.user.uid;

      // Now create the Firestore document with the correct UID
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', uid), {
        ...userData,
        email: newUser.email.toLowerCase().trim(),
        uid,
        isVerified: false,
        updatedAt: new Date().toISOString()
      });

      await logAction('USER_ADDED', 'Admin', userData.fullName, 'success');
      toast.success('Operative created successfully in Auth & Firestore');
      setShowAddModal(false);
    } catch (error: any) {
      console.error("Admin user creation error:", error);
      toast.error(error.message || 'Failed to create operative');
    } finally {
      // Cleanup ALWAYS - prevent leaks
      if (secondaryAuth) await signOut(secondaryAuth);
      if (secondaryApp) await deleteApp(secondaryApp);
      setLoading(false);
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);
        
        if (!isFirebaseReady) {
          const newUsers = data.map((item, index) => ({
            id: `imported_${Date.now()}_${index}`,
            fullName: item.fullName || item.Name || 'Imported User',
            email: item.email || item.Email || `user${index}@example.com`,
            role: item.role || item.Role || 'member',
            memberId: item.memberId || item.ID || (users.length + index + 1).toString(),
            status: item.status || item.Status || 'active',
            faculty: item.faculty || item.Faculty || 'Unknown',
            createdAt: item.createdAt || new Date().toISOString(),
            isVerified: item.isVerified === true || item.isVerified === 'true'
          }));

          const updatedUsers = [...users, ...newUsers];
          updateDemoUsers(updatedUsers);
          toast.success(`Successfully imported ${newUsers.length} operatives.`);
        } else {
          toast.info(`Imported ${data.length} records. Batch processing required for live database.`);
        }
      } catch (error) {
        toast.error('Failed to parse file. Ensure it is a valid Excel or CSV file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(users);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, "DataCamp_Members_Export.xlsx");
    toast.success('Exporting member database...');
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    if (!isFirebaseReady) {
      const newUsers = users.map(u => u.id === userId ? { ...u, status: newStatus } : u);
      updateDemoUsers(newUsers);
      toast.success(`User status updated to ${newStatus}`);
      return;
    }
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      await logAction('USER_STATUS_CHANGE', 'Admin', `${userId} -> ${newStatus}`, 'success');
      toast.success(`User status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    if (!isFirebaseReady) {
      const newUsers = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
      updateDemoUsers(newUsers);
      toast.success(`Role updated to ${newRole}`);
      return;
    }
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      await logAction('USER_ROLE_CHANGE', 'Admin', `${userId} -> ${newRole}`, 'success');
      toast.success(`Role updated to ${newRole}`);
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!isFirebaseReady) {
      const newUsers = users.filter(u => u.id !== userId);
      updateDemoUsers(newUsers);
      toast.success('User removed from database');
      setShowDeleteConfirm(null);
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', userId));
      await logAction('USER_DELETED', 'Admin', userId, 'warning');
      toast.success('User removed from database');
      setShowDeleteConfirm(null);
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-cyber tracking-tighter">USER MANAGEMENT</h1>
          <p className="text-muted-foreground">Manage club members, roles, and permissions.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleExport} className="border-primary/30">
            <Download className="w-4 h-4 mr-2" />
            EXPORT_EXCEL
          </Button>
          <Button variant="cyber" onClick={() => setShowAddModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            ADD OPERATIVE
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, ID, or email..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-md px-2">
              <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <select 
                className="bg-dark-navy border-none text-[10px] font-bold uppercase tracking-widest outline-none py-2 text-foreground cursor-pointer"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all" className="bg-dark-navy text-white">ALL_ROLES</option>
                <option value="member" className="bg-dark-navy text-white">MEMBERS</option>
                <option value="mentor" className="bg-dark-navy text-white">MENTORS</option>
                <option value="organizer" className="bg-dark-navy text-white">ORGANIZERS</option>
                <option value="hr_organizer" className="bg-dark-navy text-white">HR_ORGANIZERS</option>
                <option value="hr_manager" className="bg-dark-navy text-white">HR_MANAGERS</option>
                <option value="event_manager" className="bg-dark-navy text-white">EVENT_MANAGERS</option>
                <option value="admin" className="bg-dark-navy text-white">ADMINS</option>
                <option value="super_admin" className="bg-dark-navy text-white">SUPER_ADMINS</option>
              </select>
            </div>
            <label className="cursor-pointer">
              <input type="file" accept=".csv, .xlsx" className="hidden" onChange={handleImportCSV} />
              <div className="flex items-center px-3 py-2 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold hover:bg-white/10 transition-colors">
                <FileSpreadsheet className="w-3.5 h-3.5 mr-2" /> IMPORT_CSV
              </div>
            </label>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="p-4 font-medium">Operative</th>
                  <th className="p-4 font-medium">ID Number</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Verification</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center animate-pulse">QUERYING DATABASE...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">NO_OPERATIVES_FOUND</td></tr>
                ) : filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {user.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-bold">{user.fullName}</div>
                          <div className="text-[10px] text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-neon-blue">{user.memberId}</td>
                    <td className="p-4">
                      <select 
                        className="bg-dark-navy border border-white/10 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-primary text-foreground"
                        value={user.role}
                        onChange={(e) => changeUserRole(user.id, e.target.value)}
                      >
                        <option value="member" className="bg-dark-navy">Member</option>
                        <option value="mentor" className="bg-dark-navy">Mentor</option>
                        <option value="organizer" className="bg-dark-navy">Organizer</option>
                        <option value="hr_organizer" className="bg-dark-navy">HR Organizer</option>
                        <option value="hr_manager" className="bg-dark-navy">HR Manager</option>
                        <option value="event_manager" className="bg-dark-navy">Event Manager</option>
                        <option value="admin" className="bg-dark-navy">Admin</option>
                        <option value="super_admin" className="bg-dark-navy">Super Admin</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className={`flex items-center text-[10px] font-bold uppercase tracking-widest ${user.isVerified ? 'text-neon-green' : 'text-muted-foreground'}`}>
                        {user.isVerified ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Verified</>
                        ) : (
                          <><XCircle className="w-3 h-3 mr-1" /> Pending</>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleUserStatus(user.id, user.status)}
                        className={`flex items-center text-xs font-bold ${user.status === 'active' ? 'text-neon-green' : 'text-destructive'}`}
                      >
                        {user.status === 'active' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {user.status.toUpperCase()}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20"
                          onClick={() => setViewingUser(user)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20"
                          onClick={() => setShowDeleteConfirm(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Operative Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-dark-navy/90 backdrop-blur-md">
          <Card className="w-full max-w-lg border-primary/30 shadow-[0_0_50px_rgba(57,255,20,0.1)]">
            <CardHeader>
              <CardTitle className="text-2xl font-cyber">INITIALIZE_NEW_OPERATIVE</CardTitle>
              <CardDescription className="text-destructive font-bold text-[10px] uppercase tracking-widest">
                Warning: This creates a database record only. Operatives must still register via the portal to access the grid.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddUser} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Full Name</label>
                  <Input 
                    placeholder="e.g. John Doe" 
                    value={newUser.fullName} 
                    onChange={(e) => setNewUser({...newUser, fullName: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Email Address</label>
                  <Input 
                    type="email"
                    placeholder="operative@datacamp.com" 
                    value={newUser.email} 
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Initial Password</label>
                  <Input 
                    type="password"
                    placeholder="Set temporary password" 
                    value={newUser.password} 
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})} 
                    required 
                  />
                  <p className="text-[8px] text-muted-foreground">Inform the operative of this password. They should change it upon first login.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Assigned Role</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    >
                      <option value="member" className="bg-dark-navy">Member</option>
                      <option value="mentor" className="bg-dark-navy">Mentor</option>
                      <option value="organizer" className="bg-dark-navy">Organizer</option>
                      <option value="hr_organizer" className="bg-dark-navy">HR Organizer</option>
                      <option value="hr_manager" className="bg-dark-navy">HR Manager</option>
                      <option value="event_manager" className="bg-dark-navy">Event Manager</option>
                      <option value="content_manager" className="bg-dark-navy">Content Manager</option>
                      <option value="finance_manager" className="bg-dark-navy">Finance Manager</option>
                      <option value="admin" className="bg-dark-navy">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Faculty</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                      value={newUser.faculty}
                      onChange={(e) => setNewUser({...newUser, faculty: e.target.value})}
                    >
                      <option value="Computer Science" className="bg-dark-navy">Computer Science</option>
                      <option value="Engineering" className="bg-dark-navy">Engineering</option>
                      <option value="Nursing" className="bg-dark-navy">Nursing</option>
                      <option value="Physical Therapy" className="bg-dark-navy">Physical Therapy</option>
                      <option value="Business" className="bg-dark-navy">Business</option>
                      <option value="Arts" className="bg-dark-navy">Arts</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-6">
                  <Button variant="ghost" type="button" onClick={() => setShowAddModal(false)}>ABORT</Button>
                  <Button variant="cyber" type="submit">CONFIRM_ENTRY</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-dark-navy/90 backdrop-blur-md">
          <Card className="w-full max-w-md border-destructive/30">
            <CardHeader>
              <CardTitle className="text-xl font-cyber text-destructive flex items-center gap-2">
                <ShieldAlert className="w-6 h-6" />
                DANGER_ZONE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to remove this operative from the database? This action is permanent and will redact all associated access keys.
              </p>
              <div className="flex justify-end gap-4">
                <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>CANCEL</Button>
                <Button variant="destructive" onClick={() => deleteUser(showDeleteConfirm)}>REDACT_OPERATIVE</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View User Activity Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-dark-navy/90 backdrop-blur-md">
          <Card className="w-full max-w-2xl border-primary/30 shadow-[0_0_50px_rgba(57,255,20,0.1)]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {viewingUser.fullName?.charAt(0) || '?'}
                </div>
                <div>
                  <CardTitle className="text-xl font-cyber">{viewingUser.fullName}</CardTitle>
                  <CardDescription className="text-xs font-mono text-primary/70">ID: {viewingUser.memberId} • {viewingUser.email}</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setViewingUser(null)}><XCircle className="w-5 h-5" /></Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground mb-2">Current Role</p>
                  <p className="font-bold text-primary">{viewingUser.role.toUpperCase()}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground mb-2">Faculty</p>
                  <p className="font-bold">{viewingUser.faculty || 'Not Specified'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-cyber uppercase tracking-widest text-primary flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  RELATED_OPERATIONS
                </h4>
                
                <div className="space-y-3">
                  <p className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Organized Events</p>
                  {events.filter(e => e.organizers?.some((o: string) => o.includes(viewingUser.email) || o.includes(viewingUser.memberId))).length > 0 ? (
                    <div className="grid gap-2">
                      {events.filter(e => e.organizers?.some((o: string) => o.includes(viewingUser.email) || o.includes(viewingUser.memberId))).map((e, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-3 text-primary" />
                            <span className="text-sm">{e.title}</span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">{new Date(e.date).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic p-4 bg-white/5 rounded border border-dashed border-white/10 text-center">
                      No active event assignments found for this operative.
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Staff Status</p>
                  {demoStaff.some((s: any) => s.linkedUser?.includes(viewingUser.email) || s.linkedUser?.includes(viewingUser.memberId)) ? (
                    <div className="p-3 bg-primary/10 rounded border border-primary/30 flex items-center justify-between">
                      <div className="flex items-center">
                        <ShieldAlert className="w-4 h-4 mr-3 text-primary" />
                        <span className="text-sm font-bold">ACTIVE CORE OPERATIVE</span>
                      </div>
                      <span className="text-[10px] font-cyber text-primary">VERIFIED</span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic p-4 bg-white/5 rounded border border-dashed border-white/10 text-center">
                      Not currently listed in core staff roster.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="cyber" onClick={() => setViewingUser(null)}>CLOSE_INTEL</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const Activity = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);

export default UserManagement;
