import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Upload, Camera, Image as ImageIcon, X } from 'lucide-react';
import { Button } from './ui/Button';

interface ImagePickerProps {
  onImageSelected: (base64: string) => void;
  currentImage?: string;
  label?: string;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ onImageSelected, currentImage, label }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelected(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();

  return (
    <div className="space-y-4">
      {label && <label className="text-[10px] font-cyber uppercase tracking-widest text-muted-foreground">{label}</label>}
      
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Preview Area */}
        <div className="relative w-32 h-32 rounded-2xl border-2 border-dashed border-white/10 glass flex items-center justify-center overflow-hidden group">
          {currentImage ? (
            <>
              <img src={currentImage} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-dark-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="ghost" size="icon" onClick={() => onImageSelected('')} className="text-destructive">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </>
          ) : (
            <ImageIcon className="w-8 h-8 text-muted-foreground opacity-20" />
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
          />
          
          <Button variant="outline" size="sm" className="justify-start" onClick={triggerUpload}>
            <Upload className="w-4 h-4 mr-2" />
            IMPORT_FROM_DEVICE
          </Button>
          
          <Button variant="outline" size="sm" className="justify-start" onClick={() => {
            // Simulate camera/select photo
            const url = prompt('Enter Image URL (Simulating Select Photo):');
            if (url) onImageSelected(url);
          }}>
            <ImageIcon className="w-4 h-4 mr-2" />
            SELECT_PHOTO_ARCHIVE
          </Button>

          <Button variant="outline" size="sm" className="justify-start" onClick={() => {
            alert('Camera access requested... (Simulated)');
          }}>
            <Camera className="w-4 h-4 mr-2" />
            TAKE_PHOTO_LIVE
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImagePicker;
