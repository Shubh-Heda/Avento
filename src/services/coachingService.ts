import { supabaseAuth } from './supabaseAuthService';
import { supabase, supabaseEnabled } from '../lib/supabaseClient';
// Firebase imports removed
// import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';

// Storage keys for localStorage fallback
const STORAGE_KEYS = {
  coaches: 'coaching_coaches',
  plans: 'coaching_plans',
  slots: 'coaching_slots',
  bookings: 'coaching_bookings',
  subscriptions: 'coaching_subscriptions',
  availability: 'coaching_availability',
};

const FIREBASE_ENABLED = import.meta.env.VITE_FIREBASE_ENABLED !== 'false';

export interface Coach {
  id: string;
  user_id: string;
  name: string;
  bio: string;
  specializations: string;
  expertise: string[];
  experience: string;
  rating: number;
  reviews_count: number;
  image_url: string;
  hourly_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CoachingPlan {
  id: string;
  coach_id: string;
  name: string;
  description: string;
  price: number;
  duration_months: number;
  sessions_count: number;
  features: string[];
  is_recommended: boolean;
  is_active: boolean;
}

export interface CoachingSlot {
  id: string;
  coach_id: string;
  turf_id?: string;
  sport: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  max_spots: number;
  spots_left: number;
  is_available: boolean;
  is_recurring: boolean;
}

export interface CoachingBooking {
  id: string;
  user_id: string;
  coach_id: string;
  plan_id?: string;
  slot_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  payment_status: 'pending' | 'paid' | 'refunded';
  amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CoachingSubscription {
  id: string;
  user_id: string;
  coach_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  sessions_total: number;
  sessions_used: number;
  sessions_remaining: number;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  payment_status: string;
  amount_paid: number;
}

// ========== Coach Management ==========

export async function getCoaches(sport?: string) {
  try {
    if (!FIREBASE_ENABLED) {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.coaches) || '[]');
      return data.filter((c: Coach) => c.is_active && (!sport || c.expertise?.includes(sport))).sort((a: Coach, b: Coach) => b.rating - a.rating) as Coach[];
    }

    const q = query(collection(db, 'coaches'), where('is_active', '==', true));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coach));
    return data.sort((a, b) => b.rating - a.rating);
  } catch (error) {
    console.error('Error fetching coaches:', error);
    return [];
  }
}

export async function getCoachById(coachId: string) {
  try {
    if (!FIREBASE_ENABLED) {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.coaches) || '[]');
      return data.find((c: Coach) => c.id === coachId) as Coach;
    }

    const docRef = doc(db, 'coaches', coachId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) throw new Error('Coach not found');
    return { id: snapshot.id, ...snapshot.data() } as Coach;
  } catch (error) {
    console.error('Error fetching coach:', error);
    throw error;
  }
}

// ========== Coaching Plans ==========

export async function getCoachingPlans(coachId?: string) {
  try {
    if (!FIREBASE_ENABLED) {
      let data = JSON.parse(localStorage.getItem(STORAGE_KEYS.plans) || '[]');
      data = data.filter((p: CoachingPlan) => p.is_active);
      if (coachId) data = data.filter((p: CoachingPlan) => p.coach_id === coachId);
      return data.sort((a: CoachingPlan, b: CoachingPlan) => a.price - b.price) as CoachingPlan[];
    }

    const q = query(collection(db, 'coaching_plans'), where('is_active', '==', true));
    const snapshot = await getDocs(q);
    let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachingPlan));
    if (coachId) data = data.filter((p: CoachingPlan) => p.coach_id === coachId);
    return data.sort((a, b) => a.price - b.price);
  } catch (error) {
    console.error('Error fetching coaching plans:', error);
    return [];
  }
}

// ========== Coaching Slots & Calendar ==========

export async function getAvailableCoachingSlots(
  coachId: string,
  date: Date,
  sport?: string
) {
  try {
    if (!FIREBASE_ENABLED) {
      const slots = JSON.parse(localStorage.getItem(STORAGE_KEYS.slots) || '[]');
      return slots.filter((s: CoachingSlot) => 
        s.coach_id === coachId && s.is_available && (!sport || s.sport === sport)
      );
    }

    const q = query(
      collection(db, 'coaching_slots'),
      where('coach_id', '==', coachId),
      where('is_available', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachingSlot));
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return [];
  }
}

export async function getCoachRecurringSlots(coachId: string, sport?: string): Promise<CoachingSlot[]> {
  try {
    if (!FIREBASE_ENABLED) {
      const slots = JSON.parse(localStorage.getItem(STORAGE_KEYS.slots) || '[]');
      return slots.filter((s: CoachingSlot) => 
        s.coach_id === coachId && s.is_available && s.is_recurring && (!sport || s.sport === sport)
      ).sort((a: CoachingSlot, b: CoachingSlot) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time));
    }

    const q = query(
      collection(db, 'coaching_slots'),
      where('coach_id', '==', coachId),
      where('is_recurring', '==', true),
      where('is_available', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachingSlot));
  } catch (error) {
    console.error('Error fetching recurring slots:', error);
    return [];
  }
}

