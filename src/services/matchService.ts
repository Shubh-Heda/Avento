/**
 * Match Service
 * Handles all match-related operations including creation, joining, lifecycle management
 */

import { localStorageService } from './localStorageService';
import { paymentFlowService, MatchPaymentState } from './paymentFlowService';
import { trustScoreService } from './trustScoreService';
import { friendshipStreakService } from './friendshipStreakService';
import { groupChatService } from './groupChatService';

export type MatchVisibility = 'community' | 'nearby' | 'private';
export type MatchStatus = 'open' | 'soft_locked' | 'payment_pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Match {
  id: string;
  title: string;
  sport: string;
  turf: {
    id: string;
    name: string;
    location: string;
    latitude: number;
    longitude: number;
    rating: number;
  };
  date: Date;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  visibility: MatchVisibility;
  status: MatchStatus;
  organizer: {
    id: string;
    name: string;
    trustScore: number;
  };
  players: MatchPlayer[];
  minPlayers: number;
  maxPlayers: number;
  costPerHour: number;
  totalCost: number;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  description?: string;
  rules?: string[];
  badges: MatchBadge[];
  paymentState?: MatchPaymentState;
  paymentDeadline?: Date; // When payment must be completed
  chatId?: string;
  createdAt: Date; // When match was created (for deadline calculations)
  updatedAt: Date;
}

export interface MatchPlayer {
  userId: string;
  name: string;
  avatar?: string;
  trustScore: number;
  joinedAt: Date;
  status: 'joined' | 'paid' | 'confirmed' | 'removed';
  isOrganizer: boolean;
}

export interface MatchBadge {
  type: 'high_trust' | 'newbie_friendly' | 'quick_match' | 'coaching_available' | 'women_friendly';
  label: string;
  icon: string;
}

