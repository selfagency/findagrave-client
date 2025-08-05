# FindAGrave TypeScript Client

A comprehensive TypeScript client for the FindAGrave API that combines GraphQL queries and REST endpoints to search for cemeteries, locations, and memorials.

## Development

### Testing

The library includes comprehensive unit tests using Jest. Run tests with:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Note**: This project uses ES modules (`"type": "module"` in package.json), so Jest configuration is in `jest.config.cjs` format.

The test suite includes:

- Unit tests for all client methods
- Mock GraphQL and REST API responses
- Error handling scenarios
- URL construction validation
- Helper function testing
- Integration tests for examples

### Building

```bash
# Build TypeScript to JavaScript (CommonJS and ESM)
npm run build

# Generate just the dist package.json
npm run build:package
```

The build process:

1. Uses `tsup` for fast builds with multiple output formats (CommonJS + ESM)
2. Automatically generates a simplified `package.json` in the `dist/` folder
3. Includes proper module exports and dependency declarations for end users

## Installation

```bash
npm install findagrave-client @urql/core graphql
```

## Features

- 🏛️ **Cemetery Search**: Find cemeteries by name with autocomplete
- 📍 **Location Search**: Search for cities, counties, states, and countries
- 🗺️ **Geographic Search**: Find cemeteries within bounding boxes
- 🌍 **Hierarchical Browsing**: Browse locations from continents down to cities
- 👤 **Memorial Search**: Search for individual memorials/graves (REST endpoint)
- 🔍 **Coordinate Lookup**: Get GPS coordinates for locations
- 🎯 **Type Safety**: Full TypeScript support with proper types

## Quick Start

```typescript
import { createFindAGraveClient, searchCemeteries, searchLocations, searchMemorialsGeneral } from 'findagrave-client';

// Quick search for cemeteries
const cemeteries = await searchCemeteries('Cedar Park');
console.log(`Found ${cemeteries.length} cemeteries`);

// Quick search for locations
const locations = await searchLocations('Paramus');
console.log(`Found ${locations.length} locations`);

// Quick search for memorials across all cemeteries
const memorialHtml = await searchMemorialsGeneral('John', 'Smith', 'New York');
console.log('Found memorial search results (HTML)');

// Create a client for more advanced usage
const client = createFindAGraveClient();
const result = await client.searchCemeteries('Riverside Cemetery');
```

## API Methods

### Cemetery Search

```typescript
// Search for cemeteries by name
const result = await client.searchCemeteries('Cedar Park');
console.log(`Found ${result.total} cemeteries:`, result.locations);

// Get cemeteries in a geographic area
const cemeteries = await client.getCemeteriesInBoundingBox({
  from: 0,
  size: 100,
  boundingBox: {
    top_left: { lat: 41.0, lon: -74.5 },
    bottom_right: { lat: 40.5, lon: -73.5 },
  },
});
```

### Location Search

```typescript
// Search for locations (cities, counties, states, countries)
const locations = await client.searchLocations('Brooklyn');

// Get location details by ID
const details = await client.getLocationById(['city_96091']);

// Get coordinates for locations
const coords = await client.getLocationCoordinates(['city_96091']);
```

### Hierarchical Browsing

```typescript
// Browse from top level (continents)
const continents = await client.browseLocations(['top']);

// Browse a specific continent's countries
const countries = await client.browseLocations(['top', 'continent_68']);

// Browse deeper into the hierarchy
const states = await client.browseLocations(['top', 'continent_68', 'country_4']);
```

### Memorial Search

```typescript
// Search for memorials in a specific cemetery (returns HTML)
const html = await client.searchMemorials('99920', {
  firstname: 'John',
  lastname: 'Smith',
  cemeteryName: 'Cedar Park Cemetery',
  birthyear: '1950',
  deathyear: '2020',
});

// Search for memorials across ALL cemeteries (general search)
const generalHtml = await client.searchMemorialsGeneral({
  firstname: 'John',
  lastname: 'Smith',
  location: 'New Jersey',
  birthyear: '1950',
});

// Note: Memorial search returns HTML that needs to be parsed
// You might want to use a library like cheerio to extract data
```

### Helper Functions

