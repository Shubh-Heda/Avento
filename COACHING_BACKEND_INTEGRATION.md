# Coaching Backend Integration - Complete Guide

## Overview

The coaching system now has full backend integration with calendar functionality, allowing users to:
- Browse available coaches with real expertise and ratings
- Select coaching plans (Basic, Premium, Elite)
- Choose specific dates using a calendar interface
- Book available time slots with real-time availability
- Track coaching subscriptions and sessions

## Database Schema

### Tables Created

1. **coaches** - Coach profiles with ratings, expertise, and hourly rates
2. **coaching_plans** - Subscription plans with features and pricing
3. **coaching_slots** - Recurring weekly time slots for each coach
4. **coaching_bookings** - Individual booking records with dates
5. **coaching_subscriptions** - User subscriptions to coaching plans
6. **coach_availability** - Coach-specific availability/unavailability dates

### Key Features

#### 📅 Calendar Integration
- **Date Selection**: Users can select from the next 7 days
- **Real-time Availability**: Slots show actual availability from database
- **Dynamic Updates**: Booked slots automatically reduce available spots
- **Coach Availability**: Respects coach unavailability dates

#### 🕒 Time Slot Management
- **Recurring Slots**: Coaches have weekly recurring schedules
- **Day-based**: Slots are organized by day of week (Monday = 1, Sunday = 0)
- **Capacity Tracking**: Each slot has max capacity and tracks spots left
- **Booking Prevention**: Prevents overbooking automatically

#### 💰 Subscription System
- **Session Tracking**: Tracks total, used, and remaining sessions
- **Plan Association**: Links bookings to subscription plans
- **Payment Status**: Manages payment states (pending, paid, refunded)
- **Status Management**: Active, paused, cancelled, expired states

## API Functions

### Frontend Service (`src/services/coachingService.ts`)

```typescript
// Get available coaches
getCoaches(sport?: string): Promise<Coach[]>

// Get coaching plans
getCoachingPlans(coachId?: string): Promise<CoachingPlan[]>

// Get available time slots for a specific date
getAvailableTimeSlots(coachId: string, date: Date): Promise<TimeSlot[]>

// Book a coaching slot
bookCoachingSlot(
  coachId: string,
  slotId: string,
  bookingDate: Date,
  planId?: string,
  amount?: number
): Promise<string>

// Create coaching subscription
createCoachingSubscription(
  coachId: string,
  planId: string,
  startDate: Date
): Promise<CoachingSubscription>

// Get user's bookings
getUserCoachingBookings(userId?: string): Promise<Booking[]>

// Cancel a booking
cancelCoachingBooking(bookingId: string): Promise<boolean>
```

### Database Functions (SQL)

```sql
-- Get available slots for a specific date
get_available_coaching_slots(
  p_coach_id UUID,
  p_date DATE,
  p_sport TEXT
) RETURNS TABLE

-- Book a coaching slot
book_coaching_slot(
  p_user_id UUID,
  p_coach_id UUID,
  p_slot_id UUID,
  p_booking_date DATE,
  p_plan_id UUID,
  p_amount NUMERIC
) RETURNS UUID

-- Cancel a booking
cancel_coaching_booking(
  p_booking_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN
```

## Component Integration

### CoachingSubscription Component

The component now includes:

1. **Coach Selection** - Browse and select from real coaches in database
2. **Plan Selection** - Choose from coaching plans (Basic/Premium/Elite)
3. **Calendar View** - Interactive date selector showing next 7 days
4. **Time Slot Selection** - Shows real-time availability with spots left
5. **Confirmation** - Review all selections before subscribing

### Key State Management

```typescript
const [selectedCoach, setSelectedCoach] = useState<string | null>(null);
const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
const [selectedDate, setSelectedDate] = useState<Date>(new Date());
const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
const [isLoadingSlots, setIsLoadingSlots] = useState(false);
```

### Data Flow

1. User selects a coach → Loads that coach's recurring slots
2. User selects a date → Fetches availability for that specific date
3. Shows time slots with:
   - Booked slots (from coaching_bookings table)
   - Coach unavailability (from coach_availability table)
   - Remaining spots calculation
4. User books slot → Creates subscription + booking records

## Setup Instructions

### 1. Apply Migrations

```powershell
# Run the setup script
.\setup-coaching-backend.ps1

# Or manually
supabase db push
```

### 2. Seed Sample Data

