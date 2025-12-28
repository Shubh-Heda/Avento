// ============================================
// Media Upload Service for Community Posts
// ============================================
import { supabase } from '../lib/supabase';
import type { PostMedia, MediaUploadResponse } from '../types/community';

export const mediaUploadService = {
  /**
   * Upload media files to Supabase Storage
   */
  async uploadMedia(
    file: File,
    postId: string,
    displayOrder: number = 0
  ): Promise<MediaUploadResponse | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${postId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `community-media/${fileName}`;

      // Determine media type
      const mediaType = file.type.startsWith('video/') 
        ? 'video' 
        : file.type === 'image/gif' 
        ? 'gif' 
        : 'photo';

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('community-posts')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('community-posts')
        .getPublicUrl(filePath);

      // Create thumbnail for videos
      let thumbnailUrl: string | undefined;
      if (mediaType === 'video') {
        thumbnailUrl = await this.generateVideoThumbnail(file);
      }

      // Get image dimensions if it's a photo
      let width: number | undefined;
      let height: number | undefined;
      let duration: number | undefined;

      if (mediaType === 'photo') {
        const dimensions = await this.getImageDimensions(file);
        width = dimensions.width;
        height = dimensions.height;
      } else if (mediaType === 'video') {
        const videoDuration = await this.getVideoDuration(file);
        duration = videoDuration;
      }

      // Save media metadata to database
      const { data: mediaData, error: dbError } = await supabase
        .from('post_media')
        .insert({
          post_id: postId,
          media_type: mediaType,
          media_url: publicUrl,
          thumbnail_url: thumbnailUrl,
          width,
          height,
          duration,
          file_size: file.size,
          mime_type: file.type,
          display_order: displayOrder,
          processing_status: 'completed'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return {
        media_id: mediaData.id,
        media_url: publicUrl,
        thumbnail_url: thumbnailUrl,
        processing_status: 'completed'
      };
    } catch (error) {
      console.error('Error uploading media:', error);
      return null;
    }
  },

  /**
   * Upload multiple media files
   */
  async uploadMultipleMedia(
    files: File[],
    postId: string
  ): Promise<MediaUploadResponse[]> {
    try {
      const uploads = files.map((file, index) =>
        this.uploadMedia(file, postId, index)
      );

      const results = await Promise.all(uploads);
      return results.filter((r): r is MediaUploadResponse => r !== null);
    } catch (error) {
      console.error('Error uploading multiple media:', error);
      return [];
    }
  },

  /**
   * Delete media file
   */
  async deleteMedia(mediaId: string): Promise<boolean> {
    try {
      // Get media info
      const { data: media, error: fetchError } = await supabase
        .from('post_media')
        .select('media_url')
        .eq('id', mediaId)
        .single();

      if (fetchError) throw fetchError;

      // Extract file path from URL
      const urlParts = media.media_url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('community-media')).join('/');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('community-posts')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('post_media')
        .delete()
        .eq('id', mediaId);

      if (dbError) throw dbError;

      return true;
    } catch (error) {
      console.error('Error deleting media:', error);
      return false;
    }
  },

  /**
   * Get image dimensions
   */
  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.width,
          height: img.height
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ width: 0, height: 0 });
      };

      img.src = url;
    });
  },

  /**
   * Get video duration
   */
  async getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(Math.floor(video.duration));
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0);
      };

      video.src = url;
    });
  },

  /**
   * Generate video thumbnail (using video's first frame)
   */
  async generateVideoThumbnail(file: File): Promise<string | undefined> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const url = URL.createObjectURL(file);

      video.onloadeddata = () => {
        video.currentTime = 1; // Capture frame at 1 second
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          URL.revokeObjectURL(url);
          resolve(thumbnailUrl);
        } else {
          URL.revokeObjectURL(url);
          resolve(undefined);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(undefined);
      };

      video.src = url;
    });
  },

  /**
   * Get media for a post
   */
  async getPostMedia(postId: string): Promise<PostMedia[]> {
    try {
      const { data, error } = await supabase
        .from('post_media')
        .select('*')
        .eq('post_id', postId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching post media:', error);
      return [];
    }
  },

  /**
   * Validate file for upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (max 100MB for videos, 10MB for images)
    const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed (${maxSize / (1024 * 1024)}MB)`
      };
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported. Please upload JPEG, PNG, GIF, WebP, MP4, or WebM files.'
      };
    }

    return { valid: true };
  },

  /**
   * Validate multiple files
   */
  validateFiles(files: File[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check max number of files (4 media items per post)
    if (files.length > 4) {
      errors.push('Maximum 4 media items allowed per post');
    }

    // Validate each file
    files.forEach((file, index) => {
      const validation = this.validateFile(file);
      if (!validation.valid && validation.error) {
        errors.push(`File ${index + 1}: ${validation.error}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

export default mediaUploadService;
