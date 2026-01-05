import { supabase } from '../lib/supabase';

export type VibeCategory = 'sports' | 'cultural' | 'party';
export type VibeType = 'planning' | 'feedback' | 'discussion';

export interface VibeRoomRecord {
  id: string;
  title: string;
  description?: string | null;
  category: VibeCategory;
  type: VibeType;
  tags?: string[] | null;
  max_participants?: number | null;
  is_public?: boolean | null;
  is_active?: boolean | null;
  host_id: string;
  host_name?: string | null;
  created_at?: string | null;
}

export interface VibeParticipantRecord {
  room_id: string;
  user_id: string;
  display_name?: string | null;
  muted?: boolean | null;
  status?: 'listening' | 'speaking' | null;
  joined_at?: string | null;
}

export interface VibeRoomView {
  id: string;
  title: string;
  description?: string;
  category: VibeCategory;
  type: VibeType;
  host: string;
  hostId: string;
  participants: string[];
  participantNames: string[];
  maxParticipants: number;
  isPublic: boolean;
  isActive: boolean;
  tags: string[];
  createdAt: number;
}

export interface CreateVibeRoomInput {
  title: string;
  description?: string;
  category: VibeCategory;
  type: VibeType;
  tags: string[];
  maxParticipants: number;
  isPublic: boolean;
}

