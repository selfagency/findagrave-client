# FindAGrave GraphQL API Analysis

Based on the request/response files analyzed, here are the GraphQL operations available in the FindAGrave API:

## Available Operations

1. **locationTypeahead** - Search for locations (cemeteries or places) with autocomplete
2. **browse** - Browse locations hierarchically
3. **browseStart** - Get location details by ID
4. **locationCoordinates** - Get coordinates for location IDs
5. **getCemeteriesInBbox** - Search cemeteries within a bounding box

## Schema Types

```graphql
type Query {
  locationsByTypeahead(search: LocationSearchInput!): LocationResults!
  browse(parents: [String!]!, ignoreCemeteries: Boolean, hasCemeteries: Boolean): [LocationBrowseResult!]!
  locationsById(ids: [String!]!): LocationResults!
  locations(ids: [String!]!): LocationResults!
  bulkCemeterySearch(search: CemeterySearchInput!): CemeterySearchResults!
}

type LocationResults {
  total: Int
  locations: [Location!]!
}

type Location {
  id: String!
  names: [LocationName!]!
  locations: [LocationHierarchy!]!
  coordinates: Gps
  highlight: String
}

type Cemetery implements Location {
  id: String!
  names: [LocationName!]!
  locations: [LocationHierarchy!]!
  coordinates: Gps
  highlight: String
  memorialCount: Int
  photographedCount: Int
  photoRequestCount: Int
  gpsCount: Int
  coordinatePrecision: String
}

type LocationName {
  name: String!
  language: String
}

type LocationHierarchy {
  cemetery: String
  cemeteryId: String
  cemeteryAbbreviation: String
  city: String
  cityId: String
  cityAbbreviation: String
  county: String
  countyId: String
  countyAbbreviation: String
  state: String
  stateId: String
  stateAbbreviation: String
  country: String
  countryId: String
  countryAbbreviation: String
  continent: String
  continentId: String
  continentAbbreviation: String
  language: String
}

type Gps {
  lat: Float!
  lon: Float!
}

type LocationBrowseResult {
  id: String!
  locations: [Location!]!
}

type CemeterySearchResults {
  cemeteries: [Cemetery!]!
}

input LocationSearchInput {
  name: String!
  autocomplete: String! # "name" or "location"
  categories: [String!]! # ["cem"] for cemeteries, ["yes"] for locations
  returnHighlight: Boolean
}

input CemeterySearchInput {
  from: Int!
  size: Int!
  boundingBox: BoundingBoxInput!
}

input BoundingBoxInput {
  top_left: GpsInput!
  bottom_right: GpsInput!
}

input GpsInput {
  lat: Float!
  lon: Float!
}
```

## GraphQL Queries

### 1. Search for an Individual by Name and Location

Unfortunately, based on the provided request/response files, there's no direct memorial/person search GraphQL query visible. The URL patterns show memorial searches are done via REST endpoints like:
`/cemetery/99920/memorial-search?firstname=&lastname=sieradski&cemeteryName=Cedar+Park+Cemetery`

However, if such a query existed, it would likely look like this:

```graphql
query SearchMemorials($search: MemorialSearchInput!) {
  memorialsBySearch(search: $search) {
    total
    memorials {
      id
      firstName
      middleName
      lastName
      birthYear
      deathYear
      cemetery {
        id
        names {
          name
        }
        locations {
          city
          county
          state
          country
        }
      }
      coordinates {
        lat
        lon
      }
    }
  }
}
```

Variables:

```json
{
  "search": {
    "firstName": "John",
    "lastName": "Smith",
    "location": {
      "city": "Paramus",
      "state": "New Jersey",
      "country": "USA"
    },
    "cemeteryName": "Cedar Park Cemetery"
  }
}
```

### 2. Search for Cemeteries by Location

```graphql
query SearchCemeteries($search: LocationSearchInput!) {
  locationsByTypeahead(search: $search) {
    total
    locations {
      id
      names {
        name
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
      highlight
      ... on Cemetery {
        memorialCount
        photographedCount
        photoRequestCount
        gpsCount
      }
    }
  }
}
```

