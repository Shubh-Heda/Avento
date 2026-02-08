import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, Calendar, Clock, Users, Gamepad2, Monitor, DoorOpen, 
  Video, Shield, Zap, Globe, Lock, UserCheck, ChevronRight,
  Timer, Target, Trophy, Sparkles
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { gamingBackendService, GamingSession } from '../services/gamingBackendService';
import { GamingClub } from '../services/gamingService';
import { matchService } from '../services/backendService';
import { firebaseAuth } from '../services/firebaseService';
import { toast } from 'sonner';

interface CreateGamingSessionModalProps {
  userId: string;
  userName: string;
  gamingClubs: GamingClub[];
  onClose: () => void;
  onSessionCreated: (session: GamingSession) => void;
}

export function CreateGamingSessionModal({ 
  userId, 
  userName, 
  gamingClubs, 
  onClose, 
  onSessionCreated 
}: CreateGamingSessionModalProps) {
  const [step, setStep] = useState(1);
  const [selectedClub, setSelectedClub] = useState<GamingClub | null>(null);
  const [sessionData, setSessionData] = useState({
    date: '',
    time: '',
    duration: 2,
    gameSpecific: true,
    gameName: '',
    platform: 'PS5',
    sessionType: 'casual' as 'casual' | 'competitive' | 'tournament',
    skillLevel: 'any' as 'beginner' | 'intermediate' | 'pro' | 'any',
    minPlayers: 2,
    maxPlayers: 8,
    visibility: 'public' as 'public' | 'friends-only' | 'private',
    paymentMode: '5-stage' as '5-stage' | 'instant',
    seatType: 'individual' as 'individual' | 'private-room',
    streamingAvailable: false,
    hasFood: false
  });

  const popularGames = [
    'FIFA 24', 'COD: MW3', 'Valorant', 'GTA V', 'Fortnite', 
    'Apex Legends', 'CS:GO', 'Dota 2', 'League of Legends', 'Tekken 8'
  ];

  const handleCreateSession = async () => {
    if (!selectedClub) return;

    try {
      const pricePerPerson = (selectedClub.hourlyRate * sessionData.duration) / sessionData.maxPlayers;
      
      // Create using real backend service (auto-creates chat and community post)
      const newSession = await gamingBackendService.createGamingSession(
        {
          clubId: selectedClub.id,
          clubName: selectedClub.name,
          date: sessionData.date,
          time: sessionData.time,
          duration: sessionData.duration,
          gameName: sessionData.gameSpecific ? sessionData.gameName : undefined,
          platform: sessionData.platform,
          sessionType: sessionData.sessionType,
          skillLevel: sessionData.skillLevel,
          minPlayers: sessionData.minPlayers,
          maxPlayers: sessionData.maxPlayers,
          visibility: sessionData.visibility,
          paymentMode: sessionData.paymentMode,
          pricePerPerson,
          seatType: sessionData.seatType,
          streamingAvailable: sessionData.streamingAvailable,
          hasFood: sessionData.hasFood,
        },
        userId,
        userName
      );

      // Also save to matchService for cross-compatibility
      try {
        const user = firebaseAuth.getCurrentUser();
        
        if (user) {
          await matchService.createMatch({
            user_id: user.uid,
            title: `${sessionData.gameName || 'Gaming'} Session at ${selectedClub.name}`,
            turf_name: selectedClub.name,
            date: sessionData.date,
            time: sessionData.time,
            sport: sessionData.gameName || 'Gaming',
            status: 'upcoming',
            visibility: sessionData.visibility === 'public' ? 'community' : sessionData.visibility,
            payment_option: sessionData.paymentMode === '5-stage' ? 'split' : 'Pay Directly',
            amount: selectedClub.hourlyRate * sessionData.duration,
            location: selectedClub.location,
            min_players: sessionData.minPlayers,
            max_players: sessionData.maxPlayers,
            turf_cost: selectedClub.hourlyRate * sessionData.duration,
            category: 'gaming'
          });
        }
      } catch (error) {
        console.warn('Cross-save to matchService failed (non-critical):', error);
      }

      toast.success('🎮 Gaming session created! Group chat & community post auto-created');
      onSessionCreated(newSession);
    } catch (error: any) {
      console.error('❌ Error creating gaming session:', error);
      toast.error(error.message || 'Failed to create gaming session');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8 shadow-2xl border border-white/20"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 p-6 z-10 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white mb-1">Create Gaming Session</h2>
              <p className="text-purple-100">Step {step} of 3</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors bg-white/20 rounded-lg p-2 hover:bg-white/30"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Select Gaming Club */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-white mb-4">Select Gaming Club</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {gamingClubs.map((club) => (
                  <motion.div
                    key={club.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedClub(club)}
                    className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
                      selectedClub?.id === club.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img 
                        src={club.image} 
                        alt={club.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="text-white mb-1">{club.name}</h4>
                        <p className="text-sm text-cyan-200 mb-2">{club.location}</p>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                            ₹{club.hourlyRate}/hr
                          </Badge>
                          <Badge className="bg-yellow-500/20 text-yellow-300 text-xs">
                            ⭐ {club.rating}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!selectedClub}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50"
              >
                Continue
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Session Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-white mb-4">Session Details</h3>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-cyan-200 mb-2">Date</label>
                  <Input
                    type="date"
                    value={sessionData.date}
                    onChange={(e) => setSessionData({ ...sessionData, date: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-cyan-200 mb-2">Time</label>
                  <Input
                    type="time"
                    value={sessionData.time}
                    onChange={(e) => setSessionData({ ...sessionData, time: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm text-cyan-200 mb-2">Duration (hours)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((hours) => (
                    <button
                      key={hours}
                      onClick={() => setSessionData({ ...sessionData, duration: hours })}
                      className={`flex-1 py-3 rounded-xl transition-all ${
                        sessionData.duration === hours
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {hours}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Game Selection Toggle */}
              <div>
                <label className="block text-sm text-cyan-200 mb-3">Game Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSessionData({ ...sessionData, gameSpecific: true })}
                    className={`py-4 px-4 rounded-xl transition-all ${
                      sessionData.gameSpecific
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <Target className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm">Specific Game</p>
                  </button>
                  <button
                    onClick={() => setSessionData({ ...sessionData, gameSpecific: false, gameName: '' })}
                    className={`py-4 px-4 rounded-xl transition-all ${
                      !sessionData.gameSpecific
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <Sparkles className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm">Any Game</p>
                  </button>
                </div>
              </div>

              {/* Game Selection (if specific) */}
              {sessionData.gameSpecific && (
                <div>
                  <label className="block text-sm text-cyan-200 mb-2">Select Game</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {popularGames.map((game) => (
                      <button
                        key={game}
                        onClick={() => setSessionData({ ...sessionData, gameName: game })}
                        className={`py-2 px-3 rounded-lg text-sm transition-all ${
                          sessionData.gameName === game
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {game}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Platform Selection */}
              <div>
                <label className="block text-sm text-cyan-200 mb-2">Platform</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['PS5', 'Xbox Series X', 'Gaming PC', 'VR'].map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setSessionData({ ...sessionData, platform })}
                      className={`py-3 px-4 rounded-xl transition-all ${
                        sessionData.platform === platform
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session Type */}
              <div>
                <label className="block text-sm text-cyan-200 mb-2">Session Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'casual', label: 'Casual', icon: Gamepad2 },
                    { value: 'competitive', label: 'Competitive', icon: Zap },
                    { value: 'tournament', label: 'Tournament', icon: Trophy }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSessionData({ ...sessionData, sessionType: type.value as any })}
                      className={`py-3 px-4 rounded-xl transition-all ${
                        sessionData.sessionType === type.value
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <type.icon className="w-5 h-5 mx-auto mb-1" />
                      <p className="text-sm">{type.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Skill Level */}
              <div>
                <label className="block text-sm text-cyan-200 mb-2">Skill Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {['beginner', 'intermediate', 'pro', 'any'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setSessionData({ ...sessionData, skillLevel: level as any })}
                      className={`py-2 px-3 rounded-lg text-sm transition-all capitalize ${
                        sessionData.skillLevel === level
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Players */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-cyan-200 mb-2">Min Players</label>
                  <Input
                    type="number"
                    min="2"
                    value={sessionData.minPlayers}
                    onChange={(e) => setSessionData({ ...sessionData, minPlayers: parseInt(e.target.value) })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-cyan-200 mb-2">Max Players</label>
                  <Input
                    type="number"
                    min={sessionData.minPlayers}
                    value={sessionData.maxPlayers}
                    onChange={(e) => setSessionData({ ...sessionData, maxPlayers: parseInt(e.target.value) })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>

              {/* Seat Type */}
              <div>
                <label className="block text-sm text-cyan-200 mb-2">Seating Preference</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'individual', label: 'Individual Seats', icon: Monitor },
                    { value: 'private-room', label: 'Private Room', icon: DoorOpen }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSessionData({ ...sessionData, seatType: type.value as any })}
                      className={`py-4 px-4 rounded-xl transition-all ${
                        sessionData.seatType === type.value
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <type.icon className="w-6 h-6 mx-auto mb-2" />
                      <p className="text-sm">{type.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Extras */}
              <div>
                <label className="block text-sm text-cyan-200 mb-3">Extras</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={sessionData.streamingAvailable}
                      onChange={(e) => setSessionData({ ...sessionData, streamingAvailable: e.target.checked })}
                      className="w-5 h-5 accent-purple-500"
                    />
                    <Video className="w-5 h-5 text-purple-400" />
                    <span className="text-white">Streaming Setup Available</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={sessionData.hasFood}
                      onChange={(e) => setSessionData({ ...sessionData, hasFood: e.target.checked })}
                      className="w-5 h-5 accent-purple-500"
                    />
                    <span className="text-xl">🍕</span>
                    <span className="text-white">Food & Drinks Included</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  Continue
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Payment & Visibility */}
          {step === 3 && selectedClub && (
            <div className="space-y-6">
              <h3 className="text-white mb-4">Payment & Visibility</h3>

              {/* Payment Mode Selection - NEW! */}
              <div>
                <label className="block text-sm text-cyan-200 mb-3">Payment Mode</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSessionData({ ...sessionData, paymentMode: '5-stage' })}
                    className={`p-5 rounded-xl transition-all border-2 ${
                      sessionData.paymentMode === '5-stage'
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <Timer className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                    <h4 className="text-white mb-2">5-Stage Flow</h4>
                    <p className="text-xs text-cyan-200">Free join → Soft lock → Payment window → Hard lock → Confirmation</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
                      <Shield className="w-4 h-4" />
                      <span>Flexible & Fair</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSessionData({ ...sessionData, paymentMode: 'instant' })}
                    className={`p-5 rounded-xl transition-all border-2 ${
                      sessionData.paymentMode === 'instant'
                        ? 'border-cyan-500 bg-cyan-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <Zap className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                    <h4 className="text-white mb-2">Pay & Join</h4>
                    <p className="text-xs text-cyan-200">Instant confirmation with immediate payment</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-cyan-400">
                      <Sparkles className="w-4 h-4" />
                      <span>Quick & Simple</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Visibility Options - As Buttons */}
              <div>
                <label className="block text-sm text-cyan-200 mb-3">Session Visibility</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setSessionData({ ...sessionData, visibility: 'public' })}
                    className={`py-4 px-4 rounded-xl transition-all ${
                      sessionData.visibility === 'public'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <Globe className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm">Public</p>
                    <p className="text-xs opacity-70 mt-1">Everyone can join</p>
                  </button>
                  
                  <button
                    onClick={() => setSessionData({ ...sessionData, visibility: 'friends-only' })}
                    className={`py-4 px-4 rounded-xl transition-all ${
                      sessionData.visibility === 'friends-only'
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <UserCheck className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm">Friends Only</p>
                    <p className="text-xs opacity-70 mt-1">Only your friends</p>
                  </button>
                  
                  <button
                    onClick={() => setSessionData({ ...sessionData, visibility: 'private' })}
                    className={`py-4 px-4 rounded-xl transition-all ${
                      sessionData.visibility === 'private'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <Lock className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm">Private</p>
                    <p className="text-xs opacity-70 mt-1">Invite only</p>
                  </button>
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30">
                <h4 className="text-white mb-4">Price Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-cyan-200">
                    <span>Hourly Rate</span>
                    <span>₹{selectedClub.hourlyRate}/hr</span>
                  </div>
                  <div className="flex justify-between text-cyan-200">
                    <span>Duration</span>
                    <span>{sessionData.duration} hours</span>
                  </div>
                  <div className="flex justify-between text-cyan-200">
                    <span>Total Cost</span>
                    <span>₹{selectedClub.hourlyRate * sessionData.duration}</span>
                  </div>
                  <div className="flex justify-between text-cyan-200">
                    <span>Max Players</span>
                    <span>{sessionData.maxPlayers} players</span>
                  </div>
                  <div className="border-t border-purple-500/30 pt-3 flex justify-between">
                    <span className="text-white">Price Per Person</span>
                    <span className="text-white text-xl">₹{Math.ceil((selectedClub.hourlyRate * sessionData.duration) / sessionData.maxPlayers)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateSession}
                  className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 hover:from-purple-600 hover:via-pink-600 hover:to-cyan-600 text-white"
                >
                  Create Session 🎮
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
