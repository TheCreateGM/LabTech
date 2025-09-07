# Setting Up LabTech GeoLab on Ionic Dashboard (Appflow)

This guide will walk you through setting up your LabTech GeoLab project on the Ionic Dashboard at https://dashboard.ionicframework.com for cloud builds, CI/CD, and app distribution.

## 🚀 What is Ionic Appflow?

Ionic Appflow is a powerful mobile DevOps platform that provides:
- **Cloud Builds**: Build your app in the cloud without local setup
- **Live Updates**: Push updates directly to users without app store approval
- **Native Builds**: Generate iOS and Android binaries
- **Automated Testing**: Run automated tests on real devices
- **Distribution**: Distribute apps to testers and app stores
- **Analytics**: Monitor app performance and crashes

## 📋 Prerequisites

Before setting up on Ionic Dashboard, ensure you have:
- [x] Ionic CLI installed (`npm install -g @ionic/cli`)
- [x] Git repository for your project (GitHub, GitLab, Bitbucket, or Azure DevOps)
- [x] Ionic account (free tier available)
- [x] Your LabTech GeoLab project ready

## 🔧 Step-by-Step Setup

### Step 1: Create Ionic Account

1. Go to https://dashboard.ionicframework.com
2. Click **"Sign Up"** if you don't have an account
3. Choose your preferred sign-up method:
   - GitHub (recommended)
   - Email and password
   - Google account
4. Verify your email if required

### Step 2: Install Ionic CLI (if not already installed)

```bash
# Install globally
npm install -g @ionic/cli

# Verify installation
ionic --version
```

### Step 3: Login to Ionic CLI

```bash
# Login to your Ionic account
ionic login

# This will open a browser window to authenticate
# Follow the prompts to complete authentication
```

### Step 4: Prepare Your Git Repository

If you haven't already, push your LabTech GeoLab project to a Git repository:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: LabTech GeoLab complete implementation"

# Add your remote repository
git remote add origin YOUR_REPOSITORY_URL

# Push to repository
git push -u origin main
```

**Supported Git Providers:**
- GitHub
- GitLab
- Bitbucket
- Azure DevOps

### Step 5: Connect Your App to Appflow

#### Option A: Using Ionic CLI (Recommended)

```bash
# Navigate to your project directory
cd /path/to/labtech-geolab

# Link your app to Appflow
ionic link

# Follow the prompts:
# 1. Select "Create a new app"
# 2. Enter app name: "LabTech GeoLab"
# 3. Choose your git provider
# 4. Select your repository
```

#### Option B: Using Dashboard Web Interface

1. Go to https://dashboard.ionicframework.com
2. Click **"New App"**
3. Fill in the app details:
   - **App Name**: `LabTech GeoLab`
   - **App ID**: `com.labtech.geolab` (matches your capacitor.config.ts)
4. Connect your Git repository:
   - Choose your Git provider
   - Select the repository containing your project
   - Choose the branch (usually `main` or `master`)

### Step 6: Configure Build Settings

1. In your Appflow dashboard, go to **Builds** → **Configure**
2. Set up your build configuration:

```yaml
# Example ionic.config.json (should already be configured)
{
  "name": "labtech-geolab",
  "integrations": {
    "capacitor": {}
  },
  "type": "angular"
}
```

3. Configure build environments:
   - **Development**: For testing builds
   - **Production**: For app store releases

### Step 7: Set Up Native Configurations

#### Android Configuration
1. Go to **Builds** → **Android**
2. Upload your signing certificates (for production builds):
   - Generate keystore: `keytool -genkey -v -keystore labtech-geolab.keystore -alias labtech-geolab -keyalg RSA -keysize 2048 -validity 10000`
   - Upload the keystore file
   - Provide keystore password and key alias

#### iOS Configuration
1. Go to **Builds** → **iOS**
2. Upload your iOS certificates and provisioning profiles:
   - Development certificate and provisioning profile
   - Distribution certificate and provisioning profile (for App Store)

### Step 8: Configure Package.json for Appflow

Ensure your `package.json` has the correct scripts for Appflow builds:

```json
{
  "scripts": {
    "build": "ng build",
    "ionic:build": "ng build",
    "ionic:serve": "ng serve"
  }
}
```

### Step 9: Create Your First Build

#### Web Build
1. Go to **Builds** → **Start Build**
2. Select **Web** build type
3. Choose your branch
4. Click **Start Build**

#### Native Builds (Android/iOS)
1. Go to **Builds** → **Start Build**
2. Select **Android** or **iOS**
3. Choose build type:
   - **Development**: For testing
   - **Production**: For app store submission
4. Select your branch
5. Click **Start Build**

### Step 10: Configure Live Updates (Optional)

Live Updates allow you to push updates without app store approval:

1. Go to **Deploy** → **Channels**
2. Create a new channel (e.g., "Production")
3. Configure the channel settings:
   - **Auto-deploy**: Enable for automatic updates
   - **Target devices**: Set device criteria

### Step 11: Set Up Automation (Optional)

Configure automatic builds triggered by Git commits:

1. Go to **Automations**
2. Click **New Automation**
3. Configure trigger:
   - **Git Push**: Trigger on push to specific branch
   - **Build Type**: Choose Android, iOS, or Web
   - **Environment**: Development or Production

Example automation configuration:
```yaml
# When: Push to main branch
# Do: Build Android Production + Deploy to Production channel
Trigger: Git Push (main)
Actions:
  - Build Android (Production)
  - Deploy to Channel (Production)
