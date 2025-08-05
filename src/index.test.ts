// Create global mock objects that will be shared
const mockQuery = jest.fn();

// Mock @urql/core
jest.mock('@urql/core', () => ({
  Client: jest.fn().mockImplementation(() => ({
    query: mockQuery,
  })),
  cacheExchange: jest.fn(),
  fetchExchange: jest.fn(),
  gql: jest.fn(query => query), // Return the query string as-is
}));

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Import after mocking
import { FindAGraveClient, createFindAGraveClient, searchCemeteries, getCemeteriesNear } from './index';

describe('FindAGraveClient', () => {
  let client: FindAGraveClient;

  beforeEach(() => {
    client = new FindAGraveClient();
    mockFetch.mockClear();
    mockQuery.mockClear();
  });

  describe('Cemetery Search', () => {
    it('should search for cemeteries by name', async () => {
      const mockResponse = {
        data: {
          locationsByTypeahead: {
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
          },
        },
        error: null,
      };

      mockQuery.mockResolvedValue(mockResponse);

      const result = await client.searchCemeteries('Cedar Park');

      expect(result.total).toBe(2);
      expect(result.locations).toHaveLength(1);
      expect(result.locations[0].names[0].name).toBe('Cedar Park Cemetery');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('locationsByTypeahead')]),
        {
          search: {
            name: 'Cedar Park',
            autocomplete: 'name',
            categories: ['cem'],
            returnHighlight: true,
          },
        },
        { fetchOptions: { method: 'GET' } }
      );
    });

    it('should handle cemetery search errors', async () => {
      mockQuery.mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });

      await expect(client.searchCemeteries('Invalid')).rejects.toThrow('Cemetery search failed: Network error');
    });
  });

  describe('Location Search', () => {
    it('should search for locations by name', async () => {
      const mockResponse = {
        data: {
          locationsByTypeahead: {
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
          },
        },
        error: null,
      };

      mockQuery.mockResolvedValue(mockResponse);

      const result = await client.searchLocations('Paramus');

      expect(result.total).toBe(1);
      expect(result.locations[0].names[0].name).toBe('Paramus');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('locationsByTypeahead')]),
        {
          search: {
            name: 'Paramus',
            autocomplete: 'location',
            categories: ['yes'],
            returnHighlight: true,
          },
        },
        { fetchOptions: { method: 'GET' } }
      );
    });
  });

  describe('Bounding Box Cemetery Search', () => {
    it('should find cemeteries within bounding box', async () => {
      const mockResponse = {
        data: {
          bulkCemeterySearch: {
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
          },
        },
        error: null,
      };

      mockQuery.mockResolvedValue(mockResponse);

      const searchParams = {
        from: 0,
        size: 100,
        boundingBox: {
          top_left: { lat: 43.0, lon: -77.0 },
          bottom_right: { lat: 42.0, lon: -76.0 },
        },
      };

      const result = await client.getCemeteriesInBoundingBox(searchParams);

      expect(result.cemeteries).toHaveLength(1);
      expect(result.cemeteries[0].names[0].name).toBe('Seneca Falls Cemetery');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('bulkCemeterySearch')]),
        { search: searchParams },
        { fetchOptions: { method: 'GET' } }
      );
    });
  });

  describe('Hierarchical Browsing', () => {
    it('should browse locations hierarchically', async () => {
      const mockResponse = {
        data: {
          browse: [
            {
              id: 'top',
              locations: [
                {
                  id: 'continent_68',
                  names: [{ name: 'North America' }],
                  locations: [
                    {
                      continent: 'North America',
                    },
                  ],
                  coordinates: null,
                },
              ],
            },
          ],
        },
        error: null,
      };

      mockQuery.mockResolvedValue(mockResponse);

      const result = await client.browseLocations(['top']);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('top');
      expect(result[0].locations[0].names[0].name).toBe('North America');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('browse')]),
        {
          parents: ['top'],
          ignoreCemeteries: true,
          hasCemeteries: true,
        },
        { fetchOptions: { method: 'GET' } }
      );
    });
  });

  describe('Location Details', () => {
    it('should get location details by ID', async () => {
      const mockResponse = {
        data: {
          locationsById: {
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
          },
        },
        error: null,
      };

      mockQuery.mockResolvedValue(mockResponse);

      const result = await client.getLocationById(['city_96091']);

      expect(result.locations).toHaveLength(1);
      expect(result.locations[0].id).toBe('city_96091');
      expect(result.locations[0].locations[0].city).toBe('Paramus');
    });
  });

  describe('Location Coordinates', () => {
    it('should get coordinates for location IDs', async () => {
      const mockResponse = {
        data: {
          locations: {
            locations: [
              {
                id: 'city_96091',
                coordinates: { lat: 40.9444389, lon: -74.0758286 },
              },
            ],
          },
        },
        error: null,
      };

      mockQuery.mockResolvedValue(mockResponse);

      const result = await client.getLocationCoordinates(['city_96091']);

      expect(result.locations).toHaveLength(1);
      expect(result.locations[0].coordinates.lat).toBe(40.9444389);
      expect(result.locations[0].coordinates.lon).toBe(-74.0758286);
    });
  });

  describe('Memorial Search (REST)', () => {
    it('should search memorials in specific cemetery', async () => {
      const mockHtml = '<html><body>Memorial search results</body></html>';

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      } as Response);

      const result = await client.searchMemorials('99920', {
        firstname: 'John',
        lastname: 'Smith',
        cemeteryName: 'Cedar Park Cemetery',
      });

      expect(result).toBe(mockHtml);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.findagrave.com/cemetery/99920/memorial-search?firstname=John&lastname=Smith&cemeteryName=Cedar+Park+Cemetery',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          }),
        })
      );
    });

    it('should search memorials across all cemeteries', async () => {
      const mockHtml = '<html><body>General memorial search results</body></html>';

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      } as Response);

      const result = await client.searchMemorialsGeneral({
        firstname: 'John',
        lastname: 'Smith',
        location: 'New York',
      });

      expect(result).toBe(mockHtml);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.findagrave.com/memorial-search?firstname=John&lastname=Smith&location=New+York',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle memorial search errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect(client.searchMemorials('invalid', {})).rejects.toThrow('Memorial search failed: 404 Not Found');
    });
  });

  describe('Persisted Queries', () => {
    it('should make persisted query with correct format', async () => {
      const mockResponse = { data: { test: 'result' } };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const variables = {
        search: {
          name: 'test',
          autocomplete: 'name',
          categories: ['cem'],
          returnHighlight: true,
        },
      };

      const result = await client.makePersistedQuery('locationTypeahead', variables);

      expect(result).toEqual(mockResponse);

      const expectedUrl = expect.stringContaining('/orc/graphql?operationName=locationTypeahead');
      expect(mockFetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'ancestry-clientpath': 'findagrave-frontend',
            'apollographql-client-name': 'findagrave-cemetery-landing',
          }),
        })
      );
    });
  });
});

