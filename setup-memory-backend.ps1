# ============================================
# Setup Memory Backend
# Automated script for database setup
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Memory Backend Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "[1/3] Checking Supabase CLI..." -ForegroundColor Yellow
$supabaseCli = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseCli) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Supabase CLI:" -ForegroundColor Yellow
    Write-Host "  npm install -g supabase" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run: supabase login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Check if Supabase is linked
Write-Host "[2/3] Checking Supabase project..." -ForegroundColor Yellow
$supabaseConfig = Test-Path ".\.supabase\config.toml"

if (-not $supabaseConfig) {
    Write-Host "⚠️  Supabase project not linked!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To link your project:" -ForegroundColor Yellow
    Write-Host "  supabase link --project-ref <your-project-ref>" -ForegroundColor White
    Write-Host ""
    Write-Host "Or start local development:" -ForegroundColor Yellow
    Write-Host "  supabase start" -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "Do you want to apply migration anyway? (y/n)"
    if ($response -ne "y") {
        exit 1
    }
}

# Apply migration
Write-Host "[3/3] Applying memory backend migration..." -ForegroundColor Yellow
Write-Host ""

try {
    # Try to run the migration
    supabase db push
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ Memory Backend Setup Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Created tables:" -ForegroundColor Cyan
    Write-Host "  • memory_likes       - Store memory likes" -ForegroundColor White
    Write-Host "  • memory_comments    - Store memory comments" -ForegroundColor White
    Write-Host "  • memory_shares      - Track memory shares" -ForegroundColor White
    Write-Host ""
    Write-Host "Features enabled:" -ForegroundColor Cyan
    Write-Host "  ✓ Real-time likes and comments" -ForegroundColor White
    Write-Host "  ✓ Row Level Security (RLS)" -ForegroundColor White
    Write-Host "  ✓ User authentication integration" -ForegroundColor White
    Write-Host "  ✓ Stats aggregation function" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Test the Memory Timeline in your app" -ForegroundColor White
    Write-Host "  2. Try liking, commenting, and sharing memories" -ForegroundColor White
    Write-Host "  3. Check real-time updates work across users" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual setup:" -ForegroundColor Yellow
    Write-Host "  1. Open Supabase Dashboard > SQL Editor" -ForegroundColor White
    Write-Host "  2. Copy contents of: supabase\migrations\009_memory_backend.sql" -ForegroundColor White
    Write-Host "  3. Paste and run in SQL Editor" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
