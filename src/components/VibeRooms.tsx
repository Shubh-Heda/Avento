import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Radio, Users, Lock, Globe, Mic, MicOff, Plus, Volume2, MessageCircle, Coffee, Video, VideoOff, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CreateRoomDialog } from './CreateRoomDialog';
import { useVibeRooms } from '../lib/hooks/useVibeRooms';
import { toast } from 'sonner';

interface VibeRoom {
  id: string;
  title: string;
  category: 'cultural' | 'sports' | 'party';
  type: 'planning' | 'feedback' | 'discussion';
  host: string;
  hostId: string;
  participants: string[];
  participantNames: string[];
  maxParticipants: number;
  isPublic: boolean;
  isActive: boolean;
  tags: string[];
  createdAt: number;
}

interface VibeRoomsProps {
  category?: 'cultural' | 'sports' | 'party' | 'all';
  onJoinRoom?: (roomId: string) => void;
}

export function VibeRooms({ category = 'all', onJoinRoom }: VibeRoomsProps) {
  const cardClass = 'rounded-xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm dark:bg-slate-900/70 dark:border-slate-800';
  const mutedText = 'text-slate-600 dark:text-slate-400';

  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  const { rooms, loading, error, createRoom, joinRoomWithVoice, joinRandomRoom, leaveRoom, presence, localStream, remoteStreams, startLocalAudio, stopLocalAudio, offerToPeers, voiceReady, videoEnabled, enableVideo, disableVideo, chatMessages, sendChatMessage } = useVibeRooms(category);

  const filteredRooms = category === 'all' 
    ? rooms 
    : rooms.filter(r => r.category === category);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'sports':
        return 'bg-cyan-50 text-cyan-700 border-cyan-100';
      case 'cultural':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'party':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'planning':
        return <Coffee className="w-4 h-4" />;
      case 'feedback':
        return <MessageCircle className="w-4 h-4" />;
      case 'discussion':
        return <Users className="w-4 h-4" />;
      default:
        return <Radio className="w-4 h-4" />;
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      setActiveRoomId(roomId);
      if (onJoinRoom) {
        onJoinRoom(roomId);
      }
      await joinRoomWithVoice(roomId);
      setIsMuted(false);
      toast.success('🎉 Joined room successfully!', {
        description: 'You can now chat and collaborate with others',
      });
    } catch (error: any) {
      toast.error('Failed to join room', {
        description: error.message,
      });
      setActiveRoomId(null);
    }
  };

  const handleRandomConnect = async () => {
    try {
      const room = await joinRandomRoom();
      setActiveRoomId(room.id);
      toast.success('🔮 Connected to a live room', {
        description: room.title,
      });
    } catch (error: any) {
      toast.error('No live rooms available', { description: error?.message || 'Try creating one!' });
    }
  };

  const livePresenceCount = Object.values(presence || {}).reduce((acc, entries: any) => {
    if (Array.isArray(entries)) return acc + entries.length;
    return acc;
  }, 0);

  const toggleMic = async () => {
    try {
      if (!localStream) {
        await startLocalAudio();
        setIsMuted(false);
        await offerToPeers();
      } else {
        const enabled = !isMuted;
        localStream.getAudioTracks().forEach((t) => (t.enabled = !enabled));
        setIsMuted(enabled);
      }
    } catch (err: any) {
      toast.error('Mic error', { description: err?.message });
    }
  };

  const hangUp = async () => {
    if (activeRoomId) {
      await leaveRoom(activeRoomId);
      setActiveRoomId(null);
    }
    await stopLocalAudio();
    setIsMuted(true);
  };

  const RemoteAudio = ({ stream }: { stream: MediaStream }) => {
    const ref = useRef<HTMLAudioElement | null>(null);
    useEffect(() => {
      if (ref.current) {
        ref.current.srcObject = stream;
        ref.current.play().catch(() => {});
      }
    }, [stream]);
    return <audio ref={ref} autoPlay playsInline className="hidden" />;
  };

  const LocalVideo = ({ stream }: { stream: MediaStream }) => {
    const ref = useRef<HTMLVideoElement | null>(null);
    useEffect(() => {
      if (ref.current) {
        ref.current.srcObject = stream;
        ref.current.play().catch(() => {});
      }
    }, [stream]);
    return (
      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900/70">
        <video ref={ref} autoPlay muted playsInline className="w-32 h-24 object-cover" />
        <div className="text-xs text-white/70 px-2 py-1">You</div>
      </div>
    );
  };

  const RemoteVideo = ({ stream, name }: { stream: MediaStream; name: string }) => {
    const ref = useRef<HTMLVideoElement | null>(null);
    useEffect(() => {
      if (ref.current) {
        ref.current.srcObject = stream;
        ref.current.play().catch(() => {});
      }
    }, [stream]);
    return (
      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900/70">
        <video ref={ref} autoPlay playsInline className="w-32 h-24 object-cover" />
        <div className="text-xs text-white/70 px-2 py-1 truncate">{name || 'Guest'}</div>
      </div>
    );
  };

  const handleLeaveRoom = async () => {
    if (!activeRoomId) return;
    
    try {
      await leaveRoom(activeRoomId);
      setActiveRoomId(null);
      setIsMuted(true);
      toast.success('Left room');
    } catch (error: any) {
      toast.error('Failed to leave room', {
        description: error.message,
      });
    }
  };

  return (
    <div className="mb-8">
      {/* Create Room Dialog */}
      <CreateRoomDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreateRoom={createRoom}
        category={category === 'all' ? 'sports' : category}
      />
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-5 h-5 text-indigo-600" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Vibe Rooms</h2>
          <Badge className="border border-slate-200 bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
            {filteredRooms.length} Active
          </Badge>
          {livePresenceCount > 0 && (
            <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-100 dark:border-emerald-500/30">
              Live {livePresenceCount} in voice/chat
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2 flex-wrap justify-end">
          <Button
            variant="outline"
            className="gap-2 rounded-full border-slate-200 text-slate-800 dark:text-slate-100"
            onClick={handleRandomConnect}
          >
            <Radio className="w-4 h-4" />
            Random Connect
          </Button>
          <Button className="gap-2 rounded-full px-4 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4" />
            Create Room
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-2 text-sm text-slate-600">Loading vibe rooms...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className={cardClass}>
          <div className="p-6 text-center">
            <p className="text-red-600 mb-2">Unable to load vibe rooms</p>
            <p className={`text-sm mb-4 ${mutedText}`}>
              There was an issue loading the vibe rooms. Please try refreshing the page.
            </p>
            <details className="text-left mb-4">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                Technical details
              </summary>
              <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded mt-2 overflow-auto text-left">
                {error}
              </pre>
            </details>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="rounded-full">
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredRooms.length === 0 && (
        <div className={cardClass}>
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Radio className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">No Active Rooms</h3>
            <p className={`${mutedText} mb-4`}>
              Be the first to create a vibe room and start connecting!
            </p>
            <Button 
              className="gap-2 rounded-full px-4 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="w-4 h-4" />
              Create First Room
            </Button>
          </div>
        </div>
      )}

      {/* Active Room Banner */}
      {activeRoomId && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className={cardClass}>
            <div className="p-4">
              <div className="grid md:grid-cols-3 gap-4 mb-3">
                <div className="md:col-span-2 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-xs ${mutedText}`}>You're in</p>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{rooms.find(r => r.id === activeRoomId)?.title}</h3>
                    <p className={`text-xs ${mutedText}`}>{rooms.find(r => r.id === activeRoomId)?.participants.length} people connected • Voice {voiceReady ? 'on' : 'off'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleMic}
                    className={`rounded-full ${isMuted ? 'border-red-200 text-red-700' : 'border-emerald-200 text-emerald-700'}`}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (videoEnabled ? disableVideo() : enableVideo())}
                    className="rounded-full"
                  >
                    {videoEnabled ? <Video className="w-4 h-4 text-emerald-600" /> : <VideoOff className="w-4 h-4 text-slate-600" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={hangUp}
                    className="rounded-full text-red-600 hover:bg-red-50"
                  >
                    Leave
                  </Button>
                </div>
              </div>

              {[...remoteStreams.entries()].map(([peerId, stream]) => (
                <RemoteAudio key={peerId} stream={stream} />
              ))}

              {(videoEnabled || remoteStreams.size > 0) && (
                <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {videoEnabled && localStream && <LocalVideo stream={localStream} />}
                  {[...remoteStreams.entries()].map(([peerId, stream]) => (
                    <RemoteVideo key={peerId} stream={stream} name={peerId} />
                  ))}
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-4 items-stretch">
                <div className="md:col-span-2 p-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Room Chat</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {chatMessages.length === 0 && (
                      <p className="text-xs text-slate-500">Say hello to everyone in the room.</p>
                    )}
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span className="font-medium text-slate-700 dark:text-slate-200">{msg.name || 'Guest'}</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Send a quick note to the room"
                      className="flex-1 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <Button
                      size="sm"
                      className="gap-1 rounded-full bg-indigo-600 hover:bg-indigo-700"
                      onClick={async () => {
                        if (!activeRoomId || !chatInput.trim()) return;
                        await sendChatMessage(activeRoomId, chatInput);
                        setChatInput('');
                      }}
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </Button>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
                  <p className="text-sm text-slate-900 dark:text-slate-100 mb-1">Room activity</p>
                  <p className={`text-xs ${mutedText}`}>Voice {voiceReady ? 'ready' : 'connecting'} • Video {videoEnabled ? 'on' : 'off'}</p>
                  <p className={`text-xs ${mutedText}`}>{livePresenceCount} people in room</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Rooms List */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredRooms.map((room, index) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={cardClass}>
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${getCategoryColor(room.category)} border rounded-full px-3 py-1 flex items-center gap-1`}>
                        {getTypeIcon(room.type)}
                        <span className="ml-1 capitalize">{room.type}</span>
                      </Badge>
                      {room.isPublic ? (
                        <Badge variant="outline" className="gap-1 rounded-full border-slate-200 text-slate-700 dark:text-slate-200">
                          <Globe className="w-3 h-3" />
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 rounded-full border-slate-200 text-slate-700 dark:text-slate-200">
                          <Lock className="w-3 h-3" />
                          Private
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{room.title}</h3>
                    <p className={`text-sm ${mutedText}`}>
                      Hosted by {room.host}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {room.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 text-sm ${mutedText}`}>
                    <div className="flex -space-x-2">
                      {[...Array(Math.min(3, room.participants.length))].map((_, i) => (
                        <div key={i} className={`w-7 h-7 rounded-full border ${getCategoryColor(room.category)} border-white dark:border-slate-900`} />
                      ))}
                    </div>
                    <span>{room.participants.length}/{room.maxParticipants}</span>
                  </div>

                  {activeRoomId === room.id ? (
                    <Badge className="bg-emerald-500 text-white rounded-full px-3">
                      <Radio className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleJoinRoom(room.id)}
                      className="gap-2 rounded-full px-4 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Radio className="w-4 h-4" />
                      Join
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}