describe('Helper Functions', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockQuery.mockClear();
  });

  describe('searchCemeteries', () => {
    it('should use helper function for cemetery search', async () => {
      const mockResponse = {
        data: {
          locationsByTypeahead: {
            total: 1,
            locations: [
              {
                id: '123',
                names: [{ name: 'Test Cemetery', language: 'en' }],
                locations: [{ cemetery: 'Test Cemetery' }],
                coordinates: { lat: 40.0, lon: -74.0 },
              },
            ],
          },
        },
        error: null,
      };

      mockQuery.mockResolvedValue(mockResponse);

      const result = await searchCemeteries('Test');
      expect(result).toHaveLength(1);
      expect(result[0].names[0].name).toBe('Test Cemetery');
    });
  });

  describe('getCemeteriesNear', () => {
    it('should calculate bounding box correctly', async () => {
      const mockResponse = {
        data: {
          bulkCemeterySearch: {
            cemeteries: [
              {
                id: '456',
                names: [{ name: 'Nearby Cemetery', language: 'en' }],
                locations: [{ cemetery: 'Nearby Cemetery' }],
                coordinates: { lat: 40.7, lon: -74.0 },
              },
            ],
          },
        },
        error: null,
      };

      mockQuery.mockResolvedValue(mockResponse);

      const result = await getCemeteriesNear(40.7, -74.0, 0.1);
      expect(result).toHaveLength(1);
      expect(result[0].names[0].name).toBe('Nearby Cemetery');
    });
  });
});

describe('Error Handling', () => {
  let client: FindAGraveClient;

  beforeEach(() => {
    client = new FindAGraveClient();
  });

  it('should handle GraphQL errors properly', async () => {
    mockQuery.mockResolvedValue({
      data: null,
      error: { message: 'GraphQL syntax error' },
    });

    await expect(client.searchCemeteries('test')).rejects.toThrow('Cemetery search failed: GraphQL syntax error');
  });

  it('should handle network errors in REST calls', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(client.searchMemorials('123', {})).rejects.toThrow('Network error');
  });

  it('should handle malformed responses', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON')),
    } as Response);

    await expect(client.makePersistedQuery('locationTypeahead', {})).rejects.toThrow('Invalid JSON');
  });
});

describe('URL Construction', () => {
  let client: FindAGraveClient;

  beforeEach(() => {
    client = new FindAGraveClient();
  });

  it('should construct memorial search URLs correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<html></html>'),
    } as Response);

    await client.searchMemorials('99920', {
      firstname: 'John',
      lastname: 'Smith',
      birthyear: '1950',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.findagrave.com/cemetery/99920/memorial-search?firstname=John&lastname=Smith&birthyear=1950',
      expect.any(Object)
    );
  });

  it('should handle special characters in search parameters', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<html></html>'),
    } as Response);

    await client.searchMemorialsGeneral({
      lastname: "O'Brien",
      location: 'New York, NY',
    });

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('lastname=O%27Brien'), expect.any(Object));
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('location=New+York%2C+NY'), expect.any(Object));
  });

  it('should skip undefined parameters', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<html></html>'),
    } as Response);

    await client.searchMemorials('99920', {
      firstname: 'John',
      lastname: undefined,
      middlename: undefined,
    });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('firstname=John');
    expect(calledUrl).not.toContain('lastname');
    expect(calledUrl).not.toContain('middlename');
  });
});

describe('Client Configuration', () => {
  it('should create client with correct configuration', () => {
    const client = createFindAGraveClient();
    expect(client).toBeInstanceOf(FindAGraveClient);
  });

  it('should use correct base URL', () => {
    const client = new FindAGraveClient();
    expect((client as unknown as { baseUrl: string }).baseUrl).toBe('https://www.findagrave.com');
  });
});