```powershell
# Reset database (applies all migrations including seed data)
supabase db reset
```

This creates:
- 4 sample coaches (Football, Goalkeeper, Basketball, Badminton)
- Multiple coaching plans per coach
- Recurring weekly slots for each coach
- Sample bookings to demonstrate the system

### 3. Update Configuration

Ensure your `src/supabase-config.json` has correct credentials:

```json
{
  "projectId": "your-project-id",
  "publicAnonKey": "your-anon-key"
}
```

## Usage Examples

### Booking a Coaching Session

```typescript
import { bookCoachingSlot } from '../services/coachingService';

// Book a slot
const bookingId = await bookCoachingSlot(
  'coach-id',
  'slot-id',
  new Date('2025-12-30'),
  'plan-id', // optional: if part of subscription
  1500 // amount in rupees
);
```

### Getting Available Slots

```typescript
import { getAvailableTimeSlots } from '../services/coachingService';

// Get slots for tomorrow
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const slots = await getAvailableTimeSlots('coach-id', tomorrow);
// Returns: [{ time: "06:00", available: true, spotsLeft: 4 }, ...]
```

### Creating a Subscription

```typescript
import { createCoachingSubscription } from '../services/coachingService';

const subscription = await createCoachingSubscription(
  'coach-id',
  'premium-plan-id',
  new Date() // start date
);
```

## Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- **Read Access**: Everyone can view active coaches, plans, and available slots
- **Write Access**: Only authenticated users can create bookings
- **Privacy**: Users can only view their own bookings and subscriptions
- **Coach Management**: Coaches can manage their own slots and availability

## Calendar Features Explained

### Date Selection
- Shows next 7 days in a grid layout
- Highlights today with a badge
- Selected date is highlighted
- Updates time slots when date changes

### Time Slot Display
- Shows actual available slots for selected date
- Displays spots remaining (e.g., "4 spots available")
- Grays out fully booked slots
- Shows booking confirmation checkmark

### Real-time Updates
- Queries database for current availability
- Accounts for existing bookings
- Checks coach unavailability
- Prevents double booking

## Testing the Integration

### 1. View Database Tables

```powershell
supabase db studio
```

Navigate to:
- Tables → coaches (see sample coaches)
- Tables → coaching_slots (see recurring schedules)
- Tables → coaching_bookings (see booked sessions)

### 2. Test Booking Flow

1. Start dev server: `npm run dev`
2. Navigate to a turf with coaching available
3. Click "Explore Coaching Plans"
4. Select a coach, plan, date, and time slot
5. Confirm booking
6. Check database for new booking record

### 3. Verify Calendar Integration

- Select different dates and watch time slots update
- Book a slot and verify it's removed from available slots
- Check that recurring weekly slots appear correctly

## Troubleshooting

### "Failed to load available time slots"

Check:
1. Supabase is running: `supabase status`
2. Migrations applied: `supabase migration list`
3. RLS policies allow read access
4. Coach has slots defined for selected day of week

### "No available slots for this date"

This can happen if:
1. Coach has no recurring slots for that day of week
2. All slots are fully booked for that date
3. Coach marked unavailable for that date
4. Date is in the past

### Booking Fails

Verify:
1. User is authenticated
2. Slot still has available spots
3. No duplicate booking for same user/slot/date
4. Subscription has remaining sessions (if applicable)

## Future Enhancements

Potential additions:
- [ ] Multi-week calendar view
- [ ] Recurring booking patterns
- [ ] Waitlist for fully booked slots
- [ ] Coach rating and review system after sessions
- [ ] Automated reminders via email/SMS
- [ ] Payment gateway integration
- [ ] Video session support
- [ ] Session notes and feedback

## File Structure

```
supabase/
  migrations/
    007_coaching_backend.sql        # Main backend schema
    008_coaching_seed_data.sql      # Sample data

src/
  services/
    coachingService.ts             # Backend integration service
  
  components/
    CoachingSubscription.tsx       # Updated with calendar

setup-coaching-backend.ps1         # Automated setup script
COACHING_BACKEND_INTEGRATION.md    # This file
```

## Support

For issues or questions:
1. Check migration logs: `supabase db inspect`
2. View Supabase logs: `supabase logs`
3. Verify RLS policies in Supabase Studio
4. Check browser console for frontend errors

---

**Integration Complete!** 🎉

The coaching system now has full backend support with calendar integration. Users can book specific dates and times with real-time availability checking.
