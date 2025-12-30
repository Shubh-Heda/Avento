import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapPin, X, Users, Calendar, Clock, Zap, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { GlassCard } from './GlassCard';
import { matchService } from '../services/backendService';

// Configure Leaflet marker assets for Vite bundling
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapEvent {
  id: string;
  title: string;
  category: 'sports' | 'events' | 'parties';
  type: string;
  location: string;
  lat: number;
  lng: number;
  datetime?: string;
  participants: number;
  maxParticipants?: number;
  distance?: string;
  creator?: string;
}

interface MapViewProps {
  onClose: () => void;
  category?: 'sports' | 'events' | 'parties' | 'all';
  events?: MapEvent[];
}

// Ahmedabad city center coordinates
const AHMEDABAD_CENTER = {
  lat: 23.0225,
  lng: 72.5714,
};

// Famous locations in Ahmedabad
const AHMEDABAD_LANDMARKS = [
  { name: 'Sabarmati Ashram', lat: 23.0596, lng: 72.5771 },
  { name: 'Kankaria Lake', lat: 22.9988, lng: 72.6189 },
  { name: 'Law Garden', lat: 23.0295, lng: 72.5556 },
  { name: 'Sardar Patel Stadium', lat: 23.0878, lng: 72.5703 },
  { name: 'CEPT University', lat: 23.0295, lng: 72.5556 },
  { name: 'Gujarat University', lat: 23.0685, lng: 72.5348 },
  { name: 'Vastrapur Lake', lat: 23.0381, lng: 72.5253 },
  { name: 'SG Highway', lat: 23.0330, lng: 72.5174 },
];

const LOCATION_COORDS: Record<string, { lat: number; lng: number }> = {
  'sabarmati ashram': { lat: 23.0596, lng: 72.5771 },
  'kankaria lake': { lat: 22.9988, lng: 72.6189 },
  'law garden': { lat: 23.0295, lng: 72.5556 },
  'sardar patel stadium': { lat: 23.0878, lng: 72.5703 },
  'cept university': { lat: 23.0295, lng: 72.5556 },
  'gujarat university sports complex': { lat: 23.0685, lng: 72.5348 },
  'gujarat university': { lat: 23.0685, lng: 72.5348 },
  'vastrapur lake': { lat: 23.0381, lng: 72.5253 },
  'sg highway': { lat: 23.033, lng: 72.5174 },
  'city sports arena': { lat: 23.0708, lng: 72.5367 },
  'sky sports arena': { lat: 23.0708, lng: 72.5367 },
};

// Sample events across Ahmedabad
const SAMPLE_EVENTS: MapEvent[] = [
  {
    id: '1',
    title: 'Saturday Football Match',
    category: 'sports',
    type: 'Football',
    location: 'Sardar Patel Stadium',
    lat: 23.0878,
    lng: 72.5703,
    datetime: '2025-11-18 18:00',
    participants: 10,
    maxParticipants: 20,
    distance: '3.2 km',
    creator: 'Rahul M.',
  },
  {
    id: '2',
    title: 'Cricket Practice Session',
    category: 'sports',
    type: 'Cricket',
    location: 'CEPT University Ground',
    lat: 23.0295,
    lng: 72.5556,
    datetime: '2025-11-18 17:00',
    participants: 8,
    maxParticipants: 16,
    distance: '1.5 km',
    creator: 'Amit S.',
  },
  {
    id: '3',
    title: 'Diwali Cultural Festival',
    category: 'events',
    type: 'Festival',
    location: 'Law Garden',
    lat: 23.0295,
    lng: 72.5556,
    datetime: '2025-11-18 19:00',
    participants: 45,
    maxParticipants: 100,
    distance: '2.1 km',
    creator: 'Priya S.',
  },
  {
    id: '4',
    title: 'Live Music Concert',
    category: 'events',
    type: 'Music',
    location: 'Kankaria Lakefront',
    lat: 22.9988,
    lng: 72.6189,
    datetime: '2025-11-19 20:00',
    participants: 32,
    maxParticipants: 80,
    distance: '4.8 km',
    creator: 'DJ Beats',
  },
  {
    id: '5',
    title: 'Rooftop Party',
    category: 'parties',
    type: 'Social',
    location: 'SG Highway',
    lat: 23.0330,
    lng: 72.5174,
    datetime: '2025-11-18 21:00',
    participants: 28,
    maxParticipants: 50,
    distance: '2.7 km',
    creator: 'Alex T.',
  },
  {
    id: '6',
    title: 'Sunday Badminton',
    category: 'sports',
    type: 'Badminton',
    location: 'Gujarat University Sports Complex',
    lat: 23.0685,
    lng: 72.5348,
    datetime: '2025-11-19 08:00',
    participants: 6,
    maxParticipants: 12,
    distance: '3.9 km',
    creator: 'Sneha K.',
  },
  {
    id: '7',
    title: 'Yoga by the Lake',
    category: 'sports',
    type: 'Yoga',
    location: 'Vastrapur Lake',
    lat: 23.0381,
    lng: 72.5253,
    datetime: '2025-11-18 06:30',
    participants: 15,
    maxParticipants: 30,
    distance: '1.8 km',
    creator: 'Maya R.',
  },
  {
    id: '8',
    title: 'Community Potluck',
    category: 'parties',
    type: 'Food',
    location: 'Sabarmati Ashram',
    lat: 23.0596,
    lng: 72.5771,
    datetime: '2025-11-19 18:00',
    participants: 22,
    maxParticipants: 40,
    distance: '2.3 km',
    creator: 'Community Team',
  },
];

