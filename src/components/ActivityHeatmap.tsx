import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { MapPin, TrendingUp, Filter, Zap, Map, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MapView } from './MapView';
import { matchService } from '../services/backendService';
import { supabase, type Match } from '../lib/supabase';

type HeatmapCategory = 'sports' | 'cultural' | 'parties' | 'events' | 'all';

// Leaflet typings can be strict; wrap to keep JSX happy while we keep runtime behavior intact.
const LeafletMap = MapContainer as unknown as React.ComponentType<any>;
const LeafletTileLayer = TileLayer as unknown as React.ComponentType<any>;
const LeafletCircleMarker = CircleMarker as unknown as React.ComponentType<any>;
const LeafletTooltip = Tooltip as unknown as React.ComponentType<any>;

interface ActivityHeatmapProps {
  category?: HeatmapCategory;
}

interface HotSpot {
  id: string;
  name: string;
  category: Exclude<HeatmapCategory, 'events' | 'all'>;
  activeNow: number;
  lat: number;
  lng: number;
  intensity: 'high' | 'medium' | 'low';
  location?: string;
  datetime?: string;
  maxParticipants?: number;
  hostId?: string;
}

const AHMEDABAD_CENTER = { lat: 23.0225, lng: 72.5714 };

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

const FALLBACK_HOTSPOTS: HotSpot[] = [
  {
    id: 'fallback-1',
    name: 'Sky Sports Arena',
    category: 'sports',
    activeNow: 28,
    lat: 23.0225,
    lng: 72.5714,
    intensity: 'high',
    location: 'Sky Sports Arena',
  },
  {
    id: 'fallback-2',
    name: 'Culture Hub',
    category: 'cultural',
    activeNow: 22,
    lat: 23.0335,
    lng: 72.585,
    intensity: 'medium',
    location: 'Culture Hub',
  },
  {
    id: 'fallback-3',
    name: 'Skybar Lounge',
    category: 'parties',
    activeNow: 41,
    lat: 23.0195,
    lng: 72.568,
    intensity: 'high',
    location: 'Skybar Lounge',
  },
];

const categoryToBackend = (category: HeatmapCategory): 'sports' | 'events' | 'parties' | undefined => {
  if (category === 'all') return undefined;
  if (category === 'cultural') return 'events';
  if (category === 'events') return 'events';
  return category as 'sports' | 'parties';
};

const backendToUiCategory = (category?: string): HotSpot['category'] => {
  if (category === 'events') return 'cultural';
  if (category === 'sports') return 'sports';
  if (category === 'parties') return 'parties';
  return 'sports';
};

const getIntensityFromCount = (count: number): HotSpot['intensity'] => {
  if (count >= 35) return 'high';
  if (count >= 15) return 'medium';
  return 'low';
};

const getIntensityColor = (intensity: HotSpot['intensity']) => {
  switch (intensity) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'medium':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    default:
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
};

const getCategoryColor = (cat: HotSpot['category']) => {
  switch (cat) {
    case 'sports':
      return 'bg-cyan-50 text-cyan-700';
    case 'cultural':
      return 'bg-indigo-50 text-indigo-700';
    case 'parties':
      return 'bg-amber-50 text-amber-700';
  }
};

const getCategoryIcon = (cat: HotSpot['category']) => {
  switch (cat) {
    case 'sports':
      return '⚽';
    case 'cultural':
      return '🎨';
    case 'parties':
      return '🎉';
  }
};

const resolveCoords = (match: Match | any) => {
  if (match?.lat && match?.lng) return { lat: match.lat, lng: match.lng };
  const key = (match?.location || match?.turf_name || '').toLowerCase();
  if (key && LOCATION_COORDS[key]) return LOCATION_COORDS[key];
  return null;
};

const mapMatchToSpot = (match: Match): HotSpot | null => {
  const coords = resolveCoords(match);
  if (!coords) return null;

  const matchWithCounts = match as Match & { current_players?: number };
  const activeNow = matchWithCounts.current_players ?? matchWithCounts.max_players ?? matchWithCounts.min_players ?? 12;
  const category = backendToUiCategory(match.category);

  return {
    id: match.id,
    name: match.title || match.turf_name || 'Live event',
    category,
    activeNow,
    lat: coords.lat,
    lng: coords.lng,
    intensity: getIntensityFromCount(activeNow),
    location: match.location || match.turf_name,
    datetime: match.date && match.time ? `${match.date} ${match.time}` : undefined,
    maxParticipants: match.max_players,
    hostId: match.user_id,
  };
};

