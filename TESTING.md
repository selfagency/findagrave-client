# Test Documentation

## Test Coverage Overview

The FindAGrave client library includes comprehensive unit tests covering all major functionality:

### Core Client Methods (src/index.test.ts)

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
- ✅ `getCemeteriesNear()` - Geographic proximity search

### Error Handling

- ✅ GraphQL query errors
- ✅ REST API HTTP errors
- ✅ Network failures
- ✅ Malformed responses

### API Integration

- ✅ Persisted query format validation
- ✅ URL construction for REST endpoints
- ✅ Request header configuration
- ✅ Parameter encoding (URL encoding, JSON)
- ✅ Special character handling

### Configuration

- ✅ Client instantiation
- ✅ Base URL configuration

### Integration Tests (src/examples.test.ts)

- ✅ End-to-end example execution
- ✅ Error handling in examples

### Test Summary

Total: 23 tests across 2 test files

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

- `src/index.test.ts` - Main unit tests for all client methods (21 tests)
- `src/examples.test.ts` - Integration tests for example usage (2 tests)
- `jest.config.cjs` - Jest configuration for ES modules
- `jest.setup.cjs` - Global test setup and mocks
- `__mocks__/@urql/core.ts` - Manual mock for GraphQL client

## Mock Strategy

Tests use comprehensive mocking:

- **@urql/core**: Manual mock in `__mocks__/@urql/core.ts` with controllable GraphQL responses
- **fetch**: Global fetch mock for REST API testing using Jest's built-in mocking
- **Console**: Suppressed console output during tests for cleaner test runs
- **Modules**: Strategic module mocking for isolated testing of individual components

## Coverage Goals

The test suite aims for:

- 🎯 **95%+ line coverage** - Nearly all code paths tested
- 🎯 **90%+ branch coverage** - Error conditions and edge cases
- 🎯 **100% function coverage** - Every public method tested
- 🎯 **Real-world scenarios** - Tests based on actual API responses
