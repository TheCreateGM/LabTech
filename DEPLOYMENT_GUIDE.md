# LabTech GeoLab - Deployment & Setup Guide 🚀

This guide provides comprehensive instructions for setting up, developing, and deploying the LabTech GeoLab Ionic Angular application.

## Table of Contents
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Vercel Deployment](#vercel-deployment)
- [Alternative Hosting Options](#alternative-hosting-options)
- [Mobile App Deployment](#mobile-app-deployment)
- [Troubleshooting](#troubleshooting)

## Quick Start

For the fastest setup experience:

```bash
# Clone and setup
git clone https://github.com/TheCreateGM/LabTech.git
cd LabTech
npm install

# Start development server
npm start
# or
ionic serve

# Build for production
npm run build:prod

# Deploy to Vercel (after setup)
npx vercel --prod
```

## Prerequisites

Ensure you have the following installed on your system:

### Required Software
- **Node.js**: Version 18.x or later
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify: `node --version`
- **npm**: Version 8.x or later (included with Node.js)
  - Verify: `npm --version`

### Development Tools
- **Ionic CLI**: For Ionic framework commands
  ```bash
  npm install -g @ionic/cli
  ```
- **Angular CLI**: For Angular commands
  ```bash
  npm install -g @angular/cli
  ```

### Optional (For Mobile Development)
- **Android Studio**: For Android app development
- **Xcode**: For iOS development (macOS only)
- **Java JDK 11+**: Required for Android development

## Local Development Setup

### 1. Project Installation

```bash
# Navigate to project directory
cd LabTech

# Install all dependencies
npm install

# Verify installation
ionic info
```

### 2. Development Server

Start the development server with live reload:

```bash
# Method 1: Using Ionic CLI (recommended)
ionic serve

# Method 2: Using npm script
npm start

# Method 3: Using Angular CLI
ng serve

# Custom port
ionic serve --port 8200

# External access (for testing on mobile devices)
ionic serve --external

# Lab mode (view iOS and Android simultaneously)
ionic serve --lab
```

The application will be available at:
- **Local**: `http://localhost:8100`
- **External**: `http://your-ip:8100` (when using --external)

### 3. Building for Production

```bash
# Production build
npm run build:prod

# Development build
npm run build

# Output location: dist/
```

## Vercel Deployment

Vercel is recommended for hosting this Ionic Angular application due to its excellent SPA support and free tier.

### Prerequisites for Vercel
- **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
- **Git Repository**: https://github.com/TheCreateGM/LabTech.git

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   # Global installation (may require sudo on some systems)
   npm install -g vercel
   
   # Or use local installation
   npm install vercel --save-dev
   ```

2. **Login to Vercel**:
   ```bash
   # If globally installed
   vercel login
   
   # If locally installed
   npx vercel login
   ```

3. **Deploy**:
   ```bash
   # First deployment (will prompt for configuration)
   npx vercel
   
   # Production deployment
   npx vercel --prod
   ```

4. **Configuration Prompts**:
   - **Set up and deploy?** → Yes
   - **Which scope?** → Select your account/team
   - **Link to existing project?** → No (first time)
   - **What's your project's name?** → labtech-geolab (or your preference)
   - **In which directory is your code located?** → ./ (current directory)

### Method 2: Vercel Dashboard (Web Interface)

1. **Login to Vercel Dashboard**: Go to [vercel.com](https://vercel.com) and log in
2. **Import Project**: Click "New Project"
3. **Connect Git Repository**: Select your Git provider and repository
4. **Configure Build Settings**:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build:prod`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. **Deploy**: Click "Deploy"

### Method 3: Vercel for Git (Automatic)

1. **Connect Repository**: Link your Git repository to Vercel
2. **Automatic Deployments**: Every push to main/master branch will trigger a deployment
3. **Preview Deployments**: Pull requests will get preview URLs

### Vercel Configuration

The project includes a `vercel.json` configuration file with:
- **SPA Routing**: All routes redirect to `index.html`
- **Asset Caching**: Static assets cached for 1 year
- **Security Headers**: Basic security headers included
- **Service Worker**: Proper caching for PWA features

```json
{
  "version": 2,
  "name": "labtech-geolab",
  "buildCommand": "npm run build:prod",
  "outputDirectory": "dist",
  "routes": [
    {
      "src": "/(.*\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|otf|map|json))",
      "headers": { "cache-control": "public, max-age=31536000, immutable" }
    },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### Post-Deployment

After successful deployment:
1. **Test the Live Site**: Verify all routes and features work
2. **Custom Domain** (Optional): Add your own domain in Vercel dashboard
3. **Environment Variables**: Add any needed environment variables
4. **Analytics**: Enable Vercel Analytics if desired

## Alternative Hosting Options

### Netlify

1. **Build the project**:
   ```bash
   npm run build:prod
   ```

2. **Deploy to Netlify**:
   - Drag and drop the `dist/` folder to [netlify.com/drop](https://netlify.com/drop)
   - Or use Netlify CLI:
     ```bash
     npm install -g netlify-cli
     netlify deploy --prod --dir=dist
     ```

3. **Configure redirects** (`dist/_redirects`):
   ```
   /*    /index.html   200
   ```

### Firebase Hosting

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase**:
   ```bash
   firebase init hosting
   ```

3. **Configure `firebase.json`**:
   ```json
   {
     "hosting": {
       "public": "dist",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [
         { "source": "**", "destination": "/index.html" }
       ]
     }
   }
   ```

4. **Deploy**:
   ```bash
   npm run build:prod
   firebase deploy
   ```

### GitHub Pages

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add deploy script to `package.json`**:
   ```json
   {
     "scripts": {
       "deploy:gh": "npm run build:prod && npx gh-pages -d dist"
     }
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy:gh
   ```

## Mobile App Deployment

### Ionic Dashboard (Recommended for Testing)

1. **Build the app**:
   ```bash
   ionic build
   ```

2. **Login to Ionic**:
   ```bash
   ionic login
   ```

3. **Link project** (if not already linked):
   ```bash
   ionic link
   ```

4. **Deploy to Ionic Dashboard**:
   ```bash
   ionic deploy
   ```

5. **Test on devices**: Visit [dashboard.ionicframework.com](https://dashboard.ionicframework.com)

### Android App Store

1. **Add Android platform**:
   ```bash
   ionic capacitor add android
   ```

2. **Build for production**:
   ```bash
   ionic build
   ionic capacitor copy android
   ionic capacitor open android
   ```

3. **Generate signed APK** in Android Studio
4. **Upload to Google Play Console**

### iOS App Store

1. **Add iOS platform** (macOS only):
   ```bash
   ionic capacitor add ios
   ```

2. **Build for production**:
   ```bash
   ionic build
   ionic capacitor copy ios
   ionic capacitor open ios
   ```

3. **Build and archive** in Xcode
4. **Upload to App Store Connect**

## Environment Configuration

### Development Environment

Create `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  appVersion: '1.0.2'
};
```

### Production Environment

Create `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.your-domain.com',
  appVersion: '1.0.2'
};
```

## Troubleshooting

### Common Build Issues

1. **Node version conflicts**:
   ```bash
   node --version  # Should be 18.x or later
   npm --version   # Should be 8.x or later
   ```

2. **Clear npm cache**:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Ionic CLI issues**:
   ```bash
   npm uninstall -g @ionic/cli
   npm install -g @ionic/cli@latest
   ```

### Vercel Deployment Issues

1. **Build fails**:
   - Check build logs in Vercel dashboard
   - Verify `package.json` scripts are correct
   - Ensure all dependencies are in `dependencies` (not just `devDependencies`)

2. **Routes not working**:
   - Verify `vercel.json` configuration
   - Check that SPA routing is properly configured

3. **Large bundle size**:
   ```bash
   # Analyze bundle
   npm install -g webpack-bundle-analyzer
   ng build --configuration=production --source-map
   npx webpack-bundle-analyzer dist/**/*.js
   ```

### Mobile Development Issues

1. **Capacitor sync issues**:
   ```bash
   ionic capacitor sync
   ```

2. **Platform not found**:
   ```bash
   ionic capacitor add android
   ionic capacitor add ios
   ```

3. **Build errors**:
   - Update Android SDK and build tools
   - Clear Xcode derived data (iOS)

## Scripts Reference

```bash
# Development
npm start                 # Start development server
npm run ionic:serve      # Alternative development server

# Building
npm run build            # Development build
npm run build:prod       # Production build
npm run watch            # Build with file watching

# Testing
npm test                 # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run lint             # Run linter

# Mobile
npm run add:android      # Add Android platform
npm run add:ios          # Add iOS platform
npm run build:android    # Build Android app
npm run build:ios        # Build iOS app
npm run sync             # Sync web assets to native projects

# Deployment
npx vercel               # Deploy to Vercel (staging)
npx vercel --prod        # Deploy to Vercel (production)
```

## Project Information

- **Framework**: Ionic 8.x with Angular 18.x
- **Language**: TypeScript 5.5.x
- **Mobile Runtime**: Capacitor 6.x
- **Package Manager**: npm
- **Build Tool**: Angular CLI
- **App ID**: `com.labtech.geolab`

## Support

- **Documentation**: Check the main `README.md` file
- **Issues**: Create issues in your project repository
- **Ionic Docs**: [ionicframework.com/docs](https://ionicframework.com/docs)
- **Angular Docs**: [angular.dev](https://angular.dev)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)

---

**Happy Coding!** 🧪📱

For additional help, please refer to the official documentation of the respective tools or create an issue in your project repository.