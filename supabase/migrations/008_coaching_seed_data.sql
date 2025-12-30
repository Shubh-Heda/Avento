-- Seed data for Coaching System
-- Run this after running 007_coaching_backend.sql

-- Insert sample coaches
INSERT INTO coaches (id, name, bio, specializations, expertise, experience, rating, reviews_count, image_url, hourly_rate, is_active) VALUES
  (
    'c1c1c1c1-1111-1111-1111-111111111111',
    'Coach Rajesh Kumar',
    'Former professional footballer with experience coaching national youth teams.',
    'Specializes in attacking strategies and youth development',
    ARRAY['Dribbling', 'Shooting', 'Tactical Play', 'Fitness'],
    '12 Years',
    4.9,
    87,
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    1500,
    true
  ),
  (
    'c2c2c2c2-2222-2222-2222-222222222222',
    'Coach Priya Sharma',
    'Ex-national goalkeeper with a passion for teaching defensive techniques.',
    'Expert in goalkeeper training and defensive formations',
    ARRAY['Goal Keeping', 'Defense', 'Positioning', 'Reflexes'],
    '8 Years',
    4.8,
    64,
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    1200,
    true
  ),
  (
    'c3c3c3c3-3333-3333-3333-333333333333',
    'Coach Michael Johnson',
    'Professional basketball coach with college-level coaching experience.',
    'Shooting techniques and offensive strategies',
    ARRAY['Shooting', 'Ball Handling', 'Defense', 'Conditioning'],
    '10 Years',
    4.7,
    56,
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
    1800,
    true
  ),
  (
    'c4c4c4c4-4444-4444-4444-444444444444',
    'Coach Anita Desai',
    'Professional badminton player turned coach, specializing in technique and agility.',
    'Singles and doubles strategy, footwork excellence',
    ARRAY['Technique', 'Footwork', 'Strategy', 'Agility Training'],
    '9 Years',
    4.9,
    92,
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    1400,
    true
  );

-- Insert coaching plans for each coach
INSERT INTO coaching_plans (id, coach_id, name, description, price, duration_months, sessions_count, features, is_recommended, is_active) VALUES
  -- Plans for Coach Rajesh Kumar (Football)
  (
    'p1p1p1p1-1111-1111-1111-111111111111',
    'c1c1c1c1-1111-1111-1111-111111111111',
    'Basic Football Training',
    'Get started with fundamental football skills',
    2999,
    1,
    8,
    ARRAY[
      '8 coaching sessions',
      'Group training (max 6 people)',
      'Basic skill assessment',
      'Weekly progress reports',
      'Access to training materials'
    ],
    false,
    true
  ),
  (
    'p1p1p1p1-2222-2222-2222-222222222222',
    'c1c1c1c1-1111-1111-1111-111111111111',
    'Premium Football Training',
    'Advanced training for serious players',
    7999,
    3,
    24,
    ARRAY[
      '24 coaching sessions',
      'Semi-private training (max 3 people)',
      'Comprehensive skill assessment',
      'Bi-weekly progress reports',
      'Personalized training plan',
      'Video analysis of your gameplay',
      'Nutrition guidance',
      'Priority booking'
    ],
    true,
    true
  ),
  -- Plans for Coach Priya Sharma (Goalkeeper)
  (
    'p2p2p2p2-1111-1111-1111-111111111111',
    'c2c2c2c2-2222-2222-2222-222222222222',
    'Goalkeeper Essentials',
    'Master the fundamentals of goalkeeping',
    2999,
    1,
    8,
    ARRAY[
      '8 specialized goalkeeper sessions',
      'Small group training (max 4)',
      'Reflexes and positioning drills',
      'Weekly performance tracking'
    ],
    false,
    true
  ),
  (
    'p2p2p2p2-2222-2222-2222-222222222222',
    'c2c2c2c2-2222-2222-2222-222222222222',
    'Elite Goalkeeper Program',
    'Professional-level goalkeeper training',
    14999,
    6,
    48,
    ARRAY[
      '48 one-on-one sessions',
      'Advanced reflexes training',
      'Match situation drills',
      'Video analysis',
      'Custom training program',
      'Tournament preparation'
    ],
    true,
    true
  );

-- Insert coaching slots (recurring weekly schedule)
-- Monday slots for Coach Rajesh
INSERT INTO coaching_slots (coach_id, sport, day_of_week, start_time, end_time, duration_minutes, max_spots, spots_left, is_available, is_recurring) VALUES
  ('c1c1c1c1-1111-1111-1111-111111111111', 'Football', 1, '06:00:00', '07:30:00', 90, 6, 6, true, true),
  ('c1c1c1c1-1111-1111-1111-111111111111', 'Football', 1, '17:00:00', '18:30:00', 90, 6, 6, true, true),
  ('c1c1c1c1-1111-1111-1111-111111111111', 'Football', 1, '18:30:00', '20:00:00', 90, 6, 6, true, true);

