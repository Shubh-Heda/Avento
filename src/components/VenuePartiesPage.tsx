import { useState } from 'react';
import { ArrowLeft, MapPin, Star, Calendar, Clock, Users, Ticket, Music } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AventoLogo } from './AventoLogo';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';

interface VenuePartiesPageProps {
  onNavigate: (page: string) => void;
  venueId?: string;
}

// Mock venue data
const venueDataMap: { [key: string]: any } = {
  'nexus-nightclub': {
    name: 'Nexus Nightclub',
    image: 'https://images.unsplash.com/photo-1713885462557-12b5c41f22cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    location: 'Satellite, Ahmedabad',
    rating: 4.9,
    parties: 6
  },
  'sky-lounge': {
    name: 'Sky Lounge & Bar',
    image: 'https://images.unsplash.com/photo-1514432324607-2e467f4af445?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    location: 'CG Road, Ahmedabad',
    rating: 4.8,
    parties: 4
  },
  'social-house': {
    name: 'The Social House',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    location: 'Vastrapur, Ahmedabad',
    rating: 4.7,
    parties: 8
  }
};

const partiesDataMap: { [key: string]: any[] } = {
  'nexus-nightclub': [
    {
      id: '1',
      title: 'Electric Nights',
      date: 'Tonight',
      time: '9:00 PM',
      attendees: 156,
      rating: 4.8,
      price: '₹999',
      description: 'High-energy DJ set with live performances',
      tags: ['DJ', 'Dance', 'VIP Available']
    },
    {
      id: '2',
      title: 'Weekend Bash',
      date: 'Tomorrow',
      time: '10:00 PM',
      attendees: 200,
      rating: 4.9,
      price: '₹1299',
      description: 'International DJ with special performances',
      tags: ['International DJ', 'Cocktails', 'Dancing']
    },
    {
      id: '3',
      title: 'Throwback Thursdays',
      date: '2025-11-27',
      time: '9:30 PM',
      attendees: 120,
      rating: 4.7,
      price: '₹799',
      description: 'Retro music night - 80s and 90s hits',
      tags: ['Retro', 'Throwback', 'Budget Friendly']
    },
    {
      id: '4',
      title: 'Live Band Night',
      date: '2025-11-29',
      time: '8:00 PM',
      attendees: 100,
      rating: 4.9,
      price: '₹1499',
      description: 'Local live band performing hits',
      tags: ['Live Music', 'Band', 'Dinner']
    },
    {
      id: '5',
      title: 'Latin Night',
      date: '2025-12-01',
      time: '9:00 PM',
      attendees: 140,
      rating: 4.8,
      price: '₹1099',
      description: 'Salsa, Reggaeton & Latin vibes all night',
      tags: ['Latin', 'Dance', 'Workshops']
    },
    {
      id: '6',
      title: 'New Year Countdown',
      date: '2025-12-31',
      time: '8:00 PM',
      attendees: 500,
      rating: 5.0,
      price: '₹2999',
      description: 'Mega celebration with special performances',
      tags: ['New Year', 'Grand Event', 'Premium']
    }
  ],
  'sky-lounge': [
    {
      id: '7',
      title: 'Rooftop Sunset Vibes',
      date: 'Tonight',
      time: '5:00 PM',
      attendees: 80,
      rating: 4.8,
      price: '₹799',
      description: 'Cocktails and sunset views',
      tags: ['Sunset', 'Rooftop', 'Cocktails']
    },
    {
      id: '8',
      title: 'Corporate Mixer',
      date: 'Tomorrow',
      time: '6:00 PM',
      attendees: 150,
      rating: 4.6,
      price: '₹1200',
      description: 'Networking event for professionals',
      tags: ['Networking', 'Corporate', 'Cocktails']
    },
    {
      id: '9',
      title: 'Lounge Music Night',
      date: '2025-11-26',
      time: '7:00 PM',
      attendees: 60,
      rating: 4.7,
      price: '₹899',
      description: 'Smooth jazz and lounge music',
      tags: ['Jazz', 'Lounge', 'Intimate']
    },
    {
      id: '10',
      title: 'Birthday Bash',
      date: '2025-11-28',
      time: '8:00 PM',
      attendees: 100,
      rating: 4.9,
      price: '₹1499',
      description: 'Celebrate in style with VIP service',
      tags: ['Birthday', 'VIP', 'Celebrations']
    }
  ],
  'social-house': [
    {
      id: '11',
      title: 'Social Mixer Saturdays',
      date: 'Tomorrow',
      time: '7:00 PM',
      attendees: 180,
      rating: 4.8,
      price: '₹599',
      description: 'Meet new people, make friends',
      tags: ['Social', 'Meet & Greet', 'Affordable']
    },
    {
      id: '12',
      title: 'Game Night',
      date: '2025-11-26',
      time: '7:30 PM',
      attendees: 90,
      rating: 4.7,
      price: '₹499',
      description: 'Board games, card games, laughter',
      tags: ['Games', 'Fun', 'Groups']
    },
    {
      id: '13',
      title: 'Open Mic Night',
      date: '2025-11-27',
      time: '8:00 PM',
      attendees: 75,
      rating: 4.9,
      price: '₹399',
      description: 'Showcase your talent, enjoy local talent',
      tags: ['Open Mic', 'Performance', 'Art']
    },
    {
      id: '14',
      title: 'Casual Hangout Vibes',
      date: '2025-11-29',
      time: '6:00 PM',
      attendees: 120,
      rating: 4.8,
      price: '₹0',
      description: 'Free entry, casual gathering',
      tags: ['Free', 'Casual', 'Hangout']
    },
    {
      id: '15',
      title: 'Weekend Brunch Party',
      date: '2025-11-30',
      time: '11:00 AM',
      attendees: 110,
      rating: 4.8,
      price: '₹799',
      description: 'Brunch with friends and great company',
      tags: ['Brunch', 'Day Party', 'Social']
    },
    {
      id: '16',
      title: 'Year-End Bash',
      date: '2025-12-28',
      time: '7:00 PM',
      attendees: 250,
      rating: 5.0,
      price: '₹1199',
      description: 'Celebrate the year with your community',
      tags: ['Year-End', 'Celebration', 'Popular']
    },
    {
      id: '17',
      title: 'Paint & Party',
      date: '2025-12-05',
      time: '6:00 PM',
      attendees: 85,
      rating: 4.9,
      price: '₹999',
      description: 'Paint, create, and celebrate together',
      tags: ['Art', 'Creative', 'Fun']
    },
    {
      id: '18',
      title: 'Dance Workshop Party',
      date: '2025-12-12',
      time: '7:00 PM',
      attendees: 95,
      rating: 4.8,
      price: '₹899',
      description: 'Learn dance moves and party',
      tags: ['Dance', 'Workshop', 'Learning']
    }
  ]
};

