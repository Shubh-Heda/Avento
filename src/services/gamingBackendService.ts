/**
 * Gaming Backend Service
 * Handles all gaming session operations with real backend integration
 * Mirrors matchService pattern for consistency
 */

import { localStorageService } from './localStorageService';
import { groupChatService } from './groupChatService';
import { communityService } from './communityService';
import { trustScoreService } from './trustScoreService';

export interface GamingSession {
  id: string;
  clubId: string;
  clubName: string;
  hostId: string;
  hostName: string;
  date: string;
  time: string;
  duration: number;
  gameName?: string;
  platform: string;
  sessionType: 'casual' | 'competitive' | 'tournament';
  skillLevel: 'beginner' | 'intermediate' | 'pro' | 'any';
  minPlayers: number;
  maxPlayers: number;
  currentPlayers: number;
  visibility: 'public' | 'friends-only' | 'private';
  paymentMode: '5-stage' | 'instant';
  pricePerPerson: number;
  seatType: 'individual' | 'private-room';
  streamingAvailable: boolean;
  hasFood: boolean;
  players: GamingPlayer[];
  status: 'open' | 'soft-lock' | 'payment-window' | 'hard-lock' | 'confirmed' | 'completed';
  paymentWindowEnd?: string;
  stage?: number;
  chatId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GamingPlayer {
  id: string;
  name: string;
  avatar: string;
  trustScore: number;
  skillLevel: string;
  favoriteGames: string[];
  hasPaid: boolean;
  joinedAt: string;
}

export interface GamingClub {
  id: string;
  name: string;
  location: string;
  distance: string;
  rating: number;
  reviews: number;
  image: string;
  consoles: string[];
  hourlyRate: number;
  facilities: string[];
  gamesLibrary: string[];
}

class GamingBackendService {
  private storageKey = 'avento_gaming_sessions';

  /**
   * Create a new gaming session with auto-chat and community posting
   */
  async createGamingSession(
    data: Partial<GamingSession>,
    hostId: string,
    hostName: string
  ): Promise<GamingSession> {
    const session: GamingSession = {
      id: `gaming_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clubId: data.clubId || 'default_club',
      clubName: data.clubName || 'Gaming Club',
      hostId,
      hostName,
      date: data.date || new Date().toISOString().split('T')[0],
      time: data.time || '18:00',
      duration: data.duration || 2,
      gameName: data.gameName,
      platform: data.platform || 'PS5',
      sessionType: data.sessionType || 'casual',
      skillLevel: data.skillLevel || 'any',
      minPlayers: data.minPlayers || 2,
      maxPlayers: data.maxPlayers || 8,
      currentPlayers: 1,
      visibility: data.visibility || 'public',
      paymentMode: data.paymentMode || '5-stage',
      pricePerPerson: data.pricePerPerson || 200,
      seatType: data.seatType || 'individual',
      streamingAvailable: data.streamingAvailable || false,
      hasFood: data.hasFood || false,
      players: [],
      status: 'open',
      stage: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add host as first player
    session.players.push({
      id: hostId,
      name: hostName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${hostName}`,
      trustScore: 4.5, // Default score, can be updated from actual service
      skillLevel: session.skillLevel,
      favoriteGames: data.players?.[0]?.favoriteGames || [],
      hasPaid: false,
      joinedAt: new Date().toISOString(),
    });

    // Save to storage
    this.saveSession(session);

    // Auto-create group chat for gaming session
    await this.createSessionGroupChat(session, hostId);

    // Auto-create community post if public
    if (session.visibility === 'public') {
      await this.createSessionCommunityPost(session);
    }

    return session;
  }

  /**
   * Get all gaming sessions
   */
  async getGamingSessions(filters?: {
    clubId?: string;
    platform?: string;
    skillLevel?: string;
    status?: string;
  }): Promise<GamingSession[]> {
    let sessions = this.getAllSessions();

    if (filters?.clubId) {
      sessions = sessions.filter(s => s.clubId === filters.clubId);
    }
    if (filters?.platform) {
      sessions = sessions.filter(s => s.platform === filters.platform);
    }
    if (filters?.skillLevel && filters.skillLevel !== 'any') {
      sessions = sessions.filter(s => s.skillLevel === filters.skillLevel || s.skillLevel === 'any');
    }
    if (filters?.status) {
      sessions = sessions.filter(s => s.status === filters.status);
    }

    return sessions;
  }

  /**
   * Get a specific gaming session
   */
  async getGamingSession(sessionId: string): Promise<GamingSession | null> {
    const sessions = this.getAllSessions();
    return sessions.find(s => s.id === sessionId) || null;
  }

  /**
   * Join a gaming session
   */
  async joinGamingSession(
    sessionId: string,
    playerId: string,
    playerName: string
  ): Promise<GamingSession | null> {
    const sessions = this.getAllSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) return null;

    const session = sessions[sessionIndex];

    // Check if player already joined
    if (session.players.find(p => p.id === playerId)) {
      return session;
    }

    // Check if session is full
    if (session.currentPlayers >= session.maxPlayers) {
      throw new Error('Session is full');
    }

