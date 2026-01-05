import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Send,
  Plus,
  Users,
  Settings,
  Copy,
  Check,
  Share2,
  LogOut,
  MessageSquare,
  Volume2,
  VolumeX,
  ChevronDown,
  User,
  Clock,
  Globe,
  Lock,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useVibeRooms } from '../lib/hooks/useVibeRooms';
import { toast } from 'sonner';

interface DiscordRoomProps {
  category?: 'cultural' | 'sports' | 'party' | 'all';
  onClose?: () => void;
}

export function DiscordLikeRooms({ category = 'all', onClose }: DiscordRoomProps) {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [voiceVolume, setVoiceVolume] = useState(70);
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const {
    rooms,
    loading,
    error,
    createRoom,
    joinRoomWithVoice,
    leaveRoom,
    presence,
    localStream,
    remoteStreams,
    voiceReady,
    videoEnabled,
    enableVideo,
    disableVideo,
    chatMessages,
    sendChatMessage,
    startLocalMedia,
  } = useVibeRooms(category);

  const filteredRooms = category === 'all' ? rooms : rooms.filter((r) => r.category === category);
  const activeRoom = rooms.find((r) => r.id === activeRoomId);
  const roomMembers = activeRoom ? Object.keys(presence).length + 1 : 0;

  // Setup local video
  useEffect(() => {
    if (isVideoOn && localStream && videoRef.current) {
      videoRef.current.srcObject = localStream;
    }
  }, [isVideoOn, localStream]);

  // Setup remote audio
  useEffect(() => {
    if (remoteStreams.length > 0 && remoteAudioRef.current) {
      const audioTracks = remoteStreams
        .flatMap((stream) => stream.getAudioTracks());
      if (audioTracks.length > 0) {
        const combinedStream = new MediaStream(audioTracks);
        remoteAudioRef.current.srcObject = combinedStream;
      }
    }
  }, [remoteStreams]);

  const handleJoinRoom = async (roomId: string) => {
    try {
      setActiveRoomId(roomId);
      await joinRoomWithVoice(roomId);
      setIsMicMuted(false);
      toast.success('Joined room successfully! 🎉');
    } catch (error: any) {
      toast.error('Failed to join room', { description: error.message });
      setActiveRoomId(null);
    }
  };

  const handleLeaveRoom = async () => {
    if (!activeRoomId) return;
    try {
      await leaveRoom(activeRoomId);
      setActiveRoomId(null);
      setIsMicMuted(true);
      setIsVideoOn(false);
      toast.success('Left room');
    } catch (error: any) {
      toast.error('Failed to leave room', { description: error.message });
    }
  };

  const toggleMic = async () => {
    setIsMicMuted(!isMicMuted);
    if (!isMicMuted) {
      await startLocalMedia('audio');
    }
  };

  const toggleVideo = async () => {
    setIsVideoOn(!isVideoOn);
    if (!isVideoOn) {
      await startLocalMedia('video');
      await enableVideo();
    } else {
      await disableVideo();
    }
  };

  const handleSendMessage = async () => {
    if (!activeRoomId || !chatInput.trim()) return;
    try {
      await sendChatMessage(activeRoomId, chatInput);
      setChatInput('');
    } catch (error: any) {
      toast.error('Failed to send message');
    }
  };

  const copyInviteLink = () => {
    if (!activeRoomId) return;
    const inviteLink = `${window.location.origin}?join_room=${activeRoomId}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
    toast.success('Invite link copied! 📋');
  };

  if (!activeRoomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">🎙️ Vibe Rooms</h1>
              <p className="text-slate-400">Connect, chat, and collaborate with others in real-time</p>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Close
              </Button>
            )}
          </div>

          {/* Create Room Button */}
          <div className="mb-8">
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg px-6 py-2"
            >
              <Plus className="w-5 h-5" />
              Create Room
            </Button>
          </div>

          {/* Active Rooms Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-purple-500 transition-all cursor-pointer"
                onClick={() => handleJoinRoom(room.id)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/20 group-hover:to-pink-600/20 transition-all" />
                <div className="relative p-5">
                  {/* Room Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30 mb-3">
                        {room.category}
                      </Badge>
                      <h3 className="text-lg font-semibold text-white mb-1">{room.title}</h3>
                      <p className="text-sm text-slate-400">Hosted by {room.host}</p>
                    </div>
                    {room.isPublic ? (
                      <Globe className="w-5 h-5 text-slate-500" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Users className="w-4 h-4" />
                      <span>
                        {room.participants.length}/{room.maxParticipants}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {room.isActive && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-2 h-2 bg-emerald-500 rounded-full"
                        />
                      )}
                      <span className={room.isActive ? 'text-emerald-400' : 'text-slate-500'}>
                        {room.isActive ? 'Live' : 'Idle'}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {room.tags.slice(0, 2).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-slate-700 text-slate-200 text-xs rounded-full"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Join Button */}
                  <Button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg">
                    Join Room
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredRooms.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No active rooms yet</p>
              <p className="text-slate-500 text-sm mt-2">Be the first to create one!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active Room View - Discord Style
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
              {activeRoom?.title.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white"># {activeRoom?.title}</h1>
              <p className="text-sm text-slate-400">
                {roomMembers} member{roomMembers !== 1 ? 's' : ''} connected
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={copyInviteLink}
              className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              title="Copy invite link"
            >
              {copiedInvite ? (
                <Check className="w-5 h-5 text-emerald-500" />
              ) : (
                <Share2 className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden gap-4 p-4">
        {/* Left Side - Video & Members (Large) */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Video Grid - Responsive Layout */}
          <div className="flex-1 bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden">
            <div className={`w-full h-full grid gap-2 p-2 ${
              remoteStreams.size === 0 ? 'grid-cols-1' :
              remoteStreams.size === 1 ? 'grid-cols-2' :
              remoteStreams.size === 2 ? 'grid-cols-2' :
              remoteStreams.size <= 4 ? 'grid-cols-2' :
              'grid-cols-3'
            }`}>
              {/* Local Video */}
              {isVideoOn && (
                <div className="relative bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center min-h-[200px]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white font-semibold">
                    You
                  </div>
                </div>
              )}

              {/* Remote Videos */}
              {Array.from(remoteStreams.entries()).map(([userId, stream], index) => (
                <div key={userId} className="relative bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center min-h-[200px]">
                  <video
                    autoPlay
                    playsInline
                    ref={(video) => {
                      if (video) {
                        (video as any).srcObject = stream;
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white font-semibold">
                    Participant {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={toggleMic}
              className={`gap-2 rounded-lg transition-all ${
                isMicMuted
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              } text-white`}
            >
              {isMicMuted ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              {isMicMuted ? 'Unmute' : 'Mute'}
            </Button>
            <Button
              onClick={toggleVideo}
              className={`gap-2 rounded-lg transition-all ${
                isVideoOn
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-slate-700 hover:bg-slate-600'
              } text-white`}
            >
              {isVideoOn ? (
                <Video className="w-4 h-4" />
              ) : (
                <VideoOff className="w-4 h-4" />
              )}
              {isVideoOn ? 'Camera On' : 'Camera'}
            </Button>
          </div>

          {/* Leave Button */}
          <Button
            onClick={handleLeaveRoom}
            className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            <PhoneOff className="w-4 h-4" />
            Leave Room
          </Button>

          {/* Members List */}
          <div className="flex-1 bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                Members {roomMembers}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {Object.entries(presence).map(([userId, user]: [string, any]) => (
                <motion.button
                  key={userId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() =>
                    setSelectedMember(selectedMember === userId ? null : userId)
                  }
                  className="w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm text-white font-medium truncate">
                      {user.name || 'Guest'}
                    </span>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="ml-auto w-2 h-2 bg-emerald-500 rounded-full"
                    />
                  </div>
                  {selectedMember === userId && (
                    <p className="text-xs text-slate-400 ml-10">
                      {user.email || 'No email'}
                    </p>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Room Info */}
          <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-4">
            <h4 className="text-sm font-semibold text-white mb-3">Room Info</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Category:</span>
                <span className="text-white capitalize">{activeRoom?.category}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Host:</span>
                <span className="text-white">{activeRoom?.host}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Type:</span>
                <span className="text-white capitalize">{activeRoom?.type}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Status:</span>
                <span
                  className={activeRoom?.isActive ? 'text-emerald-400' : 'text-slate-500'}
                >
                  {activeRoom?.isActive ? 'Live' : 'Idle'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Chat Area (Small) */}
        <div className="w-96 flex flex-col bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500">Be the first to say hello! 👋</p>
                </div>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group"
                >
                  <div className="flex gap-3 hover:bg-slate-800/50 p-2 rounded-lg transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {msg.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-white text-sm">{msg.name || 'Guest'}</span>
                        <span className="text-xs text-slate-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-200 text-sm break-words">{msg.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-slate-800 p-4">
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Say something nice... 💬"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Button
                onClick={handleSendMessage}
                className="gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
