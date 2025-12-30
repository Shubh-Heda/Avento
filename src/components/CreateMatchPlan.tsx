import { useState } from 'react';
import { ArrowLeft, MapPin, Users, Calendar, Clock, Search, ChevronRight, Send, Plus, X, Heart, CreditCard, DollarSign, Split } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { AnimatedBackground } from './AnimatedBackground';
import { toast } from 'sonner';
import { generateUpcomingDates, getMinBookingDate } from '../utils/dateUtils';
import chatService from '../services/chatService';
import { supabase } from '../lib/supabase';
import { communityService } from '../services/communityService';

interface CreateMatchPlanProps {
  onNavigate: (page: 'dashboard' | 'profile' | 'community' | 'reflection' | 'finder' | 'create-match' | 'turf-detail' | 'chat' | 'availability', turfId?: string, matchId?: string) => void;
  onMatchCreate: (match: {
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
  }) => void;
}

const turfs = [
  {
    id: '1',
    name: 'Sky Sports Arena',
    location: 'Satellite, Ahmedabad',
    sport: 'Football',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop',
    price: '₹1500/hr',
    rating: 4.8,
  },
  {
    id: '2',
    name: 'Victory Cricket Ground',
    location: 'Maninagar, Ahmedabad',
    sport: 'Cricket',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=300&fit=crop',
    price: '₹2000/hr',
    rating: 4.7,
  },
  {
    id: '3',
    name: 'Hoops Basketball Court',
    location: 'Vastrapur, Ahmedabad',
    sport: 'Basketball',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
    price: '₹800/hr',
    rating: 4.6,
  },
  {
    id: '4',
    name: 'Elite Football Academy',
    location: 'SG Highway, Ahmedabad',
    sport: 'Football',
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&h=300&fit=crop',
    price: '₹1800/hr',
    rating: 4.9,
  },
  {
    id: '5',
    name: 'Champions Cricket Turf',
    location: 'Naroda, Ahmedabad',
    sport: 'Cricket',
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=300&fit=crop',
    price: '₹1700/hr',
    rating: 4.5,
  },
  {
    id: '6',
    name: 'Urban Basketball Arena',
    location: 'Bodakdev, Ahmedabad',
    sport: 'Basketball',
    image: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a26?w=400&h=300&fit=crop',
    price: '₹1000/hr',
    rating: 4.7,
  },
];

const timeSlots = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'
];

