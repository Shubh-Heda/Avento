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
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import chatService from '../services/chatService';
import { supabase } from '../lib/supabase';
import type { ChatRoom, ChatMessage } from '../services/chatService';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load rooms
  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      // Get current user from Supabase
      const { data: { user } } = await supabase.auth.getUser();
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
    if (!messageInput.trim() || !selectedRoom) return;

    try {
      const newMessage = await chatService.sendMessage(selectedRoom.id, messageInput);
      setMessageInput('');
      // Message will be added via real-time subscription
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
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
              </p>
            </div>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>

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
                    <p className="text-slate-900 whitespace-pre-wrap">{message.content}</p>
                    {message.media_url && (
                      <img
                        src={message.media_url}
                        alt="attachment"
                        className="mt-2 rounded-lg max-w-sm"
                      />
                    )}
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
    </div>
  );
}