```

## 🎯 Recommended Workflow

### Development Workflow
1. **Local Development**: `ionic serve` for rapid development
2. **Git Push**: Push changes to your repository
3. **Web Build**: Automatic web build via Appflow
4. **Testing**: Test web build on Appflow preview
5. **Native Builds**: Create Android/iOS builds for device testing

### Release Workflow
1. **Production Branch**: Create production branch or tag
2. **Production Build**: Build production versions for Android/iOS
3. **Testing**: Download and test production builds
4. **App Store Submission**: Submit to Google Play Store and Apple App Store

## 📊 Monitoring and Analytics

### Build Status
- Monitor build progress in real-time
- View build logs for debugging
- Download build artifacts (APK, IPA files)

### Live Updates Analytics
- Track update adoption rates
- Monitor update success/failure rates
- View device and OS statistics

### App Performance
- Crash reporting and analysis
- Performance metrics
- User engagement analytics

## 🔒 Security Best Practices

1. **Environment Variables**: Store sensitive data in Appflow environment variables
2. **Signing Certificates**: Keep certificates secure and rotate regularly
3. **Access Control**: Limit team member permissions appropriately
4. **Branch Protection**: Use protected branches for production code

## 💰 Pricing Considerations

### Free Plan Includes:
- 500 Live Updates per month
- 100 automation minutes per month
- 1 concurrent build
- Basic support

### Paid Plans Offer:
- Unlimited Live Updates
- More automation minutes
- Multiple concurrent builds
- Priority support
- Advanced features

## 🛠️ Troubleshooting Common Issues

### Build Failures
```bash
# Check build logs in Appflow dashboard
# Common issues:
# 1. Missing dependencies in package.json
# 2. Build script errors
# 3. Memory limits exceeded
# 4. Platform-specific build errors
```

### Git Connection Issues
```bash
# Ensure proper git credentials
ionic login
ionic link --confirm

# Check repository permissions
# Verify webhook configuration
```

### Certificate Issues (iOS)
```bash
# Ensure certificates are valid and not expired
# Check provisioning profile matches app ID
# Verify certificate chain is complete
```

## 📞 Support Resources

- **Documentation**: https://ionicframework.com/docs/appflow
- **Community Forum**: https://forum.ionicframework.com
- **Support Tickets**: Available through dashboard
- **Discord**: Ionic Community Discord server

## 🎉 Next Steps

After successful setup:

1. **Test your builds** on multiple devices
2. **Set up automated workflows** for your development process  
3. **Configure Live Updates** for rapid iteration
4. **Prepare for app store submission** with production builds
5. **Monitor app performance** using Appflow analytics

## 📝 Example Commands Summary

```bash
# Initial setup
npm install -g @ionic/cli
ionic login
ionic link

# Create builds via CLI
ionic build
ionic capacitor build android
ionic capacitor build ios

# Deploy updates
ionic deploy build
ionic deploy deploy --channel=Production

# Monitor builds
ionic build list
ionic build logs BUILD_ID
```

---

**🔗 Useful Links:**
- [Ionic Appflow Dashboard](https://dashboard.ionicframework.com)
- [Appflow Documentation](https://ionicframework.com/docs/appflow)
- [Ionic CLI Documentation](https://ionicframework.com/docs/cli)
- [Capacitor Documentation](https://capacitorjs.com/docs)

Your LabTech GeoLab app is now ready for professional deployment and distribution through Ionic Appflow! 🚀
