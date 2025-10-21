/**
 * Webpack Bundle Analyzer Configuration
 * 
 * This configuration helps identify large dependencies and optimize bundle size.
 * 
 * Usage:
 * 1. Build the app: npm run build:prod
 * 2. Analyze: npx webpack-bundle-analyzer dist/stats.json
 */

module.exports = {
  analyzerMode: 'static',
  reportFilename: 'bundle-report.html',
  openAnalyzer: true,
  generateStatsFile: true,
  statsFilename: 'stats.json',
  statsOptions: {
    source: false
  },
  excludeAssets: /\.map$/
};
