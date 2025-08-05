import { examples } from './examples';

// Mock the entire index module
jest.mock('./index', () => ({
  createFindAGraveClient: jest.fn(() => ({
    searchCemeteries: jest.fn().mockResolvedValue({
      total: 2,
      locations: [
        {
          id: '64159',
          names: [{ name: 'Cedar Park Cemetery', language: 'en' }],
          locations: [
            {
              cemetery: 'Cedar Park Cemetery',
              city: 'Hudson',
              county: 'Columbia County',
              state: 'New York',
              country: 'USA',
            },
          ],
          coordinates: { lat: 42.2528, lon: -73.7909 },
          highlight: 'Cedar Park Cemetery',
          memorialCount: 150,
          photographedCount: 75,
        },
      ],
    }),
    searchLocations: jest.fn().mockResolvedValue({
      total: 1,
      locations: [
        {
          id: 'city_96091',
          names: [{ name: 'Paramus', language: 'en' }],
          locations: [
            {
              city: 'Paramus',
              county: 'Bergen County',
              state: 'New Jersey',
              country: 'USA',
            },
          ],
          coordinates: { lat: 40.9444389, lon: -74.0758286 },
          highlight: 'Paramus,Bergen,New Jersey,USA',
        },
      ],
    }),
    browseLocations: jest.fn().mockResolvedValue([
      {
        id: 'top',
        locations: [
          {
            id: 'continent_68',
            names: [{ name: 'North America' }],
            locations: [{ continent: 'North America' }],
            coordinates: null,
          },
        ],
      },
    ]),
    getCemeteriesInBoundingBox: jest.fn().mockResolvedValue({
      cemeteries: [
        {
          id: '2781537',
          names: [{ name: 'Seneca Falls Cemetery', language: 'en' }],
          locations: [
            {
              cemetery: 'Seneca Falls Cemetery',
              city: 'Seneca Falls',
              county: 'Seneca County',
              state: 'New York',
            },
          ],
          coordinates: { lat: 42.9105606, lon: -76.7969437 },
          memorialCount: 0,
        },
      ],
    }),
    getLocationById: jest.fn().mockResolvedValue({
      locations: [
        {
          id: 'city_96091',
          locations: [
            {
              city: 'Paramus',
              cityId: 'city_96091',
              county: 'Bergen County',
              countyId: 'county_1908',
              state: 'New Jersey',
              stateId: 'state_33',
            },
          ],
          coordinates: { lat: 40.9444389, lon: -74.0758286 },
        },
      ],
    }),
    searchMemorials: jest.fn().mockResolvedValue('<html><body>Memorial search results</body></html>'),
  })),
  searchCemeteries: jest.fn().mockResolvedValue({
    total: 1,
    locations: [
      {
        id: '123',
        names: [{ name: 'Riverside Cemetery' }],
        locations: [
          {
            cemetery: 'Riverside Cemetery',
            city: 'Test City',
            county: 'Test County',
            state: 'Test State',
            country: 'USA',
          },
        ],
        coordinates: { lat: 40.0, lon: -74.0 },
        memorialCount: 100,
      },
    ],
  }),
  searchLocations: jest.fn().mockResolvedValue({
    total: 1,
    locations: [
      {
        id: '456',
        names: [{ name: 'Brooklyn' }],
        locations: [
          {
            city: 'Brooklyn',
            county: 'Kings County',
            state: 'New York',
            country: 'USA',
          },
        ],
        coordinates: { lat: 40.6782, lon: -73.9442 },
      },
    ],
  }),
  searchMemorialsGeneral: jest.fn().mockResolvedValue('<html>General search results</html>'),
  getCemeteriesNear: jest.fn().mockResolvedValue({
    cemeteries: [
      {
        id: '789',
        names: [{ name: 'Nearby Cemetery' }],
        locations: [
          {
            cemetery: 'Nearby Cemetery',
            city: 'Near City',
            county: 'Near County',
            state: 'Near State',
            country: 'USA',
          },
        ],
        coordinates: { lat: 40.75, lon: -73.98 },
        memorialCount: 50,
      },
    ],
  }),
}));

describe('Examples Integration Tests', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should run all examples without errors', async () => {
    await expect(examples()).resolves.not.toThrow();

    // Verify that console.log was called multiple times (examples are running)
    expect(consoleSpy).toHaveBeenCalledWith('FindAGrave Client Examples\n');
    expect(consoleSpy).toHaveBeenCalledWith('1. Searching for cemeteries named "Cedar Park"...');
    expect(consoleSpy).toHaveBeenCalledWith('2. Searching for location "Paramus"...');
    expect(consoleSpy).toHaveBeenCalledWith('3. Browsing top-level locations (continents)...');
    expect(consoleSpy).toHaveBeenCalledWith('4. Browsing North America countries...');
    expect(consoleSpy).toHaveBeenCalledWith('5. Finding cemeteries near New York (bounding box search)...');
    expect(consoleSpy).toHaveBeenCalledWith('6. Getting details for Paramus, NJ (city_96091)...');
    expect(consoleSpy).toHaveBeenCalledWith('7. Searching for memorials with lastname "Smith" in cemetery 99920...');
    expect(consoleSpy).toHaveBeenCalledWith('8. Using helper functions...');
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Test error');
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Reset modules to ensure fresh imports
    jest.resetModules();
    jest.clearAllMocks();

    // Re-import with the error mock
    jest.doMock('./index', () => ({
      createFindAGraveClient: jest.fn(() => ({
        searchCemeteries: jest.fn().mockRejectedValue(mockError),
        searchLocations: jest.fn(),
        browseLocations: jest.fn(),
        getCemeteriesInBoundingBox: jest.fn(),
        getLocationById: jest.fn(),
        searchMemorials: jest.fn(),
      })),
      searchCemeteries: jest.fn(),
      searchLocations: jest.fn(),
      searchMemorialsGeneral: jest.fn(),
      getCemeteriesNear: jest.fn(),
    }));

    // Dynamically import the examples function
    const { examples: examplesWithError } = await import('./examples');

    await examplesWithError();

    expect(errorSpy).toHaveBeenCalledWith('Error:', mockError);

    errorSpy.mockRestore();
  });
});
