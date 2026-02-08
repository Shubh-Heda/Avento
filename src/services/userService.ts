/**
 * User Service
 * Manages user data and profiles with Firebase backend + mock data fallback
 */

import { mockDataService } from './mockDataService';
import { trustScoreService } from './trustScoreService';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  name: string;
  avatar: string;
  trustScore?: number;
  badges?: string[];
}

class UserService {
  private cache: Map<string, User> = new Map();
  private allUsersCache: User[] | null = null;
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Get user by ID with Supabase + mock data fallback
   */
  async getUserById(userId: string): Promise<User | undefined> {
    try {
      // Check cache first
      if (this.cache.has(userId)) {
        return this.cache.get(userId);
      }

      // Try fetching from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .eq('id', userId)
        .single();

      if (!error && data) {
        const user = await this.enrichUserWithTrustScore(data);
        this.cache.set(userId, user);
        return user;
      }

      // Fallback to mock data
      console.log('Using mock data for user:', userId);
      return this.getMockUserById(userId);
    } catch (error) {
      console.warn('Error fetching user, using mock data:', error);
      return this.getMockUserById(userId);
    }
  }

  /**
   * Get mock user by ID (fallback)
   */
  private getMockUserById(userId: string): User | undefined {
    const mockUser = mockDataService.getUserById(userId);
    if (!mockUser) return undefined;

    const trustScore = trustScoreService.getTrustScore(userId);
    const overall = trustScore?.overall || 75;
    
    const badges: string[] = [];
    if (overall >= 90) badges.push('High trust zone');
    if (overall >= 80) badges.push('Reliable player');
    if (overall >= 75) badges.push('Newbie-friendly');
    if (trustScore && trustScore.completedMatches >= 10) badges.push('Experienced');
    
    return {
      ...mockUser,
      trustScore: overall,
      badges,
    };
  }

  /**
   * Get all users with Supabase + mock data fallback
   */
  async getAllUsers(): Promise<User[]> {
    try {
      // Check cache
      if (this.allUsersCache) {
        return this.allUsersCache;
      }

      // Try fetching from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .limit(50);

      if (!error && data && data.length > 0) {
        const users = await Promise.all(
          data.map(user => this.enrichUserWithTrustScore(user))
        );
        this.allUsersCache = users;
        
        // Clear cache after expiry
        setTimeout(() => { this.allUsersCache = null; }, this.cacheExpiry);
        
        return users;
      }

      // Fallback to mock data
      console.log('Using mock data for all users');
      return this.getAllMockUsers();
    } catch (error) {
      console.warn('Error fetching users, using mock data:', error);
      return this.getAllMockUsers();
    }
  }

  /**
   * Get all mock users (fallback)
   */
  private getAllMockUsers(): User[] {
    return mockDataService.getAllMockUsers().map(user => ({
      ...user,
      trustScore: trustScoreService.getTrustScore(user.id)?.overall || 75,
    }));
  }

  /**
   * Search users by name
   */
  async searchUsers(query: string): Promise<User[]> {
    const allUsers = await this.getAllUsers();
    const lowerQuery = query.toLowerCase();
    return allUsers.filter(user => 
      user.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Enrich user data with trust score and badges
   */
  private async enrichUserWithTrustScore(user: any): Promise<User> {
    const trustScore = trustScoreService.getTrustScore(user.id);
    const overall = trustScore?.overall || 75;
    
    const badges: string[] = [];
    if (overall >= 90) badges.push('High trust zone');
    if (overall >= 80) badges.push('Reliable player');
    if (overall >= 75) badges.push('Newbie-friendly');
    if (trustScore && trustScore.completedMatches >= 10) badges.push('Experienced');
    
    return {
      id: user.id,
      name: user.name,
      avatar: user.avatar || '👤',
      trustScore: overall,
      badges,
    };
  }

  /**
   * Clear all caches (useful after updates)
   */
  clearCache(): void {
    this.cache.clear();
    this.allUsersCache = null;
  }
}

export const userService = new UserService();