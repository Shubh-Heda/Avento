import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../AuthProvider';
import {
  vibeRoomService,
  type VibeRoomView,
  type VibeCategory,
  type RealtimeSession,
  type VibeSignal,
  type ChatMessage,
} from '../../services/vibeRoomService';

type CategoryFilter = VibeCategory | 'all';

type PeerMap = Map<string, RTCPeerConnection>;
type StreamMap = Map<string, MediaStream>;

interface RoomInput {
  title: string;
  type: 'planning' | 'feedback' | 'discussion';
  description?: string;
  tags: string[];
  maxParticipants: number;
  isPublic: boolean;
  category?: VibeCategory;
}

export function useVibeRooms(category?: CategoryFilter) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<VibeRoomView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [presence, setPresence] = useState<Record<string, any>>({});
  const [signals, setSignals] = useState<VibeSignal[]>([]);
  const realtimeRef = useRef<RealtimeSession | null>(null);
  const peerConnections = useRef<PeerMap>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<StreamMap>(new Map());
  const [voiceReady, setVoiceReady] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const effectiveCategory = useMemo<VibeCategory>(() => {
    if (!category || category === 'all') return 'sports';
    return category;
  }, [category]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await vibeRoomService.listRooms(category);
      setRooms(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Unable to load vibe rooms');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribeRooms: (() => void) | null = null;
    loadRooms();
    unsubscribeRooms = vibeRoomService.subscribeRooms(loadRooms);
    return () => {
      unsubscribeRooms?.();
    };
  }, [category]);

  const refreshParticipants = async (roomId: string) => {
    await loadRooms();
  };

  const createRoom = async (roomData: RoomInput) => {
    if (!user) throw new Error('Must be logged in to create a room');

    const payload = {
      ...roomData,
      category: roomData.category || effectiveCategory,
    };

    const newRoom = await vibeRoomService.createRoom(payload, {
      id: user.id,
      name: user.name,
      email: user.email,
    });
    setRooms((prev) => [newRoom, ...prev]);
    return newRoom;
  };

  const attachRealtime = (roomId: string) => {
    if (!user) return;
    realtimeRef.current?.leave();
    const session = vibeRoomService.startRealtimeSession(
      roomId,
      { id: user.id, name: user.name, email: user.email },
      (signal) => {
        setSignals((prev) => [signal, ...prev].slice(0, 50));
        handleSignal(signal);
      },
      (state) => setPresence(state),
      (message) => {
        setChatMessages((prev) => [...prev, message].slice(-100));
      }
    );
    realtimeRef.current = session;
    setChatMessages([]);
  };

  const closePeers = () => {
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    setRemoteStreams(new Map());
  };

  const addTrackToPeers = (track: MediaStreamTrack) => {
    peerConnections.current.forEach((pc) => {
      const alreadyAdded = pc.getSenders().some((sender) => sender.track === track);
      if (!alreadyAdded) {
        pc.addTrack(track, localStream || new MediaStream([track]));
      }
    });
  };

  const stopLocalAudio = () => {
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setVoiceReady(false);
    setVideoEnabled(false);
  };

  const startLocalMedia = async (options?: { video?: boolean }) => {
    if (localStream) {
      const hasVideo = localStream.getVideoTracks().length > 0;
      if (options?.video && !hasVideo) {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const [videoTrack] = videoStream.getVideoTracks();
        if (videoTrack) {
          localStream.addTrack(videoTrack);
          addTrackToPeers(videoTrack);
          setVideoEnabled(true);
        }
      }
      return localStream;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: options?.video || false });
    setLocalStream(stream);
    setVoiceReady(true);
    setVideoEnabled((options?.video || false) && stream.getVideoTracks().length > 0);
    return stream;
  };

  const startLocalAudio = async () => startLocalMedia();

  const enableVideo = async () => {
    const stream = await startLocalMedia({ video: true });
    stream.getVideoTracks().forEach(addTrackToPeers);
    setVideoEnabled(stream.getVideoTracks().length > 0);
    await offerToPeers();
  };

  const disableVideo = () => {
    if (!localStream) return;
    const videoTracks = localStream.getVideoTracks();
    videoTracks.forEach((track) => {
      track.stop();
      localStream.removeTrack(track);
    });
    peerConnections.current.forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === 'video') {
          pc.removeTrack(sender);
        }
      });
    });
    setVideoEnabled(false);
  };

  const ensurePeer = (peerId: string) => {
    if (!user || peerId === user.id) return null;
    let pc = peerConnections.current.get(peerId);
    if (pc) return pc;

    pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate && realtimeRef.current) {
        realtimeRef.current.sendSignal({
          kind: 'ice',
          roomId: realtimeRef.current.roomId,
          from: user.id,
          to: peerId,
          payload: e.candidate,
          timestamp: Date.now(),
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.set(peerId, stream);
        return next;
      });
    };

    if (localStream) {
      localStream.getTracks().forEach((track) => pc!.addTrack(track, localStream));
    }

    peerConnections.current.set(peerId, pc);
    return pc;
  };

  const handleSignal = async (signal: VibeSignal) => {
    if (!user || signal.from === user.id) return;
    const pc = ensurePeer(signal.from);
    if (!pc) return;

    if (signal.kind === 'offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
      if (localStream && pc.getSenders().length === 0) {
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (realtimeRef.current) {
        await realtimeRef.current.sendSignal({
          kind: 'answer',
          roomId: signal.roomId,
          from: user.id,
          to: signal.from,
          payload: answer,
          timestamp: Date.now(),
        });
      }
    }

    if (signal.kind === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
    }

    if (signal.kind === 'ice' && signal.payload) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
      } catch (err) {
        console.error('ICE add error', err);
      }
    }
  };

  const offerToPeers = async () => {
    if (!user || !localStream || !realtimeRef.current) return;
    const state = presence || {};
    const peers = Object.keys(state).filter((id) => id !== user.id);
    for (const peerId of peers) {
      const pc = ensurePeer(peerId);
      if (!pc) continue;
      if (pc.signalingState === 'stable') {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await realtimeRef.current.sendSignal({
          kind: 'offer',
          roomId: realtimeRef.current.roomId,
          from: user.id,
          to: peerId,
          payload: offer,
          timestamp: Date.now(),
        });
      }
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!user) throw new Error('Must be logged in to join a room');
    const joined = await vibeRoomService.joinRoom(roomId, {
      id: user.id,
      name: user.name,
      email: user.email,
    });
    await refreshParticipants(roomId);
    attachRealtime(roomId);
    return joined;
  };

  const joinRoomWithVoice = async (roomId: string) => {
    await joinRoom(roomId);
    await startLocalAudio();
    await offerToPeers();
  };

  const sendChatMessage = async (roomId: string, text: string) => {
    if (!user) throw new Error('Must be logged in to chat');
    if (!text.trim()) return;
    const message: ChatMessage = {
      id: `${user.id}-${Date.now()}`,
      roomId,
      userId: user.id,
      name: user.name || user.email || 'Guest',
      text,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, message].slice(-100));
    await realtimeRef.current?.sendChat(message);
  };

  const joinRandomRoom = async () => {
    const open = rooms.filter((r) => r.isPublic && r.isActive && r.participants.length < r.maxParticipants);
    if (open.length === 0) throw new Error('No available rooms right now');
    const target = open[Math.floor(Math.random() * open.length)];
    return joinRoomWithVoice(target.id);
  };

  const leaveRoom = async (roomId: string) => {
    if (!user) throw new Error('Must be logged in to leave a room');
    await vibeRoomService.leaveRoom(roomId, { id: user.id, name: user.name, email: user.email });
    if (realtimeRef.current?.roomId === roomId) {
      realtimeRef.current.leave();
      realtimeRef.current = null;
      setPresence({});
    }
    closePeers();
    stopLocalAudio();
    await refreshParticipants(roomId);
  };

  useEffect(() => {
    return () => {
      realtimeRef.current?.leave();
      closePeers();
      stopLocalAudio();
    };
  }, []);

  return {
    rooms,
    loading,
    error,
    presence,
    signals,
    localStream,
    remoteStreams,
    voiceReady,
    videoEnabled,
    chatMessages,
    createRoom,
    joinRoom,
    joinRoomWithVoice,
    joinRandomRoom,
    leaveRoom,
    refresh: loadRooms,
    startLocalAudio,
    startLocalMedia,
    stopLocalAudio,
    enableVideo,
    disableVideo,
    offerToPeers,
    sendChatMessage,
  };
}