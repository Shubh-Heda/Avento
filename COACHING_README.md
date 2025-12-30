# 📅 Coaching Calendar Backend Integration

## Overview

Complete backend integration for the coaching system with **real calendar functionality**. Users can now select specific dates and book time slots with live availability tracking.

---

## ✨ Key Features Implemented

### 🗓️ Interactive Calendar
- Visual date selector showing next 7 days
- Today indicator badge
- Real-time availability for each date
- Smooth date switching

### ⏰ Smart Time Slot Management
- Live availability from database
- "X spots available" counter
- Automatic "Fully Booked" detection
- Prevents overbooking

### 💾 Complete Backend Infrastructure
- 6 database tables
- Row Level Security (RLS)
- SQL functions for bookings
- Automatic session tracking

### 🔄 Real-Time Updates
- Availability updates after each booking
- Spot counting per time slot
- Coach unavailability respect
- Instant feedback to users

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│            CoachingSubscription.tsx              │
│  (Updated with Calendar & Date Selection)       │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────┐
│          coachingService.ts (NEW)                │
│  • getAvailableTimeSlots(coach, date)           │
│  • bookCoachingSlot(coach, slot, date)          │
│  • createCoachingSubscription()                  │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────┐
│              Supabase Backend                    │
│  ┌─────────────────────────────────────┐       │
│  │ Tables:                              │       │
│  │  • coaches                           │       │
│  │  • coaching_plans                    │       │
│  │  • coaching_slots (recurring)        │       │
│  │  • coaching_bookings (with dates)    │       │
│  │  • coaching_subscriptions            │       │
│  │  • coach_availability                │       │
│  └─────────────────────────────────────┘       │
│                                                  │
│  ┌─────────────────────────────────────┐       │
│  │ Functions:                           │       │
│  │  • get_available_coaching_slots()    │       │
│  │  • book_coaching_slot()              │       │
│  │  • cancel_coaching_booking()         │       │
│  └─────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### coaches
```sql
id, user_id, name, bio, expertise[], rating, reviews_count, 
image_url, hourly_rate, is_active
```

### coaching_slots (Recurring Weekly)
```sql
id, coach_id, day_of_week (0-6), start_time, end_time,
duration_minutes, max_spots, spots_left, is_recurring
```

### coaching_bookings (Specific Dates)
```sql
id, user_id, coach_id, slot_id, booking_date, 
start_time, end_time, status, payment_status, amount
```

---

## 🎯 User Flow

### Before Integration
```
1. Select coach
2. Select plan
3. Select generic recurring slot → ❌ No date awareness
4. Subscribe
```

### After Integration
```
1. Select coach
2. Select plan
3. 📅 Select specific date from calendar
4. ⏰ See real-time available time slots
5. 🎫 Book with live spot counting
6. ✅ Create subscription + booking in DB
```

---

## 🔧 Setup Instructions

### 1. Run Backend Setup
```powershell
.\setup-coaching-backend.ps1
```

This will:
- Start Supabase locally
- Apply database migrations
- Create tables and functions
- Enable Row Level Security
- Show setup status

### 2. Seed Sample Data (Optional)
```powershell
supabase db reset
```

Creates:
- 4 sample coaches (Football, Basketball, Badminton)
- Multiple coaching plans
- Recurring weekly schedules
- Sample bookings

### 3. Start Development
```powershell
npm run dev
```

---

## 📱 Component Usage

### Calendar Date Selection
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  {availableDates.map((date, index) => (
    <button onClick={() => setSelectedDate(date)}>
      <div>{dayName}</div>
      <div className="text-2xl">{dayNumber}</div>
      {isToday && <Badge>Today</Badge>}
    </button>
  ))}
</div>
```

### Time Slot Display
```tsx
{availableTimeSlots.map(timeSlot => (
  <button onClick={() => toggleSlot(timeSlot.id)}>
    <Clock /> {timeSlot.time}
    {timeSlot.available ? (
      <span>{timeSlot.spotsLeft} spots available</span>
    ) : (
      <Badge>Fully Booked</Badge>
    )}
  </button>
))}
```

---

## 🔍 How It Works

### Getting Available Slots for a Date

1. **User selects date** → December 30, 2025
2. **System determines day** → Monday (day_of_week = 1)
3. **Query recurring slots** → All Monday slots for this coach
4. **Check bookings** → Count confirmed bookings for Dec 30
5. **Check availability** → Coach unavailability for Dec 30
6. **Calculate spots** → max_spots - booked_count
7. **Return results** → Available slots with spot counts

### SQL Logic
```sql
-- Get slots for Monday (day_of_week = 1)
SELECT * FROM coaching_slots WHERE day_of_week = 1