export function MapView({ onClose, category = 'all', events }: MapViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);
  const [zoom, setZoom] = useState(13);
  const [userLocation, setUserLocation] = useState(AHMEDABAD_CENTER);
  const [filterCategory, setFilterCategory] = useState(category);
  const [backendEvents, setBackendEvents] = useState<MapEvent[]>([]);
  const [loadingBackend, setLoadingBackend] = useState(false);

  // Use provided events, otherwise backend events, fallback to samples
  const displayEvents = events || (backendEvents.length > 0 ? backendEvents : SAMPLE_EVENTS);

  // Filter events by category
  const filteredEvents = filterCategory === 'all' 
    ? displayEvents 
    : displayEvents.filter(e => e.category === filterCategory);

  // Resolve coordinates for each event (prefer backend lat/lng, otherwise known venue lookup)
  const resolvedEvents = filteredEvents
    .map((event) => {
      if (event.lat && event.lng) return event;
      const locKey = event.location?.toLowerCase() || '';
      const coords = LOCATION_COORDS[locKey];
      if (coords) {
        return { ...event, lat: coords.lat, lng: coords.lng };
      }
      return null;
    })
    .filter((e): e is MapEvent => Boolean(e));

  useEffect(() => {
    if (events) return; // parent passed events

    const load = async () => {
      setLoadingBackend(true);
      try {
        const categories: Array<'sports' | 'events' | 'parties'> = ['sports', 'events', 'parties'];
        const results = await Promise.all(categories.map((cat) => matchService.getMatches(cat)));

        const mapped: MapEvent[] = results.flatMap((list, idx) =>
          list.map((m) => ({
            id: m.id,
            title: m.title,
            category: categories[idx],
            type: m.sport,
            location: m.location || m.turf_name,
            lat: m.lat,
            lng: m.lng,
            datetime: `${m.date} ${m.time}`,
            participants: 0,
            maxParticipants: m.max_players || undefined,
            creator: m.user_id,
          }))
        );

        setBackendEvents(mapped);
      } catch (error) {
        console.error('Failed to load map events from Supabase:', error);
      } finally {
        setLoadingBackend(false);
      }
    };

    load();
  }, [events]);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'sports':
        return 'from-cyan-500 to-emerald-500';
      case 'events':
        return 'from-purple-500 to-pink-500';
      case 'parties':
        return 'from-orange-500 to-pink-500';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'sports':
        return '⚽';
      case 'events':
        return '🎨';
      case 'parties':
        return '🎉';
      default:
        return '📍';
    }
  };

  useEffect(() => {
    if (resolvedEvents.length > 0) {
      setSelectedEvent((prev) => prev && resolvedEvents.find(e => e.id === prev.id) ? prev : resolvedEvents[0]);
    } else {
      setSelectedEvent(null);
    }
  }, [filterCategory, events, resolvedEvents.length]);

  useEffect(() => {
    // Try to get user's actual location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Use Ahmedabad center as fallback
          setUserLocation(AHMEDABAD_CENTER);
        }
      );
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-[95vw] h-[95vh] md:w-[90vw] md:h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6" />
            <div>
              <h2 className="flex items-center gap-2">
                Ahmedabad Activity Map
              </h2>
              <p className="text-sm text-white/80">{filteredEvents.length} activities happening now</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Category Filters */}
        <div className="p-4 bg-slate-50 border-b flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-600" />
          <div className="flex gap-2 flex-wrap">
            {['all', 'sports', 'events', 'parties'].map(cat => (
              <Button
                key={cat}
                variant={filterCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory(cat as any)}
                className="capitalize"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-slate-50">
          <div className="flex-1 grid lg:grid-cols-3 gap-4 p-4">
            <div className="lg:col-span-2 h-full rounded-xl overflow-hidden shadow-inner relative">
              <MapContainer
                center={[userLocation.lat, userLocation.lng]}
                zoom={zoom}
                className="h-full min-h-[520px]"
                scrollWheelZoom
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup>You are here</Popup>
                </Marker>

                {resolvedEvents.map((event) => (
                  <Marker
                    key={event.id}
                    position={[event.lat!, event.lng!]}
                    eventHandlers={{ click: () => setSelectedEvent(event) }}
                  >
                    <Popup>
                      <div className="space-y-1">
                        <div className="font-semibold">{event.title}</div>
                        <div className="text-xs text-slate-600">{event.location}</div>
                        {event.datetime && (
                          <div className="text-xs text-slate-600 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{event.datetime}</span>
                          </div>
                        )}
                        <div className="text-xs text-slate-600 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{event.participants} going{event.maxParticipants ? ` / ${event.maxParticipants}` : ''}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            <div className="space-y-4">
              <GlassCard>
                <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">Live in Ahmedabad</p>
                    <Badge variant="secondary">{resolvedEvents.length} spots</Badge>
                  </div>

                  {loadingBackend && !events && (
                    <p className="text-sm text-slate-600">Loading live events from Supabase...</p>
                  )}

                  {resolvedEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full text-left p-3 rounded-xl border transition hover:border-slate-300 ${selectedEvent?.id === event.id ? 'border-cyan-500 bg-cyan-50/60' : 'border-slate-200 bg-white'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getCategoryColor(event.category)} text-white flex items-center justify-center text-xl`}>
                            {getCategoryIcon(event.category)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{event.title}</p>
                            <p className="text-xs text-slate-600">{event.location}</p>
                          </div>
                        </div>
                        <Badge className={`bg-gradient-to-r ${getCategoryColor(event.category)} text-white capitalize`}>
                          {event.category}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                        {event.datetime && (
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.datetime}</span>
                        )}
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.participants}{event.maxParticipants ? ` / ${event.maxParticipants}` : ''}</span>
                      </div>
                    </button>
                  ))}

                  {resolvedEvents.length === 0 && (
                    <p className="text-sm text-slate-600">No events with map coordinates yet. Create one with a known Ahmedabad venue to see it here.</p>
                  )}
                </div>
              </GlassCard>

              {selectedEvent && (
                <GlassCard>
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className={`bg-gradient-to-r ${getCategoryColor(selectedEvent.category)} text-white`}>
                          {selectedEvent.category}
                        </Badge>
                        <h3 className="mt-2">{selectedEvent.title}</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedEvent(null)}
                        className="h-8 w-8"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2 text-sm text-slate-700">
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {selectedEvent.location}</div>
                      {selectedEvent.datetime && (
                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {selectedEvent.datetime}</div>
                      )}
                      <div className="flex items-center gap-2"><Users className="w-4 h-4" /> {selectedEvent.participants}{selectedEvent.maxParticipants ? ` / ${selectedEvent.maxParticipants}` : ''}</div>
                      <div className="flex items-center gap-2"><Zap className="w-4 h-4" /> {selectedEvent.type}</div>
                      {selectedEvent.creator && <div className="text-xs text-slate-500">Hosted by {selectedEvent.creator}</div>}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button className="w-full" onClick={() => setSelectedEvent(null)}>Close</Button>
                      <Button variant="outline" className="w-full">View Details</Button>
                    </div>
                  </div>
                </GlassCard>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
