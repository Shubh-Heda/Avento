import { useState } from 'react';
import { Search, Filter, Users, Heart, Sparkles, User, MessageCircle, Calendar, TrendingUp, Star, MapPin, PartyPopper, HelpCircle, Ticket, Clock, Zap, Map, Trophy, Camera, Video, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { AventoLogo } from './AventoLogo';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { AnimatedBackground } from './AnimatedBackground';
import { PaymentNotification } from './PaymentNotification';
import { EmptyState } from './EmptyState';
import { GlobalSearch } from './GlobalSearch';
import { NotificationInbox } from './NotificationInbox';
import { MatchCountdownTimer } from './MatchCountdownTimer';
import { MenuDropdown } from './MenuDropdown';
import partyHeroImage from 'figma:asset/0af8b90ac57008e9f3c2d27238a5b8e1f3b85480.png';

interface UserProfile {
  name: string;
  bio: string;
  interests: string[];
  location: string;
  joinDate: string;
}

interface PartyDashboardProps {
  onNavigate: (page: string, turfId?: string, matchId?: string) => void;
  userProfile?: UserProfile;
  onBookParty?: (partyDetails: any) => void;
}

export function PartyDashboard({ onNavigate, userProfile: userProfileProp, onBookParty }: PartyDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock user profile - in production this would come from context/props
  const userProfile: UserProfile = userProfileProp || {
    name: 'Party Starter',
    bio: 'Love to celebrate life!',
    interests: ['Music', 'Dancing', 'Socializing'],
    location: 'Ahmedabad',
    joinDate: '2025-01-01'
  };

  const categories = [
    { id: 'all', label: 'All Parties', icon: Sparkles },
    { id: 'nightclub', label: 'Nightclub', icon: Zap },
    { id: 'birthday', label: 'Birthday', icon: PartyPopper },
    { id: 'social', label: 'Social Mixer', icon: Users },
    { id: 'theme', label: 'Theme Party', icon: Star },
  ];

  // Sample upcoming party with payment (for demo)
  const upcomingParty = {
    date: '2025-11-18',
    time: '9:00 PM',
    amount: 1200,
    name: 'Weekend Social Mixer'
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* STUNNING Background Image - DJ performing at nightclub with energetic crowd */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${partyHeroImage})` }}
      ></div>
      
      {/* Minimal gradient overlay for contrast and readability - Background DOMINATES */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-pink-50/20 to-orange-50/25"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Payment Notification for upcoming parties */}
        {upcomingParty.amount && (
          <PaymentNotification
            matchDate={upcomingParty.date}
            matchTime={upcomingParty.time}
            amountPaid={0}
            totalAmount={upcomingParty.amount}
            turfName={upcomingParty.name}
          />
        )}
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
                  <ArrowLeft className="w-5 h-5 text-slate-700 group-hover:text-pink-600 transition-colors" />
                </button>
                <AventoLogo size="md" variant="with-text" />
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  onClick={() => onNavigate('party-chat')}
                  className="gap-2 hover:bg-pink-50"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Chats</span>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => onNavigate('party-community')}
                  className="gap-2 hover:bg-pink-50 hidden md:flex"
                >
                  <Users className="w-4 h-4" />
                  Community
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => onNavigate('party-events')}
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
                  category="parties"
                  unreadNotifications={7}
                  userName={userProfile.name}
                />
              </div>
            </div>
            
            {/* Bottom Row - Global Search */}
            <div className="w-full">
              <GlobalSearch onNavigate={onNavigate} category="parties" />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
          {/* Welcome Section */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="mb-2">
                    Let's Celebrate, <span className="bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">{userProfile.name}</span>! 🎉
                  </h1>
                  <p className="text-slate-600">Discover amazing parties and celebrations happening around you</p>
                </div>
                <div className="hidden md:block">
                  <div className="text-6xl">🎊</div>
                </div>
              </div>
            </div>
          </div>

          {/* Emotional Dashboard Highlights */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm border border-pink-200 shadow-lg hover:shadow-xl transition-all p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 group-hover:text-white transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-pink-600 group-hover:text-pink-100 mb-1">Parties Attended</p>
                    <div className="flex items-baseline gap-2">
                      <span>18</span>
                      <span className="text-pink-600 group-hover:text-pink-100">parties</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-pink-100 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                    <PartyPopper className="w-6 h-6 text-pink-600 group-hover:text-white" />
                  </div>
                </div>
                <p className="text-sm text-slate-600 group-hover:text-pink-100">You know how to celebrate! 🎉</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-orange-200 shadow-lg hover:shadow-xl transition-all p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 group-hover:text-white transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-orange-600 group-hover:text-orange-100 mb-1">Party Crew</p>
                    <div className="flex items-baseline gap-2">
                      <span>32</span>
                      <span className="text-orange-600 group-hover:text-orange-100">friends</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                    <Users className="w-6 h-6 text-orange-600 group-hover:text-white" />
                  </div>
                </div>
                <p className="text-sm text-slate-600 group-hover:text-orange-100">Your celebration squad 🥳</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-fuchsia-200 shadow-lg hover:shadow-xl transition-all p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 group-hover:text-white transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-fuchsia-600 group-hover:text-fuchsia-100 mb-1">Vibe Score</p>
                    <div className="flex items-baseline gap-2">
                      <span>4.9</span>
                      <span className="text-fuchsia-600 group-hover:text-fuchsia-100">/5.0</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-fuchsia-100 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                    <Zap className="w-6 h-6 text-fuchsia-600 group-hover:text-white" />
                  </div>
                </div>
                <p className="text-sm text-slate-600 group-hover:text-fuchsia-100">You bring the energy! ⚡</p>
              </div>
            </div>
          </div>

          {/* Hero Image Section - DJ/Nightclub Energy */}
          <div className="mb-8 relative group overflow-hidden rounded-3xl shadow-2xl">
            <img 
              src={partyHeroImage} 
              alt="DJ performing at a nightclub with energetic crowd"
              className="w-full h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end">
              <div className="p-8 text-white w-full">
                <h2 className="text-white mb-3">🎧 Feel the Vibe, Live the Moment</h2>
                <p className="text-white/90 mb-4 max-w-2xl">
                  From high-energy nightclubs to intimate gatherings—every party is a chance to celebrate, connect, and create unforgettable memories.
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => onBookParty && onBookParty({ title: 'Hot Party' })}
                    className="bg-white text-pink-600 hover:bg-slate-100"
                  >
                    Get Tickets Now
                  </Button>
                  <Button 
                    onClick={() => onNavigate('party-community')}
                    variant="outline"
                    className="border-white text-white hover:bg-white/20"
                  >
                    Join Party Community
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  className={selectedCategory === cat.id 
                    ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white' 
                    : 'border-pink-200 text-pink-600 hover:bg-pink-50'
                  }
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {cat.label}
                </Button>
              );
            })}
          </div>

          {/* Happening Tonight */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-pink-600" />
                <h2>Happening Tonight</h2>
              </div>
              <Badge className="bg-gradient-to-r from-pink-500 to-orange-500 text-white">Hot 🔥</Badge>
            </div>

            <div className="space-y-4">
              <PartyCard
                image="https://images.unsplash.com/photo-1713885462557-12b5c41f22cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"
                title="Electric Nights"
                category="Nightclub"
                venue="Skye Lounge"
                location="SG Highway, Ahmedabad"
                date="Tonight"
                time="9:00 PM"
                price="₹999"
                attendees={156}
                rating={4.8}
                tags={['EDM', 'DJ Night', '21+']}
                onNavigate={onNavigate}
                onBookParty={onBookParty}
              />
              <PartyCard
                image="https://images.unsplash.com/photo-1758275557553-0c46c061d43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"
                title="Saturday Social"
                category="Social Mixer"
                venue="The Urban Hub"
                location="Vastrapur, Ahmedabad"
                date="Tonight"
                time="8:00 PM"
                price="₹599"
                attendees={89}
                rating={4.7}
                tags={['Meet New People', 'Games', 'All Ages']}
                onNavigate={onNavigate}
                onBookParty={onBookParty}
              />
              <PartyCard
                image="https://images.unsplash.com/photo-1762237874410-17ddf6c782a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"
                title="Rooftop Revelry"
                category="Theme Party"
                venue="Cloud 9 Terrace"
                location="Bodakdev, Ahmedabad"
                date="Tonight"
                time="7:30 PM"
                price="₹799"
                attendees={124}
                rating={4.9}
                tags={['Retro Theme', 'Live Band', 'Couples']}
                onNavigate={onNavigate}
                onBookParty={onBookParty}
              />
            </div>
          </div>

          {/* This Weekend */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2>This Weekend's Hottest Parties</h2>
            </div>
            
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input 
                  placeholder="Search parties by name or location..."
                  className="pl-10 bg-white/80 backdrop-blur-sm border-slate-300"
                />
              </div>
              <Button variant="outline" className="gap-2 border-slate-300">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <PartyVenueCard
                id="1"
                image="https://images.unsplash.com/photo-1713885462557-12b5c41f22cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"
                name="Nexus Nightclub"
                location="Satellite, Ahmedabad"
                rating={4.9}
                category="Premium Nightclub"
                upcomingParties={6}
                onNavigate={onNavigate}
              />
              
              <PartyVenueCard
                id="2"
                image="https://images.unsplash.com/photo-1762237874410-17ddf6c782a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"
                name="Sky Lounge & Bar"
                location="CG Road, Ahmedabad"
                rating={4.8}
                category="Rooftop Venue"
                upcomingParties={4}
                onNavigate={onNavigate}
              />
              
              <PartyVenueCard
                id="3"
                image="https://images.unsplash.com/photo-1758275557553-0c46c061d43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"
                name="The Social House"
                location="Vastrapur, Ahmedabad"
                rating={4.7}
                category="Social Venue"
                upcomingParties={8}
                onNavigate={onNavigate}
              />
            </div>
          </div>

          {/* Upcoming Premium Experiences */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">✨ Premium Experiences</h2>
              <Button variant="ghost" className="text-pink-600 hover:bg-pink-50">
                See All →
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* VIP Experience Card */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 hover:shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">👑</div>
                  <Badge className="bg-amber-500 text-white">VIP</Badge>
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">VIP Table Lounge</h3>
                <p className="text-slate-600 mb-4 text-sm">Exclusive lounge access with bottle service and prime seating at any venue</p>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-lg font-semibold text-orange-600">₹4999 onwards</span>
                  <span className="text-xs bg-white px-3 py-1 rounded-full text-amber-700">Limited Spots</span>
                </div>
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                  Reserve VIP
                </Button>
              </div>

              {/* Couple Package Card */}
              <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 hover:shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">💑</div>
                  <Badge className="bg-red-500 text-white">Special</Badge>
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">Couple's Night Out</h3>
                <p className="text-slate-600 mb-4 text-sm">Romantic dinner-party combo with champagne and complimentary photography</p>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-lg font-semibold text-red-600">₹2999 per couple</span>
                  <span className="text-xs bg-white px-3 py-1 rounded-full text-red-700">Most Popular</span>
                </div>
                <Button className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white">
                  Book Package
                </Button>
              </div>
            </div>
          </div>

          {/* Party Trends & Social Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-cyan-100 p-5 hover:shadow-lg transition-all">
              <div className="text-3xl mb-2">🔥</div>
              <p className="text-slate-600 text-sm mb-1">Trending Tonight</p>
              <p className="text-xl font-bold text-slate-900">12 parties</p>
              <p className="text-xs text-cyan-600 mt-2">+3 from yesterday</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-purple-100 p-5 hover:shadow-lg transition-all">
              <div className="text-3xl mb-2">👥</div>
              <p className="text-slate-600 text-sm mb-1">Active Users</p>
              <p className="text-xl font-bold text-slate-900">2.4K</p>
              <p className="text-xs text-purple-600 mt-2">Partying now</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-100 p-5 hover:shadow-lg transition-all">
              <div className="text-3xl mb-2">⭐</div>
              <p className="text-slate-600 text-sm mb-1">Avg Rating</p>
              <p className="text-xl font-bold text-slate-900">4.7/5</p>
              <p className="text-xs text-pink-600 mt-2">From 2,456 reviews</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-orange-100 p-5 hover:shadow-lg transition-all">
              <div className="text-3xl mb-2">🎊</div>
              <p className="text-slate-600 text-sm mb-1">This Month</p>
              <p className="text-xl font-bold text-slate-900">156 parties</p>
              <p className="text-xs text-orange-600 mt-2">All genres</p>
            </div>
          </div>

          {/* Special Offers & Deals */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">🎁 Special Deals This Week</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Early Bird Discount */}
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-4xl">🐤</div>
                <h3 className="text-2xl font-bold mb-2">Early Bird Special</h3>
                <p className="text-white/90 mb-4">Book before 6 PM and get 20% off on any party</p>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">20% OFF</span>
                  <Button className="bg-white text-blue-600 hover:bg-slate-100">Use Code: EARLY20</Button>
                </div>
              </div>

              {/* Group Discount */}
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-4xl">👫</div>
                <h3 className="text-2xl font-bold mb-2">Group Bonanza</h3>
                <p className="text-white/90 mb-4">Bring 4 friends and get free entry for 1 person</p>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">1 FREE</span>
                  <Button className="bg-white text-green-600 hover:bg-slate-100">Learn More</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Party Finder Assistant */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-8 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">🤖 Party Finder AI</h3>
                <p className="text-slate-600">Tell us what kind of party you're in the mood for, and we'll find perfect matches!</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Input placeholder="What kind of party are you looking for? (e.g., 'relaxed cocktail bar' or 'high-energy dancing')" className="flex-1 bg-white" />
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                Find Parties
              </Button>
            </div>
          </div>
        
          {/* Create Your Party CTA */}
          <div className="mt-8 bg-gradient-to-br from-pink-500 via-fuchsia-500 to-orange-500 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
            
            <div className="relative z-10 text-center">
              <PartyPopper className="w-12 h-12 mx-auto mb-4 text-white/90" />
              <h2 className="mb-2 text-white">Host Your Own Party</h2>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Planning a celebration? Create your party and invite friends from our amazing community!
              </p>
              <Button 
                onClick={() => onNavigate('community')}
                size="lg"
                className="bg-white text-pink-600 hover:bg-slate-50 shadow-lg"
              >
                Join Community
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PartyCard({ 
  image, 
  title, 
  category,
  venue, 
  location, 
  date,
  time, 
  price,
  attendees,
  rating,
  tags,
  onNavigate,
  onBookParty
}: { 
  image: string;
  title: string;
  category: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  price: string;
  attendees: number;
  rating: number;
  tags: string[];
  onNavigate: (page: string, turfId?: string, matchId?: string) => void;
  onBookParty?: (partyDetails: any) => void;
}) {
  const handleGetTickets = () => {
    // Call the booking function if available
    if (onBookParty) {
      onBookParty({
        title,
        venue,
        location,
        date,
        time,
        price,
        attendees,
        rating,
        tags,
        category,
        image
      });
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl border border-pink-200 hover:shadow-md transition-shadow">
      <ImageWithFallback 
        src={image}
        alt={title}
        className="w-32 h-32 object-cover rounded-lg shadow-md"
      />
      <div className="flex-1">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3>{title}</h3>
            <p className="text-slate-600">{venue} • {location}</p>
          </div>
          <Badge className="bg-gradient-to-r from-pink-500 to-orange-500 text-white">{category}</Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {time}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {attendees} going
          </span>
        </div>
        <div className="flex gap-2 mb-3">
          {tags.map(tag => (
            <Badge key={tag} variant="outline" className="border-pink-300 text-pink-600 text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>{rating}</span>
            </div>
            <span className="text-pink-600">{price}</span>
          </div>
          <Button
            onClick={handleGetTickets}
            size="sm"
            className="gap-2 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white"
          >
            <Ticket className="w-4 h-4" />
            Get Tickets
          </Button>
        </div>
      </div>
    </div>
  );
}

function PartyVenueCard({ 
  id,
  image, 
  name, 
  location, 
  rating,
  category,
  upcomingParties,
  onNavigate
}: { 
  id: string;
  image: string;
  name: string;
  location: string;
  rating: number;
  category: string;
  upcomingParties: number;
  onNavigate: (page: string, turfId?: string, matchId?: string) => void;
}) {
  const handleViewParties = () => {
    // Navigate to venue-specific party list
    onNavigate('venue-parties', id);
  };

  return (
    <div
      className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl hover:scale-105 transition-all w-full"
    >
      <div className="relative">
        <ImageWithFallback 
          src={image}
          alt={name}
          className="w-full h-48 object-cover"
        />
        <Badge className="absolute top-3 right-3 bg-white text-slate-700 shadow-md">
          {category}
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
          <span className="text-pink-600">{upcomingParties} parties</span>
        </div>

        <Button
          onClick={handleViewParties}
          size="sm"
          className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white"
        >
          View Parties
        </Button>
      </div>
    </div>
  );
}