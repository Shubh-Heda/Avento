import { useState } from 'react';
import { ArrowLeft, Users, Send, Plus, Search, Shield, MessageCircle, UserPlus, MoreVertical, Check, Clock, AlertCircle, CreditCard, CheckCircle, Calendar, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { SoftExitMenu } from './SoftExitMenu';

interface Match {
  id: string;
  title: string;
  turfName: string;
  date: string;
  time: string;
  sport: string;
  status: 'upcoming' | 'completed';
  visibility: string;
  paymentOption: string;
  amount?: number;
  location?: string;
  minPlayers?: number;
  maxPlayers?: number;
  turfCost?: number;
}

interface GroupChatSportsProps {
  onNavigate: (page: string, turfId?: string, matchId?: string) => void;
  matchId?: string | null;
  matches: Match[];
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
  type: 'match' | 'custom';
}

interface MatchParticipant {
  id: string;
  name: string;
  initial: string;
  color: string;
  joinedAt: number;
  hasPaid: boolean;
}

type MatchStage = 'open' | 'soft-locked' | 'payment-window' | 'hard-locked' | 'confirmed';

const defaultChatRooms: ChatRoom[] = [
  {
    id: 'sports-2',
    name: 'Weekend Warriors',
    members: 12,
    lastMessage: 'Who\'s up for cricket this Sunday?',
    unread: 0,
    type: 'custom',
  },
  {
    id: 'sports-3',
    name: 'Beginner Friendly Football',
    members: 15,
    lastMessage: 'Thanks for the warm welcome everyone!',
    unread: 5,
    type: 'custom',
  },
];

export function GroupChatSports({ onNavigate, matchId, matches }: GroupChatSportsProps) {
  // Convert matches to chat rooms
  const matchChatRooms: ChatRoom[] = matches
    .filter(m => m.status === 'upcoming')
    .map(m => ({
      id: m.id,
      name: m.title,
      members: 8,
      lastMessage: `Match on ${m.date} at ${m.time}`,
      unread: matchId === m.id ? 0 : 1,
      type: 'match' as const,
    }));
  
  const chatRooms = [...matchChatRooms, ...defaultChatRooms];
  const [selectedRoom, setSelectedRoom] = useState<string>(matchId || chatRooms[0]?.id || '1');
  const [newMessage, setNewMessage] = useState('');
  const [showSoftExitMenu, setShowSoftExitMenu] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);

  // Initialize some mock participants for demonstration
  const initialParticipants: {[key: string]: MatchParticipant[]} = {};
  matchChatRooms.forEach(room => {
    initialParticipants[room.id] = [
      {
        id: 'user-1',
        name: 'Sarah M.',
        initial: 'S',
        color: 'from-cyan-400 to-cyan-500',
        joinedAt: Date.now() - 300000,
        hasPaid: false,
      },
      {
        id: 'user-2',
        name: 'Mike C.',
        initial: 'M',
        color: 'from-purple-400 to-purple-500',
        joinedAt: Date.now() - 240000,
        hasPaid: false,
      },
      {
        id: 'user-3',
        name: 'Alex R.',
        initial: 'A',
        color: 'from-pink-400 to-pink-500',
        joinedAt: Date.now() - 180000,
        hasPaid: false,
      },
    ];
  });

  // Match payment state
  const [matchParticipants, setMatchParticipants] = useState<{[matchId: string]: MatchParticipant[]}>(initialParticipants);
  const [matchStages, setMatchStages] = useState<{[matchId: string]: MatchStage}>({});
  const [currentUserJoined, setCurrentUserJoined] = useState<{[matchId: string]: boolean}>({});
  const [currentUserPaid, setCurrentUserPaid] = useState<{[matchId: string]: boolean}>({});

  const currentRoom = chatRooms.find(r => r.id === selectedRoom);
  const currentMatch = matches.find(m => m.id === selectedRoom);
  const isMatchChat = currentRoom?.type === 'match';
  const matchStage = matchStages[selectedRoom] || 'open';
  const participants = matchParticipants[selectedRoom] || [];
  const hasJoined = currentUserJoined[selectedRoom] || false;
  const hasPaid = currentUserPaid[selectedRoom] || false;

  // Calculate payment window based on time until match
  const getPaymentWindow = (matchDate: string, matchTime: string) => {
    const matchDateTime = new Date(`${matchDate} ${matchTime}`);
    const now = new Date();
    const hoursUntilMatch = (matchDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilMatch >= 4) return 90;
    if (hoursUntilMatch >= 2) return 45;
    if (hoursUntilMatch >= 1) return 30;
    return 15;
  };

  const getSharePerPerson = () => {
    if (!currentMatch?.turfCost) return 0;
    
    // During payment window, divide by all joined players
    if (matchStage === 'payment-window' || matchStage === 'open' || matchStage === 'soft-locked') {
      const joinedCount = participants.length;
      if (joinedCount === 0) return Math.ceil(currentMatch.turfCost / (currentMatch.minPlayers || 6));
      return Math.ceil(currentMatch.turfCost / joinedCount);
    }
    
    // After hard lock, divide only by paid players
    const paidCount = participants.filter(p => p.hasPaid).length;
    if (paidCount === 0) return 0;
    return Math.ceil(currentMatch.turfCost / paidCount);
  };

  const handleImIn = () => {
    if (!currentMatch) return;
    setShowPaymentConfirm(true);
  };

  const confirmJoin = () => {
    if (!currentMatch) return;
    
    const newParticipant: MatchParticipant = {
      id: 'current-user',
      name: 'You',
      initial: 'Y',
      color: 'from-blue-500 to-cyan-500',
      joinedAt: Date.now(),
      hasPaid: false,
    };

    setMatchParticipants(prev => ({
      ...prev,
      [selectedRoom]: [...(prev[selectedRoom] || []), newParticipant]
    }));

    setCurrentUserJoined(prev => ({
      ...prev,
      [selectedRoom]: true
    }));

    setShowPaymentConfirm(false);
    
    toast.success('You\'re in! 🎉', {
      description: 'Wait for soft lock to make payment',
    });

    checkSoftLock();
  };

  const checkSoftLock = () => {
    if (!currentMatch || matchStage !== 'open') return;
    
    const participantCount = (participants.length || 0) + 1;
    const minPlayers = currentMatch.minPlayers || 6;
    
    if (participantCount >= minPlayers) {
      setTimeout(() => {
        setMatchStages(prev => ({
          ...prev,
          [selectedRoom]: 'soft-locked'
        }));
        
        toast.success('🔒 Group Locked!', {
          description: 'Minimum players reached. Payment window opening soon...',
        });

        setTimeout(() => {
          setMatchStages(prev => ({
            ...prev,
            [selectedRoom]: 'payment-window'
          }));
          
          const paymentWindow = getPaymentWindow(currentMatch.date, currentMatch.time);
          toast.success('💳 Payment Window Open', {
            description: `Pay your share within ${paymentWindow} minutes`,
          });

          setTimeout(() => {
            handleHardLock();
          }, paymentWindow * 60 * 1000);
        }, 5000);
      }, 2000);
    }
  };

  const handlePayNow = () => {
    if (!currentMatch) return;
    
    toast.loading('Processing payment...', { id: 'payment' });
    
    setTimeout(() => {
      setCurrentUserPaid(prev => ({
        ...prev,
        [selectedRoom]: true
      }));

      setMatchParticipants(prev => ({
        ...prev,
        [selectedRoom]: prev[selectedRoom].map(p => 
          p.id === 'current-user' ? { ...p, hasPaid: true } : p
        )
      }));

      toast.success('Payment Successful! ✅', {
        id: 'payment',
        description: `₹${getSharePerPerson()} paid`,
      });
    }, 1500);
  };

  const handleHardLock = () => {
    if (!currentMatch) return;

    const paidParticipants = participants.filter(p => p.hasPaid);
    
    setMatchParticipants(prev => ({
      ...prev,
      [selectedRoom]: paidParticipants
    }));

    setMatchStages(prev => ({
      ...prev,
      [selectedRoom]: 'hard-locked'
    }));

    const removedCount = participants.length - paidParticipants.length;
    
    toast.warning('⏰ Payment Window Closed', {
      description: `${removedCount} unpaid player${removedCount > 1 ? 's' : ''} removed`,
    });

    setTimeout(() => {
      setMatchStages(prev => ({
        ...prev,
        [selectedRoom]: 'confirmed'
      }));

      const finalShare = getSharePerPerson();
      toast.success('🎉 Team Confirmed!', {
        description: `Final share: ₹${finalShare}/person. Turf booked!`,
      });
    }, 2000);
  };

  const getStageInfo = () => {
    if (!isMatchChat || !currentMatch) return null;

    const participantCount = participants.length;
    const minPlayers = currentMatch.minPlayers || 6;

    switch (matchStage) {
      case 'open':
        return {
          title: 'Open for Joining',
          description: `${participantCount}/${minPlayers} minimum players`,
          icon: UserPlus,
          color: 'from-blue-500 to-cyan-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        };
      case 'soft-locked':
        return {
          title: 'Group Locked',
          description: 'Minimum players reached. Opening payment soon...',
          icon: Clock,
          color: 'from-orange-500 to-amber-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
        };
      case 'payment-window':
        const paymentWindow = getPaymentWindow(currentMatch.date, currentMatch.time);
        return {
          title: 'Payment Window Open',
          description: `Pay within ${paymentWindow} minutes`,
          icon: CreditCard,
          color: 'from-purple-500 to-pink-500',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
        };
      case 'hard-locked':
        return {
          title: 'Finalizing Team',
          description: 'Unpaid players removed. Confirming team...',
          icon: AlertCircle,
          color: 'from-red-500 to-pink-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        };
      case 'confirmed':
        return {
          title: 'Team Confirmed!',
          description: `${participantCount} players • Turf booked`,
          icon: CheckCircle,
          color: 'from-green-500 to-emerald-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
    }
  };

  const getSystemMessage = () => {
    if (!isMatchChat || !currentMatch) return null;
    
    let visibilityText = '';
    const visibility = currentMatch.visibility?.toLowerCase();
    
    visibilityText = visibility === 'community' 
      ? 'Open to all community members!'
      : visibility === 'nearby'
      ? 'Visible to players near you!'
      : 'Private match - only invited players can join';
    
    return `⚽ Match group created! ${visibilityText}\n\n✨ Join for FREE by clicking "I'm In" below\n💰 Payment opens only after ${currentMatch.minPlayers || 6} players join\n🤝 Final cost split equally among paid players`;
  };

  const messages: Message[] = isMatchChat ? [
    {
      id: '1',
      sender: 'System',
      senderInitial: '🎉',
      senderColor: 'from-cyan-400 to-cyan-500',
      text: getSystemMessage() || 'Match plan created!',
      time: '10:00 AM',
      isSystem: true,
    },
    {
      id: '2',
      sender: 'Sarah Martinez',
      senderInitial: 'S',
      senderColor: 'from-cyan-400 to-cyan-500',
      text: 'Hey everyone! Really excited for this match! 🎉',
      time: '10:30 AM',
    },
    {
      id: '3',
      sender: 'Mike Chen',
      senderInitial: 'M',
      senderColor: 'from-purple-400 to-purple-500',
      text: 'Count me in! The timing works perfectly ☀️',
      time: '10:32 AM',
    },
  ] : [
    {
      id: '1',
      sender: 'Sarah Martinez',
      senderInitial: 'S',
      senderColor: 'from-cyan-400 to-cyan-500',
      text: 'Hey everyone! Ready for tomorrow? 🎉',
      time: '10:30 AM',
    },
  ];

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    toast.success('Message sent!');
    setNewMessage('');
  };

  const stageInfo = getStageInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <h1 className="text-slate-900">Sports Group Chats</h1>
              <p className="text-sm text-slate-600">{chatRooms.length} active conversations</p>
            </div>
          </div>
          <Button
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Group
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
          {/* Chat List */}
          <div className="col-span-4 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search chats..."
                  className="pl-10 bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {chatRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room.id)}
                  className={`w-full p-4 flex items-start gap-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                    selectedRoom === room.id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${
                    room.type === 'match' ? 'from-emerald-400 to-cyan-500' : 'from-purple-400 to-pink-500'
                  } flex items-center justify-center text-white flex-shrink-0`}>
                    {room.type === 'match' ? <Shield className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm text-slate-900 truncate">{room.name}</h3>
                      {room.unread > 0 && (
                        <Badge className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
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
          <div className="col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white">
                    {isMatchChat ? <Shield className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-slate-900">{chatRooms.find(r => r.id === selectedRoom)?.name}</h2>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-slate-600">
                        {chatRooms.find(r => r.id === selectedRoom)?.members} members
                      </p>
                      {isMatchChat && (
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs border border-emerald-200">
                          Match Chat
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowSoftExitMenu(true)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Match Stage Banner */}
            {isMatchChat && stageInfo && (
              <div className={`p-4 border-b ${stageInfo.borderColor} ${stageInfo.bgColor}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${stageInfo.color} flex items-center justify-center text-white`}>
                    <stageInfo.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm text-slate-900">{stageInfo.title}</h3>
                    <p className="text-xs text-slate-600">{stageInfo.description}</p>
                  </div>
                  {matchStage === 'payment-window' && !hasPaid && hasJoined && (
                    <Button
                      onClick={handlePayNow}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay ₹{getSharePerPerson()}
                    </Button>
                  )}
                </div>

                {/* Participants List */}
                {participants.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {participants.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200"
                      >
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${p.color} flex items-center justify-center text-white text-xs`}>
                          {p.initial}
                        </div>
                        <span className="text-xs text-slate-700">{p.name}</span>
                        {p.hasPaid && (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={msg.isSystem ? 'flex justify-center' : 'flex items-start gap-3'}>
                  {msg.isSystem ? (
                    <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 border-2 border-emerald-300 rounded-2xl px-5 py-4 max-w-lg shadow-sm">
                      <p className="text-sm text-emerald-900 whitespace-pre-line leading-relaxed">{msg.text}</p>
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

            {/* I'm In Button */}
            {isMatchChat && matchStage === 'open' && !hasJoined && (
              <div className="p-4 border-t-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50">
                <div className="mb-3 text-center">
                  <p className="text-sm text-slate-700 mb-1">
                    🎯 Join this match for <strong>FREE</strong>
                  </p>
                  <p className="text-xs text-slate-600">
                    Payment only after minimum {currentMatch?.minPlayers || 6} players join
                  </p>
                </div>
                <Button
                  onClick={handleImIn}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white py-6 text-base shadow-lg hover:shadow-xl transition-all"
                >
                  <Check className="w-6 h-6 mr-2" />
                  I'm In! (Join Free)
                </Button>
                <p className="text-xs text-center text-slate-500 mt-2">
                  You'll confirm payment details before joining
                </p>
              </div>
            )}

            {/* Already Joined */}
            {isMatchChat && matchStage === 'open' && hasJoined && (
              <div className="p-4 border-t border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">You're In! Waiting for others...</span>
                </div>
                <p className="text-xs text-center text-slate-600 mt-2">
                  {(currentMatch?.minPlayers || 6) - participants.length} more player(s) needed to lock group
                </p>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-slate-200">
              <div className="flex gap-3">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-50 border-slate-200"
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {showPaymentConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200 overflow-y-auto" onClick={(e) => {
          if (e.target === e.currentTarget) setShowPaymentConfirm(false);
        }}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 my-8 animate-in zoom-in-95 duration-200 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-center mb-2 text-slate-900">Join This Match?</h2>
            <p className="text-center text-slate-600 mb-6">
              You're about to join <strong>{currentMatch?.title}</strong>
            </p>

            {/* Match Details */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 mb-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Turf:
                  </span>
                  <span className="text-slate-900 font-medium">{currentMatch?.turfName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date:
                  </span>
                  <span className="text-slate-900 font-medium">{currentMatch?.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Time:
                  </span>
                  <span className="text-slate-900 font-medium">{currentMatch?.time}</span>
                </div>
              </div>
            </div>

            {/* Payment Responsibility */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
              <h3 className="text-orange-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Responsibility
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-orange-200">
                  <span className="text-orange-800">Total Turf Cost:</span>
                  <span className="text-orange-900 font-bold text-base">₹{currentMatch?.turfCost}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-orange-800">Your Estimated Share:</span>
                  <span className="text-orange-900 font-bold text-lg">₹{Math.ceil((currentMatch?.turfCost || 0) / (participants.length + 1 || currentMatch?.minPlayers || 6))}</span>
                </div>
                <div className="bg-orange-100 rounded-lg p-3 mt-3">
                  <p className="text-xs text-orange-900 leading-relaxed">
                    <strong>⚠️ Important:</strong> By clicking "OK, I'm In", you agree to pay your share when the payment window opens (after minimum players join). Final share will be split equally among all paid players.
                  </p>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 mb-6">
              <h4 className="text-cyan-900 text-sm mb-2">📋 How it works:</h4>
              <div className="space-y-1.5 text-xs text-cyan-800">
                <p>✓ You join the group chat for free</p>
                <p>✓ When minimum players join, group locks</p>
                <p>✓ Payment window opens (30-90 mins)</p>
                <p>✓ You pay your share</p>
                <p>✓ Unpaid players are removed at deadline</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowPaymentConfirm(false)}
                variant="outline"
                className="flex-1 border-slate-300 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmJoin}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg"
              >
                <Check className="w-5 h-5 mr-2" />
                OK, I'm In!
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Soft Exit Menu */}
      {showSoftExitMenu && (
        <SoftExitMenu
          onClose={() => setShowSoftExitMenu(false)}
          onLeave={() => {
            setShowSoftExitMenu(false);
            toast.success('You\'ve left the group');
            onNavigate('dashboard');
          }}
        />
      )}
    </div>
  );
}