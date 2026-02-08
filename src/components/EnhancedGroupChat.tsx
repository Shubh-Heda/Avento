// ============================================
// Enhanced Group Chat with Real Backend
// Persistent messages with Supabase
// ============================================
import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Send,
  Users,
  Plus,
  MoreVertical,
  Search,
  MessageCircle,
  X,
  Shield,
  Flag,
  Trash2
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import chatService from '../services/chatService';
import { firebaseAuth } from '../services/firebaseService';
import type { ChatRoom, ChatMessage, ChatModerationAction, ChatMemberRole, ChatRoomMember, ChatPinnedMessage } from '../services/chatService';
import { validateMessageContent, MessageRateLimiter } from '../utils/contentModeration';
import { toast } from 'sonner';

interface EnhancedGroupChatProps {
  onNavigate: (page: string) => void;
  matchId?: string | null;
}

export function EnhancedGroupChat({ onNavigate, matchId }: EnhancedGroupChatProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberRole, setMemberRole] = useState<ChatMemberRole | null>(null);
  const [moderationActions, setModerationActions] = useState<ChatModerationAction[]>([]);
  const [members, setMembers] = useState<ChatRoomMember[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<ChatPinnedMessage[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const rateLimiterRef = useRef(new MessageRateLimiter(5, 10000));

  // Load rooms
  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      // Get current user from Firebase
      const user = firebaseAuth.getCurrentUser();
      setCurrentUserId(user?.uid ?? null);
      if (!user) {
        // For demo purposes, show mock rooms if not authenticated
        setRooms([
          {
            id: '1',
            name: 'Weekend Warriors',
            room_type: 'custom',
            member_count: 12,
            last_message_at: new Date().toISOString(),
            unread_count: 0
          } as ChatRoom,
          {
            id: '2',
            name: 'Friday Night Football',
            room_type: 'match',
            member_count: 10,
            last_message_at: new Date().toISOString(),
            unread_count: 3
          } as ChatRoom
        ]);
        if (!selectedRoom) setSelectedRoom(rooms[0]);
        setLoading(false);
        return;
      }

      const userRooms = await chatService.getRooms(user.id);
      setRooms(userRooms);

      // Auto-select first room or match room
      if (matchId) {
        const matchRoom = userRooms.find(r => r.related_id === matchId);
        if (matchRoom) setSelectedRoom(matchRoom);
      } else if (userRooms.length > 0 && !selectedRoom) {
        setSelectedRoom(userRooms[0]);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      // Show mock data on error
      setRooms([
        {
          id: '1',
          name: 'Weekend Warriors',
          room_type: 'custom',
          member_count: 12,
          last_message_at: new Date().toISOString(),
          unread_count: 0
        } as ChatRoom
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Load messages for selected room
  useEffect(() => {
    if (!selectedRoom) return;

    const loadMessages = async () => {
      try {
        const roomMessages = await chatService.getMessages(selectedRoom.id);
        setMessages(roomMessages);
        scrollToBottom();
        
        // Mark as read
        await chatService.markAsRead(selectedRoom.id);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();

    const loadModerationContext = async () => {
      try {
        const [role, actions, roomMembers, pinned] = await Promise.all([
          chatService.getMemberRole(selectedRoom.id),
          chatService.getModerationActions(selectedRoom.id),
          chatService.getMembers(selectedRoom.id),
          chatService.getPinnedMessages(selectedRoom.id)
        ]);
        setMemberRole(role);
        setModerationActions(actions);
        setMembers(roomMembers);
        setPinnedMessages(pinned);
      } catch (error) {
        console.error('Error loading moderation context:', error);
      }
    };

    loadModerationContext();

    // Subscribe to real-time updates
    const unsubscribe = chatService.subscribeToRoom(selectedRoom.id, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      scrollToBottom();
      
      // Mark as read
      chatService.markAsRead(selectedRoom.id);
    });

    return () => {
      unsubscribe();
    };
  }, [selectedRoom]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedRoom || !currentUserId) return;

    // Rate limit check
    if (!rateLimiterRef.current.canSend(currentUserId)) {
      const waitTime = Math.ceil(rateLimiterRef.current.getWaitTime(currentUserId) / 1000);
      toast.error(`Slow down! Wait ${waitTime}s before sending another message.`);
      return;
    }

    // Content validation
    const validation = validateMessageContent(messageInput);
    if (!validation.valid) {
      toast.error(validation.reason || 'Invalid message');
      if (validation.filtered) {
        const useFiltered = window.confirm(`Message contains inappropriate content. Send filtered version?\n\n${validation.filtered}`);
        if (!useFiltered) return;
        setMessageInput(validation.filtered);
      }
      return;
    }

    try {
      const newMessage = await chatService.sendMessage(selectedRoom.id, messageInput);
      setMessageInput('');
      // Message will be added via real-time subscription
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Create room
  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;

    try {
      const newRoom = await chatService.createRoom({
        name: roomName,
        room_type: 'custom',
        is_private: false
      });
      
      setRooms(prev => [newRoom, ...prev]);
      setSelectedRoom(newRoom);
      setShowCreateRoom(false);
      setRoomName('');
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room');
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const canModerate = memberRole === 'admin' || memberRole === 'moderator';

  const handleDeleteMessage = async (message: ChatMessage) => {
    if (!selectedRoom) return;
    const confirmed = window.confirm('Delete this message for everyone?');
    if (!confirmed) return;
    try {
      await chatService.deleteMessage(selectedRoom.id, message.id, 'moderator_delete');
      setMessages(prev => prev.filter(m => m.id !== message.id));
      const actions = await chatService.getModerationActions(selectedRoom.id);
      setModerationActions(actions);
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  const handleReportMessage = async (message: ChatMessage) => {
    if (!selectedRoom) return;
    const reason = window.prompt('Report reason (e.g., abuse, spam, harassment):');
    if (!reason) return;
    try {
      await chatService.reportMessage(selectedRoom.id, message.id, reason);
      toast.success('Report submitted to moderators');
    } catch (error) {
      console.error('Error reporting message:', error);
      toast.error('Failed to submit report');
    }
  };

  const handlePinMessage = async (message: ChatMessage) => {
    if (!selectedRoom || !canModerate) return;
    try {
      await chatService.pinMessage(selectedRoom.id, message.id);
      const pinned = await chatService.getPinnedMessages(selectedRoom.id);
      setPinnedMessages(pinned);
      toast.success('Message pinned');
    } catch (error) {
      console.error('Error pinning message:', error);
      toast.error('Failed to pin message');
    }
  };

  const handleUnpinMessage = async (pinnedId: string, messageId: string) => {
    if (!selectedRoom || !canModerate) return;
    try {
      await chatService.unpinMessage(selectedRoom.id, messageId);
      setPinnedMessages(prev => prev.filter(p => p.id !== pinnedId));
      toast.success('Message unpinned');
    } catch (error) {
      console.error('Error unpinning message:', error);
      toast.error('Failed to unpin message');
    }
  };

  const handleSearch = async () => {
    if (!selectedRoom || !searchQuery.trim()) return;
    try {
      const results = await chatService.searchMessages(selectedRoom.id, searchQuery);
      setSearchResults(results);
      setShowSearch(true);
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Search failed');
    }
  };

  const handleKickUser = async (userId: string, userName: string) => {
    if (!selectedRoom || !canModerate) return;
    const confirmed = window.confirm(`Kick ${userName} from the room?`);
    if (!confirmed) return;
    try {
      await chatService.kickUser(selectedRoom.id, userId, 'kicked_by_moderator');
      setMembers(prev => prev.filter(m => m.user_id !== userId));
      toast.success(`${userName} was kicked`);
    } catch (error) {
      console.error('Error kicking user:', error);
      toast.error('Failed to kick user');
    }
  };

  const handleMuteUser = async (userId: string, userName: string) => {
    if (!selectedRoom || !canModerate) return;
    try {
      await chatService.muteUser(selectedRoom.id, userId, 'muted_by_moderator');
      setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, is_muted: true } : m));
      toast.success(`${userName} was muted`);
    } catch (error) {
      console.error('Error muting user:', error);
      toast.error('Failed to mute user');
    }
  };

  const handlePromoteModerator = async (userId: string, userName: string) => {
    if (!selectedRoom || memberRole !== 'admin') return;
    try {
      await chatService.promoteToModerator(selectedRoom.id, userId);
      setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role: 'moderator' } : m));
      toast.success(`${userName} promoted to moderator`);
    } catch (error) {
      console.error('Error promoting user:', error);
      toast.error('Failed to promote user');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-slate-50">
      {/* Sidebar - Chat Rooms */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              onClick={() => onNavigate('dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              size="sm"
              onClick={() => setShowCreateRoom(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              New
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search chats..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className={`w-full p-4 border-b text-left transition-colors ${
                selectedRoom?.id === room.id
                  ? 'bg-cyan-50 border-l-4 border-l-cyan-600'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-slate-400" />
                  <span className="font-semibold text-slate-900">{room.name}</span>
                </div>
                {(room.unread_count || 0) > 0 && (
                  <Badge className="bg-cyan-600 text-white">
                    {room.unread_count}
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  {room.member_count} members
                </span>
                <span className="text-xs text-slate-400">
                  {formatTime(room.last_message_at)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedRoom ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b p-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">{selectedRoom.name}</h2>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <Users className="w-3 h-3" />
                {selectedRoom.member_count} members
                {memberRole && (
                  <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {memberRole}
                  </Badge>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="w-4 h-4" />
                Search
              </Button>
              {canModerate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowMembers(!showMembers)}
                >
                  <Users className="w-4 h-4" />
                  Manage
                </Button>
              )}
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Moderation Actions */}
          {canModerate && moderationActions.length > 0 && (
            <div className="bg-slate-50 border-b px-4 py-2 flex gap-2 overflow-x-auto">
              {moderationActions.map((action) => (
                <Badge key={action.id} variant="outline" className="text-xs whitespace-nowrap">
                  {action.action_type} · {formatTime(action.created_at)}
                </Badge>
              ))}
            </div>
          )}

          {/* Pinned Messages */}
          {pinnedMessages.length > 0 && (
            <div className="bg-amber-50 border-b px-4 py-2 flex flex-col gap-2">
              <div className="text-xs font-semibold text-amber-800 flex items-center gap-2">
                📌 Pinned Messages
              </div>
              {pinnedMessages.map((pinned) => (
                <div key={pinned.id} className="flex items-start gap-2 text-sm">
                  <p className="flex-1 text-slate-700 line-clamp-1">
                    {pinned.message?.content || 'Message not found'}
                  </p>
                  {canModerate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => handleUnpinMessage(pinned.id, pinned.message_id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Search Panel */}
          {showSearch && (
            <div className="bg-white border-b p-4">
              <div className="flex gap-2 mb-3">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search messages..."
                  className="flex-1"
                />
                <Button onClick={handleSearch}>Search</Button>
                <Button variant="outline" onClick={() => { setShowSearch(false); setSearchResults([]); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {searchResults.map((msg) => (
                    <div key={msg.id} className="text-sm p-2 bg-slate-50 rounded">
                      <span className="font-semibold">{msg.sender?.full_name}: </span>
                      <span className="text-slate-700">{msg.content}</span>
                      <span className="text-xs text-slate-400 ml-2">{formatTime(msg.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <img
                  src={message.sender?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender_id}`}
                  alt={message.sender?.full_name}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {message.sender?.full_name || 'Unknown'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm border">
                    <p className="text-slate-900 whitespace-pre-wrap">
                      {message.is_deleted ? 'This message was removed.' : message.content}
                    </p>
                    {message.media_url && !message.is_deleted && (
                      <img
                        src={message.media_url}
                        alt="attachment"
                        className="mt-2 rounded-lg max-w-sm"
                      />
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                      <button
                        className="flex items-center gap-1 hover:text-slate-900"
                        onClick={() => handleReportMessage(message)}
                      >
                        <Flag className="w-3 h-3" />
                        Report
                      </button>
                      {canModerate && !message.is_deleted && (
                        <button
                          className="flex items-center gap-1 hover:text-amber-600"
                          onClick={() => handlePinMessage(message)}
                        >
                          📌 Pin
                        </button>
                      )}
                      {(canModerate || message.sender_id === currentUserId) && !message.is_deleted && (
                        <button
                          className="flex items-center gap-1 hover:text-red-600"
                          onClick={() => handleDeleteMessage(message)}
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t p-4">
            <div className="flex items-center gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Select a chat to start messaging</p>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Create New Chat Room</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateRoom(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <Input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name..."
              className="mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateRoom(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRoom}
                disabled={!roomName.trim()}
                className="flex-1"
              >
                Create Room
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Member Management Panel */}
      {showMembers && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Room Members</h3>
                <p className="text-sm text-slate-500">{members.length} total members</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowMembers(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_id}`}
                        alt={member.user?.full_name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-semibold">{member.user?.full_name || 'Unknown'}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={member.role === 'admin' ? 'default' : member.role === 'moderator' ? 'secondary' : 'outline'}>
                            {member.role}
                          </Badge>
                          {member.is_muted && (
                            <Badge variant="destructive" className="text-xs">Muted</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {canModerate && member.user_id !== currentUserId && (
                      <div className="flex gap-2">
                        {memberRole === 'admin' && member.role === 'member' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePromoteModerator(member.user_id, member.user?.full_name || 'User')}
                          >
                            Promote
                          </Button>
                        )}
                        {!member.is_muted && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMuteUser(member.user_id, member.user?.full_name || 'User')}
                          >
                            Mute
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleKickUser(member.user_id, member.user?.full_name || 'User')}
                        >
                          Kick
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