export interface UserIdentity {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface VibeSignal {
  kind: 'offer' | 'answer' | 'ice' | 'ping' | 'invite';
  roomId: string;
  from: string;
  to?: string;
  payload?: any;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  name?: string | null;
  text: string;
  timestamp: number;
}

export interface RealtimeSession {
  roomId: string;
  channel: ReturnType<typeof supabase.channel>;
  sendSignal: (signal: VibeSignal) => Promise<void>;
  sendChat: (message: ChatMessage) => Promise<void>;
  leave: () => void;
}

const mockRooms: VibeRoomView[] = [
  {
    id: '1',
    title: 'Weekend Football Planning',
    description: 'Lineups, timings, and who is bringing the cones.',
    category: 'sports',
    type: 'planning',
    host: 'Alex Thompson',
    hostId: 'mock-user-id',
    participants: ['mock-user-id'],
    participantNames: ['Alex Thompson'],
    maxParticipants: 10,
    isPublic: true,
    isActive: true,
    tags: ['Football', 'Weekend'],
    createdAt: Date.now() - 3600000,
  },
];

const mapRoom = (room: VibeRoomRecord, participantRows?: VibeParticipantRecord[]): VibeRoomView => {
  const participantList = participantRows || [];
  return {
    id: room.id,
    title: room.title,
    description: room.description ?? undefined,
    category: room.category,
    type: room.type,
    host: room.host_name || 'Host',
    hostId: room.host_id,
    participants: participantList.map((p) => p.user_id),
    participantNames: participantList.map((p) => p.display_name || 'Guest'),
    maxParticipants: room.max_participants ?? 25,
    isPublic: room.is_public ?? true,
    isActive: room.is_active ?? true,
    tags: room.tags ?? [],
    createdAt: room.created_at ? new Date(room.created_at).getTime() : Date.now(),
  };
};

const fetchParticipantsByRoom = async (roomIds: string[]) => {
  if (roomIds.length === 0) return new Map<string, VibeParticipantRecord[]>();
  const { data, error } = await supabase
    .from('vibe_room_participants')
    .select('*')
    .in('room_id', roomIds);

  if (error) throw error;

  const byRoom = new Map<string, VibeParticipantRecord[]>();
  (data || []).forEach((row) => {
    const list = byRoom.get(row.room_id) || [];
    list.push(row);
    byRoom.set(row.room_id, list);
  });
  return byRoom;
};

export const vibeRoomService = {
  async listRooms(category?: VibeCategory | 'all'): Promise<VibeRoomView[]> {
    try {
      const { data, error } = await supabase
        .from('vibe_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const roomRows = data || [];
      const participantsMap = await fetchParticipantsByRoom(roomRows.map((r) => r.id));
      const mapped = roomRows.map((room) => mapRoom(room as VibeRoomRecord, participantsMap.get(room.id)));
      if (category && category !== 'all') {
        return mapped.filter((r) => r.category === category);
      }
      return mapped;
    } catch (err) {
      console.error('[vibeRoomService] listRooms fallback to mock because of error:', err);
      if (category && category !== 'all') return mockRooms.filter((r) => r.category === category);
      return mockRooms;
    }
  },

  async createRoom(input: CreateVibeRoomInput, user: UserIdentity): Promise<VibeRoomView> {
    if (!user?.id) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('vibe_rooms')
      .insert({
        title: input.title,
        description: input.description,
        category: input.category,
        type: input.type,
        tags: input.tags,
        max_participants: input.maxParticipants,
        is_public: input.isPublic,
        is_active: true,
        host_id: user.id,
        host_name: user.name || user.email || 'Host',
      })
      .select()
      .single();

    if (error || !data) {
      console.error('[vibeRoomService] createRoom failed', error);
      throw error || new Error('Failed to create vibe room');
    }

    // Auto-join creator
    await supabase.from('vibe_room_participants').upsert({
      room_id: data.id,
      user_id: user.id,
      display_name: user.name || user.email || 'You',
      muted: false,
      status: 'listening',
    });

    const participants = await fetchParticipantsByRoom([data.id]);
    return mapRoom(data as VibeRoomRecord, participants.get(data.id));
  },

  async joinRoom(roomId: string, user: UserIdentity): Promise<VibeRoomView> {
    if (!user?.id) throw new Error('No authenticated user');

    const { data: roomRow, error: roomErr } = await supabase
      .from('vibe_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomErr || !roomRow) throw roomErr || new Error('Room not found');

    const participants = await fetchParticipantsByRoom([roomId]);
    const participantList = participants.get(roomId) || [];
    const capacity = roomRow.max_participants ?? 25;
    if (participantList.length >= capacity) {
      throw new Error('Room is full');
    }

    await supabase.from('vibe_room_participants').upsert({
      room_id: roomId,
      user_id: user.id,
      display_name: user.name || user.email || 'Guest',
      muted: false,
      status: 'listening',
    });

    const refreshed = await fetchParticipantsByRoom([roomId]);
    return mapRoom(roomRow as VibeRoomRecord, refreshed.get(roomId));
  },

  async leaveRoom(roomId: string, user: UserIdentity): Promise<void> {
    if (!user?.id) return;
    const { error } = await supabase
      .from('vibe_room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  subscribeRooms(onChange: () => void) {
    const channel = supabase
      .channel('vibe-rooms-table')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vibe_rooms' }, onChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeParticipants(roomId: string, onChange: () => void) {
    const channel = supabase
      .channel(`vibe-rooms-${roomId}-participants`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vibe_room_participants', filter: `room_id=eq.${roomId}` }, onChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  startRealtimeSession(
    roomId: string,
    user: UserIdentity,
    onSignal?: (signal: VibeSignal) => void,
    onPresence?: (state: Record<string, any>) => void,
    onChat?: (message: ChatMessage) => void
  ): RealtimeSession {
    const channel = supabase.channel(`vibe-rooms-${roomId}-rt`, {
      config: {
        presence: { key: user.id || `anon-${Date.now()}` },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        onPresence?.(state);
      })
      .on('broadcast', { event: 'signal' }, (payload) => {
        const signal = payload.payload as VibeSignal;
        onSignal?.(signal);
      })
      .on('broadcast', { event: 'chat' }, (payload) => {
        const message = payload.payload as ChatMessage;
        onChat?.(message);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: user.id,
            name: user.name || user.email || 'Guest',
            joinedAt: Date.now(),
          });
        }
      });

    return {
      roomId,
      channel,
      sendSignal: async (signal: VibeSignal) => {
        await channel.send({ type: 'broadcast', event: 'signal', payload: signal });
      },
      sendChat: async (message: ChatMessage) => {
        await channel.send({ type: 'broadcast', event: 'chat', payload: message });
      },
      leave: () => {
        supabase.removeChannel(channel);
      },
    };
  },
};
