# Build Scripts

## generate-dist-package.js

Generates a simplified `package.json` file for the `dist/` folder after building.

### What it does

1. **Reads source package.json** - Extracts metadata from the root package.json
2. **Creates simplified dist package.json** with:
   - Clean dependencies (only @urql/core and graphql)
   - Proper module entry points (main, module, types)
   - ESM/CommonJS dual format support via exports field
   - No dev dependencies
   - Essential metadata (name, version, description, author, license)

### Usage

```bash
# Run automatically as part of build
npm run build

# Run standalone
npm run build:package
```

### Generated package.json structure

```json
{
  "name": "findagrave-client",
  "version": "0.1.0", 
  "main": "index.cjs",
  "module": "index.js",
  "types": "index.d.ts",
  "exports": {
    ".": {
      "import": "./index.js",
      "require": "./index.cjs", 
      "types": "./index.d.ts"
    }
  },
  "dependencies": {
    "@urql/core": "5.2.0",
    "graphql": "^16.11.0"
  }
}
```

This ensures users installing the package get proper dependency resolution and module format support for both CommonJS and ESM environments.