-- Count bookings for December 30, 2025
SELECT COUNT(*) FROM coaching_bookings 
WHERE booking_date = '2025-12-30' 
AND slot_id = <slot_id>
AND status = 'confirmed'

-- Calculate: spots_left = max_spots - booked_count
```

---

## 🎨 Visual Features

### Date Selector
```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │
│ 30  │ 31  │  1  │  2  │  3  │  4  │  5  │
│ Dec │ Dec │ Jan │ Jan │ Jan │ Jan │ Jan │
│TODAY│     │     │     │     │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
  ↑ Selected (highlighted in cyan)
```

### Time Slot Cards
```
┌──────────────────────────────┐
│ 🕐 6:00 AM          ✓        │ ← Selected
│ 4 spots available            │
└──────────────────────────────┘

┌──────────────────────────────┐
│ 🕐 7:00 AM                   │ ← Available
│ 6 spots available            │
└──────────────────────────────┘

┌──────────────────────────────┐
│ 🕐 8:00 AM                   │ ← Booked
│ Fully Booked                 │ (Grayed out)
└──────────────────────────────┘
```

---

## 📈 Data Flow Example

### Booking Scenario

**User Action**: Book 6:00 AM slot on Dec 30, 2025

```javascript
// 1. Frontend calls service
await bookCoachingSlot(
  'coach-123',
  'slot-abc',
  new Date('2025-12-30'),
  'premium-plan',
  1500
);

// 2. Service calls database function
book_coaching_slot(
  user_id: 'user-xyz',
  coach_id: 'coach-123',
  slot_id: 'slot-abc',
  booking_date: '2025-12-30',
  plan_id: 'premium-plan',
  amount: 1500
);

// 3. Database function:
//    - Validates slot availability
//    - Creates booking record
//    - Updates subscription sessions_used
//    - Returns booking_id

// 4. Frontend refreshes slots
getAvailableTimeSlots('coach-123', new Date('2025-12-30'));
// Now shows: "3 spots available" (was 4)
```

---

## 🔐 Security (RLS Policies)

```sql
-- Everyone can view active coaches and plans
CREATE POLICY "view_coaches" ON coaches FOR SELECT USING (is_active = true);

-- Users can only book for themselves
CREATE POLICY "create_bookings" ON coaching_bookings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only view their own bookings
CREATE POLICY "view_own_bookings" ON coaching_bookings FOR SELECT 
USING (auth.uid() = user_id);

-- Coaches can view their bookings
CREATE POLICY "view_coach_bookings" ON coaching_bookings FOR SELECT
USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));
```

---

## 📂 Files Structure

```
project/
├── supabase/
│   └── migrations/
│       ├── 007_coaching_backend.sql       ← Main schema
│       └── 008_coaching_seed_data.sql     ← Sample data
│
├── src/
│   ├── services/
│   │   └── coachingService.ts             ← Backend API
│   │
│   └── components/
│       └── CoachingSubscription.tsx       ← Updated component
│
├── setup-coaching-backend.ps1             ← Automated setup
├── COACHING_BACKEND_INTEGRATION.md        ← Full documentation
├── COACHING_BACKEND_SUMMARY.md            ← Quick reference
└── COACHING_README.md                     ← This file
```

---

## ✅ Testing Checklist

- [ ] Run `.\setup-coaching-backend.ps1`
- [ ] Verify migrations applied: `supabase migration list`
- [ ] View tables in Studio: `supabase db studio`
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to coaching section
- [ ] Select a coach
- [ ] Select a date from calendar
- [ ] Verify time slots show real availability
- [ ] Book a slot
- [ ] Verify availability updates
- [ ] Check database for booking record

---

## 🎉 Result

**Before**: Static mock data, no date awareness, fake availability

**After**: 
- ✅ Real database backing
- ✅ Calendar with date selection
- ✅ Live availability tracking
- ✅ Proper booking system
- ✅ Session management
- ✅ Production-ready

---

## 🚀 Quick Commands

```powershell
# Setup backend
.\setup-coaching-backend.ps1

# View database
supabase db studio

# Check status
supabase status

# View logs
supabase logs

# Reset database (reapply migrations)
supabase db reset
```

---

**Backend integration complete!** The coaching system now has full calendar functionality with real-time availability from the database. 🎓✨