```typescript
import {
  searchCemeteries,
  searchLocations,
  searchMemorials,
  searchMemorialsGeneral,
  getCemeteriesNear,
  browseFromTop,
  browseContinent,
  browseCountry,
} from 'findagrave-client';

// Quick cemetery search
const cemeteries = await searchCemeteries('Riverside');

// Find cemeteries near coordinates
const nearby = await getCemeteriesNear(40.7128, -74.006, 0.1);

// Search for memorials across all cemeteries
const memorials = await searchMemorialsGeneral('John', 'Smith', 'New York');

// Browse hierarchy
const continents = await browseFromTop();
const countries = await browseContinent('continent_68');
const states = await browseCountry('continent_68', 'country_4');
```

## Location ID Patterns

FindAGrave uses specific ID patterns for different location types:

- **Continents**: `continent_68` (North America), `continent_70` (Europe), etc.
- **Countries**: `country_4` (USA), `country_15` (Canada), etc.
- **States**: `state_33` (New Jersey), `state_36` (New York), etc.
- **Counties**: `county_1908` (Bergen County), etc.
- **Cities**: `city_96091` (Paramus), etc.
- **Cemeteries**: Numeric IDs like `99920`, `64159`, etc.

## Response Types

### Cemetery

```typescript
interface Cemetery {
  id: string;
  names: Array<{ name: string; language?: string }>;
  locations: LocationHierarchy[];
  coordinates?: { lat: number; lon: number };
  highlight?: string;
  memorialCount?: number;
  photographedCount?: number;
  photoRequestCount?: number;
  gpsCount?: number;
  coordinatePrecision?: string;
}
```

### Location

```typescript
interface Location {
  id: string;
  names: Array<{ name: string; language?: string }>;
  locations: LocationHierarchy[];
  coordinates?: { lat: number; lon: number };
  highlight?: string;
}
```

### MemorialSearchParams

```typescript
interface MemorialSearchParams {
  firstname?: string;
  middlename?: string;
  lastname?: string;
  cemeteryName?: string;
  location?: string; // For general searches across all cemeteries
  birthyear?: string;
  birthyearfilter?: string;
  deathyear?: string;
  deathyearfilter?: string;
  bio?: string;
  linkedToName?: string;
  plot?: string;
  memorialid?: string;
  mcid?: string;
  datefilter?: string;
  orderby?: string;
  page?: number;
}
```

### LocationHierarchy

```typescript
interface LocationHierarchy {
  cemetery?: string;
  cemeteryId?: string;
  city?: string;
  cityId?: string;
  county?: string;
  countyId?: string;
  state?: string;
  stateId?: string;
  country?: string;
  countryId?: string;
  continent?: string;
  continentId?: string;
}
```

## Error Handling

```typescript
try {
  const cemeteries = await client.searchCemeteries('nonexistent');
} catch (error) {
  console.error('Search failed:', error.message);
}
```

## Advanced Usage

### Using Persisted Queries Directly

```typescript
// Make direct persisted query calls (mimics browser behavior exactly)
const result = await client.makePersistedQuery('locationTypeahead', {
  search: {
    name: 'cedar park',
    autocomplete: 'name',
    categories: ['cem'],
    returnHighlight: true,
  },
});
```

### Custom Headers and Configuration

The client automatically includes the required headers for FindAGrave's API:

- `ancestry-clientpath: findagrave-frontend`
- `apollographql-client-name: findagrave-cemetery-landing`
- Standard browser headers for CORS compliance

## Examples

See `src/examples.ts` for comprehensive usage examples including:

1. Cemetery search by name
2. Location search
3. Hierarchical browsing
4. Bounding box searches
5. Location detail retrieval
6. Memorial searches
7. Helper function usage

## Notes

- **Memorial searches**: Support both cemetery-specific searches (`searchMemorials`) and general searches across all cemeteries (`searchMemorialsGeneral`)
- Memorial searches use REST endpoints and return HTML (not JSON)
- GraphQL queries use persisted query hashes for security
- All variables are URL-encoded in GET requests
- The client handles proper headers and authentication requirements
- Location IDs follow specific patterns for different geographic levels

## License

MIT
