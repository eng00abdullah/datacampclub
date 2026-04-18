import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Trash2, Code, Save, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, isFirebaseReady } from '../../lib/firebase';
import { UserIdentityInput, validateUserIdentity } from '../../components/UserIdentityInput';
import ImagePicker from '../../components/ImagePicker';
import { demoUsers, demoProjects, setDemoProjects } from '../../lib/demoData';

const ProjectManagement = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProject, setNewProject] = useState({ 
    title: '', 
    description: '', 
    tech: '', 
    link: '', 
    category: '', 
    image: '',
    author: ''
  });
  const [authorType, setAuthorType] = useState<'email' | 'id'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseReady) {
      setProjects(demoProjects);
      setUsers(demoUsers);
      return;
    }

    const q = query(collection(db, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("Projects listener error:", error);
    });

    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("Users listener error:", error);
    });

    return () => {
      unsubscribe();
      unsubscribeUsers();
    };
  }, []);

  const resetForm = () => {
    setNewProject({ 
      title: '', 
      description: '', 
      tech: '', 
      link: '', 
      category: '', 
      image: '',
      author: ''
    });
    setAuthorType('email');
  };

  const addProject = async () => {
    if (!newProject.title) {
      toast.error('Project title is required');
      return;
    }

    setIsSubmitting(true);
    const authorLabel = newProject.author 
      ? (authorType === 'email' ? newProject.author : `ID: ${newProject.author}`)
      : 'Club Member';
      
    const projectData = { 
      ...newProject, 
      author: authorLabel, 
      createdAt: new Date().toISOString() 
    };

    if (!isFirebaseReady) {
      const updated = [{ ...projectData, id: 'demo_' + Date.now() }, ...projects];
      setDemoProjects(updated);
      setProjects(updated);
      setShowAddModal(false);
      resetForm();
      setIsSubmitting(false);
      toast.success('Project added to portfolio (Demo Mode)');
      return;
    }

    try {
      await addDoc(collection(db, 'projects'), projectData);
      setShowAddModal(false);
      resetForm();
      toast.success('Project added to cloud portfolio');
    } catch (error) {
      console.error('Error adding project:', error);
      toast.error('Failed to add project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (!isFirebaseReady) {
      const updated = projects.filter(p => p.id !== id);
      setDemoProjects(updated);
      setProjects(updated);
      toast.success('Project removed (Demo Mode)');
      return;
    }

    try {
      await deleteDoc(doc(db, 'projects', id));
      toast.success('Project removed from cloud');
    } catch (error) {
      toast.error('Failed to remove project');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-cyber tracking-tighter">PROJECT MANAGEMENT</h1>
          <p className="text-muted-foreground">Manage the club's technical portfolio.</p>
        </div>
        <Button variant="cyber" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          ADD_PROJECT
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="border-white/10 hover:border-primary/30 transition-all group">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="font-cyber text-lg group-hover:text-primary transition-colors">{project.title}</CardTitle>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteConfirmId(project.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-cyber tracking-widest">
                <span className="text-primary">{project.category || 'NO_CAT'}</span>
                <span className="text-muted-foreground">BY {project.author || 'UNKNOWN'}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
              <div className="text-[10px] font-mono text-primary uppercase tracking-widest bg-primary/5 p-2 rounded border border-primary/10">
                TECH_STACK: {project.tech}
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
              <CardTitle className="text-xl font-cyber">CONFIRM_REMOVAL</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">Are you sure you want to remove this project from the portfolio? This will purge all associated code repository links.</p>
            </CardHeader>
            <CardContent className="flex gap-4 pt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setDeleteConfirmId(null)}>ABORT</Button>
              <Button variant="destructive" className="flex-1" onClick={() => {
                deleteProject(deleteConfirmId);
                setDeleteConfirmId(null);
              }}>CONFIRM_PURGE</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-10 bg-dark-navy/90 backdrop-blur-md overflow-y-auto custom-scrollbar">
          <Card className="w-full max-w-lg border-primary/30 my-auto">
            <CardHeader><CardTitle className="font-cyber">INITIALIZE_PROJECT</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Project Title</label>
                  <Input value={newProject.title} onChange={(e) => setNewProject({...newProject, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Category (e.g. NLP, Web3)</label>
                  <Input value={newProject.category} onChange={(e) => setNewProject({...newProject, category: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Tech Stack</label>
                  <Input value={newProject.tech} onChange={(e) => setNewProject({...newProject, tech: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Project Link (URL)</label>
                  <Input value={newProject.link} onChange={(e) => setNewProject({...newProject, link: e.target.value})} />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Lead Developer / Author (Optional)</label>
                <UserIdentityInput 
                  suggestions={users}
                  onValueChange={(val, type) => {
                    setNewProject({...newProject, author: val});
                    setAuthorType(type);
                  }}
                />
              </div>

              <div className="space-y-2">
                <ImagePicker 
                  label="Project Cover Image"
                  currentImage={newProject.image}
                  onImageSelected={(base64) => setNewProject({...newProject, image: base64})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Description</label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[100px]"
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <Button variant="ghost" onClick={() => { setShowAddModal(false); resetForm(); }}>ABORT</Button>
                <Button variant="cyber" onClick={addProject} disabled={isSubmitting}>
                  {isSubmitting ? 'PUBLISHING...' : 'PUBLISH_PROJECT'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
