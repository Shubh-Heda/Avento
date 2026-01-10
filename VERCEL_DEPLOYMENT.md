# 🚀 Vercel Deployment Guide

## Quick Deploy to Vercel

### Method 1: Deploy via Git (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository
   - Vercel will auto-detect Vite configuration
   - Click "Deploy"

3. **Configure Environment Variables:**
   - In Vercel dashboard → Settings → Environment Variables
   - Add:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - Redeploy the project

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? **Your account**
   - Link to existing project? **No**
   - Project name? **your-project-name**
   - Directory? **./
   - Override settings? **No**

4. **Add Environment Variables:**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

5. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

### Method 3: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/your-repo)

## Configuration Files

### vercel.json
The project includes a `vercel.json` configuration file that:
- Sets up build command and output directory
- Configures SPA routing (all routes → index.html)
- Optimizes asset caching
- Sets up environment variables

### Build Settings
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Node Version:** 18.x (default)

## Environment Variables

Required environment variables in Vercel:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJxxx...` |

## Custom Domain

1. Go to your project in Vercel
2. Settings → Domains
3. Add your custom domain
4. Configure DNS records as instructed
5. SSL certificate is automatically provisioned

## Automatic Deployments

- **Production:** Pushes to `main` branch auto-deploy to production
- **Preview:** Pull requests create preview deployments
- **Development:** Pushes to other branches create preview deployments

## Performance Optimizations

The build is optimized for Vercel with:
- Code splitting for faster loads
- Automatic compression (gzip/brotli)
- Edge caching for static assets
- CDN distribution globally
- HTTP/2 and HTTP/3 support

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify Node version compatibility
- Check build logs in Vercel dashboard

### Environment Variables Not Working
- Ensure variables start with `VITE_` prefix
- Redeploy after adding variables
- Check variables are set for correct environment (Production/Preview)

### 404 Errors on Routes
- Verify `vercel.json` has correct rewrites configuration
- Check that SPA routing is properly configured

## Monitoring

- Access logs: Vercel dashboard → Logs
- Analytics: Vercel dashboard → Analytics
- Performance: Vercel dashboard → Speed Insights

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
