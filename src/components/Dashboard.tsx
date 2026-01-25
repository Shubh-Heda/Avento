import { useState, useEffect } from 'react';
import { Search, Filter, Users, Heart, Sparkles, User, MessageCircle, Calendar, TrendingUp, Star, MapPin, Shield, GraduationCap, Award, HelpCircle, CreditCard, Map, Trophy, Camera, Video, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { AventoLogo } from './AventoLogo';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { AnimatedBackground } from './AnimatedBackground';
import { PaymentNotification } from './PaymentNotification';
import { PaymentModal } from './PaymentModal';
import { EmptyState } from './EmptyState';
import { GlobalSearch } from './GlobalSearch';
import { NotificationInbox } from './NotificationInbox';
import { MatchCountdownTimer } from './MatchCountdownTimer';
import { MatchCardSkeleton } from './LoadingSkeleton';
import { MenuDropdown } from './MenuDropdown';
import { FirstTimeUserGuide } from './FirstTimeUserGuide';

const sportsHeroImage = 'https://images.unsplash.com/photo-1509077613385-f89402467146?q=80&w=1940&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

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
}

interface UserProfile {
  name: string;
  bio: string;
  interests: string[];
  location: string;
  joinDate: string;
}

interface DashboardProps {
  onNavigate: (page: 'dashboard' | 'profile' | 'community' | 'sports-community' | 'reflection' | 'finder' | 'create-match' | 'turf-detail' | 'sports-chat' | 'help' | 'availability' | 'landing' | 'comprehensive-dashboard', turfId?: string, matchId?: string) => void;
  userProfile: UserProfile;
  matches: Match[];
}