export function VenuePartiesPage({ onNavigate, venueId = 'nexus-nightclub' }: VenuePartiesPageProps) {
  const venue = venueDataMap[venueId] || venueDataMap['nexus-nightclub'];
  const parties = partiesDataMap[venueId] || partiesDataMap['nexus-nightclub'];

  const handleBookParty = (partyId: string, partyTitle: string) => {
    toast.success(`Booked for "${partyTitle}"! 🎉`, {
      description: 'Check your email for confirmation'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('party-dashboard')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Back to Parties"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div>
                <h1 className="text-slate-900 font-semibold text-lg">{venue.name}</h1>
                <p className="text-sm text-slate-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {venue.location}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold">{venue.rating}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-600">{parties.length} parties</span>
            </div>
          </div>
        </div>
      </header>

      {/* Venue Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-8">
          <ImageWithFallback
            src={venue.image}
            alt={venue.name}
            className="w-full h-[300px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end">
            <div className="p-8 text-white w-full">
              <h2 className="text-3xl font-bold mb-2">{venue.name}</h2>
              <p className="text-white/90 max-w-2xl">
                Discover amazing parties and celebrations at this premium venue
              </p>
            </div>
          </div>
        </div>

        {/* Parties List */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-slate-900">
            <Music className="w-6 h-6 inline mr-2" />
            Upcoming Parties ({parties.length})
          </h2>

          <div className="grid gap-4">
            {parties.map(party => (
              <div
                key={party.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row gap-6 p-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{party.title}</h3>
                        <p className="text-slate-600 mt-1">{party.description}</p>
                      </div>
                      <Badge className="bg-gradient-to-r from-pink-500 to-orange-500 text-white whitespace-nowrap">
                        {party.rating} ⭐
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {party.date}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {party.time}
                      </span>
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {party.attendees} going
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {party.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="border-pink-300 text-pink-600 text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between md:whitespace-nowrap">
                    <span className="text-2xl font-bold text-pink-600">{party.price}</span>
                    <Button
                      onClick={() => handleBookParty(party.id, party.title)}
                      className="gap-2 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white mt-4"
                    >
                      <Ticket className="w-4 h-4" />
                      Get Tickets
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
