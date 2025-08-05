import { Client, cacheExchange, fetchExchange, gql } from '@urql/core';

// Types based on the reverse-engineered schema
export interface LocationSearchInput {
  name: string;
  autocomplete: 'name' | 'location';
  categories: string[];
  returnHighlight?: boolean;
}

export interface CemeterySearchInput {
  from: number;
  size: number;
  boundingBox: {
    top_left: { lat: number; lon: number };
    bottom_right: { lat: number; lon: number };
  };
}

export interface LocationHierarchy {
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

export interface Location {
  id: string;
  names: Array<{ name: string; language?: string }>;
  locations: LocationHierarchy[];
  coordinates?: { lat: number; lon: number };
  highlight?: string;
}

export interface Cemetery extends Location {
  memorialCount?: number;
  photographedCount?: number;
  photoRequestCount?: number;
  gpsCount?: number;
  coordinatePrecision?: string;
}

export interface Memorial {
  id: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  birthYear?: number;
  deathYear?: number;
  cemetery?: Cemetery;
  coordinates?: { lat: number; lon: number };
}

export interface MemorialSearchParams {
  firstname?: string;
  middlename?: string;
  lastname?: string;
  cemeteryName?: string;
  location?: string;
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

// Persisted query hashes from the reverse-engineered API
const PERSISTED_QUERIES = {
  locationTypeahead: '48272a8b942641e1b3041ac159efd11d5ce4cda9d869a6f9f53468e04fab8ba5',
  browse: 'bfb78b85f6be61da441f58ab1e538e6b36ba50f5437b177f7826953eb9ee02c8',
  browseStart: 'aaba96c146d4145d9a29a44e13cf1a0db9f71276a24ec7a0e6d67d2f3968279e',
  locationCoordinates: '4c83ce4a0faca6f9b4d38ba441a83eebc72fff8018d365093bc1960594825c8b',
  getCemeteriesInBbox: 'edb98695eaea673b2c57597571c51d2477019b5bb547d350b50393d5b9ee6dd4',
};

export class FindAGraveClient {
  private client: Client;
  private baseUrl = 'https://www.findagrave.com';

