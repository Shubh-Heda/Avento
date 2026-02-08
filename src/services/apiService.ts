/**
 * API Service
 * Main interface for all backend operations
 * Simulates API calls with async behavior for realistic UX
 */

import { matchService } from './matchService';
import { paymentFlowService } from './paymentFlowService';
import { trustScoreService } from './trustScoreService';
import { friendshipStreakService } from './friendshipStreakService';
import { localStorageService } from './localStorageService';
import { mockDataService } from './mockDataService';

/**
 * Simulate network delay for realistic API behavior
 */
const simulateDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  /**
   * Initialize the backend system
   */
  async initialize(): Promise<void> {
    // Minimal initialization - defer heavy operations
    try {
      const existingMatches = localStorageService.getSportsMatches();
      if (!existingMatches || existingMatches.length === 0) {
        mockDataService.initializeMockData();
      }
    } catch (error) {
      console.warn('Initialize error:', error);
    }
  }

  // ============================================
  // AUTHENTICATION APIs
  // ============================================

  async login(email: string, password: string): Promise<any> {
    // Demo account credentials
    const demoAccounts = {
      'demo@avento.com': { password: 'demo123', name: 'Shubh Heda', demoAccount: true },
      'demo@gamesetgo.com': { password: 'demo123', name: 'Demo User', demoAccount: true },
    };

    // Check if this is a demo account
    const account = demoAccounts[email as keyof typeof demoAccounts];
    
    if (account && account.password === password) {
      // Demo account login
      const user = {
        id: 'demo_user',
        name: account.name,
        email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${account.name}`,
        joinedDate: new Date(),
        isDemoAccount: true,
      };

      localStorageService.setUserProfile(user);
      return { success: true, user };
    }

    // Mock login - any other credentials succeed for testing
    const user = {
      id: 'user_current',
      name: email.split('@')[0] || 'Current User',
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      joinedDate: new Date(),
    };

    localStorageService.setUserProfile(user);
    return { success: true, user };
  }

  async signup(name: string, email: string, password: string): Promise<any> {
    const user = {
      id: `user_${Date.now()}`,
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      joinedDate: new Date(),
    };

    localStorageService.setUserProfile(user);
    
    // Initialize trust score
    trustScoreService.getTrustScore(user.id);
    
    return { success: true, user };
  }

  async logout(): Promise<void> {
    localStorageService.remove('avento_user_profile');
  }

  // ============================================
  // MATCH APIs
  // ============================================

  async getMatches(filters?: any): Promise<any> {
    if (filters?.sport) {
      return matchService.searchMatches({ sport: filters.sport });
    }
    
    if (filters?.visibility) {
      return matchService.getMatchesByVisibility(filters.visibility);
    }
    
    return matchService.getAllMatches();
  }

  async getMatch(matchId: string): Promise<any> {
    return matchService.getMatch(matchId);
  }

  async createMatch(matchData: any, userId: string): Promise<any> {
    return matchService.createMatch(matchData, userId);
  }

  async joinMatch(matchId: string, userId: string, userName: string): Promise<any> {
    return matchService.joinMatch(matchId, userId, userName);
  }

  async leaveMatch(matchId: string, userId: string): Promise<any> {
    return matchService.leaveMatch(matchId, userId);
  }

  async getUserMatches(userId: string): Promise<any> {
    return matchService.getUserMatches(userId);
  }

  async searchMatches(query: any): Promise<any> {
    return matchService.searchMatches(query);
  }

  async getNearbyMatches(latitude: number, longitude: number, radius?: number): Promise<any> {
    return matchService.getNearbyMatches(latitude, longitude, radius);
  }

  // ============================================
  // PAYMENT APIs
  // ============================================

  async processPayment(matchId: string, userId: string, amount: number, method: string = 'upi'): Promise<any> {
    try {
      const paymentStatus = paymentFlowService.processPayment(matchId, userId, amount, method as any);
      const match = matchService.processPayment(matchId, userId, amount);
      
      return {
        success: true,
        paymentStatus,
        match,
        message: 'Payment processed successfully!',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getPaymentSummary(matchId: string): Promise<any> {
    return paymentFlowService.getPaymentSummary(matchId);
  }

  async triggerHardLock(matchId: string): Promise<any> {
    return paymentFlowService.triggerHardLock(matchId);
  }

  async confirmFinalTeam(matchId: string): Promise<any> {
    return paymentFlowService.confirmFinalTeam(matchId);
  }

  // ============================================
  // TRUST SCORE APIs
  // ============================================

  async getTrustScore(userId: string): Promise<any> {
    return trustScoreService.getTrustScoreSummary(userId);
  }

  async recordTrustAction(action: any): Promise<any> {
    return trustScoreService.recordAction(action);
  }

  async getTopTrustedUsers(limit?: number): Promise<any> {
    return trustScoreService.getTopTrustedUsers(limit);
  }

  // ============================================
  // FRIENDSHIP STREAK APIs
  // ============================================

  async getFriendshipStreak(user1Id: string, user2Id: string): Promise<any> {
    return friendshipStreakService.getStreakStatus(user1Id, user2Id);
  }

  async getUserStreaks(userId: string): Promise<any> {
    return friendshipStreakService.getUserStreaks(userId);
  }

  async getStreakSummary(userId: string): Promise<any> {
    return friendshipStreakService.getStreakSummary(userId);
  }

  // ============================================
  // EVENT APIs
  // ============================================

  async getEvents(): Promise<any> {
    return localStorageService.getEvents();
  }

  async getEvent(eventId: string): Promise<any> {
    const events = localStorageService.getEvents();
    return events.find((e: any) => e.id === eventId);
  }

  async bookEvent(eventId: string, userId: string): Promise<any> {
    const events = localStorageService.getEvents();
    const event = events.find((e: any) => e.id === eventId);
    
    if (event && event.attendees < event.maxAttendees) {
      event.attendees++;
      localStorageService.setEvents(events);
      
      return {
        success: true,
        message: 'Event booked successfully!',
        event,
      };
    }
    
    return {
      success: false,
      message: 'Event is full or not found',
    };
  }

  // ============================================
  // PARTY APIs
  // ============================================

  async getParties(): Promise<any> {
    return localStorageService.getParties();
  }

  async getParty(partyId: string): Promise<any> {
    const parties = localStorageService.getParties();
    return parties.find((p: any) => p.id === partyId);
  }

  async joinParty(partyId: string, userId: string): Promise<any> {
    const parties = localStorageService.getParties();
    const party = parties.find((p: any) => p.id === partyId);
    
    if (party && party.attendees < party.maxAttendees) {
      party.attendees++;
      localStorageService.setParties(parties);
      
      return {
        success: true,
        message: 'Party joined successfully!',
        party,
      };
    }
    
    return {
      success: false,
      message: 'Party is full or not found',
    };
  }

  // ============================================
  // CHAT APIs
  // ============================================

  async getChatMessages(matchId: string): Promise<any> {
    return localStorageService.getChatMessages(matchId);
  }

  async sendChatMessage(matchId: string, userId: string, userName: string, message: string): Promise<any> {
    const messages = localStorageService.getChatMessages(matchId);
    const newMessage = {
      id: `msg_${Date.now()}`,
      userId,
      userName,
      message,
      timestamp: new Date(),
    };
    
    messages.push(newMessage);
    localStorageService.setChatMessages(matchId, messages);
    
    return newMessage;
  }

  // ============================================
  // NOTIFICATION APIs
  // ============================================

  async getNotifications(userId: string): Promise<any> {
    await simulateDelay(400);
    const allNotifications = localStorageService.getNotifications();
    return allNotifications.filter((n: any) => n.userId === userId);
  }

  async markNotificationRead(notificationId: string): Promise<any> {
    await simulateDelay(200);
    
    const notifications = localStorageService.getNotifications();
    const notification = notifications.find((n: any) => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      localStorageService.setNotifications(notifications);
    }
    
    return { success: true };
  }

  async createNotification(notification: any): Promise<any> {
    await simulateDelay(200);
    
    const notifications = localStorageService.getNotifications();
    const newNotification = {
      id: `notif_${Date.now()}`,
      ...notification,
      createdAt: new Date(),
      read: false,
    };
    
    notifications.push(newNotification);
    localStorageService.setNotifications(notifications);
    
    return newNotification;
  }

  // ============================================
  // USER PROFILE APIs
  // ============================================

  async getUserProfile(userId?: string): Promise<any> {
    await simulateDelay(300);
    
    if (!userId) {
      return localStorageService.getUserProfile();
    }
    
    // In real app, would fetch from backend
    return localStorageService.getUserProfile();
  }

  async updateUserProfile(userId: string, updates: any): Promise<any> {
    await simulateDelay(500);
    
    const profile = localStorageService.getUserProfile();
    const updatedProfile = { ...profile, ...updates };
    localStorageService.setUserProfile(updatedProfile);
    
    return updatedProfile;
  }

  // ============================================
  // UTILITY APIs
  // ============================================

  async resetAllData(): Promise<void> {
    await simulateDelay(500);
    mockDataService.resetData();
  }

  async clearAllData(): Promise<void> {
    await simulateDelay(300);
    mockDataService.clearAllData();
  }

  // Get system stats
  async getSystemStats(): Promise<any> {
    await simulateDelay(400);
    
    const matches = matchService.getAllMatches();
    const events = localStorageService.getEvents();
    const parties = localStorageService.getParties();
    const trustScores = localStorageService.getTrustScores();
    
    return {
      totalMatches: matches.length,
      activeMatches: matches.filter(m => m.status === 'open' || m.status === 'soft_locked').length,
      totalEvents: events.length,
      totalParties: parties.length,
      totalUsers: Object.keys(trustScores).length,
      highTrustUsers: Object.values(trustScores).filter((s: any) => s.overall >= 80).length,
    };
  }
}

export const apiService = new ApiService();