Variables:

```json
{
  "search": {
    "name": "cedar park",
    "autocomplete": "name",
    "categories": ["cem"],
    "returnHighlight": true
  }
}
```

### 3. Search Cemeteries in Geographic Area

```graphql
query GetCemeteriesInArea($search: CemeterySearchInput!) {
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
```

Variables:

```json
{
  "search": {
    "from": 0,
    "size": 9999,
    "boundingBox": {
      "top_left": {
        "lat": 43.59375,
        "lon": -77.34375
      },
      "bottom_right": {
        "lat": 42.1875,
        "lon": -75.9375
      }
    }
  }
}
```

### 4. Browse Locations Hierarchically

```graphql
query BrowseLocations($parents: [String!]!, $ignoreCemeteries: Boolean, $hasCemeteries: Boolean) {
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
```

Variables:

```json
{
  "parents": ["top", "continent_68", "country_4"],
  "ignoreCemeteries": true,
  "hasCemeteries": true
}
```

### 5. Get Location Details by ID

```graphql
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
```

Variables:

```json
{
  "ids": ["city_96091"]
}
```

### 6. Get Coordinates for Location IDs

```graphql
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
```

Variables:

```json
{
  "ids": ["city_96091"]
}
```

## Notes

1. FindAGrave uses persisted queries with SHA256 hashes for security
2. The API uses URL-encoded JSON for variables in GET requests
3. Memorial/person searches appear to use REST endpoints rather than GraphQL
4. Location IDs follow patterns like: `city_96091`, `county_1908`, `state_33`, `country_4`, `continent_68`
5. Cemetery searches can be done by name or geographic bounding box
6. All queries support pagination and filtering

## Authentication Headers Required

```http
ancestry-clientpath: findagrave-frontend
apollographql-client-name: findagrave-cemetery-landing
```

## API Request Structure Analysis

### Base URL and Endpoint

All GraphQL requests go to: `https://www.findagrave.com/orc/graphql`

### Request Method

All requests use `GET` method with query parameters

### URL Parameter Structure

```text
GET /orc/graphql?operationName={operation}&variables={encoded_json}&extensions={persisted_query_info}
```

### Decoded API Requests

#### 1. Location Typeahead Search (Cemetery Search)

**Raw URL:**

```text
/orc/graphql?operationName=locationTypeahead&variables=%7B%22search%22%3A%7B%22name%22%3A%22cedar%20park%22%2C%22autocomplete%22%3A%22name%22%2C%22categories%22%3A%5B%22cem%22%5D%2C%22returnHighlight%22%3Atrue%7D%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%2248272a8b942641e1b3041ac159efd11d5ce4cda9d869a6f9f53468e04fab8ba5%22%7D%7D
```

**Decoded Variables:**

```json
{
  "search": {
    "name": "cedar park",
    "autocomplete": "name",
    "categories": ["cem"],
    "returnHighlight": true
  }
}
```

**Persisted Query Hash:** `48272a8b942641e1b3041ac159efd11d5ce4cda9d869a6f9f53468e04fab8ba5`

#### 2. Location Typeahead Search (Place Search)

**Raw URL:**

```text
/orc/graphql?operationName=locationTypeahead&variables=%7B%22search%22%3A%7B%22name%22%3A%22paramus%2C%22%2C%22autocomplete%22%3A%22location%22%2C%22categories%22%3A%5B%22yes%22%5D%2C%22returnHighlight%22%3Atrue%7D%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%2248272a8b942641e1b3041ac159efd11d5ce4cda9d869a6f9f53468e04fab8ba5%22%7D%7D
```

**Decoded Variables:**

```json
{
  "search": {
    "name": "paramus,",
    "autocomplete": "location",
    "categories": ["yes"],
    "returnHighlight": true
  }
}
```