  constructor() {
    this.client = new Client({
      url: `${this.baseUrl}/orc/graphql`,
      exchanges: [cacheExchange, fetchExchange],
      fetchOptions: {
        headers: {
          'ancestry-clientpath': 'findagrave-frontend',
          'apollographql-client-name': 'findagrave-cemetery-landing',
          accept: '*/*',
          'content-type': 'application/json',
          'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        },
      },
    });
  }

  /**
   * Search for cemeteries by name
   */
  async searchCemeteries(name: string, returnHighlight = true): Promise<{ total: number; locations: Cemetery[] }> {
    const variables = {
      search: {
        name,
        autocomplete: 'name',
        categories: ['cem'],
        returnHighlight,
      },
    };

    const query = gql`
      query LocationTypeahead($search: LocationSearchInput!) {
        locationsByTypeahead(search: $search) {
          total
          locations {
            id
            names {
              name
              language
            }
            locations {
              cemetery
              cemeteryId
              city
              cityId
              county
              countyId
              state
              stateId
              country
              countryId
              continent
              continentId
            }
            coordinates {
              lat
              lon
            }
            highlight
            ... on Cemetery {
              memorialCount
              photographedCount
              photoRequestCount
              gpsCount
              coordinatePrecision
            }
          }
        }
      }
    `;

    const result = await this.client.query(query, variables, {
      fetchOptions: {
        method: 'GET',
      },
    });

    if (result.error) {
      throw new Error(`Cemetery search failed: ${result.error.message}`);
    }

    return result.data.locationsByTypeahead;
  }

  /**
   * Search for locations (cities, counties, states, etc.)
   */
  async searchLocations(name: string, returnHighlight = true): Promise<{ total: number; locations: Location[] }> {
    const variables = {
      search: {
        name,
        autocomplete: 'location',
        categories: ['yes'],
        returnHighlight,
      },
    };

    const query = gql`
      query LocationTypeahead($search: LocationSearchInput!) {
        locationsByTypeahead(search: $search) {
          total
          locations {
            id
            names {
              name
              language
            }
            locations {
              city
              cityId
              county
              countyId
              state
              stateId
              country
              countryId
              continent
              continentId
            }
            coordinates {
              lat
              lon
            }
            highlight
          }
        }
      }
    `;

    const result = await this.client.query(query, variables, {
      fetchOptions: {
        method: 'GET',
      },
    });

    if (result.error) {
      throw new Error(`Location search failed: ${result.error.message}`);
    }

    return result.data.locationsByTypeahead;
  }

  /**
   * Get cemeteries within a geographic bounding box
   */
  async getCemeteriesInBoundingBox(searchParams: CemeterySearchInput): Promise<{ cemeteries: Cemetery[] }> {
    const query = gql`
      query GetCemeteriesInBbox($search: CemeterySearchInput!) {
        bulkCemeterySearch(search: $search) {
          cemeteries {
            id
            names {
              name
              language
            }
            locations {
              cemetery
              city
              county
              state
              country
              continent
            }
            coordinates {
              lat
              lon
            }
            coordinatePrecision
            memorialCount
            photographedCount
            photoRequestCount
            gpsCount
          }
        }
      }
    `;

    const result = await this.client.query(
      query,
      { search: searchParams },
      {
        fetchOptions: {
          method: 'GET',
        },
      }
    );

    if (result.error) {
      throw new Error(`Bounding box search failed: ${result.error.message}`);
    }

    return result.data.bulkCemeterySearch;
  }

  /**
   * Browse locations hierarchically (continents -> countries -> states -> counties -> cities)
   */
  async browseLocations(
    parents: string[],
    ignoreCemeteries = true,
    hasCemeteries = true
  ): Promise<Array<{ id: string; locations: Location[] }>> {
    const query = gql`
      query Browse($parents: [String!]!, $ignoreCemeteries: Boolean, $hasCemeteries: Boolean) {
        browse(parents: $parents, ignoreCemeteries: $ignoreCemeteries, hasCemeteries: $hasCemeteries) {
          id
          locations {
            id
            names {
              name
            }
            locations {
              city
              county
              state
              country
              continent
            }
            coordinates {
              lat
              lon
            }
          }
        }
      }
    `;

    const result = await this.client.query(
      query,
      { parents, ignoreCemeteries, hasCemeteries },
      {
        fetchOptions: {
          method: 'GET',
        },
      }
    );

    if (result.error) {
      throw new Error(`Browse locations failed: ${result.error.message}`);
    }

    return result.data.browse;
  }

  /**
   * Get location details by ID
   */
  async getLocationById(ids: string[]): Promise<{ locations: Location[] }> {
    const query = gql`
      query GetLocationById($ids: [String!]!) {
        locationsById(ids: $ids) {
          locations {
            id
            locations {
              city
              cityId
              county
              countyId
              state
              stateId
              country
              countryId
              continentId
            }
            coordinates {
              lat
              lon
            }
          }
        }
      }
    `;

    const result = await this.client.query(
      query,
      { ids },
      {
        fetchOptions: {
          method: 'GET',
        },
      }
    );

    if (result.error) {
      throw new Error(`Get location by ID failed: ${result.error.message}`);
    }

    return result.data.locationsById;
  }

  /**
   * Get coordinates for location IDs
   */
  async getLocationCoordinates(
    ids: string[]
  ): Promise<{ locations: Array<{ id: string; coordinates: { lat: number; lon: number } }> }> {
    const query = gql`
      query GetLocationCoordinates($ids: [String!]!) {
        locations(ids: $ids) {
          locations {
            id
            coordinates {
              lat
              lon
            }
          }
        }
      }
    `;

    const result = await this.client.query(
      query,
      { ids },
      {
        fetchOptions: {
          method: 'GET',
        },
      }
    );

    if (result.error) {
      throw new Error(`Get location coordinates failed: ${result.error.message}`);
    }

    return result.data.locations;
  }

  /**
   * Search for memorials/individuals using the REST endpoint
   * This uses the native fetch API since memorial searches use REST, not GraphQL
   */
  async searchMemorials(cemeteryId: string, params: MemorialSearchParams): Promise<string> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const url = `${this.baseUrl}/cemetery/${cemeteryId}/memorial-search?${searchParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.5',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        dnt: '1',
      },
    });

    if (!response.ok) {
      throw new Error(`Memorial search failed: ${response.status} ${response.statusText}`);
    }

    // Return the HTML response - you may want to parse this with a library like cheerio
    return await response.text();
  }

  /**
   * Search for memorials/individuals across all cemeteries (general search)
   * This uses the main memorial search endpoint without specifying a cemetery
   */
  async searchMemorialsGeneral(params: MemorialSearchParams): Promise<string> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    // General memorial search endpoint
    const url = `${this.baseUrl}/memorial-search?${searchParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.5',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        dnt: '1',
      },
    });

