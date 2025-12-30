# Coaching Backend Setup Script
# This script sets up the coaching system with calendar integration

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Coaching Backend Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "Checking Supabase CLI..." -ForegroundColor Yellow
$supabaseVersion = supabase --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Please install it from: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
Write-Host ""

# Check if supabase is initialized
if (!(Test-Path "supabase/.temp")) {
    Write-Host "Initializing Supabase locally..." -ForegroundColor Yellow
    supabase init
    Write-Host "✓ Supabase initialized" -ForegroundColor Green
    Write-Host ""
}

# Start Supabase (if not already running)
Write-Host "Starting Supabase services..." -ForegroundColor Yellow
supabase start
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start Supabase" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Supabase services started" -ForegroundColor Green
Write-Host ""

# Apply coaching backend migration
Write-Host "Applying coaching backend migration..." -ForegroundColor Yellow
supabase db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to apply migrations" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Coaching backend migration applied" -ForegroundColor Green
Write-Host ""

# Check migration status
Write-Host "Checking migration status..." -ForegroundColor Yellow
supabase migration list
Write-Host ""

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Coaching System Features Enabled:" -ForegroundColor Cyan
Write-Host "  ✓ Coach profiles and management" -ForegroundColor White
Write-Host "  ✓ Coaching plans (Basic, Premium, Elite)" -ForegroundColor White
Write-Host "  ✓ Calendar integration with date selection" -ForegroundColor White
Write-Host "  ✓ Time slot booking system" -ForegroundColor White
Write-Host "  ✓ Recurring weekly schedules" -ForegroundColor White
Write-Host "  ✓ Coach availability management" -ForegroundColor White
Write-Host "  ✓ Subscription tracking" -ForegroundColor White
Write-Host "  ✓ Real-time availability updates" -ForegroundColor White
Write-Host ""

Write-Host "Database Tables Created:" -ForegroundColor Cyan
Write-Host "  • coaches" -ForegroundColor White
Write-Host "  • coaching_plans" -ForegroundColor White
Write-Host "  • coaching_slots" -ForegroundColor White
Write-Host "  • coaching_bookings" -ForegroundColor White
Write-Host "  • coaching_subscriptions" -ForegroundColor White
Write-Host "  • coach_availability" -ForegroundColor White
Write-Host ""

Write-Host "Functions Available:" -ForegroundColor Cyan
Write-Host "  • get_available_coaching_slots(coach_id, date, sport)" -ForegroundColor White
Write-Host "  • book_coaching_slot(user_id, coach_id, slot_id, date, plan_id, amount)" -ForegroundColor White
Write-Host "  • cancel_coaching_booking(booking_id, user_id)" -ForegroundColor White
Write-Host ""

# Get Supabase URL and keys
$supabaseStatus = supabase status --output json | ConvertFrom-Json
$apiUrl = $supabaseStatus.API_URL
$anonKey = $supabaseStatus.ANON_KEY

Write-Host "Local Supabase Connection:" -ForegroundColor Cyan
Write-Host "  API URL: $apiUrl" -ForegroundColor White
Write-Host "  Studio URL: http://localhost:54323" -ForegroundColor White
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Update your supabase-config.json with local credentials" -ForegroundColor White
Write-Host "  2. The CoachingSubscription component is now integrated with backend" -ForegroundColor White
Write-Host "  3. Calendar will show real-time availability from database" -ForegroundColor White
Write-Host "  4. Users can book specific dates and time slots" -ForegroundColor White
Write-Host "  5. Run 'npm run dev' to test the coaching booking flow" -ForegroundColor White
Write-Host ""

Write-Host "To view the database:" -ForegroundColor Yellow
Write-Host "  supabase db studio" -ForegroundColor White
Write-Host ""

Write-Host "To seed sample data:" -ForegroundColor Yellow
Write-Host "  supabase db reset" -ForegroundColor White
Write-Host "  (This will apply migration 008_coaching_seed_data.sql)" -ForegroundColor White
Write-Host ""