**Persisted Query Hash:** `48272a8b942641e1b3041ac159efd11d5ce4cda9d869a6f9f53468e04fab8ba5`

#### 3. Browse Locations Hierarchically

**Raw URL:**

```text
/orc/graphql?operationName=browse&variables=%7B%22parents%22%3A%5B%22top%22%2C%22continent_68%22%2C%22country_4%22%5D%2C%22ignoreCemeteries%22%3Atrue%2C%22hasCemeteries%22%3Atrue%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22bfb78b85f6be61da441f58ab1e538e6b36ba50f5437b177f7826953eb9ee02c8%22%7D%7D
```

**Decoded Variables:**

```json
{
  "parents": ["top", "continent_68", "country_4"],
  "ignoreCemeteries": true,
  "hasCemeteries": true
}
```

**Persisted Query Hash:** `bfb78b85f6be61da441f58ab1e538e6b36ba50f5437b177f7826953eb9ee02c8`

#### 4. Browse Start (Get Location Details)

**Raw URL:**

```text
/orc/graphql?operationName=browseStart&variables=%7B%22ids%22%3A%5B%22city_96091%22%5D%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22aaba96c146d4145d9a29a44e13cf1a0db9f71276a24ec7a0e6d67d2f3968279e%22%7D%7D
```

**Decoded Variables:**

```json
{
  "ids": ["city_96091"]
}
```

**Persisted Query Hash:** `aaba96c146d4145d9a29a44e13cf1a0db9f71276a24ec7a0e6d67d2f3968279e`

#### 5. Location Coordinates

**Raw URL:**

```text
/orc/graphql?operationName=locationCoordinates&variables=%7B%22ids%22%3A%5B%22city_96091%22%5D%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%224c83ce4a0faca6f9b4d38ba441a83eebc72fff8018d365093bc1960594825c8b%22%7D%7D
```

**Decoded Variables:**

```json
{
  "ids": ["city_96091"]
}
```

**Persisted Query Hash:** `4c83ce4a0faca6f9b4d38ba441a83eebc72fff8018d365093bc1960594825c8b`

#### 6. Get Cemeteries in Bounding Box

**Raw URL:**

```text
/orc/graphql?operationName=getCemeteriesInBbox&variables=%7B%22search%22%3A%7B%22from%22%3A0%2C%22size%22%3A9999%2C%22boundingBox%22%3A%7B%22top_left%22%3A%7B%22lat%22%3A43.59375%2C%22lon%22%3A-77.34375%7D%2C%22bottom_right%22%3A%7B%22lat%22%3A42.1875%2C%22lon%22%3A-75.9375%7D%7D%7D%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22edb98695eaea673b2c57597571c51d2477019b5bb547d350b50393d5b9ee6dd4%22%7D%7D
```

**Decoded Variables:**

```json
{
  "search": {
    "from": 0,
    "size": 9999,
    "boundingBox": {
      "top_left": {
        "lat": 43.59375,
        "lon": -77.34375
      },
      "bottom_right": {
        "lat": 42.1875,
        "lon": -75.9375
      }
    }
  }
}
```

**Persisted Query Hash:** `edb98695eaea673b2c57597571c51d2477019b5bb547d350b50393d5b9ee6dd4`

### Persisted Query Hashes Summary

| Operation           | SHA256 Hash                                                        |
| ------------------- | ------------------------------------------------------------------ |
| locationTypeahead   | `48272a8b942641e1b3041ac159efd11d5ce4cda9d869a6f9f53468e04fab8ba5` |
| browse              | `bfb78b85f6be61da441f58ab1e538e6b36ba50f5437b177f7826953eb9ee02c8` |
| browseStart         | `aaba96c146d4145d9a29a44e13cf1a0db9f71276a24ec7a0e6d67d2f3968279e` |
| locationCoordinates | `4c83ce4a0faca6f9b4d38ba441a83eebc72fff8018d365093bc1960594825c8b` |
| getCemeteriesInBbox | `edb98695eaea673b2c57597571c51d2477019b5bb547d350b50393d5b9ee6dd4` |

