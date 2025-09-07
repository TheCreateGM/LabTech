# LabTech GeoLab Desktop Application

A desktop application built with Electron for geotechnical laboratory testing. This application serves as a digital guide and data entry tool for students and technicians performing geotechnical engineering lab tests.

## Features

- **Interactive Laboratory Tests**:
  - Grain Size Sieve Analysis (Dry)
  - Standard Proctor Compaction Test
  
- **Automatic Calculations**:
  - Real-time data processing
  - Formula-based computations
  - Results validation

- **User-Friendly Interface**:
  - Dark theme optimized for lab environments
  - Step-by-step guided workflows
  - Mobile-responsive design in desktop format

## Technology Stack

- **Framework**: Electron
- **Frontend**: HTML5, CSS3
- **Logic**: TypeScript/JavaScript
- **Build System**: Node.js & npm

## Project Structure

```
labtech-geolab/
├── electron-app/
│   ├── src/
│   │   ├── main/
│   │   │   └── main.ts         # Main Electron process
│   │   └── renderer/
│   │       ├── assets/
│   │       │   └── css/
│   │       │       └── styles.css    # Global styles
│   │       ├── ts/
│   │       │   ├── preload.ts        # IPC bridge
│   │       │   ├── renderer.ts       # Navigation logic
│   │       │   ├── sieve.ts          # Sieve analysis logic
│   │       │   └── proctor.ts        # Proctor test logic
│   │       ├── index.html            # UI1 (START)
│   │       ├── homepage.html         # UI2 (HOMEPAGE)
│   │       ├── geo-lab.html          # UI3 (GEOTECHNICAL LAB)
│   │       ├── sieve-analysis.html   # UI4 (SIEVE ANALYSIS)
│   │       ├── proctor-test.html     # UI5 (PROCTOR TEST)
│   │       └── end.html              # UI6 (END)
│   ├── dist/                         # Compiled TypeScript output
│   ├── package.json
│   └── tsconfig.json
```

## Setup Instructions

### Prerequisites

- Node.js (version 16 or higher)
- npm (comes with Node.js)
- A Linux-based system (tested on Fedora)

### Installation

1. Navigate to the electron-app directory:
   ```bash
   cd electron-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

4. Start the application:
   ```bash
   npm start
   ```

### Development Mode

For development with automatic compilation:

```bash
npm run dev
```

## Usage Guide

### Application Flow

1. **Start Screen**: Launch the application with the START button
2. **Homepage**: Select "GeoTechnical LAB" (other labs are placeholders)
3. **Test Selection**: Choose between:
   - Grain Size Sieve Analysis (Dry)
   - Standard Proctor Compaction Test
4. **Test Execution**: Navigate through sections using Back/Next buttons
5. **Data Entry**: Enter measurements in provided forms
6. **Results**: View automatic calculations and generated results
7. **Completion**: Return to homepage or exit application

### Test Modules

#### Grain Size Sieve Analysis
- **Objective**: Determine grain size distribution in soil samples
- **Sections**: Objectives, Theory, Apparatus, Procedure, Data/Results, Calculation, Summary
- **Key Features**:
  - Interactive data table with automatic calculations
  - Mass passing and percentage calculations
  - Loss calculation and validation

#### Standard Proctor Compaction Test
- **Objective**: Determine optimal moisture content and maximum dry density
- **Sections**: Objectives, Theory, Apparatus, Procedure, Data/Results, Calculation, Discussion, Conclusion
- **Key Features**:
  - Dual table system for density and moisture data
  - Complex moisture content calculations
  - Bulk and dry density computations
  - Optimal values determination

### Navigation Controls

- **Back/Next**: Navigate between test sections
- **Home**: Return to main menu from any screen
- **Exit**: Close the application (with confirmation)

### Data Validation

- All numerical inputs are validated in real-time
- Calculated fields are automatically updated
- Error handling for invalid or missing data
- Results formatted to appropriate decimal places

## Calculations Implemented

### Sieve Analysis
- Mass Passing = Total Mass - Cumulative Mass Retained
- Cumulative Percentage = (Mass Passing / Total Mass) × 100
- Losses = Total Mass - Sum of Mass Retained

### Proctor Compaction
- Specimen Mass = m2 - m1
- Bulk Density = (Specimen Mass × 1000) / Volume
- Moisture Content = (c2 - c3) / (c3 - c1) × 100%
- Dry Density = Bulk Density / (1 + w/100)

## Troubleshooting

### Build Issues
- Ensure Node.js version is 16 or higher
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript compilation: `npm run build`

### Runtime Issues
- Check console for JavaScript errors
- Verify file paths are correct
- Ensure all dependencies are installed

### Navigation Problems
- Use DevTools in development mode for debugging
- Check IPC communication between main and renderer processes

## Development Notes

### Adding New Tests
1. Create HTML file in `src/renderer/`
2. Add TypeScript logic file in `src/renderer/ts/`
3. Update navigation in `renderer.ts`
4. Implement calculation logic
5. Add to main test selection screen

### Modifying Calculations
- Update the respective controller class (SieveAnalysisController or ProctorTestController)
- Ensure input validation and error handling
- Test with various data scenarios

### Styling Changes
- Global styles in `src/renderer/assets/css/styles.css`
- Follow existing dark theme patterns
- Ensure mobile-responsive design principles

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Submit a pull request

## Support

For technical support or questions about the application, please refer to the project documentation or submit an issue in the repository.
