# LabTech GeoLab

A comprehensive mobile application for geotechnical engineering laboratory tests, built with Ionic Framework, Angular, and TypeScript.

## Project Overview

LabTech GeoLab serves as a digital handbook and data entry tool for common geotechnical engineering laboratory tests. The application currently includes:

1. **Grain Size Sieve Analysis (Dry)** - A complete 5-step workflow
2. **Standard Proctor Compaction Test** - A comprehensive 6-step workflow

## Features

- 📱 **Cross-platform**: Runs on Android, iOS, and web browsers
- 🧪 **Complete Test Workflows**: Step-by-step guidance for laboratory tests
- 📊 **Data Entry Tables**: Interactive forms for test data collection
- 📝 **Documentation**: Built-in theory, procedures, and calculations
- 💾 **Local Storage**: Data persistence across sessions
- 🎨 **Professional UI**: Clean, minimalist design optimized for laboratory use

## Technology Stack

- **Framework**: Ionic 8.x
- **Frontend**: Angular 20.x
- **Language**: TypeScript
- **Mobile Runtime**: Capacitor 7.x
- **Styling**: SCSS
- **Icons**: Ionicons 7.x

## Project Structure

```
src/
├── app/
│   ├── components/           # Reusable components
│   │   ├── header.component.ts
│   │   └── lab-card.component.ts
│   ├── pages/               # Application pages
│   │   ├── start/           # Landing page
│   │   ├── home/            # Lab selection
│   │   ├── geotechnical-lab/ # Test selection
│   │   ├── sieve-analysis/  # Sieve analysis workflow
│   │   │   ├── theory/
│   │   │   ├── procedure/
│   │   │   ├── data/
│   │   │   ├── calculation/
│   │   │   └── summary/
│   │   ├── proctor-test/    # Proctor test workflow
│   │   │   ├── theory/
│   │   │   ├── procedure/
│   │   │   ├── data/
│   │   │   ├── calculation/
│   │   │   ├── discussion/
│   │   │   └── conclusion/
│   │   └── end/             # Test completion
│   ├── app.routes.ts        # Application routing
│   └── app.component.ts     # Root component
├── assets/                  # Static assets
├── global.scss             # Global styles
└── main.ts                 # Application bootstrap
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.x or later)
- **npm** (v8.x or later)
- **Ionic CLI** (v7.x or later)
- **Angular CLI** (v20.x or later)

For mobile development:
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

## Installation

1. **Clone or download the project** to your local machine

2. **Navigate to the project directory**:
   ```bash
   cd labtech-geolab
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Install Ionic CLI globally** (if not already installed):
   ```bash
   npm install -g @ionic/cli
   ```

## Development

### Running in Web Browser

To run the application in your web browser for development:

```bash
# Using Ionic CLI (recommended)
ionic serve

# Or using Angular CLI
npm start

# Or using npm scripts
npm run ionic:serve
```

The application will open in your default browser at `http://localhost:8100`. Changes will be automatically reloaded.

### Development Server Options

- **Port Configuration**: Use `ionic serve --port 8200` to run on a different port
- **External Access**: Use `ionic serve --external` to access from other devices on your network
- **Lab Mode**: Use `ionic serve --lab` to view iOS and Android versions side by side

## Building for Production

### Web Build

```bash
# Build for production
ionic build

# Or using npm
npm run build
```

Built files will be in the `dist/` directory.

### Mobile Development Setup

1. **Add mobile platforms**:
   ```bash
   # Add Android platform
   ionic capacitor add android
   # Or using npm script
   npm run add:android

   # Add iOS platform (macOS only)
   ionic capacitor add ios
   # Or using npm script
   npm run add:ios
   ```

2. **Sync web assets to native projects**:
   ```bash
   ionic capacitor sync
   ```

### Building for Android

1. **Build the web assets**:
   ```bash
   ionic build
   ```

2. **Copy to Android project**:
   ```bash
   ionic capacitor copy android
   ```

3. **Open in Android Studio**:
   ```bash
   ionic capacitor open android
   ```

4. **Or build directly**:
   ```bash
   ionic capacitor build android
   # Or using npm script
   npm run build:android
   ```

### Building for iOS

1. **Build the web assets**:
   ```bash
   ionic build
   ```

2. **Copy to iOS project**:
   ```bash
   ionic capacitor copy ios
   ```

3. **Open in Xcode**:
   ```bash
   ionic capacitor open ios
   ```

4. **Or build directly**:
   ```bash
   ionic capacitor build ios
   # Or using npm script
   npm run build:ios
   ```

## Testing

### Unit Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### End-to-End Testing

```bash
# Run e2e tests
npm run e2e
```

## Application Flow

1. **Start Page**: Welcome screen with app branding
2. **Home Page**: Selection of available laboratories
3. **Geotechnical Lab**: Selection of available tests
4. **Test Workflows**:
   - **Sieve Analysis**: Theory → Procedure → Data Entry → Calculation → Summary
   - **Proctor Test**: Theory → Procedure → Data Entry → Calculation → Discussion → Conclusion
5. **End Page**: Test completion with options to return home or exit

## Key Components

### HeaderComponent
- Consistent navigation across test flows
- Back button and Home button functionality
- Context-aware title display

### LabCardComponent
- Reusable card component for lab selection
- Icon and label support
- Click event handling

### Data Entry Pages
- Interactive tables for test data
- Real-time input validation
- Responsive design for mobile devices

## Customization

### Adding New Tests

1. Create new page components in `src/app/pages/`
2. Add routing configuration in `app.routes.ts`
3. Update the geotechnical lab page to include the new test
4. Follow existing patterns for consistent UI/UX

### Styling

- Global styles in `src/global.scss`
- Component-specific styles in individual component files
- Ionic CSS variables for theming

### Icons

The app uses Ionicons. Available icons can be found at: https://ionic.io/ionicons

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure all dependencies are installed with `npm install`
2. **Capacitor Issues**: Run `ionic capacitor sync` after making changes
3. **Android Build**: Ensure Android SDK and build tools are properly installed
4. **iOS Build**: Ensure Xcode and iOS SDK are properly installed (macOS only)

### Platform-Specific Issues

- **Android**: Check `android/app/build.gradle` for configuration
- **iOS**: Check `ios/App/App.xcodeproj` settings in Xcode

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on the project repository
- Check the Ionic documentation: https://ionicframework.com/docs
- Angular documentation: https://angular.dev

## Acknowledgments

- Built with Ionic Framework
- Uses Angular for component architecture
- Styled with Ionic components and custom SCSS
- Icons provided by Ionicons
