/**
 * Post-Match Service
 * Manages post-match rituals, reflections, memories, and hangout coordination
 */

import { localStorageService } from './localStorageService';

export interface PostMatchMemory {
  id: string;
  matchId: string;
  userId: string;
  photos: string[];
  vibeRating: number; // 1-5
  emotionalHighlights: string[];
  reflection: string;
  tags: string[];
  timestamp: Date;
}

export interface MatchRecap {
  matchId: string;
  date: Date;
  sport: string;
  turf: string;
  players: { id: string; name: string; avatar: string }[];
  highlights: string[];
  photos: string[];
  averageVibeRating: number;
  totalMemories: number;
}

export interface HangoutSuggestion {
  name: string;
  type: 'cafe' | 'restaurant' | 'bar' | 'dessert';
  distance: string;
  rating: number;
  priceRange: string;
  coordinates?: { lat: number; lng: number };
}

export interface HangoutPoll {
  id: string;
  matchId: string;
  question: string;
  options: string[];
  votes: Map<string, string>; // userId -> option
  createdBy: string;
  timestamp: Date;
  expiresAt: Date;
}

class PostMatchService {
  private readonly MEMORIES_KEY = 'avento_post_match_memories';
  private readonly POLLS_KEY = 'avento_hangout_polls';

  /**
   * Create a post-match memory
   */
  createMemory(params: {
    matchId: string;
    userId: string;
    photos?: string[];
    vibeRating: number;
    emotionalHighlights?: string[];
    reflection?: string;
    tags?: string[];
  }): PostMatchMemory {
    const memory: PostMatchMemory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      matchId: params.matchId,
      userId: params.userId,
      photos: params.photos || [],
      vibeRating: params.vibeRating,
      emotionalHighlights: params.emotionalHighlights || [],
      reflection: params.reflection || '',
      tags: params.tags || [],
      timestamp: new Date()
    };

