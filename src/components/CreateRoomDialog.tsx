import { useState } from 'react';
import { X, Users, Globe, Lock, Coffee, MessageCircle, Radio, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface CreateRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomData: RoomData) => Promise<any>;
  category: 'cultural' | 'sports' | 'party' | 'all';
}

interface RoomData {
  title: string;
  type: 'planning' | 'feedback' | 'discussion';
  description: string;
  tags: string[];
  maxParticipants: number;
  isPublic: boolean;
  category?: 'cultural' | 'sports' | 'party';
}

export function CreateRoomDialog({ isOpen, onClose, onCreateRoom, category }: CreateRoomDialogProps) {
  const [step, setStep] = useState(1);
  const [roomData, setRoomData] = useState<RoomData>({
    title: '',
    type: 'discussion',
    description: '',
    tags: [],
    maxParticipants: 10,
    isPublic: true,
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (tagInput.trim() && roomData.tags.length < 5) {
      setRoomData({ ...roomData, tags: [...roomData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setRoomData({ ...roomData, tags: roomData.tags.filter((_, i) => i !== index) });
  };

  const handleSubmit = async () => {
    if (!roomData.title.trim()) {
      toast.error('Please enter a room title');
      return;
    }

    setLoading(true);
    try {
      const roomPayload = {
        ...roomData,
        category: category === 'all' ? 'sports' : category,
      } as RoomData;
      await onCreateRoom(roomPayload);
      toast.success('🎉 Room created successfully!', {
        description: 'Your vibe room is now live and others can join',
      });
      // Reset and close
      setRoomData({
        title: '',
        type: 'discussion',
        description: '',
        tags: [],
        maxParticipants: 10,
        isPublic: true,
      });
      setStep(1);
      onClose();
    } catch (error: any) {
      toast.error('Failed to create room', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = () => {
    switch (category) {
      case 'sports':
        return 'from-cyan-500 to-emerald-500';
      case 'cultural':
        return 'from-purple-500 to-pink-500';
      case 'party':
        return 'from-orange-500 to-pink-500';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className={`bg-gradient-to-r ${getCategoryColor()} p-6 text-white relative`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-white mb-1">Create Vibe Room</h2>
              <p className="text-sm text-white/90">Start a conversation and connect with others</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center py-6 gap-2">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  step >= s
                    ? `bg-gradient-to-r ${getCategoryColor()} text-white shadow-lg`
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {s}
              </div>
              {s < 2 && (
                <div
                  className={`w-12 h-1 mx-1 transition-all ${
                    step > s ? `bg-gradient-to-r ${getCategoryColor()}` : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Room Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-4">Room Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2 text-slate-700">Room Title *</label>
                    <Input
                      placeholder="e.g., Planning Next Week's Match, Post-Game Discussion"
                      value={roomData.title}
                      onChange={(e) => setRoomData({ ...roomData, title: e.target.value })}
                      className="border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-slate-700">Room Type</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setRoomData({ ...roomData, type: 'planning' })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          roomData.type === 'planning'
                            ? `border-purple-500 bg-purple-50`
                            : 'border-slate-200 hover:border-purple-200'
                        }`}
                      >
                        <Coffee className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                        <div className="text-sm">Planning</div>
                      </button>
                      <button
                        onClick={() => setRoomData({ ...roomData, type: 'feedback' })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          roomData.type === 'feedback'
                            ? `border-purple-500 bg-purple-50`
                            : 'border-slate-200 hover:border-purple-200'
                        }`}
                      >
                        <MessageCircle className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                        <div className="text-sm">Feedback</div>
                      </button>
                      <button
                        onClick={() => setRoomData({ ...roomData, type: 'discussion' })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          roomData.type === 'discussion'
                            ? `border-purple-500 bg-purple-50`
                            : 'border-slate-200 hover:border-purple-200'
                        }`}
                      >
                        <Users className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                        <div className="text-sm">Discussion</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-slate-700">Description (Optional)</label>
                    <Textarea
                      placeholder="What would you like to talk about?"
                      value={roomData.description}
                      onChange={(e) => setRoomData({ ...roomData, description: e.target.value })}
                      className="border-slate-300 min-h-24"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-slate-700">Tags (up to 5)</label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Add a tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        className="border-slate-300"
                        disabled={roomData.tags.length >= 5}
                      />
                      <Button
                        variant="outline"
                        onClick={handleAddTag}
                        disabled={!tagInput.trim() || roomData.tags.length >= 5}
                        className="border-purple-300"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {roomData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="gap-1 pr-1">
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(index)}
                            className="ml-1 hover:bg-slate-300 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  className={`bg-gradient-to-r ${getCategoryColor()}`}
                  disabled={!roomData.title.trim()}
                >
                  Next: Settings
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Room Settings */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-4">Room Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2 text-slate-700">Maximum Participants</label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setRoomData({ ...roomData, maxParticipants: Math.max(2, roomData.maxParticipants - 1) })}
                        className="border-purple-300"
                      >
                        -
                      </Button>
                      <span className="text-2xl w-16 text-center">{roomData.maxParticipants}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setRoomData({ ...roomData, maxParticipants: Math.min(50, roomData.maxParticipants + 1) })}
                        className="border-purple-300"
                      >
                        +
                      </Button>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Minimum 2, maximum 50 participants</p>
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-slate-700">Privacy</label>
                    <div className="space-y-3">
                      <button
                        onClick={() => setRoomData({ ...roomData, isPublic: true })}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          roomData.isPublic
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-slate-200 hover:border-purple-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Globe className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <div className="text-slate-900 mb-1">Public</div>
                            <p className="text-sm text-slate-600">
                              Anyone in the community can find and join this room
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setRoomData({ ...roomData, isPublic: false })}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          !roomData.isPublic
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-slate-200 hover:border-purple-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Lock className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <div className="text-slate-900 mb-1">Private</div>
                            <p className="text-sm text-slate-600">
                              Only people with the invite link can join
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-purple-600 mt-1" />
                      <div>
                        <div className="text-slate-900 mb-1">Room Preview</div>
                        <p className="text-sm text-slate-600 mb-2">{roomData.title}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs capitalize">{roomData.type}</Badge>
                          <Badge variant="secondary" className="text-xs">{roomData.isPublic ? 'Public' : 'Private'}</Badge>
                          <Badge variant="secondary" className="text-xs">Max {roomData.maxParticipants} people</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-slate-300"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  className={`bg-gradient-to-r ${getCategoryColor()} gap-2`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Radio className="w-4 h-4" />
                      Create Room
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