    // Add player
    session.players.push({
      id: playerId,
      name: playerName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerName}`,
      trustScore: 4.5, // Default score, can be updated from actual service
      skillLevel: session.skillLevel,
      favoriteGames: [],
      hasPaid: false,
      joinedAt: new Date().toISOString(),
    });

    session.currentPlayers = session.players.length;
    session.updatedAt = new Date();

    // Check if soft-lock trigger (min players reached)
    if (
      session.currentPlayers >= session.minPlayers &&
      session.status === 'open'
    ) {
      session.status = 'soft-lock';
    }

    sessions[sessionIndex] = session;
    localStorageService.set(this.storageKey, sessions);

    return session;
  }

  /**
   * Leave a gaming session
   */
  async leaveGamingSession(sessionId: string, playerId: string): Promise<boolean> {
    const sessions = this.getAllSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) return false;

    const session = sessions[sessionIndex];
    const playerIndex = session.players.findIndex(p => p.id === playerId);

    if (playerIndex === -1) return false;

    session.players.splice(playerIndex, 1);
    session.currentPlayers = session.players.length;
    session.updatedAt = new Date();

    // If host left, cancel session
    if (playerId === session.hostId) {
      session.status = 'completed';
    }

    // Reset from soft-lock if below min players
    if (session.currentPlayers < session.minPlayers && session.status === 'soft-lock') {
      session.status = 'open';
    }

    sessions[sessionIndex] = session;
    localStorageService.set(this.storageKey, sessions);

    return true;
  }

  /**
   * Update payment status for a player
   */
  async updateParticipantPayment(
    sessionId: string,
    playerId: string,
    hasPaid: boolean
  ): Promise<GamingSession | null> {
    const sessions = this.getAllSessions();
    const session = sessions.find(s => s.id === sessionId);

    if (!session) return null;

    const player = session.players.find(p => p.id === playerId);
    if (player) {
      player.hasPaid = hasPaid;
    }

    session.updatedAt = new Date();
    localStorageService.set(this.storageKey, sessions);

    return session;
  }

  /**
   * Update session status
   */
  async updateSessionStatus(
    sessionId: string,
    status: GamingSession['status']
  ): Promise<GamingSession | null> {
    const sessions = this.getAllSessions();
    const session = sessions.find(s => s.id === sessionId);

    if (!session) return null;

    session.status = status;
    session.updatedAt = new Date();
    localStorageService.set(this.storageKey, sessions);

    return session;
  }

  /**
   * Delete a gaming session
   */
  async deleteGamingSession(sessionId: string, hostId: string): Promise<boolean> {
    const sessions = this.getAllSessions();
    const index = sessions.findIndex(s => s.id === sessionId && s.hostId === hostId);

    if (index === -1) return false;

    sessions.splice(index, 1);
    localStorageService.set(this.storageKey, sessions);

    return true;
  }

  /**
   * Create group chat for gaming session (async)
   */
  private async createSessionGroupChat(session: GamingSession, hostId: string): Promise<void> {
    try {
      const totalCost = session.pricePerPerson * session.maxPlayers;
      const chatRoom = await groupChatService.createMatchGroupChat(
        session.id,
        `${session.gameName || session.platform} Gaming - ${session.clubName}`,
        totalCost,
        hostId,
        session.hostName,
        'INR'
      );

      // Link chat to session
      session.chatId = chatRoom.id;

      // Send welcome message
      const paymentInfo =
        session.paymentMode === 'instant'
          ? `💰 Cost: ₹${session.pricePerPerson * session.maxPlayers} total\n💳 Payment: Direct payment for gaming session`
          : `💰 Cost: ₹${session.pricePerPerson}/person\n💳 Payment: 5-stage process - Opens after ${session.minPlayers} players join`;

      await groupChatService.postSystemMessage(
        chatRoom.id,
        `🎮 Welcome to ${session.gameName || session.platform} Gaming Session!\n\n` +
          `📍 Location: ${session.clubName}\n` +
          `🕐 Time: ${session.date} at ${session.time}\n` +
          `⏱️ Duration: ${session.duration} hours\n` +
          `👥 Players: ${session.currentPlayers}/${session.maxPlayers}\n\n` +
          paymentInfo
      );
    } catch (error) {
      console.error('Failed to create gaming session group chat:', error);
    }
  }

  /**
   * Create community post for gaming session
   */
  private async createSessionCommunityPost(session: GamingSession): Promise<void> {
    try {
      await communityService.createPost({
        area: session.clubName,
        authorId: session.hostId,
        authorName: session.hostName,
        authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.hostName}`,
        title: `${session.gameName || session.platform} Gaming Session`,
        content: `Join us for an epic ${session.sessionType} gaming session!\n\n` +
          `📅 Date: ${session.date}\n` +
          `🕐 Time: ${session.time}\n` +
          `⏱️ Duration: ${session.duration} hours\n` +
          `🎯 Skill Level: ${session.skillLevel}\n` +
          `👥 Players: ${session.currentPlayers}/${session.maxPlayers}\n` +
          `💰 Cost: ₹${session.pricePerPerson}/person\n` +
          (session.streamingAvailable ? '📹 Streaming setup available\n' : '') +
          (session.hasFood ? '🍔 Food & drinks available\n' : ''),
        category: 'announcement',
      });
    } catch (error) {
      console.error('Failed to create gaming session community post:', error);
    }
  }

  /**
   * Get user's gaming sessions
   */
  async getUserGamingSessions(userId: string): Promise<GamingSession[]> {
    const sessions = this.getAllSessions();
    return sessions.filter(s => s.players.find(p => p.id === userId) || s.hostId === userId);
  }

  // Private helpers

  private getAllSessions(): GamingSession[] {
    try {
      const data = localStorageService.get(this.storageKey) as string | null;
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveSession(session: GamingSession): void {
    const sessions = this.getAllSessions();
    const index = sessions.findIndex(s => s.id === session.id);

    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }

    localStorageService.set(this.storageKey, JSON.stringify(sessions));
  }
}

export const gamingBackendService = new GamingBackendService();
