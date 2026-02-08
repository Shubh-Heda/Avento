// ============================================
// Advanced Trust Score Service - Supabase Version
// ============================================
import { supabase, supabaseEnabled } from '../lib/supabaseClient';
import { toast } from 'sonner';

export interface TrustScoreDimension {
  name: 'reliability' | 'behavior' | 'community';
  score: number;
  weight: number;
  change_history: { date: string; change: number }[];
}

export interface TrustEventLog {
  id: string;
  user_id: string;
  event_type: string;
  dimension: string;
  old_score: number;
  new_score: number;
  change_amount: number;
  reason: string;
  related_user?: string;
  is_decay?: boolean;
  created_at: string;
}

export interface TrustAppeal {
  id: string;
  user_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'approved' | 'denied' | 'resolved';
  evidence_url?: string;
  reviewer_notes?: string;
  created_at: string;
}

class AdvancedTrustService {
  // Constants
  private readonly DAILY_GAIN_CAP = 15; // Max points per day
  private readonly FEEDBACK_COOLDOWN_HOURS = 24;
  private readonly DECAY_PERCENTAGE = 0.5; // 0.5% per month
  private readonly RECIPROCAL_FEEDBACK_THRESHOLD = 5; // Flag after 5 mutual feedbacks

  // ==================== TRANSPARENCY & EVENT LOGS ====================

  /**
   * Get detailed trust score with dimension breakdown
   */
  async getTrustScoreWithDimensions(userId: string) {
    try {
      const scoreDoc = await getDoc(doc(db, 'user_trust_scores', userId));
      if (!scoreDoc.exists()) {
        throw new Error('User trust score not found');
      }
      const score = scoreDoc.data();

      const weightsDoc = await getDoc(doc(db, 'trust_score_weights', userId));
      const weights = weightsDoc.exists() ? weightsDoc.data() : {
        reliability_weight: 0.4,
        behavior_weight: 0.35,
        community_weight: 0.25
      };

      return {
        ...score,
        dimensions: [
          {
            name: 'reliability',
            score: score.reliability_score,
            weight: weights.reliability_weight
          },
          {
            name: 'behavior',
            score: score.behavior_score,
            weight: weights.behavior_weight
          },
          {
            name: 'community',
            score: score.community_score,
            weight: weights.community_weight
          }
        ]
      };
    } catch (error) {
      console.error('Error getting trust score:', error);
      throw error;
    }
  }

  /**
   * Log a trust score event
   */
  async logTrustEvent(event: Omit<TrustEventLog, 'id' | 'created_at'>) {
    try {
      await addDoc(collection(db, 'trust_event_logs'), {
        ...event,
        created_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging trust event:', error);
    }
  }

  /**
   * Get event logs for a user
   */
  async getUserEventLogs(userId: string, limitCount: number = 50) {
    try {
      const q = query(
        collection(db, 'trust_event_logs'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting event logs:', error);
      return [];
    }
  }

  /**
   * Apply time decay to trust scores
   */
  async applyDecay(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'user_trust_scores', userId));
      if (!userDoc.exists()) return;

      const data = userDoc.data();
      const lastDecay = data.last_decay ? data.last_decay.toDate() : new Date(0);
      const monthsSinceDecay = (Date.now() - lastDecay.getTime()) / (1000 * 60 * 60 * 24 * 30);

      if (monthsSinceDecay < 1) return;

      const decayAmount = Math.floor(data.total_score * (this.DECAY_PERCENTAGE / 100) * monthsSinceDecay);
      if (decayAmount > 0) {
        const newScore = Math.max(0, data.total_score - decayAmount);
        
        await updateDoc(doc(db, 'user_trust_scores', userId), {
          total_score: newScore,
          last_decay: serverTimestamp()
        });

        await this.logTrustEvent({
          user_id: userId,
          event_type: 'decay',
          dimension: 'all',
          old_score: data.total_score,
          new_score: newScore,
          change_amount: -decayAmount,
          reason: 'Monthly inactivity decay',
          is_decay: true
        });
      }
    } catch (error) {
      console.error('Error applying decay:', error);
    }
  }

  /**
   * Submit trust score appeal
   */
  async submitAppeal(appeal: Omit<TrustAppeal, 'id' | 'created_at' | 'status'>) {
    try {
      const docRef = await addDoc(collection(db, 'trust_appeals'), {
        ...appeal,
        status: 'pending',
        created_at: serverTimestamp()
      });
      
      toast.success('Appeal submitted', {
        description: 'Your appeal will be reviewed by our team.'
      });
      
      return { id: docRef.id, error: null };
    } catch (error: any) {
      toast.error('Failed to submit appeal');
      return { id: null, error: error.message };
    }
  }

  /**
   * Get user appeals
   */
  async getUserAppeals(userId: string) {
    try {
      const q = query(
        collection(db, 'trust_appeals'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting appeals:', error);
      return [];
    }
  }

  // ==================== INITIALIZATION ====================

  /**
   * Initialize trust score for new user
   */
  async initializeTrustScore(userId: string) {
    try {
      await setDoc(doc(db, 'user_trust_scores', userId), {
        user_id: userId,
        total_score: 50,
        reliability_score: 50,
        behavior_score: 50,
        community_score: 50,
        last_decay: serverTimestamp(),
        created_at: serverTimestamp()
      });

      await setDoc(doc(db, 'trust_score_weights', userId), {
        user_id: userId,
        reliability_weight: 0.4,
        behavior_weight: 0.35,
        community_weight: 0.25
      });

      await this.logTrustEvent({
        user_id: userId,
        event_type: 'initialization',
        dimension: 'all',
        old_score: 0,
        new_score: 50,
        change_amount: 50,
        reason: 'Account created'
      });
    } catch (error) {
      console.error('Error initializing trust score:', error);
    }
  }
}

export const advancedTrustService = new AdvancedTrustService();