export function Dashboard({ onNavigate, userProfile, matches }: DashboardProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false);
  
  // Get only upcoming matches
  const upcomingMatches = matches.filter(m => m.status === 'upcoming');

  // Check if user is new (first time visiting)
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('avento_sports_guide_completed');
    if (!hasSeenGuide) {
      setShowFirstTimeGuide(true);
    }
  }, []);

  const handlePayNow = (match: Match) => {
    setSelectedMatch(match);
    setShowPaymentModal(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* First Time User Guide */}
      {showFirstTimeGuide && (
        <FirstTimeUserGuide 
          onClose={() => setShowFirstTimeGuide(false)}
          category="sports"
        />
      )}
      {/* STUNNING Background Image - Friends playing sports together */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${sportsHeroImage})` }}
      ></div>
      
      {/* Minimal light overlay for contrast and readability - Background DOMINATES */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-cyan-50/20 to-emerald-50/25"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Payment Notifications - Show for all upcoming matches with payment required */}
        {upcomingMatches.map(match => (
          match.amount ? (
            <PaymentNotification
              key={match.id}
              matchDate={match.date}
              matchTime={match.time}
              amountPaid={0}
              totalAmount={match.amount}
              turfName={match.turfName}
            />
          ) : null
        ))}

        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Top Row - Logo and Actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onNavigate('landing')}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors group" title="Back to Home"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-700 group-hover:text-cyan-600 transition-colors" />
                </button>
                <AventoLogo size="md" variant="with-text" />
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowFirstTimeGuide(true)}
                  className="gap-2 hover:bg-purple-50"
                  title="Show Tutorial"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span className="hidden lg:inline">Guide</span>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => onNavigate('sports-chat')}
                  className="gap-2 hover:bg-cyan-50"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Chats</span>
                  <Badge className="bg-cyan-500 text-white text-xs">3</Badge>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => onNavigate('sports-community')}
                  className="gap-2 hover:bg-emerald-50 hidden md:flex"
                >
                  <Users className="w-4 h-4" />
                  Community
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => onNavigate('sports-events')}
                  className="gap-2 hover:bg-yellow-50 hidden md:flex"
                >
                  <Trophy className="w-4 h-4" />
                  Events
                </Button>
                <Button 
                  onClick={() => onNavigate('comprehensive-dashboard')}
                  className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white animate-pulse shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">New Features ✨</span>
                  <Badge className="bg-white text-purple-600 text-xs">17</Badge>
                </Button>
                
                {/* Menu Dropdown - Contains Profile, Help, Map, Notifications */}
                <MenuDropdown 
                  onNavigate={onNavigate} 
                  category="sports"
                  unreadNotifications={5}
                  userName={userProfile.name}
                />
              </div>
            </div>
            
            {/* Bottom Row - Global Search */}
            <div className="w-full">
              <GlobalSearch onNavigate={onNavigate} category="sports" />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
          {/* Welcome Section with Emotional Connection */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-emerald-400/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="mb-2">
                    Welcome back, <span className="bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">{userProfile.name}</span>! 👋
                  </h1>
                  <p className="text-slate-600">Your community is growing stronger with every match</p>
                </div>
                <div className="hidden md:block">
                  <div className="text-6xl">⚽</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image Section - Community in Action */}
          <div className="mb-8 relative group overflow-hidden rounded-3xl shadow-2xl">
            <img 
              src={sportsHeroImage} 
              alt="Friends playing sports together"
              className="w-full h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end">
              <div className="p-8 text-white w-full">
                <h2 className="text-white mb-3">🎯 The Spirit of Connection</h2>
                <p className="text-white/90 mb-4 max-w-2xl">
                  Every match is more than a game—it's a chance to build friendships, create memories, and belong to something special.
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => onNavigate('finder')}
                    className="bg-white text-cyan-600 hover:bg-slate-100"
                  >
                    Join a Match Today
                  </Button>
                  <Button 
                    onClick={() => onNavigate('sports-community')}
                    variant="outline"
                    className="border-white text-white hover:bg-white/20"
                  >
                    Explore Community
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Emotional Dashboard Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm border border-cyan-200 shadow-lg hover:shadow-xl transition-all p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 group-hover:text-white transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-cyan-600 group-hover:text-cyan-100 mb-1">Trust Score</p>
                    <div className="flex items-baseline gap-2">
                      <span>4.8</span>
                      <span className="text-cyan-600 group-hover:text-cyan-100">/5.0</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-cyan-100 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                    <Shield className="w-6 h-6 text-cyan-600 group-hover:text-white" />
                  </div>
                </div>
                <p className="text-sm text-slate-600 group-hover:text-cyan-100">You're known for reliability and respect 🌟</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-emerald-200 shadow-lg hover:shadow-xl transition-all p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 group-hover:text-white transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-emerald-600 group-hover:text-emerald-100 mb-1">Friendship Streak</p>
                    <div className="flex items-baseline gap-2">
                      <span>12</span>
                      <span className="text-emerald-600 group-hover:text-emerald-100">matches</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                    <TrendingUp className="w-6 h-6 text-emerald-600 group-hover:text-white" />
                  </div>
                </div>
                <p className="text-sm text-slate-600 group-hover:text-emerald-100">With Sarah & the weekend crew 🔥</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-purple-200 shadow-lg hover:shadow-xl transition-all p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 group-hover:text-white transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-purple-600 group-hover:text-purple-100 mb-1">Community Impact</p>
                    <div className="flex items-baseline gap-2">
                      <span>28</span>
                      <span className="text-purple-600 group-hover:text-purple-100">connections</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                    <Heart className="w-6 h-6 text-purple-600 group-hover:text-white" />
                  </div>
                </div>
                <p className="text-sm text-slate-600 group-hover:text-purple-100">You've helped 8 people find their first match ✨</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8">
            <Button
              size="lg"
              onClick={() => onNavigate('availability')}
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white gap-3 h-auto py-4"
            >
              <TrendingUp className="w-5 h-5" />
              <div className="text-left flex-1">
                <div>Find Players Available Now</div>
                <div className="text-xs opacity-90">See who's free to play instantly</div>
              </div>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate('create-match')}
              className="border-cyan-500 text-cyan-600 hover:bg-cyan-50 gap-3 h-auto py-4"
            >
              <Calendar className="w-5 h-5" />
              <div className="text-left flex-1">
                <div>Create Match Plan</div>
                <div className="text-xs opacity-70">Schedule a new game</div>
              </div>
            </Button>
          </div>

          {/* Upcoming Matches & Rituals */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-600" />
                <h2>Your Upcoming Matches</h2>
              </div>
            </div>

            {/* Countdown Timer for Next Match */}
            {upcomingMatches.length > 0 && upcomingMatches[0] && (
              <div className="mb-4">
                <MatchCountdownTimer
                  matchDate={upcomingMatches[0].date}
                  matchTime={upcomingMatches[0].time}
                  matchTitle={upcomingMatches[0].title}
                  showDismiss={true}
                />
              </div>
            )}

            {upcomingMatches.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No upcoming matches yet"
                description="Ready to make new friends? Join a match or create one to get started! Every game is a chance to build connections. ⚽"
                actionLabel="Find Matches"
                onAction={() => onNavigate('finder')}
                secondaryActionLabel="Create Match"
                onSecondaryAction={() => onNavigate('create-match')}
              />
            ) : (
              <div className="space-y-4">
                {upcomingMatches.map(match => (
                  <div key={match.id} className="flex items-start gap-4 p-4 bg-gradient-to-r from-cyan-50 to-emerald-50 rounded-xl border border-cyan-200 hover:shadow-md transition-shadow">
                    <ImageWithFallback 
                      src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop"
                      alt="Football field"
                      className="w-24 h-24 object-cover rounded-lg shadow-md"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3>{match.title}</h3>
                          <p className="text-slate-600">{match.turfName}{match.location ? ` • ${match.location}` : ''}</p>
                        </div>
                        <Badge className="bg-cyan-500 text-white">{match.sport}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                        <span>{match.date}, {match.time}</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          8/10 players
                        </span>
                        {match.amount && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CreditCard className="w-4 h-4" />
                            ₹{match.amount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-500 border-2 border-white flex items-center justify-center text-xs text-white shadow-md">S</div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 border-2 border-white flex items-center justify-center text-xs text-white shadow-md">M</div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 border-2 border-white flex items-center justify-center text-xs text-white shadow-md">R</div>
                          </div>
                          <span className="text-sm text-slate-600">Friends attending</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => onNavigate('sports-chat', undefined, match.id)}
                            variant="outline"
                            size="sm"
                            className="gap-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Chat
                          </Button>
                          {match.paymentOption === 'split' && match.amount && (
                            <Button
                              onClick={() => handlePayNow(match)}
                              size="sm"
                              className="gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
                            >
                              <CreditCard className="w-4 h-4" />
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search & Discover Turfs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2>Discover Turfs & Connect</h2>
              <Button 
                onClick={() => onNavigate('finder')}
                variant="outline"
                className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              >
                View All Turfs
              </Button>
            </div>
            
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input 
                  placeholder="Search turfs by name or location..."
                  className="pl-10 bg-white/80 backdrop-blur-sm border-slate-300"
                />
              </div>
              <Button variant="outline" className="gap-2 border-slate-300">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <TurfCard
                id="1"
                image="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop"
                sport="Football"
                name="Sky Sports Arena"
                location="Satellite, Ahmedabad"
                rating={4.8}
                price="₹1500/hr"
                trustScore={4.7}
                communitySize={45}
                onNavigate={onNavigate}
              />
              
              <TurfCard
                id="2"
                image="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=300&fit=crop"
                sport="Cricket"
                name="Victory Cricket Ground"
                location="Maninagar, Ahmedabad"
                rating={4.7}
                price="₹2000/hr"
                trustScore={4.9}
                communitySize={62}
                onNavigate={onNavigate}
              />
              
              <TurfCard
                id="3"
                image="https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop"
                sport="Basketball"
                name="Hoops Basketball Court"
                location="Vastrapur, Ahmedabad"
                rating={4.6}
                price="₹800/hr"
                trustScore={4.6}
                communitySize={38}
                onNavigate={onNavigate}
              />
              
              <TurfCard
                id="4"
                image="https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&h=300&fit=crop"
                sport="Football"
                name="Elite Football Academy"
                location="SG Highway, Ahmedabad"
                rating={4.9}
                price="₹1800/hr"
                trustScore={4.8}
                communitySize={56}
                onNavigate={onNavigate}
              />
              
              <TurfCard
                id="5"
                image="https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=300&fit=crop"
                sport="Cricket"
                name="Champions Cricket Turf"
                location="Naroda, Ahmedabad"
                rating={4.5}
                price="₹1700/hr"
                trustScore={4.5}
                communitySize={41}
                onNavigate={onNavigate}
              />
              
              <TurfCard
                id="6"
                image="https://images.unsplash.com/photo-1519766304817-4f37bda74a26?w=400&h=300&fit=crop"
                sport="Basketball"
                name="Urban Basketball Arena"
                location="Bodakdev, Ahmedabad"
                rating={4.7}
                price="₹1000/hr"
                trustScore={4.7}
                communitySize={48}
                onNavigate={onNavigate}
              />
            </div>
          </div>

          {/* Coaching CTA */}
          <div className="mt-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30\"></div>
            
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h2 className="mb-2 text-white">Level Up Your Game</h2>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Get professional coaching at your favorite turfs. Expert guidance, flexible plans, and personalized training from ₹2,999/month.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                  <Award className="w-4 h-4 text-white" />
                  <span className="text-sm text-white">Expert Coaches</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                  <Calendar className="w-4 h-4 text-white" />
                  <span className="text-sm text-white">Flexible Schedule</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                  <TrendingUp className="w-4 h-4 text-white" />
                  <span className="text-sm text-white">Track Progress</span>
                </div>
              </div>
              <Button 
                onClick={() => onNavigate('turf-detail', '1')}
                size="lg"
                className="bg-white text-purple-600 hover:bg-slate-50 shadow-lg gap-2"
              >
                <GraduationCap className="w-5 h-5" />
                Explore Coaching Plans
              </Button>
            </div>
          </div>

          {/* Post-Match Reflection CTA */}
          <div className="mt-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white rounded-2xl p-8 text-center shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
            <div className="relative z-10">
              <Heart className="w-12 h-12 mx-auto mb-4 text-white/90" />
              <h2 className="mb-2 text-white">Share Your Experience</h2>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Played recently? Take a moment to reflect, express gratitude, and strengthen your bonds.
              </p>
              <Button 
                onClick={() => onNavigate('reflection')}
                size="lg"
                className="bg-white text-purple-600 hover:bg-slate-50 shadow-lg"
              >
                Start Reflection
              </Button>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedMatch && (
          <PaymentModal
            onClose={() => setShowPaymentModal(false)}
            matchDate={selectedMatch.date}
            matchTime={selectedMatch.time}
            amountPaid={0}
            totalAmount={selectedMatch.amount || 0}
            turfName={selectedMatch.turfName}
          />
        )}
      </div>
    </div>
  );
}

function TurfCard({ 
  id,
  image, 
  sport, 
  name, 
  location, 
  rating, 
  price,
  trustScore,
  communitySize,
  onNavigate
}: { 
  id: string;
  image: string;
  sport: string;
  name: string;
  location: string;
  rating: number;
  price: string;
  trustScore: number;
  communitySize: number;
  onNavigate: (page: 'dashboard' | 'profile' | 'community' | 'reflection' | 'finder' | 'create-match' | 'turf-detail' | 'chat' | 'help', turfId?: string, matchId?: string) => void;
}) {
  return (
    <button
      onClick={() => onNavigate('turf-detail', id)}
      className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl hover:scale-105 transition-all text-left w-full"
    >
      <div className="relative">
        <ImageWithFallback 
          src={image}
          alt={name}
          className="w-full h-48 object-cover"
        />
        <Badge className="absolute top-3 right-3 bg-white text-slate-700 shadow-md">
          {sport}
        </Badge>
      </div>
      <div className="p-4">
        <h3 className="mb-1">{name}</h3>
        <div className="flex items-center gap-1 text-slate-600 mb-3">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span>{rating}</span>
          </div>
          <span className="text-cyan-600">{price}</span>
        </div>

        <div className="flex items-center gap-4 pt-3 border-t text-sm">
          <div className="flex items-center gap-1 text-slate-600">
            <ShieldIcon className="w-4 h-4 text-cyan-600" />
            <span>{trustScore} Trust</span>
          </div>
          <div className="flex items-center gap-1 text-slate-600">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>{communitySize} Active</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}