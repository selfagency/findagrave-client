#!/usr/bin/env node

/**
 * Generate a simplified package.json for the dist folder
 * This ensures proper dependency resolution and module format support
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  // Read the source package.json
  const sourcePackageJson = JSON.parse(
    readFileSync(join(__dirname, '..', 'package.json'), 'utf8')
  );

  // Ensure dist directory exists
  const distDir = join(__dirname, '..', 'dist');
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }

// Create simplified package.json for distribution
const distPackageJson = {
  name: sourcePackageJson.name,
  version: sourcePackageJson.version,
  description: sourcePackageJson.description,
  main: 'index.cjs',       // CommonJS entry point
  module: 'index.js',      // ESM entry point
  types: 'index.d.ts',     // TypeScript declarations
  type: 'module',
  exports: {
    '.': {
      types: './index.d.ts',     // TypeScript types
      import: './index.js',     // ESM import
      require: './index.cjs'   // CommonJS require
    }
  },
  dependencies: {
    '@urql/core': sourcePackageJson.dependencies['@urql/core'],
    'graphql': sourcePackageJson.dependencies['graphql']
  },
  keywords: sourcePackageJson.keywords || [],
  author: sourcePackageJson.author,
  license: sourcePackageJson.license
};

// Add optional fields if they exist in source
if (sourcePackageJson.repository) {
  distPackageJson.repository = sourcePackageJson.repository;
}
if (sourcePackageJson.bugs) {
  distPackageJson.bugs = sourcePackageJson.bugs;
}
if (sourcePackageJson.homepage) {
  distPackageJson.homepage = sourcePackageJson.homepage;
}

// Write the simplified package.json to dist folder
const distPath = join(__dirname, '..', 'dist', 'package.json');
writeFileSync(distPath, JSON.stringify(distPackageJson, null, 2) + '\n');

// Generate a simple README.md for the dist folder
const readmeContent = `# ${sourcePackageJson.name}

${sourcePackageJson.description}

## Installation

\`\`\`bash
npm install ${sourcePackageJson.name}
\`\`\`

## Quick Start

\`\`\`typescript
import { createFindAGraveClient, searchCemeteries, searchLocations } from '${sourcePackageJson.name}';

// Quick cemetery search
const cemeteries = await searchCemeteries('Cedar Park');

// Quick location search
const locations = await searchLocations('Paramus');

// Create client for advanced usage
const client = createFindAGraveClient();
const result = await client.searchCemeteries('Riverside Cemetery');
\`\`\`

## API Methods

### Client Methods
- \`searchCemeteries(name)\` - Search for cemeteries by name
- \`searchLocations(name)\` - Search for cities, counties, states, countries
- \`browseLocations(parents)\` - Browse location hierarchy
- \`getCemeteriesInBoundingBox(params)\` - Find cemeteries in geographic area
- \`getLocationById(ids)\` - Get location details by ID
- \`getLocationCoordinates(ids)\` - Get GPS coordinates for locations
- \`searchMemorials(cemeteryId, params)\` - Search memorials in specific cemetery
- \`searchMemorialsGeneral(params)\` - Search memorials across all cemeteries
- \`makePersistedQuery(name, variables)\` - Make direct GraphQL queries

### Convenience Functions
For quick operations without creating a client instance:
- \`searchCemeteries(name)\`, \`searchLocations(name)\`, \`getCemeteriesNear(lat, lon, radius)\`
- \`searchMemorials(cemeteryId, firstname, lastname, cemeteryName)\`
- \`searchMemorialsGeneral(firstname, lastname, location)\`
- \`browseFromTop()\`, \`browseContinent(continentId)\`, \`browseCountry(continentId, countryId)\`

## Features

- 🏛️ **Cemetery Search**: Find cemeteries by name with autocomplete
- 📍 **Location Search**: Search for cities, counties, states, and countries
- 🗺️ **Geographic Search**: Find cemeteries within bounding boxes
- 🌍 **Hierarchical Browsing**: Browse locations from continents down to cities
- 👤 **Memorial Search**: Search for individual memorials/graves
- 🔍 **Coordinate Lookup**: Get GPS coordinates for locations
- 🎯 **Type Safety**: Full TypeScript support with proper types

## Documentation

For complete documentation, examples, and advanced usage, visit:
**${sourcePackageJson.repository?.url ? sourcePackageJson.repository.url.replace('git+', '').replace('.git', '') : 'https://github.com/selfagency/findagrave-client'}**

## License

${sourcePackageJson.license}
`;

const readmePath = join(__dirname, '..', 'dist', 'README.md');
writeFileSync(readmePath, readmeContent);

console.log('✅ Generated dist/package.json with:');
console.log('   - Main: index.cjs (CommonJS)');
console.log('   - Module: index.js (ESM)');
console.log('   - Types: index.d.ts');
console.log('   - Dependencies: @urql/core, graphql');
console.log('   - Dual module support via exports field');
console.log('✅ Generated dist/README.md with API documentation');

} catch (error) {
  console.error('❌ Error generating dist/package.json:', error.message);
  process.exit(1);
}
