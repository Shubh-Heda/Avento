import { useState } from 'react';
import { ArrowLeft, Users, Send, Plus, Search, MessageCircle, MoreVertical, Check, Calendar, MapPin, Clock, PartyPopper, Sparkles, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { SoftExitMenu } from './SoftExitMenu';

interface Party {
  id: string;
  title: string;
  turfName: string;
  date: string;
  time: string;
  sport: string;
  status: 'upcoming' | 'completed';
  visibility: string;
  amount?: number;
  groupName?: string;
  createGroupChat?: boolean;
}

interface GroupChatPartiesProps {
  onNavigate: (page: string, turfId?: string, matchId?: string) => void;
  matchId?: string | null;
  parties: Party[];
}

interface Message {
  id: string;
  sender: string;
  senderInitial: string;
  senderColor: string;
  text: string;
  time: string;
  isSystem?: boolean;
}

interface ChatRoom {
  id: string;
  name: string;
  members: number;
  lastMessage: string;
  unread: number;
}

const defaultChatRooms: ChatRoom[] = [
  {
    id: 'party-2',
    name: 'Weekend Vibes Crew',
    members: 30,
    lastMessage: 'This is going to be epic!',
    unread: 0,
  },
  {
    id: 'party-3',
    name: 'Birthday Bash Squad',
    members: 22,
    lastMessage: 'Don\'t forget to bring the cake! 🎂',
    unread: 2,
  },
];

export function GroupChatParties({ onNavigate, matchId, parties }: GroupChatPartiesProps) {
  const partyChatRooms: ChatRoom[] = parties
    .filter(p => p.status === 'upcoming' && p.createGroupChat)
    .map(p => ({
      id: p.id,
      name: p.groupName || p.title,
      members: 20,
      lastMessage: `Party on ${p.date} at ${p.time}`,
      unread: matchId === p.id ? 0 : 1,
    }));
  
  const chatRooms = [...partyChatRooms, ...defaultChatRooms];
  const [selectedRoom, setSelectedRoom] = useState<string>(matchId || chatRooms[0]?.id || 'party-2');
  const [newMessage, setNewMessage] = useState('');
  const [showSoftExitMenu, setShowSoftExitMenu] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [partyStage, setPartyStage] = useState<'open' | 'soft-locked' | 'payment-window' | 'hard-locked' | 'confirmed'>('open');

  const currentParty = parties.find(p => p.id === selectedRoom);

  const messages: Message[] = [
    {
      id: '1',
      sender: 'System',
      senderInitial: '🎉',
      senderColor: 'from-orange-400 to-pink-500',
      text: currentParty 
        ? `🎉 Party group created! ${currentParty.visibility === 'public' ? 'Open to everyone!' : 'Private party'}\n\n✨ Connect with other party-goers\n💬 Share your excitement\n🎊 Make the party unforgettable!`
        : 'Welcome to the party group!',
      time: '10:00 AM',
      isSystem: true,
    },
    {
      id: '2',
      sender: 'Alex Rodriguez',
      senderInitial: 'A',
      senderColor: 'from-orange-400 to-pink-500',
      text: 'Let\'s make this the best party ever! 🎊',
      time: '10:30 AM',
    },
    {
      id: '3',
      sender: 'Maya Patel',
      senderInitial: 'M',
      senderColor: 'from-pink-400 to-orange-500',
      text: 'I\'m bringing the music playlist! Any requests? 🎵',
      time: '10:32 AM',
    },
  ];

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    toast.success('Message sent!');
    setNewMessage('');
  };

  const handleImIn = () => {
    setShowPaymentConfirm(true);
  };

  const confirmJoin = () => {
    setHasJoined(true);
    setShowPaymentConfirm(false);
    toast.success("You're in! 🎉", {
      description: "Payment will be collected after more people join"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-orange-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('party-dashboard')}
              className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-orange-700" />
            </button>
            <div>
              <h1 className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">Party Chats</h1>
              <p className="text-sm text-slate-600">{chatRooms.length} active conversations</p>
            </div>
          </div>
          <Button
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Group
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
          {/* Chat List */}
          <div className="col-span-4 bg-white rounded-2xl border border-orange-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-orange-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search chats..."
                  className="pl-10 bg-orange-50 border-orange-200"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {chatRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room.id)}
                  className={`w-full p-4 flex items-start gap-3 border-b border-slate-100 hover:bg-orange-50 transition-colors ${
                    selectedRoom === room.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white flex-shrink-0">
                    <PartyPopper className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm text-slate-900 truncate">{room.name}</h3>
                      {room.unread > 0 && (
                        <Badge className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {room.unread}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 truncate">{room.lastMessage}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-500">{room.members} members</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="col-span-8 bg-white rounded-2xl border border-orange-200 overflow-hidden flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-pink-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white">
                    <PartyPopper className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-slate-900">{chatRooms.find(r => r.id === selectedRoom)?.name}</h2>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-slate-600">
                        {chatRooms.find(r => r.id === selectedRoom)?.members} members
                      </p>
                      <Badge className="bg-orange-100 text-orange-700 text-xs border border-orange-200">
                        Party Chat
                      </Badge>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowSoftExitMenu(true)}
                  className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Party Details Banner */}
            {currentParty && (
              <div className="p-4 border-b border-orange-200 bg-gradient-to-br from-orange-50 to-pink-50">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-orange-600" />
                      <span className="text-slate-700">{currentParty.turfName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span className="text-slate-700">{currentParty.date} at {currentParty.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={msg.isSystem ? 'flex justify-center' : 'flex items-start gap-3'}>
                  {msg.isSystem ? (
                    <div className="bg-gradient-to-br from-orange-50 to-pink-50 border-2 border-orange-300 rounded-2xl px-5 py-4 max-w-lg shadow-sm">
                      <p className="text-sm text-orange-900 whitespace-pre-line leading-relaxed">{msg.text}</p>
                    </div>
                  ) : (
                    <>
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${msg.senderColor} flex items-center justify-center text-white flex-shrink-0`}>
                        {msg.senderInitial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-slate-900">{msg.sender}</span>
                          <span className="text-xs text-slate-500">{msg.time}</span>
                        </div>
                        <p className="text-sm text-slate-700">{msg.text}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-orange-200">
              <div className="flex gap-3">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-orange-50 border-orange-200"
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Soft Exit Menu */}
      {showSoftExitMenu && (
        <SoftExitMenu
          onClose={() => setShowSoftExitMenu(false)}
          onLeave={() => {
            setShowSoftExitMenu(false);
            toast.success('You\'ve left the group');
            onNavigate('party-dashboard');
          }}
        />
      )}
    </div>
  );
}
