# Test Documentation

## Test Coverage Overview

The FindAGrave client library includes comprehensive unit tests covering all major functionality:

### Core Client Methods

- ✅ `searchCemeteries()` - Cemetery search with GraphQL
- ✅ `searchLocations()` - Location search with GraphQL
- ✅ `browseLocations()` - Hierarchical location browsing
- ✅ `getCemeteriesInBoundingBox()` - Spatial cemetery search
- ✅ `getLocationById()` - Location details by ID
- ✅ `getLocationCoordinates()` - Coordinate retrieval
- ✅ `searchMemorials()` - Memorial search in specific cemetery (REST)
- ✅ `searchMemorialsGeneral()` - General memorial search (REST)
- ✅ `makePersistedQuery()` - Low-level GraphQL query method

### Helper Functions

- ✅ `searchCemeteries()` - Simplified cemetery search
- ✅ `searchLocations()` - Simplified location search
- ✅ `searchMemorialsGeneral()` - General memorial search helper
- ✅ `getCemeteriesNear()` - Geographic proximity search

### Error Handling

- ✅ GraphQL query errors
- ✅ REST API HTTP errors
- ✅ Network failures
- ✅ Malformed responses
- ✅ Invalid parameters

### API Integration

- ✅ Persisted query format validation
- ✅ URL construction for REST endpoints
- ✅ Request header configuration
- ✅ Parameter encoding (URL encoding, JSON)
- ✅ Special character handling

### Configuration

- ✅ Client instantiation
- ✅ Base URL configuration
- ✅ Request timeouts and retry logic

## Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Test Files

- `findagrave-client.test.ts` - Main unit tests for all client methods
- `examples.test.ts` - Integration tests for example usage
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Global test setup and mocks

## Mock Strategy

Tests use comprehensive mocking:

- **@urql/core**: Mocked GraphQL client with controllable responses
- **fetch**: Global fetch mock for REST API testing
- **Console**: Suppressed console output during tests
- **Modules**: Strategic module mocking for isolated testing

## Coverage Goals

The test suite aims for:

- 🎯 **95%+ line coverage** - Nearly all code paths tested
- 🎯 **90%+ branch coverage** - Error conditions and edge cases
- 🎯 **100% function coverage** - Every public method tested
- 🎯 **Real-world scenarios** - Tests based on actual API responses
