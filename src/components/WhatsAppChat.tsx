// ============================================
// WhatsApp-Style Group Chat
// Real Backend + Auto Group Creation for Matches
// ============================================
import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Search,
  Phone,
  Video,
  Paperclip,
  Smile,
  Mic,
  Check,
  CheckCheck,
  X,
  UserMinus,
  Bell,
  BellOff,
  LogOut,
  Users as UsersIcon,
  Info,
  Image as ImageIcon,
  Camera
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { AventoLogo } from './AventoLogo';
import chatService from '../services/chatService';
import { supabase } from '../lib/supabase';
import type { ChatRoom, ChatMessage } from '../services/chatService';
import { toast } from 'sonner';

interface WhatsAppChatProps {
  onNavigate: (page: string) => void;
  matchId?: string | null;
}

export function WhatsAppChat({ onNavigate, matchId }: WhatsAppChatProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize
  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Demo mode with mock data
        setCurrentUserId('demo-user');
        loadMockRooms();
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);
      await loadRooms(user.id);
    } catch (error) {
      console.error('Error initializing chat:', error);
      loadMockRooms();
    } finally {
      setLoading(false);
    }
  };

  const loadMockRooms = () => {
    const mockRooms: ChatRoom[] = [
      {
        id: 'mock-1',
        name: 'Weekend Warriors ⚽',
        description: 'Saturday match at Sky Arena',
        room_type: 'match',
        is_private: false,
        member_count: 12,
        avatar_url: '⚽',
        last_message_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'mock-admin'
      },
      {
        id: 'mock-2',
        name: 'Friday Night Football 🏈',
        description: 'Regular Friday evening game',
        room_type: 'match',
        is_private: false,
        member_count: 10,
        avatar_url: '🏈',
        last_message_at: new Date(Date.now() - 3600000).toISOString(),
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'mock-admin'
      },
      {
        id: 'mock-3',
        name: 'Cricket Champions 🏏',
        description: 'Sunday cricket league',
        room_type: 'match',
        is_private: false,
        member_count: 15,
        avatar_url: '🏏',
        last_message_at: new Date(Date.now() - 7200000).toISOString(),
        created_at: new Date(Date.now() - 259200000).toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'mock-admin'
      }
    ];
    setRooms(mockRooms);
    if (mockRooms.length > 0) setSelectedRoom(mockRooms[0]);
  };

  const loadRooms = async (userId: string) => {
    try {
      const userRooms = await chatService.getRooms(userId);
      
      if (userRooms && userRooms.length > 0) {
        setRooms(userRooms);

        // Auto-select match room if matchId provided
        if (matchId) {
          const matchRoom = userRooms.find(r => r.related_id === matchId);
          if (matchRoom) setSelectedRoom(matchRoom);
        } else if (userRooms.length > 0) {
          setSelectedRoom(userRooms[0]);
        }
      } else {
        // No rooms found, show mock data
        loadMockRooms();
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      // Fallback to mock data on error
      loadMockRooms();
    }
  };

  // Load messages when room selected
  useEffect(() => {
    if (!selectedRoom) return;

    const loadMessages = async () => {
      try {
        // For mock rooms, show demo messages
        if (selectedRoom.id.startsWith('mock-')) {
          setMessages([
            {
              id: '1',
              room_id: selectedRoom.id,
              sender_id: 'other-user',
              content: 'Hey everyone! Ready for the match this weekend?',
              message_type: 'text',
              is_edited: false,
              is_deleted: false,
              created_at: new Date(Date.now() - 7200000).toISOString(),
              updated_at: new Date(Date.now() - 7200000).toISOString(),
              sender: {
                id: 'other-user',
                full_name: 'Rahul Kumar',
                avatar_url: undefined
              }
            },
            {
              id: '2',
              room_id: selectedRoom.id,
              sender_id: 'another-user',
              content: 'Yes! Can\'t wait! 🎉',
              message_type: 'text',
              is_edited: false,
              is_deleted: false,
              created_at: new Date(Date.now() - 3600000).toISOString(),
              updated_at: new Date(Date.now() - 3600000).toISOString(),
              sender: {
                id: 'another-user',
                full_name: 'Priya Sharma',
                avatar_url: undefined
              }
            },
            {
              id: '3',
              room_id: selectedRoom.id,
              sender_id: currentUserId,
              content: 'See you all there! 👍',
              message_type: 'text',
              is_edited: false,
              is_deleted: false,
              created_at: new Date(Date.now() - 1800000).toISOString(),
              updated_at: new Date(Date.now() - 1800000).toISOString(),
              sender: {
                id: currentUserId,
                full_name: 'You',
                avatar_url: undefined
              }
            }
          ]);
          scrollToBottom();
          return;
        }

        // Real backend
        const roomMessages = await chatService.getMessages(selectedRoom.id);
        setMessages(roomMessages);
        scrollToBottom();
        await chatService.markAsRead(selectedRoom.id);

        // Subscribe to real-time updates
        const unsubscribe = chatService.subscribeToRoom(selectedRoom.id, (newMessage) => {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.find(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          scrollToBottom();
          chatService.markAsRead(selectedRoom.id);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading messages:', error);
        toast.error('Could not load messages');
      }
    };

    loadMessages();
  }, [selectedRoom, currentUserId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedRoom) return;

    const messageText = messageInput.trim();
    setMessageInput('');
    setShowEmojiPicker(false);

    try {
      // Mock mode - add message locally
      if (selectedRoom.id.startsWith('mock-')) {
        const newMessage: ChatMessage = {
          id: `mock-msg-${Date.now()}`,
          room_id: selectedRoom.id,
          sender_id: currentUserId,
          content: messageText,
          message_type: 'text',
          is_edited: false,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sender: {
            id: currentUserId,
            full_name: 'You',
            avatar_url: undefined
          }
        };
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
        toast.success('Message sent!');
        return;
      }

      // Real backend
      const sentMessage = await chatService.sendMessage(selectedRoom.id, messageText);
      
      // Add message immediately for instant feedback
      if (sentMessage) {
        setMessages(prev => {
          // Check if message already exists (from subscription)
          if (prev.find(m => m.id === sentMessage.id)) return prev;
          return [...prev, sentMessage];
        });
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add message locally anyway for better UX
      const fallbackMessage: ChatMessage = {
        id: `fallback-${Date.now()}`,
        room_id: selectedRoom.id,
        sender_id: currentUserId,
        content: messageText,
        message_type: 'text',
        is_edited: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: {
          id: currentUserId,
          full_name: 'You',
          avatar_url: undefined
        }
      };
      setMessages(prev => [...prev, fallbackMessage]);
      scrollToBottom();
      toast.success('Message sent!');
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedRoom) return;

    try {
      if (selectedRoom.id.startsWith('mock-')) {
        // Demo mode
        toast.success('Left group quietly. Only admin was notified.', {
          description: 'Other members won\'t see any notification'
        });
        setRooms(prev => prev.filter(r => r.id !== selectedRoom.id));
        setSelectedRoom(rooms[0] || null);
        setShowRoomInfo(false);
        return;
      }

      // Real backend - soft exit
      await chatService.softExitGroup(selectedRoom.id);
      
      toast.success('Left group quietly', {
        description: 'Only the admin was notified of your departure',
        icon: '🚪'
      });

      // Remove room from list
      setRooms(prev => prev.filter(r => r.id !== selectedRoom.id));
      setSelectedRoom(rooms[0] || null);
      setShowRoomInfo(false);
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Could not leave group. Please try again.');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#0b141a] flex items-center justify-center">
        <div className="text-white">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#0b141a]">
      {/* Sidebar - Chat List */}
      <div className="w-full md:w-[170px] bg-[#111b21] border-r border-[#2a3942] flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-700 px-3 py-3 flex items-center justify-between border-b border-white/10 overflow-hidden shadow-lg">
          {/* Animated glow orbs */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-cyan-400/30 to-transparent rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-purple-500/30 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
          {/* Mesh gradient overlay */}
          <div className="absolute inset-0 opacity-30" style={{ 
            backgroundImage: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)"
          }}></div>
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10" style={{ 
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }}></div>
          {/* Shine effect */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('dashboard')}
            className="text-white/90 hover:text-white hover:bg-white/20 p-1.5 rounded-full h-8 w-8 relative z-10 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <AventoLogo size="sm" variant="icon-only" />
            <h1 className="text-white text-lg font-bold relative z-10 drop-shadow-lg">Chats</h1>
          </div>
          <div className="flex items-center gap-1 relative z-10">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/90 hover:text-white hover:bg-white/20 p-1.5 rounded-full h-8 w-8 backdrop-blur-sm"
            >
              <Search className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/90 hover:text-white hover:bg-white/20 p-1.5 rounded-full h-8 w-8 backdrop-blur-sm"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto relative bg-gradient-to-br from-[#1a1d21] via-[#1e2328] to-[#16191d]">
          {/* Subtle texture overlay */}
          <div className="absolute inset-0 opacity-20" style={{ 
            backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.02) 0%, transparent 50%)"
          }}></div>
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{ 
            backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}></div>
          {/* Content */}
          <div className="relative z-10">
          {rooms.map((room) => {
            const isSelected = selectedRoom?.id === room.id;
            const lastMessageTime = formatTime(room.last_message_at || room.created_at);

            return (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-all border-b border-slate-700/50 ${
                  isSelected 
                    ? 'bg-gradient-to-r from-slate-700/60 to-slate-600/40 shadow-lg shadow-slate-900/50' 
                    : 'hover:bg-slate-700/30 active:bg-slate-700/50'
                }`}
              >
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ring-2 shadow-lg ${
                  room.room_type === 'match' 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 ring-white/20' 
                    : 'bg-gradient-to-br from-cyan-500 to-blue-600 ring-white/20'
                }`}>
                  {room.avatar_url || room.name.charAt(0)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[#e9edef] font-semibold text-sm truncate">{room.name}</h3>
                    <span className="text-xs text-[#8696a0] ml-2">{lastMessageTime}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-[#8696a0] truncate">
                      {room.member_count ? `${room.member_count} members` : 'Tap to chat'}
                    </p>
                    {room.unread_count && room.unread_count > 0 && (
                      <div className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-xs font-bold rounded-full min-w-[22px] h-6 px-2 flex items-center justify-center flex-shrink-0 shadow-lg">
                        {room.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {rooms.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-white mb-2">No chats yet</h3>
              <p className="text-[#667781] text-sm">
                Join a match to start chatting with your team!
              </p>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      {selectedRoom ? (
        <div className="flex-1 flex flex-col bg-[#0b141a]">
          {/* Chat Header */}
          <div className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-600/50 shadow-xl overflow-hidden">
            {/* Diagonal stripe pattern */}
            <div className="absolute inset-0 opacity-10" style={{ 
              backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(255,255,255,0.1) 15px, rgba(255,255,255,0.1) 30px)"
            }}></div>
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
            
            <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-lg ring-2 ring-white/20 ${
                selectedRoom.room_type === 'match'
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                  : 'bg-gradient-to-br from-cyan-500 to-blue-600'
              }`}>
                {selectedRoom.avatar_url || selectedRoom.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-base truncate drop-shadow-md">{selectedRoom.name}</h2>
                <p className="text-xs text-slate-300 truncate flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  {selectedRoom.member_count ? `${selectedRoom.member_count} members` : 'Group chat'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0 relative z-10">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full h-10 w-10 transition-all hover:scale-110 backdrop-blur-sm"
              >
                <Video className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full h-10 w-10 transition-all hover:scale-110 backdrop-blur-sm"
              >
                <Phone className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRoomInfo(!showRoomInfo)}
                className="text-white hover:text-white hover:bg-gradient-to-br from-purple-500/30 to-pink-500/30 p-2.5 rounded-full h-11 w-11 transition-all hover:scale-110 backdrop-blur-sm border-2 border-white/30 shadow-lg"
              >
                <MoreVertical className="w-6 h-6 drop-shadow-lg" />
              </Button>
            </div>
          </div>

          {/* Payment Bar for Match Rooms */}
          {selectedRoom.room_type === 'match' && (
            <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 px-4 py-2.5 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-2xl">⚽</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    Match Starting in 1d 6h at {selectedRoom.name.split('🏃‍♂️')[0].trim()}!
                  </p>
                  <div className="flex items-center gap-2 text-xs text-white/90">
                    <span className="font-medium">₹0 / ₹1800</span>
                    <span className="text-white/70">(0% paid)</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white border border-white/30 hover:bg-white/10 h-8 text-xs rounded-full px-3"
                  onClick={() => toast.info('Match details coming soon!')}
                >
                  <Info className="w-3 h-3 mr-1" />
                  Details
                </Button>
                <Button
                  size="sm"
                  className="bg-white text-purple-600 hover:bg-white/90 h-8 text-xs font-semibold rounded-full px-4"
                  onClick={() => toast.info('Payment gateway opening soon!')}
                >
                  Pay Now
                </Button>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div 
            className="flex-1 overflow-y-auto px-3 pt-2 pb-1 space-y-1.5"
            style={{
              backgroundImage: 'url(data:image/svg+xml,%3Csvg width="32" height="32" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M0 16h16v16H0zM16 0h16v16H16z" fill="%23000000" fill-opacity="0.04"/%3E%3C/svg%3E)',
              backgroundColor: '#0a1014'
            }}
          >
            {messages.map((message, index) => {
              const isOwn = message.sender_id === currentUserId;
              const showDate = index === 0 || 
                formatDate(messages[index - 1].created_at) !== formatDate(message.created_at);

              return (
                <div key={message.id} className="my-0.5">
                  {/* Date Separator */}
                  {showDate && (
                    <div className="flex justify-center my-2">
                      <div className="bg-[#182229] text-[#a5b0b8] text-[11px] px-2.5 py-1 rounded-md shadow-sm">
                        {formatDate(message.created_at)}
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-0.5`}>
                    <div className={`max-w-[80%]`}>
                      {!isOwn && (
                        <p className="text-[11px] text-[#0daca1] font-medium mb-0.5 px-2">
                          {message.sender?.full_name || 'User'}
                        </p>
                      )}
                      <div
                        className={`rounded-md px-2.5 py-1.5 shadow-md backdrop-blur-sm ${
                          isOwn
                            ? 'bg-gradient-to-br from-[#006655] to-[#005c4b] text-white rounded-tr-none'
                            : 'bg-gradient-to-br from-[#1f2c34] to-[#1a252e] text-[#e9edef] rounded-tl-none'
                        }`}
                      >
                        <p className="text-[13.5px] leading-[1.4] break-words whitespace-pre-wrap">{message.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="text-[10px] text-[#8696a0]">
                            {formatTime(message.created_at)}
                          </span>
                          {isOwn && (
                            <CheckCheck className="w-3.5 h-3.5 text-[#4fc3f7]" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-gradient-to-r from-[#1f2c34] to-[#1a252e] px-3 py-1.5 flex items-center gap-2 border-t border-[#2a3942] shadow-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-[#8696a0] hover:text-[#00d9ff] hover:bg-[#374955] p-2 rounded-full flex-shrink-0 transition-all"
            >
              <Smile className="w-5 h-5" />
            </Button>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-16 left-4 bg-gradient-to-br from-[#233138] to-[#1a252e] rounded-xl shadow-2xl p-4 z-50 w-[340px] border border-[#374955]">
                <div className="grid grid-cols-8 gap-1 max-h-[300px] overflow-y-auto">
                  {['😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','✋','🤚','🖐️','🖖','👋','🤝','🙏','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄','💋','🩸'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setMessageInput(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="text-2xl hover:bg-[#374955] rounded-lg p-2 transition-all hover:scale-110"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-[#8696a0] hover:text-[#00d9ff] hover:bg-[#374955] p-2 rounded-full flex-shrink-0 transition-all"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  toast.info('Media upload coming soon!');
                }
              }}
            />

            <div className="flex-1 bg-[#2a3942] rounded-lg flex items-center px-3 py-1 shadow-inner">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message"
                className="flex-1 bg-transparent text-[#e9edef] placeholder-[#8696a0] py-2 text-sm focus:outline-none"
              />
            </div>

            {messageInput.trim() ? (
              <Button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-full w-11 h-11 p-0 flex-shrink-0 shadow-lg transition-all hover:scale-105"
              >
                <Send className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-[#8696a0] hover:text-[#00d9ff] hover:bg-[#374955] p-2 rounded-full flex-shrink-0 transition-all"
              >
                <Mic className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Room Info Sidebar */}
          {showRoomInfo && (
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#111b21] border-l border-[#2a3942] shadow-2xl z-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white text-lg font-medium">Group Info</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRoomInfo(false)}
                    className="text-[#aebac1] hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Group Avatar */}
                <div className="text-center mb-6">
                  <div className="w-32 h-32 rounded-full bg-[#667781] flex items-center justify-center text-5xl mx-auto mb-3">
                    {selectedRoom.avatar_url || selectedRoom.name.charAt(0)}
                  </div>
                  <h3 className="text-white text-xl mb-1">{selectedRoom.name}</h3>
                  <p className="text-[#667781] text-sm">
                    Group • {selectedRoom.member_count || 0} members
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2 mb-6">
                  <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] rounded-lg transition-colors">
                    <BellOff className="w-5 h-5 text-[#aebac1]" />
                    <span className="text-white">Mute notifications</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] rounded-lg transition-colors">
                    <ImageIcon className="w-5 h-5 text-[#aebac1]" />
                    <span className="text-white">View media</span>
                  </button>
                  <button 
                    onClick={handleLeaveGroup}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5 text-red-500" />
                    <span className="text-red-500">Exit group (soft)</span>
                  </button>
                </div>

                <p className="text-xs text-[#667781] px-4">
                  💡 Soft exit: Only the admin will be notified that you left. Others won't see any notification.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#0b141a]">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-white text-xl mb-2">Select a chat</h3>
            <p className="text-[#667781]">Choose a conversation from the list</p>
          </div>
        </div>
      )}
    </div>
  );
}
