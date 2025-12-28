// ============================================
// Memory Upload - Share Match Photos & Moments
// Backend-powered with Supabase Storage
// ============================================
import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Video, Loader, Check, MapPin, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import mediaUploadService from '../services/mediaUploadService';
import communityPostService from '../services/communityPostService';
import { toast } from 'sonner';

interface MemoryUploadProps {
  matchId?: string;
  matchTitle?: string;
  onClose: () => void;
  onUploadComplete?: () => void;
}

export function MemoryUpload({ matchId, matchTitle, onClose, onUploadComplete }: MemoryUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    // Validate
    const validation = mediaUploadService.validateFiles(selectedFiles);
    if (!validation.valid) {
      toast.error(validation.errors.join(', '));
      return;
    }

    // Limit to 4 files
    const newFiles = selectedFiles.slice(0, 4 - files.length);
    setFiles(prev => [...prev, ...newFiles]);

    // Create previews
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0 && !caption) {
      toast.error('Please add photos/videos or write a caption');
      return;
    }

    setUploading(true);
    
    try {
      // Create post content
      const content = caption || `${matchTitle ? `Great match at ${matchTitle}! ` : ''}Check out these memories 📸`;
      
      // Create the post first
      const post = await communityPostService.post.createPost({
        content,
        category: 'sports',
        location: location || undefined
      });

      // Upload media if any
      if (files.length > 0 && post) {
        let completed = 0;
        for (const file of files) {
          await mediaUploadService.uploadMedia(file, post.id, completed);
          completed++;
          setUploadProgress((completed / files.length) * 100);
        }
      }

      toast.success('Memory shared successfully! 🎉');
      onUploadComplete?.();
      onClose();
    } catch (error) {
      console.error('Error uploading memory:', error);
      toast.error('Failed to upload. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-cyan-600" />
              Share Match Memory
            </h2>
            {matchTitle && (
              <p className="text-sm text-slate-600 mt-1">{matchTitle}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={uploading}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share your thoughts about this match... What made it special?"
              className="w-full min-h-[100px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
              disabled={uploading}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location (Optional)
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where was this match?"
              disabled={uploading}
            />
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Photos & Videos ({files.length}/4)
            </label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading || files.length >= 4}
            />

            {/* Preview Grid */}
            {previews.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    {files[index].type.startsWith('video/') ? (
                      <div className="relative">
                        <video src={preview} className="w-full h-32 object-cover rounded-lg" />
                        <Video className="absolute inset-0 m-auto w-10 h-10 text-white" />
                      </div>
                    ) : (
                      <img src={preview} alt="" className="w-full h-32 object-cover rounded-lg" />
                    )}
                    {!uploading && (
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {files.length < 4 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-cyan-500 hover:bg-cyan-50 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-8 h-8 text-slate-400" />
                <span className="text-sm text-slate-600">
                  Click to upload photos or videos
                </span>
                <span className="text-xs text-slate-500">
                  Max 4 files • Photos up to 10MB • Videos up to 100MB
                </span>
              </button>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
              <div className="flex items-center gap-3 mb-2">
                <Loader className="w-5 h-5 text-cyan-600 animate-spin" />
                <span className="text-sm font-medium text-cyan-900">
                  Uploading memory...
                </span>
              </div>
              <div className="w-full bg-cyan-200 rounded-full h-2">
                <div
                  className="bg-cyan-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-xs text-cyan-700 mt-1 block">
                {Math.round(uploadProgress)}% complete
              </span>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Tips for Great Memories
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Tag teammates to share the moment together</li>
              <li>• Add location so others can discover great venues</li>
              <li>• Share what made this match special</li>
              <li>• Photos of celebrations, action shots, or team huddles work best!</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-slate-50 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={uploading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploading || (files.length === 0 && !caption.trim())}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white gap-2"
          >
            {uploading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Share Memory
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