export function ActivityHeatmap({ category = 'all' }: ActivityHeatmapProps) {
  const [selectedFilter, setSelectedFilter] = useState<HeatmapCategory>(category ?? 'all');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [showFullMap, setShowFullMap] = useState(false);
  const [hotSpots, setHotSpots] = useState<HotSpot[]>(FALLBACK_HOTSPOTS);
  const [loading, setLoading] = useState(false);
  const [backendReady, setBackendReady] = useState(false);
  const [userLocation, setUserLocation] = useState(AHMEDABAD_CENTER);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setUserLocation(AHMEDABAD_CENTER);
      }
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadLiveSpots = async () => {
      setLoading(true);
      try {
        const matches = await matchService.getMatches();
        if (cancelled) return;
        const mapped = matches.map(mapMatchToSpot).filter(Boolean) as HotSpot[];
        if (mapped.length > 0) {
          setHotSpots(mapped);
          setBackendReady(true);
        } else {
          setBackendReady(false);
          setHotSpots(FALLBACK_HOTSPOTS);
        }
        setLastUpdated(new Date().toISOString());
      } catch (error) {
        console.error('Failed to load live heatmap matches from Supabase', error);
        if (!cancelled) {
          setBackendReady(false);
          setHotSpots(FALLBACK_HOTSPOTS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadLiveSpots();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('matches-heatmap')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          setBackendReady(true);
          setHotSpots((prev) => {
            if (payload.eventType === 'DELETE' && payload.old?.id) {
              return prev.filter((spot) => spot.id !== payload.old.id);
            }

            const nextSpot = mapMatchToSpot(payload.new as Match);
            if (!nextSpot) return prev;
            const remaining = prev.filter((spot) => spot.id !== nextSpot.id);
            return [nextSpot, ...remaining];
          });
          setLastUpdated(new Date().toISOString());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredSpots = useMemo(() => {
    if (selectedFilter === 'all') return hotSpots;
    const targetCategory: HotSpot['category'] = selectedFilter === 'events' ? 'cultural' : (selectedFilter as HotSpot['category']);
    return hotSpots.filter((spot) => spot.category === targetCategory);
  }, [hotSpots, selectedFilter]);

  const totalActive = filteredSpots.reduce((acc, spot) => acc + spot.activeNow, 0);

  const toMapEventCategory = (cat: HotSpot['category']): 'sports' | 'events' | 'parties' => {
    if (cat === 'cultural') return 'events';
    if (cat === 'parties') return 'parties';
    return 'sports';
  };

  const mapEvents = useMemo(
    () =>
      hotSpots.map((spot) => ({
        id: spot.id,
        title: spot.name,
        category: toMapEventCategory(spot.category),
        type: spot.category,
        location: spot.location || spot.name,
        lat: spot.lat,
        lng: spot.lng,
        datetime: spot.datetime,
        participants: spot.activeNow,
        maxParticipants: spot.maxParticipants,
        creator: spot.hostId,
      })),
    [hotSpots]
  );

  return (
    <div className="mb-8 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Activity Heatmap</h2>
          <Badge className="border border-indigo-200 text-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-100 dark:border-indigo-400/60">
            {totalActive} people active nearby
          </Badge>
          {backendReady && lastUpdated && (
            <span className="text-xs text-slate-500 dark:text-slate-400">Live • updated {new Date(lastUpdated).toLocaleTimeString()}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-full px-4"
          >
            List
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('map')}
            className="rounded-full px-4"
          >
            Map
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {['all', 'sports', 'cultural', 'parties'].map((filter) => (
          <Button
            key={filter}
            variant={selectedFilter === filter ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter(filter as HeatmapCategory)}
            className={`capitalize whitespace-nowrap rounded-full px-4 ${selectedFilter === filter ? 'bg-indigo-600 text-white hover:bg-indigo-600' : 'border-slate-200 text-slate-700 dark:text-slate-200'}`}
          >
            <Filter className="w-3 h-3 mr-1" />
            {filter}
          </Button>
        ))}
      </div>

      {viewMode === 'map' ? (
        <div className="relative h-96 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-md dark:bg-slate-900 dark:border-slate-800">
            <LeafletMap
              center={[userLocation.lat, userLocation.lng] as [number, number]}
              zoom={13}
              className="h-full w-full"
              scrollWheelZoom
            >
              <LeafletTileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <LeafletCircleMarker
                center={[userLocation.lat, userLocation.lng] as [number, number]}
                radius={10}
                pathOptions={{ color: '#06b6d4', fillColor: '#22d3ee', fillOpacity: 0.4 }}
              >
                <LeafletTooltip direction="top" offset={[0, -6] as [number, number]} opacity={1} permanent>
                  <div className="text-xs font-medium text-cyan-800">You</div>
                </LeafletTooltip>
              </LeafletCircleMarker>

              {filteredSpots.map((spot) => (
                <LeafletCircleMarker
                  key={spot.id}
                  center={[spot.lat, spot.lng] as [number, number]}
                  radius={spot.intensity === 'high' ? 18 : spot.intensity === 'medium' ? 14 : 10}
                  pathOptions={{
                    color: spot.intensity === 'high' ? '#f97316' : spot.intensity === 'medium' ? '#fbbf24' : '#34d399',
                    fillColor: '#ffffff',
                    fillOpacity: 0.15,
                    weight: 3,
                  }}
                >
                  <LeafletTooltip direction="top" offset={[0, -2] as [number, number]} opacity={1} sticky>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryIcon(spot.category)}</span>
                        <span className="font-semibold">{spot.name}</span>
                      </div>
                      <p className="text-xs text-slate-600">{spot.activeNow} people active</p>
                      {spot.location && <p className="text-xs text-slate-500">{spot.location}</p>}
                      {spot.datetime && <p className="text-xs text-slate-500">{spot.datetime}</p>}
                    </div>
                  </LeafletTooltip>
                </LeafletCircleMarker>
              ))}
            </LeafletMap>

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Syncing live map…</span>
                </div>
              </div>
            )}

            {!backendReady && !loading && (
              <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                Showing sample hotspots while Supabase data loads.
              </div>
            )}

            <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
              <MapPin className="w-3 h-3 inline mr-1" />
              Live nearby map
            </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSpots
            .slice()
            .sort((a, b) => b.activeNow - a.activeNow)
            .map((spot, index) => (
              <div key={spot.id} className="rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <div className="p-4 flex items-center gap-4">
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl border ${getIntensityColor(spot.intensity)}`}>
                      {getCategoryIcon(spot.category)}
                    </div>
                    {spot.intensity === 'high' && (
                      <div className="absolute -top-1 -right-1">
                        <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{spot.name}</h3>
                      <Badge className={`${getCategoryColor(spot.category)} border border-slate-200 dark:border-slate-700`}> 
                        {spot.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-indigo-500" />
                        {spot.activeNow} active now
                      </span>
                      <Badge
                        variant="outline"
                        className={`capitalize border ${
                          spot.intensity === 'high'
                            ? 'border-red-200 text-red-700 bg-red-50 dark:bg-red-500/10 dark:border-red-500/40'
                            : spot.intensity === 'medium'
                            ? 'border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/40'
                            : 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/40'
                        }`}
                      >
                        {spot.intensity} activity
                      </Badge>
                    </div>
                    {spot.location && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{spot.location}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                      #{index + 1}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Rank</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="mt-4">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-700 dark:text-slate-300">Activity Intensity</p>
              <Button
                size="sm"
                onClick={() => setShowFullMap(true)}
                className="gap-2 rounded-full px-4 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Map className="w-4 h-4" />
                View Full Map
              </Button>
            </div>
            <div className="flex gap-4 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>High (35+ people)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Medium (15-34 people)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Low (&lt;15 people)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFullMap && (
        <MapView
          onClose={() => setShowFullMap(false)}
          category={categoryToBackend(selectedFilter) ?? 'all'}
          events={mapEvents}
        />
      )}
    </div>
  );
}