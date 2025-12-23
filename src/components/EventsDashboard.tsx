import { useState } from 'react';
import { Search, Filter, Users, Heart, Sparkles, User, MessageCircle, Calendar, TrendingUp, Star, MapPin, Shield, Music, HelpCircle, Ticket, Clock, Map, Trophy, Camera, Video, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
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
import eventsBackgroundImage from 'figma:asset/5920481c5d9f82bea22cf2d117dfcaeb8e4a39c7.png';
import eventsHeroImage from 'figma:asset/a405f329b597be91eeb4b4ea02415753c919ddd2.png';

interface UserProfile {
  name: string;
  bio: string;
  interests: string[];
  location: string;
  joinDate: string;
}

interface EventsDashboardProps {
  onNavigate: (page: 'events-dashboard' | 'events-profile' | 'cultural-community' | 'landing' | 'help' | 'events-chat' | 'comprehensive-dashboard', param?: string) => void;
  userProfile: UserProfile;
  onBookEvent: (eventDetails: any) => void;
}

export function EventsDashboard({ onNavigate, userProfile, onBookEvent }: EventsDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Events', icon: Sparkles },
    { id: 'music', label: 'Music & Concerts', icon: Music },
    { id: 'art', label: 'Art & Exhibitions', icon: Star },
    { id: 'dance', label: 'Dance & Performance', icon: TrendingUp },
    { id: 'cultural', label: 'Cultural Festivals', icon: Heart },
  ];

  // Sample upcoming event with payment (for demo)
  const upcomingEvent = {
    date: '2025-11-20',
    time: '7:00 PM',
    amount: 500,
    name: 'Cultural Music Festival'
  };

  return (
    <div className="min-h-screen relative">
      {/* STUNNING Background Image - Outdoor concert with live performance and audience */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${eventsHeroImage})` }}
      ></div>
      
      {/* Minimal Gradient Overlay - Background should shine through */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-purple-50/20 to-pink-50/25"></div>
      
      {/* Animated Background - Very subtle, just sparkle effects */}
      <div className="absolute inset-0 opacity-10">
        <AnimatedBackground variant="events" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Payment Notification for upcoming events */}
        {upcomingEvent.amount && (
          <PaymentNotification
            matchDate={upcomingEvent.date}
            matchTime={upcomingEvent.time}
            amountPaid={0}
            totalAmount={upcomingEvent.amount}
            turfName={upcomingEvent.name}
          />
        )}
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Top Row - Logo and Actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button                   onClick={() => onNavigate('landing')}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors group" title="Back to Home"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-700 group-hover:text-purple-600 transition-colors" />
                </button>
                <button                   onClick={() => onNavigate('landing')}
                  className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                >
                  <Music className="w-6 h-6 text-white" />
                </button>
                <div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Cultural Events</span>
                  <p className="text-xs text-slate-600">Discover & Connect Through Culture</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Map View Button */}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onNavigate('events-dashboard')} // Will add map page navigation later
                  className="gap-2 hover:bg-purple-50 hidden md:flex"
                >
                  <Map className="w-4 h-4" />
                  Map
                </Button>
                
                {/* Notification Inbox */}
                <NotificationInbox onNavigate={onNavigate} category="events" />
                
                <Button 
                  variant="ghost" 
                  onClick={() => onNavigate('events-chat')}
                  className="gap-2 hover:bg-purple-50"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Chats</span>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => onNavigate('cultural-community')}
                  className="gap-2 hover:bg-purple-50 hidden md:flex"
                >
                  <Users className="w-4 h-4" />
                  Community
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => onNavigate('events-events')}
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
                  category="events"
                  unreadNotifications={3}
                  userName={userProfile.name}
                />
              </div>
            </div>
            
            {/* Bottom Row - Global Search */}
            <div className="w-full">
              <GlobalSearch onNavigate={onNavigate} category="events" />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
          {/* Welcome Section */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="mb-2">
                    Welcome to <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Cultural Events</span>, {userProfile.name}! 
                  </h1>
                  <p className="text-slate-600">Discover amazing cultural experiences happening around you</p>
                </div>
                <div className="hidden md:block">
                  <div className="text-6xl">🎨</div>
                </div>
              </div>
            </div>
          </div>

          {/* Emotional Dashboard Highlights */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm border border-purple-200 shadow-lg hover:shadow-xl transition-all p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 group-hover:text-white transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-purple-600 group-hover:text-purple-100 mb-1">Events Attended</p>
                    <div className="flex items-baseline gap-2">
                      <span>23</span>
                      <span className="text-purple-600 group-hover:text-purple-100">events</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                    <Music className="w-6 h-6 text-purple-600 group-hover:text-white" />
                  </div>
                </div>
                <p className="text-sm text-slate-600 group-hover:text-purple-100">You're a cultural explorer! 🌟</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-pink-200 shadow-lg hover:shadow-xl transition-all p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 group-hover:text-white transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-pink-600 group-hover:text-pink-100 mb-1">Cultural Connections</p>
                    <div className="flex items-baseline gap-2">
                      <span>47</span>
                      <span className="text-pink-600 group-hover:text-pink-100">friends</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-pink-100 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                    <Users className="w-6 h-6 text-pink-600 group-hover:text-white" />
                  </div>
                </div>
                <p className="text-sm text-slate-600 group-hover:text-pink-100">Met through shared experiences 💫</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-indigo-200 shadow-lg hover:shadow-xl transition-all p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 group-hover:text-white transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-indigo-600 group-hover:text-indigo-100 mb-1">Favorite Genre</p>
                    <div className="flex items-baseline gap-2">
                      <span>Jazz</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                    <Heart className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                  </div>
                </div>
                <p className="text-sm text-slate-600 group-hover:text-indigo-100">Your most attended events 🎵</p>
              </div>
            </div>
          </div>

          {/* Hero Image Section - Outdoor Concert Experience */}
          <div className="mb-8 relative group overflow-hidden rounded-3xl shadow-2xl">
            <img 
              src={eventsHeroImage} 
              alt="Live outdoor concert with community" 
              className="w-full h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end">
              <div className="p-8 text-white w-full">
                <h2 className="text-white mb-3">🎵 Experience Live Together</h2>
                <p className="text-white/90 mb-4 max-w-2xl">
                  From intimate concerts to grand festivals—every event is a celebration of culture, connection, and community.
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => onBookEvent({ title: 'Featured Event' })}
                    className="bg-white text-purple-600 hover:bg-slate-100"
                  >
                    Book Your Next Experience
                  </Button>
                  <Button 
                    onClick={() => onNavigate('cultural-community')}
                    variant="outline"
                    className="border-white text-white hover:bg-white/20"
                  >
                    Join Cultural Community
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
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                  }
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {cat.label}
                </Button>
              );
            })}
          </div>

          {/* Upcoming Featured Events */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h2>Featured Events This Week</h2>
              </div>
            </div>

            <div className="space-y-4">
              <EventCard
                id="event-jazz"
                image="https://images.unsplash.com/photo-1557750674-5e01bafc85c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"
                title="Jazz Under the Stars"
                category="Music & Concerts"
                venue="Phoenix Marketcity Amphitheater"
                location="Ahmedabad"
                date="Nov 16, 2025"
                time="7:00 PM"
                price="₹499"
                attendees={234}
                rating={4.9}
                onBookEvent={onBookEvent}
              />
              <EventCard
                id="event-art"
                image="https://images.unsplash.com/photo-1719935115623-4857df23f3c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"
                title="Modern Art Exhibition"
                category="Art & Exhibitions"
                venue="Amdavad Ni Gufa"
                location="Ahmedabad"
                date="Nov 17, 2025"
                time="10:00 AM"
                price="₹150"
                attendees={156}
                rating={4.7}
                onBookEvent={onBookEvent}
              />
              <EventCard
                id="event-garba"
                image="https://images.unsplash.com/photo-1698824554771-293b5dcc42db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"
                title="Navratri Garba Night"
                category="Cultural Festivals"
                venue="Karnavati Club"
                location="Ahmedabad"
                date="Nov 18, 2025"
                time="8:00 PM"
                price="₹799"
                attendees={567}
                rating={4.9}
                onBookEvent={onBookEvent}
              />
            </div>
          </div>

          {/* Discover All Events */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2>Discover More Events</h2>
            </div>
            
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input 
                  placeholder="Search events by name or location..."
                  className="pl-10 bg-white/80 backdrop-blur-sm border-slate-300"
                />
              </div>
              <Button variant="outline" className="gap-2 border-slate-300">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <EventVenueCard
                id="1"
                image="https://images.unsplash.com/photo-1761618291331-535983ae4296?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"
                name="Riverside Arts Center"
                location="Sabarmati, Ahmedabad"
                rating={4.8}
                category="Multi-Purpose Venue"
                upcomingEvents={12}
              />
              
              <EventVenueCard
                id="2"
                image="https://images.unsplash.com/photo-1557750674-5e01bafc85c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"
                name="Symphony Music Hall"
                location="SG Highway, Ahmedabad"
                rating={4.9}
                category="Music Venue"
                upcomingEvents={8}
              />
              
              <EventVenueCard
                id="3"
                image="https://images.unsplash.com/photo-1719935115623-4857df23f3c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"
                name="Gallery 108"
                location="Navrangpura, Ahmedabad"
                rating={4.7}
                category="Art Gallery"
                upcomingEvents={5}
              />
            </div>
          </div>

          {/* CTA for Community */}
          <div className="mt-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
            
            <div className="relative z-10 text-center">
              <Heart className="w-12 h-12 mx-auto mb-4 text-white/90" />
              <h2 className="mb-2 text-white">Share Your Cultural Experience</h2>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Attended an amazing event? Share your experience and connect with fellow culture enthusiasts!
              </p>
              <Button 
                onClick={() => onNavigate('cultural-community')}
                size="lg"
                className="bg-white text-purple-600 hover:bg-slate-50 shadow-lg"
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

function EventCard({ 
  id,
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
  onBookEvent
}: { 
  id: string;
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
  onBookEvent: (eventDetails: any) => void;
}) {
  return (
    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-md transition-shadow">
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
          <Badge className="bg-purple-500 text-white">{category}</Badge>
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
            {attendees} attending
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>{rating}</span>
            </div>
            <span className="text-purple-600">{price}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-purple-500 text-purple-600 hover:bg-purple-50"
              onClick={() => onBookEvent({ id, title, category, venue, location, date, time, price, attendees, rating })}
            >
              <Ticket className="w-4 h-4" />
              Book Match
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventVenueCard({ 
  id,
  image, 
  name, 
  location, 
  rating,
  category,
  upcomingEvents 
}: { 
  id: string;
  image: string;
  name: string;
  location: string;
  rating: number;
  category: string;
  upcomingEvents: number;
}) {
  return (
    <div
      className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl hover:scale-105 transition-all w-full cursor-pointer"
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
          <span className="text-purple-600">{upcomingEvents} events</span>
        </div>

        <Button
          size="sm"
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
        >
          View Events
        </Button>
      </div>
    </div>
  );
}