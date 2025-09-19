# Quick Vercel Deployment 🚀

## Steps to Deploy Your LabTech GeoLab App to Vercel

### Option 1: Using Vercel CLI (Fastest)

1. **Login to Vercel**:
   ```bash
   npx vercel login
   ```

2. **Deploy**:
   ```bash
   npx vercel --prod
   ```

3. **Follow the prompts**:
   - Set up and deploy? → **Yes**
   - Project name? → **labtech-geolab** (or your choice)
   - Directory with code? → **./** (current directory)

That's it! 🎉

### Option 2: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your Git repository
4. Configure:
   - **Build Command**: `npm run build:prod`
   - **Output Directory**: `dist`
5. Click **Deploy**

### After Deployment

Your app will be live at: `https://your-project-name.vercel.app`

### Troubleshooting

If you get errors:
```bash
# Make sure dependencies are installed
npm install

# Test build locally first
npm run build:prod

# Check if vercel.json exists (it should)
ls -la vercel.json
```

### Features Included

✅ **SPA Routing** - All routes work correctly  
✅ **Asset Caching** - Fast loading  
✅ **Security Headers** - Basic protection  
✅ **PWA Support** - Service worker compatible  

---

For detailed instructions, see `DEPLOYMENT_GUIDE.md`