    this.saveMemory(memory);
    return memory;
  }

  /**
   * Get all memories for a match
   */
  getMatchMemories(matchId: string): PostMatchMemory[] {
    const all = this.getAllMemories();
    return all.filter(m => m.matchId === matchId);
  }

  /**
   * Get user's memories
   */
  getUserMemories(userId: string): PostMatchMemory[] {
    const all = this.getAllMemories();
    return all.filter(m => m.userId === userId);
  }

  /**
   * Generate match recap
   */
  generateMatchRecap(matchId: string, matchData: any): MatchRecap {
    const memories = this.getMatchMemories(matchId);
    
    const allPhotos = memories.flatMap(m => m.photos);
    const averageVibe = memories.length > 0
      ? memories.reduce((sum, m) => sum + m.vibeRating, 0) / memories.length
      : 0;
    
    const highlights = [
      'Epic final goal in last 5 minutes! 🔥',
      'Amazing teamwork throughout',
      'Great sportsmanship from all players',
      'Perfect weather for the match'
    ];

    return {
      matchId,
      date: matchData.date || new Date(),
      sport: matchData.sport || 'Football',
      turf: matchData.turf || 'Unnamed Turf',
      players: matchData.players || [],
      highlights,
      photos: allPhotos,
      averageVibeRating: averageVibe,
      totalMemories: memories.length
    };
  }

  /**
   * Get nearby hangout suggestions
   */
  getHangoutSuggestions(location: string): HangoutSuggestion[] {
    // Mock data - in real app, integrate with Google Places API
    const suggestions: HangoutSuggestion[] = [
      {
        name: 'Cafe Coffee Day',
        type: 'cafe',
        distance: '0.3 km',
        rating: 4.2,
        priceRange: '₹₹'
      },
      {
        name: 'The Social',
        type: 'restaurant',
        distance: '0.5 km',
        rating: 4.5,
        priceRange: '₹₹₹'
      },
      {
        name: 'Theobroma',
        type: 'dessert',
        distance: '0.4 km',
        rating: 4.6,
        priceRange: '₹₹'
      },
      {
        name: 'Starbucks',
        type: 'cafe',
        distance: '0.6 km',
        rating: 4.3,
        priceRange: '₹₹₹'
      },
      {
        name: 'Burger King',
        type: 'restaurant',
        distance: '0.2 km',
        rating: 4.0,
        priceRange: '₹₹'
      }
    ];

    return suggestions.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
  }

  /**
   * Create hangout poll
   */
  createHangoutPoll(params: {
    matchId: string;
    question: string;
    options: string[];
    createdBy: string;
  }): HangoutPoll {
    const poll: HangoutPoll = {
      id: `poll_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      matchId: params.matchId,
      question: params.question,
      options: params.options,
      votes: new Map(),
      createdBy: params.createdBy,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
    };

    this.savePoll(poll);
    return poll;
  }

  /**
   * Vote in hangout poll
   */
  voteInPoll(pollId: string, userId: string, option: string): void {
    const polls = this.getAllPolls();
    const poll = polls.find(p => p.id === pollId);
    
    if (poll) {
      poll.votes.set(userId, option);
      this.saveAllPolls(polls);
    }
  }

  /**
   * Get poll results
   */
  getPollResults(pollId: string): { option: string; votes: number; percentage: number }[] {
    const polls = this.getAllPolls();
    const poll = polls.find(p => p.id === pollId);
    
    if (!poll) return [];
    
    const totalVotes = poll.votes.size;
    const results = poll.options.map(option => {
      const votes = Array.from(poll.votes.values()).filter(v => v === option).length;
      return {
        option,
        votes,
        percentage: totalVotes > 0 ? (votes / totalVotes) * 100 : 0
      };
    });
    
    return results.sort((a, b) => b.votes - a.votes);
  }

  /**
   * Get emotional highlight suggestions
   */
  getEmotionalHighlightSuggestions(): string[] {
    return [
      '💪 Felt empowered',
      '😊 Made new friends',
      '🎯 Achieved a goal',
      '🤝 Great teamwork',
      '⚡ High energy',
      '🧘 Stress relief',
      '🎉 Celebrated together',
      '💡 Learned something new',
      '❤️ Felt belonging',
      '🌟 Confidence boost'
    ];
  }

  /**
   * Storage helpers
   */
  private getAllMemories(): PostMatchMemory[] {
    const stored = localStorage.getItem(this.MEMORIES_KEY);
    if (!stored) return [];
    
    const memories = JSON.parse(stored);
    return memories.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp)
    }));
  }

  private saveMemory(memory: PostMatchMemory): void {
    const all = this.getAllMemories();
    all.push(memory);
    localStorage.setItem(this.MEMORIES_KEY, JSON.stringify(all));
  }

  private getAllPolls(): HangoutPoll[] {
    const stored = localStorage.getItem(this.POLLS_KEY);
    if (!stored) return [];
    
    const polls = JSON.parse(stored);
    return polls.map((p: any) => ({
      ...p,
      votes: new Map(Object.entries(p.votes || {})),
      timestamp: new Date(p.timestamp),
      expiresAt: new Date(p.expiresAt)
    }));
  }

  private savePoll(poll: HangoutPoll): void {
    const all = this.getAllPolls();
    all.push(poll);
    this.saveAllPolls(all);
  }

  private saveAllPolls(polls: HangoutPoll[]): void {
    const toSave = polls.map(p => ({
      ...p,
      votes: Object.fromEntries(p.votes)
    }));
    localStorage.setItem(this.POLLS_KEY, JSON.stringify(toSave));
  }

  /**
   * Initialize mock data
   */
  initializeMockData(): void {
    const mockMemories: PostMatchMemory[] = [
      {
        id: 'mem_1',
        matchId: 'match1',
        userId: 'user1',
        photos: [
          'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400',
          'https://images.unsplash.com/photo-1577223625816-7546f8d16d39?w=400'
        ],
        vibeRating: 5,
        emotionalHighlights: ['💪 Felt empowered', '🤝 Great teamwork', '❤️ Felt belonging'],
        reflection: 'One of the best matches! The team chemistry was incredible.',
        tags: ['epic', 'teamwork', 'friendship'],
        timestamp: new Date('2024-11-28T19:00:00')
      }
    ];
    
    localStorage.setItem(this.MEMORIES_KEY, JSON.stringify(mockMemories));
  }
}

export const postMatchService = new PostMatchService();
