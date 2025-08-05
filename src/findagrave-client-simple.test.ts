// Create global mock objects that will be shared
const mockQuery = jest.fn();

// Mock @urql/core before importing anything
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
        expect.anything(),
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
        expect.anything(),
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

    it('should handle memorial search errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect(client.searchMemorials('invalid', {})).rejects.toThrow('Memorial search failed: 404 Not Found');
    });
  });

  describe('Error Handling', () => {
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
