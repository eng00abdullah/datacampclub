import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Trash2, Save, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import ImagePicker from '../../components/ImagePicker';

import { collection, onSnapshot, query, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, isFirebaseReady } from '../../lib/firebase';
import { demoGallery, setDemoGallery } from '../../lib/demoData';
import { deleteFile } from '../../services/storageService';

const GalleryManagement = () => {
  const [images, setImages] = useState<any[]>([]);
  const [newImage, setNewImage] = useState({ url: '', title: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  const handleAdd = async () => {
    if (!newImage.url) return;
    const imageData = { ...newImage, createdAt: new Date().toISOString() };

    if (!isFirebaseReady) {
      const updated = [...images, { ...imageData, id: Date.now().toString() }];
      setDemoGallery(updated);
      setImages(updated);
      setNewImage({ url: '', title: '' });
      toast.success('Visual asset added to archive (Demo Mode)');
      return;
    }

    try {
      await addDoc(collection(db, 'gallery'), imageData);
      setNewImage({ url: '', title: '' });
      toast.success('Visual asset added to cloud archive');
    } catch (error) {
      toast.error('Failed to add asset');
    }
  };

  const removeImage = async (id: string) => {
    if (!isFirebaseReady) {
      const updated = images.filter(img => img.id !== id);
      setDemoGallery(updated);
      setImages(updated);
      toast.success('Asset removed from archive (Demo Mode)');
      return;
    }

    try {
      const itemToDelete = images.find(img => img.id === id);
      if (itemToDelete?.url) {
        await deleteFile(itemToDelete.url);
      }
      await deleteDoc(doc(db, 'gallery', id));
      toast.success('Asset removed from cloud');
    } catch (error) {
      toast.error('Failed to remove asset');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black font-cyber tracking-tighter">GALLERY ARCHIVE CONTROL</h1>
        <p className="text-muted-foreground">Manage the visual history of the DataCamp Student Club.</p>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Add New Asset</CardTitle>
          <CardDescription>Enter the URL of the image you want to add to the gallery.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ImagePicker 
            label="Visual Asset"
            currentImage={newImage.url}
            onImageSelected={(base64) => setNewImage({...newImage, url: base64})}
          />
          <div className="flex gap-4 items-end">
            <div className="flex-grow space-y-2">
              <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">Caption / Title</label>
              <Input 
                placeholder="Event Name" 
                value={newImage.title}
                onChange={(e) => setNewImage({...newImage, title: e.target.value})}
              />
            </div>
            <Button variant="cyber" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              ADD TO GRID
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {images.map((img) => (
          <div key={img.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-white/10 glass">
            <img src={img.url} alt={img.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-dark-navy/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
              <p className="text-[10px] font-cyber uppercase tracking-widest mb-4">{img.title}</p>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-10 h-10 text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20"
                onClick={() => setDeleteConfirmId(img.id)}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
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
              <p className="text-sm text-muted-foreground mt-2">Are you sure you want to remove this visual asset from the club archive?</p>
            </CardHeader>
            <CardContent className="flex gap-4 pt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setDeleteConfirmId(null)}>ABORT</Button>
              <Button variant="destructive" className="flex-1" onClick={() => {
                removeImage(deleteConfirmId);
                setDeleteConfirmId(null);
              }}>CONFIRM_PURGE</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GalleryManagement;
