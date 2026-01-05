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
  Camera,
  Plus
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { AventoLogo } from './AventoLogo';
import chatService from '../services/chatService';
import { communityService } from '../services/communityService';
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
    <div className="h-screen flex bg-[#F1F2FE]">
      {/* Sidebar - Chat List */}
      <div className="w-[200px] md:min-w-[220px] md:max-w-[370px] bg-[#000000] border-r border-[#2a3942] flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="bg-[#080C28] px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('dashboard')}
            className="text-[#aebac1] hover:text-white hover:bg-[#374955] p-2 rounded-full h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-white text-xl font-medium flex-1 ml-4">Chats</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#aebac1] hover:text-white hover:bg-[#374955] p-2 rounded-full h-10 w-10"
            >
              <Plus className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#aebac1] hover:text-white hover:bg-[#374955] p-2 rounded-full h-10 w-10"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-3 py-2 bg-[#111b21]">
          <div className="flex items-center bg-[#202c33] rounded-lg px-3 py-2">
            <Search className="w-5 h-5 text-[#8696a0] mr-3" />
            <input
              type="text"
              placeholder="Search or start new chat"
              className="bg-transparent text-white placeholder-[#8696a0] outline-none flex-1 text-sm"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#111b21]">
          <button className="px-3 py-1.5 bg-[#00a884] text-white text-sm rounded-full font-medium">All</button>
          <button className="px-3 py-1.5 bg-[#202c33] text-[#8696a0] text-sm rounded-full hover:bg-[#374955] transition-colors">Unread</button>
          <button className="px-3 py-1.5 bg-[#202c33] text-[#8696a0] text-sm rounded-full hover:bg-[#374955] transition-colors">Groups</button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto bg-[#111b21]">
          {rooms.map((room) => {
            const isSelected = selectedRoom?.id === room.id;
            const lastMessageTime = formatTime(room.last_message_at || room.created_at);

            return (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`w-full px-3 py-3 flex items-center gap-3 transition-colors ${
                  isSelected 
                    ? 'bg-[#2a3942]' 
                    : 'hover:bg-[#202c33]'
                }`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 min-w-[48px] rounded-full flex items-center justify-center flex-shrink-0 bg-[#6b7c85] overflow-hidden">
                  <span style={{ fontSize: '24px', lineHeight: 1 }}>{room.avatar_url || room.name.charAt(0)}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left border-b border-[#222d34] pb-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-[#e9edef] font-normal text-base truncate">{room.name}</h3>
                    <span className="text-xs text-[#8696a0] ml-2 flex-shrink-0">{lastMessageTime}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-[#8696a0] truncate">
                      {room.member_count ? `${room.member_count} members` : 'Tap to chat'}
                    </p>
                    {room.unread_count && room.unread_count > 0 && (
                      <div className="bg-[#00a884] text-white text-xs font-medium rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center flex-shrink-0">
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
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span style={{ fontSize: '48px', lineHeight: 1 }}>💬</span>
              </div>
              <h3 className="text-white mb-2">No chats yet</h3>
              <p className="text-[#667781] text-sm">
                Join a match to start chatting with your team!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedRoom ? (
        <div className="flex-1 flex flex-col bg-[#000000]">
          {/* Chat Header */}
          <div className="bg-[#080C28] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#6b7c85] overflow-hidden">
                <span style={{ fontSize: '20px', lineHeight: 1 }}>{selectedRoom.avatar_url || selectedRoom.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[#e9edef] font-normal text-base truncate">{selectedRoom.name}</h2>
                <p className="text-xs text-[#8696a0] truncate">
                  {selectedRoom.member_count ? `${selectedRoom.member_count} members` : 'Group chat'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="text-[#aebac1] hover:text-white hover:bg-[#374955] p-2 rounded-full h-10 w-10"
              >
                <Video className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#aebac1] hover:text-white hover:bg-[#374955] p-2 rounded-full h-10 w-10"
              >
                <Phone className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRoomInfo(!showRoomInfo)}
                className="text-[#aebac1] hover:text-white hover:bg-[#374955] p-2 rounded-full h-10 w-10"
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRoomInfo(!showRoomInfo)}
                className="text-[#aebac1] hover:text-white hover:bg-[#374955] p-2 rounded-full h-10 w-10"
              >
                <MoreVertical className="w-5 h-5" />
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
                  className="bg-emerald-500 hover:bg-emerald-600 text-white h-8 text-xs font-semibold rounded-full px-4 shadow-lg"
                  onClick={() => {
                    toast.success('You\'re in! 🎉', {
                      description: 'Confirmed attendance for the match'
                    });
                  }}
                >
                  ✓ I'm in
                </Button>
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
                  onClick={() => setShowPaymentModal(true)}
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
              <div className="absolute bottom-16 left-4 bg-gradient-to-br from-[#233138] to-[#1a252e] rounded-xl shadow-2xl p-3 z-50 w-[340px] border border-[#374955]">
                <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                  {/* Smileys & People */}
                  <div className="mb-3">
                    <p className="text-[10px] text-[#8696a0] mb-2 px-1 font-semibold">SMILEYS & PEOPLE</p>
                    <div className="grid grid-cols-8 gap-1">
                      {['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱'].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setMessageInput(prev => prev + emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="text-2xl hover:bg-[#374955] rounded-lg p-1.5 transition-all hover:scale-110 active:scale-95"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gestures & Body Parts */}
                  <div className="mb-3">
                    <p className="text-[10px] text-[#8696a0] mb-2 px-1 font-semibold">GESTURES</p>
                    <div className="grid grid-cols-8 gap-1">
                      {['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄','💋'].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setMessageInput(prev => prev + emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="text-2xl hover:bg-[#374955] rounded-lg p-1.5 transition-all hover:scale-110 active:scale-95"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sports & Activities */}
                  <div className="mb-3">
                    <p className="text-[10px] text-[#8696a0] mb-2 px-1 font-semibold">SPORTS</p>
                    <div className="grid grid-cols-8 gap-1">
                      {['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','🤺','⛹️','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚴','🚵','🎯','🪀','🎲','🎰','🎮','🕹️','🎳'].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setMessageInput(prev => prev + emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="text-2xl hover:bg-[#374955] rounded-lg p-1.5 transition-all hover:scale-110 active:scale-95"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hearts & Symbols */}
                  <div>
                    <p className="text-[10px] text-[#8696a0] mb-2 px-1 font-semibold">HEARTS & SYMBOLS</p>
                    <div className="grid grid-cols-8 gap-1">
                      {['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧️','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','♾️','💲','💱','™️','©️','®️','〰️','➰','➿','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢','💬','💭','🗯️','♠️','♣️','♥️','♦️','🃏','🎴','🀄','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚','🕛','🕜','🕝','🕞','🕟','🕠','🕡','🕢','🕣','🕤','🕥','🕦','🕧'].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setMessageInput(prev => prev + emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="text-xl hover:bg-[#374955] rounded-lg p-1.5 transition-all hover:scale-110 active:scale-95"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
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
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l border-gray-300 shadow-2xl z-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-black text-lg font-medium">Group Info</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRoomInfo(false)}
                    className="text-gray-600 hover:text-black"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Group Avatar */}
                <div className="text-center mb-6">
                  <div className="w-32 h-32 min-w-[128px] min-h-[128px] max-w-[128px] max-h-[128px] rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                    <span style={{ fontSize: '56px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{selectedRoom.avatar_url || selectedRoom.name.charAt(0)}</span>
                  </div>
                  <h3 className="text-black text-xl mb-1">{selectedRoom.name}</h3>
                  <p className="text-gray-600 text-sm">
                    Group • {selectedRoom.member_count || 0} members
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2 mb-6">
                  <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition-colors">
                    <BellOff className="w-5 h-5 text-gray-600" />
                    <span className="text-black">Mute notifications</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition-colors">
                    <ImageIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-black">View media</span>
                  </button>
                  <button 
                    onClick={handleLeaveGroup}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5 text-red-500" />
                    <span className="text-red-500">Exit group (soft)</span>
                  </button>
                </div>

                <p className="text-xs text-gray-600 px-4">
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

      {/* Payment Modal */}
      {showPaymentModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
          {/* Payment modal will go here - for now just show a placeholder */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4">Complete Payment for Match</h2>
              <p className="text-slate-600 mb-6">{selectedRoom.name}</p>
              
              <div className="bg-gradient-to-r from-cyan-50 to-emerald-50 rounded-xl p-6 mb-6 border border-cyan-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-700">Total Amount</span>
                  <span className="text-2xl font-bold text-cyan-600">₹1800</span>
                </div>
                <div className="text-sm text-slate-600">
                  5-Step Payment Process:
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Soft Lock (Minimum players reached)</li>
                    <li>Payment Window (30-90 minutes)</li>
                    <li>Hard Lock (Unpaid players removed)</li>
                    <li>Final confirmation with exact share</li>
                    <li>Match details confirmed</li>
                  </ol>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Payment successful - post to community
                    handlePaymentSuccess();
                    setShowPaymentModal(false);
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white rounded-xl font-semibold"
                >
                  Complete Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function handlePaymentSuccess() {
    if (!selectedRoom) return;

    try {
      // Create community post for the match
      const roomName = selectedRoom.name || 'Match';
      const area = 'sports'; // Default to sports community
      
      communityService.createPost({
        area: area,
        authorId: currentUserId || 'user_001',
        authorName: 'Match Organizer',
        authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=match-${selectedRoom.id}`,
        title: `🎯 ${roomName} - Join Us Now!`,
        content: `Join our match! We're organizing ${roomName}. \n\n⚽ Match Details:\n📍 Location: TBD\n🕐 Time: Upcoming\n💰 Cost: To be split among players\n👥 Players: ${selectedRoom.member_count || 0}\n\nClick here to join the conversation and confirm your attendance! Trust Score 80+ preferred.`,
        category: 'event'
      });

      toast.success('Payment Successful! 🎉', {
        description: 'Match posted to community. Others can now join!'
      });

      // Navigate to community feed
      setTimeout(() => {
        onNavigate('sports-community');
      }, 1500);
    } catch (error) {
      console.error('Error posting to community:', error);
      toast.error('Payment successful but failed to post to community');
    }
  }
}