export async function getAvailableTimeSlots(
  coachId: string,
  date: Date
): Promise<any[]> {
  try {
    const dayOfWeek = date.getDay();
    const slots = await getCoachRecurringSlots(coachId);
    const filteredSlots = slots.filter((s: CoachingSlot) => s.day_of_week === dayOfWeek);

    // Get bookings for this date
    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings) || '[]');
    const dateStr = date.toISOString().split('T')[0];
    const dayBookings = bookings.filter((b: CoachingBooking) => 
      b.coach_id === coachId && b.booking_date === dateStr && b.status === 'confirmed'
    );

    const bookingCounts: Record<string, number> = {};
    dayBookings.forEach((b: CoachingBooking) => {
      bookingCounts[b.slot_id] = (bookingCounts[b.slot_id] || 0) + 1;
    });

    return filteredSlots.map((slot: CoachingSlot) => ({
      time: slot.start_time,
      available: (slot.max_spots - (bookingCounts[slot.id] || 0)) > 0,
      spotsLeft: slot.max_spots - (bookingCounts[slot.id] || 0),
      slotId: slot.id,
      startTime: slot.start_time,
      endTime: slot.end_time,
    }));
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    return [];
  }
}

// ========== Booking Management ==========

export async function bookCoachingSlot(
  coachId: string,
  slotId: string,
  bookingDate: Date,
  planId?: string,
  amount?: number
) {
  const user = firebaseAuth.getCurrentUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const booking: CoachingBooking = {
      id: `booking-${Date.now()}`,
      user_id: user.id,
      coach_id: coachId,
      plan_id: planId,
      slot_id: slotId,
      booking_date: bookingDate.toISOString().split('T')[0],
      start_time: '',
      end_time: '',
      status: 'confirmed',
      payment_status: 'paid',
      amount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!FIREBASE_ENABLED) {
      const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings) || '[]');
      bookings.push(booking);
      localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
      return booking;
    }

    return booking;
  } catch (error) {
    console.error('Error booking slot:', error);
    throw error;
  }
}

export async function getUserCoachingBookings(userId?: string) {
  const user = firebaseAuth.getCurrentUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) {
    throw new Error('User not authenticated');
  }

  try {
    if (!FIREBASE_ENABLED) {
      const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings) || '[]');
      return bookings.filter((b: CoachingBooking) => b.user_id === targetUserId)
        .sort((a: CoachingBooking, b: CoachingBooking) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime());
    }

    const q = query(collection(db, 'coaching_bookings'), where('user_id', '==', targetUserId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachingBooking));
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
}

export async function cancelCoachingBooking(bookingId: string) {
  const user = firebaseAuth.getCurrentUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    if (!FIREBASE_ENABLED) {
      const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings) || '[]');
      const booking = bookings.find((b: CoachingBooking) => b.id === bookingId);
      if (booking && booking.user_id === user.id) {
        booking.status = 'cancelled';
        localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
        return booking;
      }
    }
    return null;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
}

// ========== Subscription Management ==========

export async function createCoachingSubscription(
  coachId: string,
  planId: string,
  startDate: Date
) {
  const user = firebaseAuth.getCurrentUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const plans = JSON.parse(localStorage.getItem(STORAGE_KEYS.plans) || '[]');
    const plan = plans.find((p: CoachingPlan) => p.id === planId);
    
    if (!plan) throw new Error('Plan not found');

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.duration_months);

    const subscription: CoachingSubscription = {
      id: `sub-${Date.now()}`,
      user_id: user.id,
      coach_id: coachId,
      plan_id: planId,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      sessions_total: plan.sessions_count,
      sessions_used: 0,
      sessions_remaining: plan.sessions_count,
      status: 'active',
      payment_status: 'paid',
      amount_paid: plan.price,
    };

    if (!FIREBASE_ENABLED) {
      const subscriptions = JSON.parse(localStorage.getItem(STORAGE_KEYS.subscriptions) || '[]');
      subscriptions.push(subscription);
      localStorage.setItem(STORAGE_KEYS.subscriptions, JSON.stringify(subscriptions));
      return subscription;
    }

    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

export async function getUserCoachingSubscriptions() {
  const user = firebaseAuth.getCurrentUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    if (!FIREBASE_ENABLED) {
      const subscriptions = JSON.parse(localStorage.getItem(STORAGE_KEYS.subscriptions) || '[]');
      return subscriptions.filter((s: CoachingSubscription) => s.user_id === user.id)
        .sort((a: CoachingSubscription, b: CoachingSubscription) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    }

    const q = query(collection(db, 'coaching_subscriptions'), where('user_id', '==', user.id));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachingSubscription));
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return [];
  }
}

// ========== Coach Availability ==========

export async function setCoachUnavailability(
  coachId: string,
  date: Date,
  startTime: string,
  endTime: string,
  reason?: string
) {
  try {
    if (!FIREBASE_ENABLED) {
      const availability = JSON.parse(localStorage.getItem(STORAGE_KEYS.availability) || '[]');
      availability.push({
        id: `avail-${Date.now()}`,
        coach_id: coachId,
        date: date.toISOString().split('T')[0],
        start_time: startTime,
        end_time: endTime,
        is_available: false,
        reason: reason || null,
      });
      localStorage.setItem(STORAGE_KEYS.availability, JSON.stringify(availability));
      return availability[availability.length - 1];
    }
    return null;
  } catch (error) {
    console.error('Error setting unavailability:', error);
    throw error;
  }
}

export async function getCoachUnavailableDates(
  coachId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    if (!FIREBASE_ENABLED) {
      const availability = JSON.parse(localStorage.getItem(STORAGE_KEYS.availability) || '[]');
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];
      return availability.filter((a: any) => 
        a.coach_id === coachId && a.date >= startStr && a.date <= endStr && !a.is_available
      );
    }
    return [];
  } catch (error) {
    console.error('Error fetching unavailable dates:', error);
    return [];
  }
}

// ========== Helper Functions ==========

export function formatTimeSlot(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`;
}

export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

export function isDateInPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function getNext7Days(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  
  return dates;
}