export function CreateMatchPlan({ onNavigate, onMatchCreate }: CreateMatchPlanProps) {
  // Generate dates dynamically from today
  const dates = generateUpcomingDates(7);
  const minDate = getMinBookingDate();
  
  const [step, setStep] = useState(1);
  const [selectedTurf, setSelectedTurf] = useState<typeof turfs[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('10');
  const [matchTitle, setMatchTitle] = useState('');
  const [matchDescription, setMatchDescription] = useState('');
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [created, setCreated] = useState(false);
  const [visibility, setVisibility] = useState<'community' | 'nearby' | 'private'>('community');
  const [minPlayers, setMinPlayers] = useState('6');

  const vibes = ['Friendly', 'Competitive', 'Beginner Friendly', 'High Energy', 'Chill', 'Social', 'Learning', 'Inclusive'];

  const getTurfCost = () => {
    if (!selectedTurf) return 0;
    const priceStr = selectedTurf.price.replace('₹', '').replace('/hr', '');
    return parseInt(priceStr);
  };

  const getCostPerPlayer = () => {
    const cost = getTurfCost();
    const players = parseInt(maxPlayers) || 1;
    return Math.ceil(cost / players);
  };

  const toggleVibe = (vibe: string) => {
    setSelectedVibes(prev =>
      prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]
    );
  };

  const addEmail = () => {
    if (emailInput && !inviteEmails.includes(emailInput)) {
      setInviteEmails([...inviteEmails, emailInput]);
      setEmailInput('');
    }
  };

  const removeEmail = (email: string) => {
    setInviteEmails(inviteEmails.filter(e => e !== email));
  };

  const handleCreate = async () => {
    setCreated(true);
    
    // Create match object with new payment flow data
    const matchId = 'match-' + Math.random().toString(36).substr(2, 9);
    const match = {
      id: matchId,
      title: matchTitle,
      turfName: selectedTurf?.name || '',
      date: selectedDate,
      time: selectedTime,
      sport: selectedTurf?.sport || '',
      status: 'upcoming' as 'upcoming' | 'completed',
      visibility: visibility,
      paymentOption: 'split', // Always split equally
      amount: getTurfCost(), // Total turf cost
      location: selectedTurf?.location || '',
      minPlayers: parseInt(minPlayers),
      maxPlayers: parseInt(maxPlayers),
      turfCost: getTurfCost(),
    };

    // Auto-create WhatsApp group chat for the match
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Create group chat room for this match
        const chatRoom = await chatService.createRoom({
          name: `${matchTitle} 🏃‍♂️`,
          description: `Group chat for ${matchTitle} at ${selectedTurf?.name || 'venue'} on ${selectedDate}`,
          room_type: 'match',
          is_private: visibility === 'private',
          category: 'sports',
          related_id: matchId,
          avatar_url: selectedTurf?.sport === 'Football' ? '⚽' : 
                      selectedTurf?.sport === 'Cricket' ? '🏏' : 
                      selectedTurf?.sport === 'Basketball' ? '🏀' : '🏃‍♂️'
        });

        // Send welcome system message
        await chatService.sendMessage(
          chatRoom.id,
          `🎉 Welcome to ${matchTitle}!\n\n📍 Venue: ${selectedTurf?.name || 'TBD'}\n📅 Date: ${selectedDate}\n⏰ Time: ${selectedTime}\n\n💰 Cost: ₹${getTurfCost()} (split between ${minPlayers}-${maxPlayers} players)\n\nPayment opens after ${minPlayers} players join. Let's make this match amazing! 🚀`,
          'system'
        );

        // Auto-post to community if 5-step payment is enabled
        if (visibility === 'community') {
          try {
            await communityService.createPost({
              area: 'sports',
              authorId: user.id,
              authorName: user.name || 'Match Organizer',
              authorAvatar: `https://i.pravatar.cc/150?u=${user.id}`,
              title: `🎯 ${matchTitle} - Join Us Now!`,
              content: `📍 ${selectedTurf?.name || 'Venue'}, ${selectedTurf?.location || 'Location'}\n📅 ${selectedDate} at ${selectedTime}\n${selectedTurf?.sport ? selectedTurf.sport : 'Sport'}\n\n👥 Looking for ${minPlayers}-${maxPlayers} players\n💰 ₹${getTurfCost()} total (₹${Math.round(getTurfCost() / parseInt(minPlayers))} per person)\n\n🎯 Join now! Slots filling fast! 🔥`,
              category: 'event'
            });

            toast.success('Posted to Community! 🌟', {
              description: 'Your match is now visible to everyone!',
            });
          } catch (error) {
            console.error('Failed to post to community:', error);
            toast.error('Failed to post to community', {
              description: 'Match created but could not be shared.',
            });
          }
        }

        toast.success('Match & Group Created! 🎉', {
          description: 'WhatsApp-style group chat is ready for your team!',
        });
      } else {
        // Demo mode - no backend
        toast.success('Match Plan Created! 🎉', {
          description: 'Group chat will be created when you sign in!',
        });
      }
    } catch (error) {
      console.error('Error creating group chat:', error);
      // Still show success for match creation
      toast.success('Match Created! 🎉', {
        description: 'Group chat will be available soon.',
      });
    }

    // Show success message based on visibility
    const visibilityMessage = visibility === 'community' 
      ? 'Open to all!'
      : visibility === 'nearby'
      ? 'Visible to nearby players!'
      : 'Private match created!';

    // Call onMatchCreate with the match object
    onMatchCreate(match);
    
    // Navigate to chat after brief delay
    setTimeout(() => {
      const matchId = match.id;
      onNavigate('sports-chat', undefined, matchId);
    }, 1500);
  };

  const filteredTurfs = turfs.filter(turf =>
    turf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    turf.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
    turf.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (created) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-white mb-3">Match Plan Created! 🎉</h2>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/20">
              <p className="text-white/90 text-sm mb-2">✓ Group chat created</p>
              <p className="text-white/90 text-sm mb-2">✓ Players can join for FREE</p>
              <p className="text-white/90 text-sm">✓ Payment opens after minimum players join</p>
            </div>
            <p className="text-white/80 text-sm">Opening group chat...</p>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-white hover:text-white/80 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step >= s ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {s}
                  </div>
                  {s < 4 && (
                    <div className={`flex-1 h-1 mx-2 transition-all ${
                      step > s ? 'bg-gradient-to-r from-cyan-500 to-emerald-500' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Select Turf */}
            {step === 1 && (
              <div>
                <div className="mb-6">
                  <h2 className="mb-2">Choose Your Turf</h2>
                  <p className="text-slate-600">Select a turf where you'd like to play</p>
                </div>

                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="Search by sport, location, or turf name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {filteredTurfs.map(turf => (
                    <button
                      key={turf.id}
                      onClick={() => setSelectedTurf(turf)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedTurf?.id === turf.id
                          ? 'border-cyan-500 bg-cyan-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <ImageWithFallback
                        src={turf.image}
                        alt={turf.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                      <h3 className="mb-1">{turf.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <MapPin className="w-4 h-4" />
                        {turf.location}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge>{turf.sport}</Badge>
                        <span className="text-sm">{turf.price}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedTurf}
                  className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white gap-2"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && selectedTurf && (
              <div>
                <div className="mb-6">
                  <h2 className="mb-2">Pick Date & Time</h2>
                  <p className="text-slate-600">When would you like to play at {selectedTurf.name}?</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm mb-3">Select Date</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {dates.map(date => (
                        <button
                          key={date.date}
                          onClick={() => setSelectedDate(date.date)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedDate === date.date
                              ? 'border-cyan-500 bg-cyan-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Calendar className="w-5 h-5 mx-auto mb-2 text-cyan-600" />
                          <div className="text-sm">{date.label}</div>
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom Date Picker */}
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-xs text-slate-500">or pick a custom date</span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <div className="mt-3">
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={minDate}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-3">Select Time Slot</label>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                      {timeSlots.map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`p-3 rounded-lg border-2 transition-all text-sm ${
                            selectedTime === time
                              ? 'border-cyan-500 bg-cyan-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!selectedDate || !selectedTime}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white gap-2"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Match Details */}
            {step === 3 && selectedTurf && (
              <div>
                <div className="mb-6">
                  <h2 className="mb-2">Match Details & Vibes</h2>
                  <p className="text-slate-600">Tell us about your match</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm mb-2">Match Title *</label>
                    <Input
                      placeholder="e.g., Friday Football Fun or Weekend Warriors Cricket"
                      value={matchTitle}
                      onChange={(e) => setMatchTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Description (Optional)</label>
                    <Textarea
                      placeholder="Share what kind of match this will be, skill level expectations, or anything else players should know..."
                      value={matchDescription}
                      onChange={(e) => setMatchDescription(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2">Minimum Players *</label>
                      <Input
                        type="number"
                        value={minPlayers}
                        onChange={(e) => setMinPlayers(e.target.value)}
                        min="2"
                        max="20"
                      />
                      <p className="text-xs text-slate-500 mt-1">Triggers soft lock when reached</p>
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Maximum Players *</label>
                      <Input
                        type="number"
                        value={maxPlayers}
                        onChange={(e) => setMaxPlayers(e.target.value)}
                        min="2"
                        max="22"
                      />
                      <p className="text-xs text-slate-500 mt-1">Max capacity for the match</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="mb-4">Set the Vibe</h3>
                    <p className="text-slate-600 mb-4">
                      Help players know what to expect from this match
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {vibes.map(vibe => (
                        <button
                          key={vibe}
                          onClick={() => toggleVibe(vibe)}
                          className={`px-4 py-2 rounded-lg border-2 transition-all ${
                            selectedVibes.includes(vibe)
                              ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {vibe}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Flow Info */}
                  <div className="bg-gradient-to-br from-cyan-50 to-emerald-50 rounded-xl border border-cyan-200 p-6">
                    <h3 className="mb-2 flex items-center gap-2 text-cyan-900">
                      <Clock className="w-5 h-5" />
                      How Payment Works
                    </h3>
                    <div className="space-y-3 text-sm text-cyan-800">
                      <div className="flex items-start gap-2">
                        <span className="bg-cyan-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs">1</span>
                        <div>
                          <p className="font-medium">Free Joining</p>
                          <p className="text-cyan-700">Players join the group chat for free</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-cyan-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs">2</span>
                        <div>
                          <p className="font-medium">Soft Lock</p>
                          <p className="text-cyan-700">When minimum players join, group closes & payment opens</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-cyan-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs">3</span>
                        <div>
                          <p className="font-medium">Payment Window</p>
                          <p className="text-cyan-700">Players have 30-90 mins to pay their share</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-cyan-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs">4</span>
                        <div>
                          <p className="font-medium">Hard Lock</p>
                          <p className="text-cyan-700">Unpaid players removed, final team confirmed</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
                    <h3 className="text-purple-900 mb-2">Match Summary</h3>
                    <div className="space-y-2 text-sm text-purple-800">
                      <p><strong>Turf:</strong> {selectedTurf.name}</p>
                      <p><strong>Date:</strong> {dates.find(d => d.date === selectedDate)?.label}</p>
                      <p><strong>Time:</strong> {selectedTime}</p>
                      <p><strong>Players:</strong> {minPlayers}-{maxPlayers} players</p>
                      <p><strong>Total Cost:</strong> ₹{getTurfCost()}</p>
                      <p><strong>Est. Per Player:</strong> ₹{Math.ceil(getTurfCost() / parseInt(minPlayers))} - ₹{Math.ceil(getTurfCost() / parseInt(maxPlayers))}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep(2)}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep(4)}
                      disabled={!matchTitle}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white gap-2"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Invite Players */}
            {step === 4 && (
              <div>
                <div className="mb-6">
                  <h2 className="mb-2">Invite Players & Set Visibility</h2>
                  <p className="text-slate-600">Choose who can discover and join your match</p>
                </div>

                <div className="space-y-6">
                  {/* Visibility Options */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="mb-4">Match Visibility</h3>
                    <p className="text-slate-600 mb-4">Who should be able to see and join your match?</p>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => setVisibility('community')}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          visibility === 'community'
                            ? 'border-cyan-500 bg-cyan-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-cyan-600" />
                          </div>
                          <div>
                            <h4 className="mb-1">Community Wide</h4>
                            <p className="text-sm text-slate-600">
                              All GameSetGo members can discover and request to join
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setVisibility('nearby')}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          visibility === 'nearby'
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h4 className="mb-1">Nearby Only (Within 5km)</h4>
                            <p className="text-sm text-slate-600">
                              Only members near {selectedTurf?.location} can see this match
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setVisibility('private')}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          visibility === 'private'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <X className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="mb-1">Private (Invite Only)</h4>
                            <p className="text-sm text-slate-600">
                              Only invited players can see and join this match
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Email Invites */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="mb-4">Invite Players by Email (Optional)</h3>
                    <p className="text-slate-600 mb-4">
                      Invite specific people to join your match
                    </p>

                    <div className="flex gap-2 mb-4">
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                      />
                      <Button onClick={addEmail} variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {inviteEmails.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm text-slate-600 mb-2">
                          {inviteEmails.length} {inviteEmails.length === 1 ? 'person' : 'people'} invited
                        </div>
                        {inviteEmails.map(email => (
                          <div key={email} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span>{email}</span>
                            <button
                              onClick={() => removeEmail(email)}
                              className="text-slate-400 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Summary based on visibility */}
                  {visibility !== 'private' && (
                    <div className="bg-gradient-to-br from-cyan-50 to-emerald-50 rounded-xl border border-cyan-200 p-6">
                      <h3 className="text-cyan-900 mb-2">
                        {visibility === 'community' ? 'Community Discovery' : 'Local Discovery'}
                      </h3>
                      <p className="text-cyan-800">
                        {visibility === 'community' 
                          ? 'Your match will appear in the community feed and match finder for all members. Others can request to join based on shared values and interests.'
                          : 'Your match will be visible only to community members within 5km of the turf location. Perfect for building strong local connections!'
                        }
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep(3)}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={visibility === 'private' && inviteEmails.length === 0}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Create Match Plan
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
}