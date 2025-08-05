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
      import: './index.js',     // ESM import
      require: './index.cjs',   // CommonJS require
      types: './index.d.ts'     // TypeScript types
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

console.log('✅ Generated dist/package.json with:');
console.log('   - Main: index.cjs (CommonJS)');
console.log('   - Module: index.js (ESM)');
console.log('   - Types: index.d.ts');
console.log('   - Dependencies: @urql/core, graphql');
console.log('   - Dual module support via exports field');

} catch (error) {
  console.error('❌ Error generating dist/package.json:', error.message);
  process.exit(1);
}
