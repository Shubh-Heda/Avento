import { useState } from 'react';
import { Heart, ArrowLeft, Star, Sparkles, Send, Users, ThumbsUp, MessageSquare, TrendingUp, Zap, Shield, Clock, Smile } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface PostMatchReflectionProps {
  onNavigate: (page: 'dashboard' | 'profile' | 'community' | 'reflection' | 'finder' | 'create-match' | 'turf-detail' | 'chat' | 'availability', turfId?: string, matchId?: string) => void;
}

interface PlayerBehavior {
  playerId: string;
  punctuality: number; // 1-5
  sportsmanship: number; // 1-5
  communication: number; // 1-5
  skillLevel: number; // 1-5
  wouldPlayAgain: boolean;
  notes: string;
}

export function PostMatchReflection({ onNavigate }: PostMatchReflectionProps) {
  const [gratitude, setGratitude] = useState('');
  const [highlight, setHighlight] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  
  // Personalized behavior tracking
  const [playerBehaviors, setPlayerBehaviors] = useState<Record<string, PlayerBehavior>>({});
  
  // System feedback
  const [overallConcept, setOverallConcept] = useState<number>(0);
  const [conceptFeedback, setConceptFeedback] = useState('');
  const [featureRatings, setFeatureRatings] = useState<Record<string, number>>({});
  const [improvementSuggestions, setImprovementSuggestions] = useState('');

  const players = [
    { id: '1', name: 'Sarah', initial: 'S', color: 'from-cyan-400 to-cyan-500' },
    { id: '2', name: 'Mike', initial: 'M', color: 'from-purple-400 to-purple-500' },
    { id: '3', name: 'Rahul', initial: 'R', color: 'from-orange-400 to-orange-500' },
    { id: '4', name: 'Priya', initial: 'P', color: 'from-pink-400 to-pink-500' },
  ];

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const updatePlayerBehavior = (playerId: string, field: keyof PlayerBehavior, value: any) => {
    setPlayerBehaviors(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        playerId,
        [field]: value
      }
    }));
  };

  const setFeatureRating = (feature: string, rating: number) => {
    setFeatureRatings(prev => ({ ...prev, [feature]: rating }));
  };

  const handleSubmit = () => {
    // Validate that at least some feedback is provided
    if (!gratitude && !highlight && selectedPlayers.length === 0 && !overallConcept) {
      toast.error('Please provide at least some feedback before submitting');
      return;
    }

    // Log feedback for analytics (would send to backend)
    console.log('Reflection submitted:', {
      gratitude,
      highlight,
      selectedPlayers,
      playerBehaviors,
      overallConcept,
      conceptFeedback,
      featureRatings,
      improvementSuggestions
    });

    toast.success('Thank you for your detailed feedback! 🙏');
    setSubmitted(true);
    setTimeout(() => {
      onNavigate('dashboard');
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl p-12 shadow-xl">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-white fill-white" />
            </div>
            <h2 className="mb-3">Reflection Shared! ✨</h2>
            <p className="text-slate-600 mb-6">
              Your gratitude has been shared with the community. These moments of appreciation strengthen our bonds.
            </p>
            <div className="text-sm text-slate-500">
              Returning to dashboard...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => onNavigate('dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="mb-3">Post-Match Reflection</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Take a moment to celebrate the match, express gratitude, and strengthen the emotional bonds with your teammates.
          </p>
        </div>

        {/* Match Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-lg flex items-center justify-center">
              <Users className="w-8 h-8 text-cyan-600" />
            </div>
            <div>
              <h2>Saturday Football Match</h2>
              <p className="text-slate-600">Sky Sports Arena • Nov 9, 2024</p>
            </div>
            <Badge className="ml-auto bg-emerald-100 text-emerald-700">Just Completed</Badge>
          </div>
        </div>

        {/* Reflection Form */}
        <div className="space-y-6">
          {/* Who made a difference? */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <h3>Who made a difference today?</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Select teammates who made your experience special
            </p>
            <div className="flex flex-wrap gap-3">
              {players.map(player => (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    selectedPlayers.includes(player.id)
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${player.color} flex items-center justify-center text-white text-sm`}>
                    {player.initial}
                  </div>
                  <span>{player.name}</span>
                  {selectedPlayers.includes(player.id) && (
                    <Heart className="w-4 h-4 text-cyan-600 fill-cyan-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Player Feedback */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <h3>Personalized Teammate Feedback (Optional)</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}
              >
                {showDetailedFeedback ? 'Hide' : 'Show'} Details
              </Button>
            </div>
            <p className="text-slate-600 mb-4">
              Help us build a better community by rating each teammate's behavior
            </p>
            
            {showDetailedFeedback && (
              <div className="space-y-6 mt-6">
                {players.map(player => (
                  <div key={player.id} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${player.color} flex items-center justify-center text-white`}>
                        {player.initial}
                      </div>
                      <h4 className="text-lg font-semibold">{player.name}</h4>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Punctuality */}
                      <div>
                        <label className="text-sm text-slate-700 mb-2 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Punctuality
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(rating => (
                            <button
                              key={rating}
                              onClick={() => updatePlayerBehavior(player.id, 'punctuality', rating)}
                              className={`w-8 h-8 rounded-full text-sm ${
                                playerBehaviors[player.id]?.punctuality === rating
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-slate-200 hover:bg-slate-300'
                              }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sportsmanship */}
                      <div>
                        <label className="text-sm text-slate-700 mb-2 flex items-center gap-1">
                          <Shield className="w-4 h-4" />
                          Sportsmanship
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(rating => (
                            <button
                              key={rating}
                              onClick={() => updatePlayerBehavior(player.id, 'sportsmanship', rating)}
                              className={`w-8 h-8 rounded-full text-sm ${
                                playerBehaviors[player.id]?.sportsmanship === rating
                                  ? 'bg-green-500 text-white'
                                  : 'bg-slate-200 hover:bg-slate-300'
                              }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Communication */}
                      <div>
                        <label className="text-sm text-slate-700 mb-2 flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          Communication
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(rating => (
                            <button
                              key={rating}
                              onClick={() => updatePlayerBehavior(player.id, 'communication', rating)}
                              className={`w-8 h-8 rounded-full text-sm ${
                                playerBehaviors[player.id]?.communication === rating
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-slate-200 hover:bg-slate-300'
                              }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Skill Level */}
                      <div>
                        <label className="text-sm text-slate-700 mb-2 flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          Skill Level
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(rating => (
                            <button
                              key={rating}
                              onClick={() => updatePlayerBehavior(player.id, 'skillLevel', rating)}
                              className={`w-8 h-8 rounded-full text-sm ${
                                playerBehaviors[player.id]?.skillLevel === rating
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-slate-200 hover:bg-slate-300'
                              }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Would play again */}
                    <div className="mt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={playerBehaviors[player.id]?.wouldPlayAgain || false}
                          onChange={(e) => updatePlayerBehavior(player.id, 'wouldPlayAgain', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">Would play with {player.name} again</span>
                      </label>
                    </div>

                    {/* Additional notes */}
                    <div className="mt-3">
                      <Textarea
                        placeholder={`Any additional feedback about ${player.name}? (Optional)`}
                        value={playerBehaviors[player.id]?.notes || ''}
                        onChange={(e) => updatePlayerBehavior(player.id, 'notes', e.target.value)}
                        className="text-sm min-h-20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gratitude */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-purple-500" />
              <h3>Express Gratitude</h3>
            </div>
            <p className="text-slate-600 mb-4">
              What are you grateful for from today's match?
            </p>
            <Textarea
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder="I'm grateful for... (e.g., 'Sarah's encouraging words when I missed that shot really lifted my spirits')"
              className="min-h-32"
            />
          </div>

          {/* Highlight */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-orange-500" />
              <h3>Your Highlight Moment</h3>
            </div>
            <p className="text-slate-600 mb-4">
              What was the most memorable moment for you?
            </p>
            <Textarea
              value={highlight}
              onChange={(e) => setHighlight(e.target.value)}
              placeholder="Share your favorite moment from today... (e.g., 'When we all laughed after that unexpected goal!')"
              className="min-h-32"
            />
          </div>

          {/* Emotional Check-in */}
          <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl border border-emerald-200 p-6">
            <h3 className="mb-4">How do you feel after today's match?</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { emoji: '😊', label: 'Happy', color: 'emerald' },
                { emoji: '💪', label: 'Energized', color: 'cyan' },
                { emoji: '🤝', label: 'Connected', color: 'purple' },
                { emoji: '✨', label: 'Inspired', color: 'orange' },
              ].map((feeling) => (
                <button
                  key={feeling.label}
                  className={`p-4 bg-white rounded-lg border-2 border-${feeling.color}-200 hover:border-${feeling.color}-400 transition-all text-center`}
                >
                  <div className="text-3xl mb-2">{feeling.emoji}</div>
                  <div className="text-sm text-slate-700">{feeling.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* System Feedback */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3>Help Us Improve</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Your feedback shapes our platform. How would you rate the overall Avento experience?
            </p>
            
            {/* Overall Rating */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-slate-700 mb-3 block">
                Overall Experience Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setOverallConcept(rating)}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      overallConcept === rating
                        ? 'border-blue-500 bg-blue-50 scale-105'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">
                      {rating === 1 ? '😞' : rating === 2 ? '😕' : rating === 3 ? '😐' : rating === 4 ? '😊' : '🤩'}
                    </div>
                    <div className="text-xs text-slate-600">{rating}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Feature-specific ratings */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-slate-700 mb-3 block">
                Rate Specific Features (1-5 stars)
              </label>
              <div className="space-y-3">
                {[
                  { key: 'matching', label: 'Match Finding System', icon: Users },
                  { key: 'payment', label: '5-Stage Payment Flow', icon: TrendingUp },
                  { key: 'communication', label: 'Chat & Communication', icon: MessageSquare },
                  { key: 'trust', label: 'Trust Score System', icon: Shield },
                ].map(feature => (
                  <div key={feature.key} className="flex items-center justify-between bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <feature.icon className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-700">{feature.label}</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          onClick={() => setFeatureRating(feature.key, rating)}
                          className={`w-7 h-7 rounded text-xs ${
                            featureRatings[feature.key] === rating
                              ? 'bg-yellow-400 text-white'
                              : 'bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Concept Feedback */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                What do you think about the overall concept?
              </label>
              <Textarea
                value={conceptFeedback}
                onChange={(e) => setConceptFeedback(e.target.value)}
                placeholder="Share your thoughts on Avento's approach to building friendships through sports..."
                className="min-h-24"
              />
            </div>

            {/* Improvement Suggestions */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                What features would you like to see added?
              </label>
              <Textarea
                value={improvementSuggestions}
                onChange={(e) => setImprovementSuggestions(e.target.value)}
                placeholder="Suggest improvements or new features... (e.g., 'Video highlights sharing', 'Skill-based matchmaking', etc.)"
                className="min-h-24"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => onNavigate('dashboard')}
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!gratitude && !highlight && selectedPlayers.length === 0}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2"
            >
              <Send className="w-4 h-4" />
              Share Reflection
            </Button>
          </div>
        </div>

        {/* Why This Matters */}
        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="mb-3">Why Reflections Matter</h3>
          <p className="text-slate-600">
            Post-match reflections aren't just about looking back — they're about building deeper connections. 
            When you express gratitude and share meaningful moments, you strengthen trust, create emotional safety, 
            and help everyone feel seen and valued in the community. These small rituals turn games into lasting friendships.
          </p>
        </div>
      </div>
    </div>
  );
}