### Required Headers for API Requests

```http
Host: www.findagrave.com
Connection: keep-alive
sec-ch-ua-platform: "macOS"
sec-ch-ua: "Not)A;Brand";v="8", "Chromium";v="138"
sec-ch-ua-mobile: ?0
ancestry-clientpath: findagrave-frontend
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36
accept: */*
DNT: 1
content-type: application/json
apollographql-client-name: findagrave-cemetery-landing
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Accept-Encoding: gzip, deflate, br, zstd
Accept-Language: en-US,en;q=0.9
```

### Cookie Requirements

```http
Cookie: ipLoc=us; preferredLanguage=en; _cfuvid=HlxxEuYpIHKplY12MKkyv2zdGvaphKYbEdvqNWMWaD4-1754357800588-0.0.1.1-604800000; tzo=-240; __Host-psifi.x-csrf-token=s%3Ac7ac15782dd6d64a33be4ac50d5f9d6d2546519b46e4d078fb0ed0ba6ea61782cf155896ea068d50121f84853d2123ccd04da771fa25e5e9f03db5bd8f3c849f%7C8a6b0266dfee731374565d28fcf77ded20196723ab6ab26d7df9fba862691a52.%2BcYephqZqMM0bCNQZu7va8BJIblQK3fUysS2CBagbH0; __cf_bm=_9neO4CiA87xsqrO4BWs_.TL8zyHD89cjFGQyE8Gd3I-1754358757-1.0.1.1-q2tFmzxVte7X8xXu9GdpnyPTX_SVuMYjZF1m44O08QxeA4Liwcnj41X5d2oLl8DAufSClmwmGc_wc4ZqgcdUrx_jiQqYz6bUOjbGyaDTYZQ
```

### URL Encoding Pattern

All variables are URL-encoded JSON. To create requests:

1. JSON stringify your variables object
2. URL encode the JSON string
3. Include in the `variables` query parameter
4. Include the appropriate persisted query hash for the operation

### Example cURL Request

```bash
curl -X GET \
  'https://www.findagrave.com/orc/graphql?operationName=locationTypeahead&variables=%7B%22search%22%3A%7B%22name%22%3A%22cedar%20park%22%2C%22autocomplete%22%3A%22name%22%2C%22categories%22%3A%5B%22cem%22%5D%2C%22returnHighlight%22%3Atrue%7D%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%2248272a8b942641e1b3041ac159efd11d5ce4cda9d869a6f9f53468e04fab8ba5%22%7D%7D' \
  -H 'ancestry-clientpath: findagrave-frontend' \
  -H 'apollographql-client-name: findagrave-cemetery-landing' \
  -H 'accept: */*' \
  -H 'content-type: application/json' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
```

### API Search Patterns Found

1. **Cemetery Search by Name**: `categories: ["cem"]`, `autocomplete: "name"`
2. **Location Search**: `categories: ["yes"]`, `autocomplete: "location"`
3. **Geographic Hierarchy**: Use `parents` array with location IDs in hierarchical order
4. **Bounding Box Search**: Use geographic coordinates for cemetery searches in specific areas

### Memorial Search (REST Endpoint)

Based on the referer URLs found, memorial searches use REST endpoints:

```test
GET /cemetery/{cemetery_id}/memorial-search?firstname={first}&lastname={last}&cemeteryName={name}&birthyear={year}&deathyear={year}&bio={bio}&linkedToName={name}&plot={plot}&memorialid={id}&mcid={id}&datefilter={filter}&orderby={order}&page={page}
```

Example:

```test
/cemetery/99920/memorial-search?firstname=&middlename=&lastname=sieradski&cemeteryName=Cedar+Park+Cemetery&birthyear=&birthyearfilter=&deathyear=&deathyearfilter=&bio=&linkedToName=&plot=&memorialid=&mcid=&datefilter=&orderby=r&page=1
```