    if (!response.ok) {
      throw new Error(`General memorial search failed: ${response.status} ${response.statusText}`);
    }

    // Return the HTML response - you may want to parse this with a library like cheerio
    return await response.text();
  }

  /**
   * Alternative method using direct URL construction with persisted queries
   * This mimics exactly how the browser makes requests
   */
  async makePersistedQuery(
    operationName: keyof typeof PERSISTED_QUERIES,
    variables: Record<string, any>
  ): Promise<any> {
    const encodedVariables = encodeURIComponent(JSON.stringify(variables));
    const encodedExtensions = encodeURIComponent(
      JSON.stringify({
        persistedQuery: {
          version: 1,
          sha256Hash: PERSISTED_QUERIES[operationName],
        },
      })
    );

    const url = `${this.baseUrl}/orc/graphql?operationName=${operationName}&variables=${encodedVariables}&extensions=${encodedExtensions}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'ancestry-clientpath': 'findagrave-frontend',
        'apollographql-client-name': 'findagrave-cemetery-landing',
        accept: '*/*',
        'content-type': 'application/json',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Persisted query failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
}

// Helper functions for common use cases

/**
 * Create a new FindAGrave client instance
 */
export function createFindAGraveClient(): FindAGraveClient {
  return new FindAGraveClient();
}

/**
 * Quick search for cemeteries by name
 */
export async function searchCemeteries(name: string): Promise<Cemetery[]> {
  const client = createFindAGraveClient();
  const result = await client.searchCemeteries(name);
  return result.locations as Cemetery[];
}

/**
 * Quick search for locations by name
 */
export async function searchLocations(name: string): Promise<Location[]> {
  const client = createFindAGraveClient();
  const result = await client.searchLocations(name);
  return result.locations;
}

/**
 * Search for memorials in a specific cemetery
 */
export async function searchMemorials(
  cemeteryId: string,
  firstname?: string,
  lastname?: string,
  cemeteryName?: string
): Promise<string> {
  const client = createFindAGraveClient();
  return await client.searchMemorials(cemeteryId, {
    firstname,
    lastname,
    cemeteryName,
  });
}

/**
 * Search for memorials across all cemeteries (general search)
 */
export async function searchMemorialsGeneral(
  firstname?: string,
  lastname?: string,
  location?: string
): Promise<string> {
  const client = createFindAGraveClient();
  return await client.searchMemorialsGeneral({
    firstname,
    lastname,
    location,
  });
}

/**
 * Get cemeteries near a location (using bounding box)
 */
export async function getCemeteriesNear(
  centerLat: number,
  centerLon: number,
  radiusDegrees = 0.1
): Promise<Cemetery[]> {
  const client = createFindAGraveClient();
  const result = await client.getCemeteriesInBoundingBox({
    from: 0,
    size: 9999,
    boundingBox: {
      top_left: { lat: centerLat + radiusDegrees, lon: centerLon - radiusDegrees },
      bottom_right: { lat: centerLat - radiusDegrees, lon: centerLon + radiusDegrees },
    },
  });
  return result.cemeteries;
}

/**
 * Browse location hierarchy starting from top level
 */
export async function browseFromTop(): Promise<Location[]> {
  const client = createFindAGraveClient();
  const result = await client.browseLocations(['top']);
  return result.length > 0 ? result[0].locations : [];
}

/**
 * Browse a specific continent's countries
 */
export async function browseContinent(continentId: string): Promise<Location[]> {
  const client = createFindAGraveClient();
  const result = await client.browseLocations(['top', continentId]);
  return result.find(r => r.id === continentId)?.locations || [];
}

/**
 * Browse a specific country's states/provinces
 */
export async function browseCountry(continentId: string, countryId: string): Promise<Location[]> {
  const client = createFindAGraveClient();
  const result = await client.browseLocations(['top', continentId, countryId]);
  return result.find(r => r.id === countryId)?.locations || [];
}

export default FindAGraveClient;
