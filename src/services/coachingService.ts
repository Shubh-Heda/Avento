import { supabase } from '../lib/supabase';

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
  let query = supabase
    .from('coaches')
    .select('*')
    .eq('is_active', true)
    .order('rating', { ascending: false });

  const { data, error } = await query;
  
  if (error) throw error;
  return data as Coach[];
}

export async function getCoachById(coachId: string) {
  const { data, error } = await supabase
    .from('coaches')
    .select('*')
    .eq('id', coachId)
    .single();

  if (error) throw error;
  return data as Coach;
}

// ========== Coaching Plans ==========

export async function getCoachingPlans(coachId?: string) {
  let query = supabase
    .from('coaching_plans')
    .select('*')
    .eq('is_active', true);

  if (coachId) {
    query = query.eq('coach_id', coachId);
  }

  const { data, error } = await query.order('price', { ascending: true });
  
  if (error) throw error;
  return data as CoachingPlan[];
}

// ========== Coaching Slots & Calendar ==========

/**
 * Get available coaching slots for a specific coach and date
 */
export async function getAvailableCoachingSlots(
  coachId: string,
  date: Date,
  sport?: string
) {
  const { data, error } = await supabase.rpc('get_available_coaching_slots', {
    p_coach_id: coachId,
    p_date: date.toISOString().split('T')[0],
    p_sport: sport || null,
  });

  if (error) throw error;
  return data;
}

/**
 * Get all recurring slots for a coach (for displaying weekly schedule)
 */
export async function getCoachRecurringSlots(coachId: string, sport?: string) {
  let query = supabase
    .from('coaching_slots')
    .select('*')
    .eq('coach_id', coachId)
    .eq('is_available', true)
    .eq('is_recurring', true)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (sport) {
    query = query.eq('sport', sport);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data as CoachingSlot[];
}

/**
 * Get available time slots for a specific date (with actual availability)
 */
export async function getAvailableTimeSlots(
  coachId: string,
  date: Date
): Promise<{ time: string; available: boolean; spotsLeft: number }[]> {
  const dayOfWeek = date.getDay();
  
  // Get recurring slots for this day of week
  const { data: slots, error: slotsError } = await supabase
    .from('coaching_slots')
    .select('*')
    .eq('coach_id', coachId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true)
    .order('start_time', { ascending: true });

  if (slotsError) throw slotsError;

  if (!slots || slots.length === 0) {
    return [];
  }

  // Get existing bookings for this date
  const { data: bookings, error: bookingsError } = await supabase
    .from('coaching_bookings')
    .select('slot_id, status')
    .eq('coach_id', coachId)
    .eq('booking_date', date.toISOString().split('T')[0])
    .eq('status', 'confirmed');

  if (bookingsError) throw bookingsError;

  // Calculate spots left for each slot
  const bookingCounts = (bookings || []).reduce((acc, booking) => {
    acc[booking.slot_id] = (acc[booking.slot_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return slots.map(slot => {
    const bookedCount = bookingCounts[slot.id] || 0;
    const spotsLeft = slot.max_spots - bookedCount;
    
    return {
      time: slot.start_time,
      available: spotsLeft > 0,
      spotsLeft: spotsLeft,
      slotId: slot.id,
      startTime: slot.start_time,
      endTime: slot.end_time,
    };
  });
}

// ========== Booking Management ==========

/**
 * Book a coaching slot
 */
export async function bookCoachingSlot(
  coachId: string,
  slotId: string,
  bookingDate: Date,
  planId?: string,
  amount?: number
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.rpc('book_coaching_slot', {
    p_user_id: user.id,
    p_coach_id: coachId,
    p_slot_id: slotId,
    p_booking_date: bookingDate.toISOString().split('T')[0],
    p_plan_id: planId || null,
    p_amount: amount || null,
  });

  if (error) throw error;
  return data;
}

/**
 * Get user's coaching bookings
 */
export async function getUserCoachingBookings(userId?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('coaching_bookings')
    .select(`
      *,
      coach:coaches(name, image_url),
      slot:coaching_slots(sport, start_time, end_time, duration_minutes)
    `)
    .eq('user_id', targetUserId)
    .order('booking_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Cancel a coaching booking
 */
export async function cancelCoachingBooking(bookingId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.rpc('cancel_coaching_booking', {
    p_booking_id: bookingId,
    p_user_id: user.id,
  });

  if (error) throw error;
  return data;
}

// ========== Subscription Management ==========

/**
 * Create a coaching subscription
 */
export async function createCoachingSubscription(
  coachId: string,
  planId: string,
  startDate: Date
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get plan details
  const { data: plan, error: planError } = await supabase
    .from('coaching_plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (planError) throw planError;

  // Calculate end date
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + plan.duration_months);

  const { data, error } = await supabase
    .from('coaching_subscriptions')
    .insert({
      user_id: user.id,
      coach_id: coachId,
      plan_id: planId,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      sessions_total: plan.sessions_count,
      sessions_remaining: plan.sessions_count,
      amount_paid: plan.price,
      status: 'active',
      payment_status: 'paid',
    })
    .select()
    .single();

  if (error) throw error;
  return data as CoachingSubscription;
}

/**
 * Get user's coaching subscriptions
 */
export async function getUserCoachingSubscriptions() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('coaching_subscriptions')
    .select(`
      *,
      coach:coaches(name, image_url, specializations),
      plan:coaching_plans(name, duration_months, sessions_count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ========== Coach Availability ==========

/**
 * Set coach unavailability for specific dates
 */
export async function setCoachUnavailability(
  coachId: string,
  date: Date,
  startTime: string,
  endTime: string,
  reason?: string
) {
  const { data, error } = await supabase
    .from('coach_availability')
    .insert({
      coach_id: coachId,
      date: date.toISOString().split('T')[0],
      start_time: startTime,
      end_time: endTime,
      is_available: false,
      reason: reason || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get coach unavailable dates
 */
export async function getCoachUnavailableDates(
  coachId: string,
  startDate: Date,
  endDate: Date
) {
  const { data, error } = await supabase
    .from('coach_availability')
    .select('*')
    .eq('coach_id', coachId)
    .eq('is_available', false)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0]);

  if (error) throw error;
  return data;
}

// ========== Helper Functions ==========

/**
 * Format time slot for display
 */
export function formatTimeSlot(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`;
}

/**
 * Get day name from day of week number
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

/**
 * Check if a date is in the past
 */
export function isDateInPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Get next 7 days from today
 */
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
