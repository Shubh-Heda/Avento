# ============================================
# Setup Community Backend - Deployment Script
# ============================================

Write-Host "🚀 Setting up Community Backend..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
$supabasePath = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabasePath) {
    Write-Host "❌ Supabase CLI not found. Installing..." -ForegroundColor Yellow
    Write-Host "Run: npm install -g supabase" -ForegroundColor Yellow
    Write-Host "Or download from: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Step 1: Link to your Supabase project
Write-Host "📡 Step 1: Link to your Supabase project" -ForegroundColor Cyan
Write-Host "Run this command: supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor Yellow
Write-Host "Get your project ref from: https://app.supabase.com/project/_/settings/general" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter after linking your project"

# Step 2: Apply migrations
Write-Host "📦 Step 2: Applying database migrations..." -ForegroundColor Cyan
try {
    supabase db push
    Write-Host "✅ Migrations applied successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error applying migrations: $_" -ForegroundColor Red
    Write-Host "Try manually: supabase db push" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Setup storage bucket
Write-Host "🗄️  Step 3: Setting up storage bucket for media..." -ForegroundColor Cyan
Write-Host "Go to: https://app.supabase.com/project/_/storage/buckets" -ForegroundColor Gray
Write-Host "Create a bucket named: 'community-media'" -ForegroundColor Yellow
Write-Host "Set it to PUBLIC for file access" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter after creating the storage bucket"

# Step 4: Update RLS policies for storage
Write-Host "🔐 Step 4: Setting up storage policies..." -ForegroundColor Cyan
$storagePolicies = @"
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-media');

-- Allow public read access
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'community-media');

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]);
"@

Write-Host "Run these SQL commands in the Supabase SQL Editor:" -ForegroundColor Yellow
Write-Host $storagePolicies -ForegroundColor White
Write-Host ""
Read-Host "Press Enter after applying storage policies"

# Step 5: Verify setup
Write-Host "✨ Step 5: Verifying setup..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Checking database tables..." -ForegroundColor Gray
try {
    $tables = supabase db list
    Write-Host "✅ Database connection successful!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not verify database tables" -ForegroundColor Yellow
}
Write-Host ""

# Final instructions
Write-Host "🎉 Community Backend Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update your .env file with Supabase credentials:" -ForegroundColor White
Write-Host "   VITE_SUPABASE_URL=your_project_url" -ForegroundColor Gray
Write-Host "   VITE_SUPABASE_ANON_KEY=your_anon_key" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Restart your dev server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test the community features:" -ForegroundColor White
Write-Host "   - Create a post with photos/videos" -ForegroundColor Gray
Write-Host "   - Like and comment on posts" -ForegroundColor Gray
Write-Host "   - Follow other users" -ForegroundColor Gray
Write-Host "   - Share posts" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Documentation: See docs/COMMUNITY_BACKEND_SETUP.md" -ForegroundColor Cyan
Write-Host ""
