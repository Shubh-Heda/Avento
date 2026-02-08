// Discovery Service - Using Firebase  
import { firebaseAuth } from './firebaseService';
import { toast } from 'sonner';

export interface PresencePoint {
  id?: string;
  user_id: string;
  sport: string;
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
  radius_km?: number;
  status?: 'active' | 'inactive' | 'expired';
  expires_at?: string;
  device_id?: string;
  session_id?: string;
  created_at?: string;
}

export interface SavedSearch {
  id?: string;
  user_id: string;
  name: string;
  sports: string[];
  radius_km: number;
  center_lat: number;
  center_lng: number;
  time_window?: { start?: string; end?: string };
  notify?: boolean;
  created_at?: string;
}

export interface GeoAlertSubscription {
  id?: string;
  user_id: string;
  sport?: string;
  radius_km?: number;
  center_lat: number;
  center_lng: number;
  start_time?: string;
  end_time?: string;
  days_of_week?: number[];
  notify_channels?: string[];
  active?: boolean;
  last_triggered?: string;
}

export interface ClusterBucket {
  id: string;
  lat: number;
  lng: number;
  count: number;
  sports: Record<string, number>;
}

const toRadians = (deg: number) => (deg * Math.PI) / 180;
const earthRadiusKm = 6371;

const haversineDistanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinLat = Math.sin(dLat / 2) ** 2;
  const sinLng = Math.sin(dLng / 2) ** 2;
  const h = sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
};

const defaultRadiusKm = 5;

class DiscoveryService {
  async upsertPresence(point: PresencePoint) {
    const payload = {
      ...point,
      id: point.id || `presence-${Date.now()}`,
      status: point.status ?? 'active',
      radius_km: point.radius_km ?? defaultRadiusKm,
      expires_at: point.expires_at ?? new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      created_at: point.created_at || new Date().toISOString()
    };

    const presences = JSON.parse(localStorage.getItem('presence_events') || '[]');
    const index = presences.findIndex((p: any) => p.user_id === point.user_id && p.sport === point.sport);
    if (index >= 0) {
      presences[index] = payload;
    } else {
      presences.push(payload);
    }
    localStorage.setItem('presence_events', JSON.stringify(presences));
    return payload as PresencePoint;
  }

  async getPresence(options: { sport?: string; maxAgeMinutes?: number } = {}) {
    const { sport, maxAgeMinutes = 180 } = options;
    const since = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();

    let presences = JSON.parse(localStorage.getItem('presence_events') || '[]');
    
    presences = presences.filter((p: any) => 
      p.created_at >= since && 
      p.status === 'active' &&
      (!sport || p.sport === sport)
    );

    return (presences ?? []) as PresencePoint[];
  }

  cluster(points: PresencePoint[], radiusKm = 1): ClusterBucket[] {
    const clusters: ClusterBucket[] = [];

    points.forEach((p) => {
      const found = clusters.find((c) => haversineDistanceKm({ lat: c.lat, lng: c.lng }, { lat: p.latitude, lng: p.longitude }) <= radiusKm);
      if (found) {
        found.count += 1;
        found.sports[p.sport] = (found.sports[p.sport] ?? 0) + 1;
        found.lat = (found.lat * (found.count - 1) + p.latitude) / found.count;
        found.lng = (found.lng * (found.count - 1) + p.longitude) / found.count;
      } else {
        clusters.push({
          id: crypto.randomUUID(),
          lat: p.latitude,
          lng: p.longitude,
          count: 1,
          sports: { [p.sport]: 1 },
        });
      }
    });

    return clusters;
  }

  async saveSearch(search: SavedSearch) {
    const payload = { ...search, id: search.id || `search-${Date.now()}`, notify: search.notify ?? true };
    const searches = JSON.parse(localStorage.getItem('saved_searches') || '[]');
    const index = searches.findIndex((s: any) => s.id === payload.id);
    if (index >= 0) {
      searches[index] = payload;
    } else {
      searches.push(payload);
    }
    localStorage.setItem('saved_searches', JSON.stringify(searches));
    return payload as SavedSearch;
  }

  async listSavedSearches(userId: string) {
    const searches = JSON.parse(localStorage.getItem('saved_searches') || '[]');
    return searches.filter((s: any) => s.user_id === userId) as SavedSearch[];
  }

  async subscribeAlert(alert: GeoAlertSubscription) {
    const payload = {
      ...alert,
      id: alert.id || `alert-${Date.now()}`,
      active: alert.active ?? true,
      days_of_week: alert.days_of_week ?? [0, 1, 2, 3, 4, 5, 6],
      notify_channels: alert.notify_channels ?? ['push'],
    };
    const alerts = JSON.parse(localStorage.getItem('geo_alert_subscriptions') || '[]');
    const index = alerts.findIndex((a: any) => a.id === payload.id);
    if (index >= 0) {
      alerts[index] = payload;
    } else {
      alerts.push(payload);
    }
    localStorage.setItem('geo_alert_subscriptions', JSON.stringify(alerts));
    return payload as GeoAlertSubscription;
  }

  async listGeoAlerts(userId: string) {
    const alerts = JSON.parse(localStorage.getItem('geo_alert_subscriptions') || '[]');
    return alerts.filter((a: any) => a.user_id === userId) as GeoAlertSubscription[];
  }

  async recordAlertTrigger(alertId: string) {
    const alerts = JSON.parse(localStorage.getItem('geo_alert_subscriptions') || '[]');
    const alert = alerts.find((a: any) => a.id === alertId);
    if (alert) {
      alert.last_triggered = new Date().toISOString();
      localStorage.setItem('geo_alert_subscriptions', JSON.stringify(alerts));
    }
  }

  async getPresenceWithFilters({
    sport,
    center,
    radiusKm = 5,
    timeWindow,
  }: {
    sport?: string;
    center?: { lat: number; lng: number };
    radiusKm?: number;
    timeWindow?: { start?: string; end?: string };
  }) {
    const points = await this.getPresence({ sport });
    const filtered = points.filter((p) => {
      const insideRadius = center
        ? haversineDistanceKm(center, { lat: p.latitude, lng: p.longitude }) <= radiusKm
        : true;
      const withinTime = timeWindow && timeWindow.start && timeWindow.end
        ? p.expires_at && p.expires_at >= timeWindow.start && p.expires_at <= timeWindow.end
        : true;
      return insideRadius && withinTime;
    });
    return filtered;
  }

  notifySuccess(message: string) {
    toast.success(message);
  }
}

export const discoveryService = new DiscoveryService();
export default discoveryService;
