import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, isFirebaseReady } from '../lib/firebase';

export const uploadFile = async (path: string, file: File | Blob): Promise<string> => {
  if (!isFirebaseReady) {
    // In mock mode, we'll returned a fake URL or the data URL if provided as Blob
    if (file instanceof Blob) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMTUwIDE1MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzEwMTAxMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMzk2ZjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSI+W0RFTU8gTUVESUFdPC90ZXh0Pjwvc3ZnPg==';
  }

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

export const deleteFile = async (url: string): Promise<void> => {
  if (!isFirebaseReady || !url || url.startsWith('data:')) return;
  try {
    // In Modular SDK v9, ref(storage, URL) correctly creates a reference from a download URL
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    // If it's a 404 (not found), we consider it successful redaction
    if ((error as any).code === 'storage/object-not-found') {
      return;
    }
    console.error('Failed to delete file from storage:', error);
  }
};

export const getStoragePath = (collection: string, id: string, fileName: string): string => {
  return `${collection}/${id}/${fileName}`;
};