-- Wednesday slots for Coach Rajesh
INSERT INTO coaching_slots (coach_id, sport, day_of_week, start_time, end_time, duration_minutes, max_spots, spots_left, is_available, is_recurring) VALUES
  ('c1c1c1c1-1111-1111-1111-111111111111', 'Football', 3, '06:00:00', '07:30:00', 90, 6, 6, true, true),
  ('c1c1c1c1-1111-1111-1111-111111111111', 'Football', 3, '17:00:00', '18:30:00', 90, 6, 6, true, true);

-- Friday slots for Coach Rajesh
INSERT INTO coaching_slots (coach_id, sport, day_of_week, start_time, end_time, duration_minutes, max_spots, spots_left, is_available, is_recurring) VALUES
  ('c1c1c1c1-1111-1111-1111-111111111111', 'Football', 5, '06:00:00', '07:30:00', 90, 6, 6, true, true),
  ('c1c1c1c1-1111-1111-1111-111111111111', 'Football', 5, '17:30:00', '19:00:00', 90, 6, 6, true, true);

-- Tuesday and Thursday slots for Coach Priya (Goalkeeper)
INSERT INTO coaching_slots (coach_id, sport, day_of_week, start_time, end_time, duration_minutes, max_spots, spots_left, is_available, is_recurring) VALUES
  ('c2c2c2c2-2222-2222-2222-222222222222', 'Football', 2, '06:30:00', '08:00:00', 90, 4, 4, true, true),
  ('c2c2c2c2-2222-2222-2222-222222222222', 'Football', 2, '18:00:00', '19:30:00', 90, 4, 4, true, true),
  ('c2c2c2c2-2222-2222-2222-222222222222', 'Football', 4, '06:30:00', '08:00:00', 90, 4, 4, true, true),
  ('c2c2c2c2-2222-2222-2222-222222222222', 'Football', 4, '18:00:00', '19:30:00', 90, 4, 4, true, true);

-- Basketball slots for Coach Michael
INSERT INTO coaching_slots (coach_id, sport, day_of_week, start_time, end_time, duration_minutes, max_spots, spots_left, is_available, is_recurring) VALUES
  ('c3c3c3c3-3333-3333-3333-333333333333', 'Basketball', 1, '16:00:00', '17:30:00', 90, 6, 6, true, true),
  ('c3c3c3c3-3333-3333-3333-333333333333', 'Basketball', 1, '18:00:00', '19:30:00', 90, 6, 6, true, true),
  ('c3c3c3c3-3333-3333-3333-333333333333', 'Basketball', 3, '16:00:00', '17:30:00', 90, 6, 6, true, true),
  ('c3c3c3c3-3333-3333-3333-333333333333', 'Basketball', 5, '16:00:00', '17:30:00', 90, 6, 6, true, true);

-- Badminton slots for Coach Anita
INSERT INTO coaching_slots (coach_id, sport, day_of_week, start_time, end_time, duration_minutes, max_spots, spots_left, is_available, is_recurring) VALUES
  ('c4c4c4c4-4444-4444-4444-444444444444', 'Badminton', 2, '07:00:00', '08:30:00', 90, 4, 4, true, true),
  ('c4c4c4c4-4444-4444-4444-444444444444', 'Badminton', 2, '17:00:00', '18:30:00', 90, 4, 4, true, true),
  ('c4c4c4c4-4444-4444-4444-444444444444', 'Badminton', 4, '07:00:00', '08:30:00', 90, 4, 4, true, true),
  ('c4c4c4c4-4444-4444-4444-444444444444', 'Badminton', 4, '17:00:00', '18:30:00', 90, 4, 4, true, true),
  ('c4c4c4c4-4444-4444-4444-444444444444', 'Badminton', 6, '08:00:00', '09:30:00', 90, 4, 4, true, true);

-- Sample bookings for demonstration (optional - can be removed)
-- These would show that 8:00 AM on the selected date is already booked
INSERT INTO coaching_bookings (
  user_id,
  coach_id,
  slot_id,
  booking_date,
  start_time,
  end_time,
  status,
  payment_status,
  amount
)
SELECT 
  auth.uid(),
  'c1c1c1c1-1111-1111-1111-111111111111',
  (SELECT id FROM coaching_slots WHERE coach_id = 'c1c1c1c1-1111-1111-1111-111111111111' AND start_time = '06:00:00' AND day_of_week = EXTRACT(DOW FROM CURRENT_DATE + INTERVAL '1 day')::INTEGER LIMIT 1),
  CURRENT_DATE + INTERVAL '1 day',
  '06:00:00',
  '07:30:00',
  'confirmed',
  'paid',
  1500
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1);