class MatchService {
  /**
   * Create a new match
   */
  createMatch(data: Partial<Match>, organizerId: string): Match {
    const match: Match = {
      id: `match_${Date.now()}`,
      title: data.title || 'Untitled Match',
      sport: data.sport || 'Football',
      turf: data.turf || this.getDefaultTurf(),
      date: data.date || new Date(),
      startTime: data.startTime || '18:00',
      endTime: data.endTime || '19:00',
      duration: data.duration || 60,
      visibility: data.visibility || 'community',
      status: 'open',
      organizer: {
        id: organizerId,
        name: data.organizer?.name || 'Organizer',
        trustScore: trustScoreService.getTrustScore(organizerId).overall,
      },
      players: [],
      minPlayers: data.minPlayers || 6,
      maxPlayers: data.maxPlayers || 12,
      costPerHour: data.costPerHour || 1000,
      totalCost: data.totalCost || 1000,
      skillLevel: data.skillLevel || 'mixed',
      description: data.description,
      rules: data.rules || [],
      badges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add organizer as first player
    match.players.push({
      userId: organizerId,
      name: match.organizer.name,
      trustScore: match.organizer.trustScore,
      joinedAt: new Date(),
      status: 'joined',
      isOrganizer: true,
    });

    // Generate badges
    match.badges = this.generateMatchBadges(match);

    // Initialize payment state
    match.paymentState = {
      matchId: match.id,
      currentStage: 'free_joining',
      minPlayers: match.minPlayers,
      maxPlayers: match.maxPlayers,
      currentPlayerCount: 1,
      totalCost: match.totalCost,
      costPerPlayer: match.totalCost / match.minPlayers,
      playerPayments: [],
    };

    this.saveMatch(match);
    
    // Auto-create group chat for this match
    this.createMatchGroupChat(match, organizerId);
    
    return match;
  }

  /**
   * Create group chat for match (async operation)
   */
  private async createMatchGroupChat(match: Match, organizerId: string): Promise<void> {
    try {
      const groupChat = await groupChatService.createMatchGroupChat(
        match.id,
        match.title,
        match.totalCost,
        organizerId,
        match.organizer.name,
        'INR'
      );
      
      // Update match with chat ID
      match.chatId = groupChat.id;
      this.saveMatch(match);
    } catch (error) {
      console.error('Error creating group chat for match:', error);
      // Don't fail match creation if chat fails
    }
  }

  /**
   * Join a match
   */
  joinMatch(matchId: string, userId: string, userName: string): Match {
    const match = this.getMatch(matchId);
    
    if (!match) {
      throw new Error('Match not found');
    }

    // Validations
    if (match.status !== 'open' && match.status !== 'soft_locked') {
      throw new Error('Match is not accepting new players');
    }

    if (match.players.length >= match.maxPlayers) {
      throw new Error('Match is full');
    }

    if (match.players.some(p => p.userId === userId)) {
      throw new Error('Already joined this match');
    }

    // Get user trust score
    const userTrustScore = trustScoreService.getTrustScore(userId);

    // Add player
    const newPlayer: MatchPlayer = {
      userId,
      name: userName,
      trustScore: userTrustScore.overall,
      joinedAt: new Date(),
      status: 'joined',
      isOrganizer: false,
    };

    match.players.push(newPlayer);
    match.updatedAt = new Date();

    // Update payment state
    if (match.paymentState) {
      match.paymentState.currentPlayerCount = match.players.length;
      
      // Create payment record for user
      paymentFlowService.joinMatch(matchId, userId);

      // Check if minimum players reached (trigger soft lock)
      if (match.players.length >= match.minPlayers && match.status === 'open') {
        this.triggerSoftLock(matchId);
      }
    }

    this.saveMatch(match);
    
    // Add member to group chat if it exists
    if (match.chatId) {
      this.addPlayerToGroupChat(match.chatId, userId);
    }
    
    return match;
  }

  /**
   * Add player to group chat (async)
   */
  private async addPlayerToGroupChat(groupChatId: string, userId: string): Promise<void> {
    try {
      // Get group chat to find total cost
      const groupChat = await groupChatService.getGroupChatDetails(groupChatId);
      if (groupChat) {
        await groupChatService.addGroupChatMember(
          groupChatId,
          userId,
          groupChat.total_cost,
          0
        );
      }
    } catch (error) {
      console.error('Error adding player to group chat:', error);
    }
  }

  /**
   * Leave a match
   */
  leaveMatch(matchId: string, userId: string): Match {
    const match = this.getMatch(matchId);
    
    if (!match) {
      throw new Error('Match not found');
    }

    const player = match.players.find(p => p.userId === userId);
    
    if (!player) {
      throw new Error('Not in this match');
    }

    if (player.isOrganizer) {
      throw new Error('Organizer cannot leave match. Please cancel the match instead.');
    }

    // Check if payment has been made
    if (player.status === 'paid' || player.status === 'confirmed') {
      throw new Error('Cannot leave after payment. Contact organizer for refund.');
    }

    // Remove player
    match.players = match.players.filter(p => p.userId !== userId);
    match.updatedAt = new Date();

    // Update payment state
    if (match.paymentState) {
      match.paymentState.currentPlayerCount = match.players.length;
      
      // Recalculate cost per player
      if (match.players.length > 0) {
        match.paymentState.costPerPlayer = match.totalCost / match.players.length;
      }
    }

    // Update trust score for cancellation
    trustScoreService.recordAction({
      type: 'match_cancelled',
      userId,
      matchId,
      timestamp: new Date(),
      impact: -10,
    });

    this.saveMatch(match);
    return match;
  }

  /**
   * Trigger soft lock when minimum players reached
   */
  private triggerSoftLock(matchId: string): void {
    const match = this.getMatch(matchId);
    
    if (!match || !match.paymentState) return;

    // Trigger payment flow soft lock
    match.paymentState = paymentFlowService.triggerSoftLock(matchId, match.paymentState);
    match.status = 'soft_locked';
    match.updatedAt = new Date();

    this.saveMatch(match);

    // Notify all players about payment window
    this.notifyPaymentWindowOpened(match);
  }

  /**
   * Process payment for a player
   */
  processPayment(matchId: string, userId: string, amount: number): Match {
    const match = this.getMatch(matchId);
    
    if (!match) {
      throw new Error('Match not found');
    }

    // Process payment through payment flow service
    const paymentStatus = paymentFlowService.processPayment(matchId, userId, amount);

    // Update player status
    const player = match.players.find(p => p.userId === userId);
    if (player) {
      player.status = 'paid';
    }

    match.updatedAt = new Date();
    this.saveMatch(match);

    return match;
  }

  /**
   * Complete a match
   */
  completeMatch(matchId: string): Match {
    const match = this.getMatch(matchId);
    
    if (!match) {
      throw new Error('Match not found');
    }

    match.status = 'completed';
    match.updatedAt = new Date();

    // Update trust scores for all players
    match.players.forEach(player => {
      trustScoreService.recordAction({
        type: 'match_completed',
        userId: player.userId,
        matchId,
        timestamp: new Date(),
        impact: 5,
      });
    });

    // Update friendship streaks
    this.updateFriendshipStreaks(match);

    this.saveMatch(match);
    return match;
  }

  /**
   * Update friendship streaks for all player pairs
   */
  private updateFriendshipStreaks(match: Match): void {
    const players = match.players;

    // Update streaks for each pair of players
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        friendshipStreakService.recordMatchTogether(
          players[i].userId,
          players[j].userId,
          new Date(match.date)
        );
      }
    }
  }

  /**
   * Cancel a match
   */
  cancelMatch(matchId: string, organizerId: string, reason?: string): Match {
    const match = this.getMatch(matchId);
    
    if (!match) {
      throw new Error('Match not found');
    }

    if (match.organizer.id !== organizerId) {
      throw new Error('Only organizer can cancel match');
    }

    match.status = 'cancelled';
    match.updatedAt = new Date();

    // Refund all paid players
    if (match.paymentState) {
      match.paymentState.playerPayments
        .filter(p => p.isPaid)
        .forEach(p => {
          // Process refund logic
          console.log(`Refunding ${p.amountPaid} to ${p.userId}`);
        });
    }

    this.saveMatch(match);
    this.notifyMatchCancellation(match, reason);

    return match;
  }

  /**
   * Get a match by ID
   */
  getMatch(matchId: string): Match | null {
    const matches = localStorageService.getSportsMatches();
    return matches.find(m => m.id === matchId) || null;
  }

  /**
   * Get all matches
   */
  getAllMatches(): Match[] {
    return localStorageService.getSportsMatches();
  }

  /**
   * Get matches by visibility
   */
  getMatchesByVisibility(visibility: MatchVisibility): Match[] {
    return this.getAllMatches().filter(m => m.visibility === visibility);
  }

  /**
   * Get user's matches
   */
  getUserMatches(userId: string): Match[] {
    return this.getAllMatches().filter(m => 
      m.players.some(p => p.userId === userId)
    );
  }

  /**
   * Get nearby matches (mock - would use geolocation in real app)
   */
  getNearbyMatches(latitude: number, longitude: number, radius: number = 5): Match[] {
    // Mock implementation - return all community matches
    return this.getMatchesByVisibility('community');
  }

  /**
   * Search matches
   */
  searchMatches(query: {
    sport?: string;
    date?: Date;
    skillLevel?: string;
    minSlots?: number;
  }): Match[] {
    let matches = this.getAllMatches();

    if (query.sport) {
      matches = matches.filter(m => 
        m.sport.toLowerCase().includes(query.sport!.toLowerCase())
      );
    }

    if (query.date) {
      matches = matches.filter(m => 
        new Date(m.date).toDateString() === query.date!.toDateString()
      );
    }

    if (query.skillLevel) {
      matches = matches.filter(m => 
        m.skillLevel === query.skillLevel || m.skillLevel === 'mixed'
      );
    }

    if (query.minSlots) {
      matches = matches.filter(m => 
        m.maxPlayers - m.players.length >= query.minSlots!
      );
    }

    return matches;
  }

  /**
   * Generate match badges
   */
  private generateMatchBadges(match: Match): MatchBadge[] {
    const badges: MatchBadge[] = [];

    // High trust zone badge
    if (match.organizer.trustScore >= 80) {
      badges.push({
        type: 'high_trust',
        label: 'High Trust Zone',
        icon: '⭐',
      });
    }

    // Newbie friendly badge
    if (match.skillLevel === 'beginner' || match.skillLevel === 'mixed') {
      badges.push({
        type: 'newbie_friendly',
        label: 'Newbie-Friendly',
        icon: '🌱',
      });
    }

    // Quick match badge (within 2 hours)
    const hoursUntilMatch = (new Date(match.date).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilMatch < 2) {
      badges.push({
        type: 'quick_match',
        label: 'Quick Match',
        icon: '⚡',
      });
    }

    return badges;
  }

  /**
   * Save match to storage
   */
  private saveMatch(match: Match): void {
    const matches = localStorageService.getSportsMatches();
    const index = matches.findIndex(m => m.id === match.id);

    if (index >= 0) {
      matches[index] = match;
    } else {
      matches.push(match);
    }

    localStorageService.setSportsMatches(matches);
  }

  /**
   * Notification methods (mock)
   */
  private notifyPaymentWindowOpened(match: Match): void {
    console.log(`Payment window opened for match ${match.id}`);
  }

  private notifyMatchCancellation(match: Match, reason?: string): void {
    console.log(`Match ${match.id} cancelled. Reason: ${reason || 'Not specified'}`);
  }

  /**
   * Get default turf (mock data)
   */
  private getDefaultTurf() {
    return {
      id: 'turf_001',
      name: 'Elite Sports Arena',
      location: 'Mumbai, Maharashtra',
      latitude: 19.0760,
      longitude: 72.8777,
      rating: 4.5,
    };
  }
}

export const matchService = new MatchService();
