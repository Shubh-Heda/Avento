import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function createAlbumRecord(payload: { owner_id?: string | null; title: string; description?: string | null; cover_photo?: string | null; total_photos?: number }) {
  try {
    const docRef = await addDoc(collection(db, 'albums'), {
      owner_id: payload.owner_id || null,
      title: payload.title,
      description: payload.description || null,
      cover_photo: payload.cover_photo || null,
      total_photos: payload.total_photos || 0,
      created_at: serverTimestamp()
    });
    return { id: docRef.id, ...payload };
  } catch (error) {
    console.error('createAlbumRecord error:', error);
    return { id: `album_demo_${Date.now()}` };
  }
}

export async function createPhotoRecord(payload: { album_id?: string | null; owner_id?: string | null; storage_path?: string | null; public_url?: string | null; caption?: string | null }) {
  try {
    const docRef = await addDoc(collection(db, 'photos'), {
      album_id: payload.album_id || null,
      owner_id: payload.owner_id || null,
      storage_path: payload.storage_path || null,
      public_url: payload.public_url || null,
      caption: payload.caption || null,
      created_at: serverTimestamp()
    });
    return { id: docRef.id, public_url: payload.public_url };
  } catch (error) {
    console.error('createPhotoRecord error:', error);
    return { id: `photo_demo_${Date.now()}`, public_url: payload.public_url };
  }
}
