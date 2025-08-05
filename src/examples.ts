import { createFindAGraveClient, searchCemeteries, searchLocations, getCemeteriesNear } from '.';

async function examples() {
  console.log('FindAGrave Client Examples\n');

  // Create a client instance
  const client = createFindAGraveClient();

  try {
    // Example 1: Search for cemeteries by name
    console.log('1. Searching for cemeteries named "Cedar Park"...');
    const cemeteries = await client.searchCemeteries('cedar park');
    console.log(`Found ${cemeteries.total} cemeteries:`);
    cemeteries.locations.slice(0, 3).forEach((cemetery, i) => {
      console.log(`  ${i + 1}. ${cemetery.names[0]?.name} (ID: ${cemetery.id})`);
      if (cemetery.locations[0]) {
        const loc = cemetery.locations[0];
        console.log(`     Location: ${loc.city}, ${loc.county}, ${loc.state}, ${loc.country}`);
      }
      if (cemetery.coordinates) {
        console.log(`     Coordinates: ${cemetery.coordinates.lat}, ${cemetery.coordinates.lon}`);
      }
    });
    console.log();

    // Example 2: Search for locations
    console.log('2. Searching for location "Paramus"...');
    const locations = await client.searchLocations('Paramus');
    console.log(`Found ${locations.total} locations:`);
    locations.locations.slice(0, 2).forEach((location, i) => {
      console.log(`  ${i + 1}. ${location.names[0]?.name} (ID: ${location.id})`);
      if (location.locations[0]) {
        const loc = location.locations[0];
        console.log(`     ${loc.city}, ${loc.county}, ${loc.state}, ${loc.country}`);
      }
    });
    console.log();

    // Example 3: Browse hierarchy starting from top level
    console.log('3. Browsing top-level locations (continents)...');
    const topLevel = await client.browseLocations(['top']);
    if (topLevel.length > 0) {
      console.log('Continents:');
      topLevel[0].locations.slice(0, 3).forEach((continent, i) => {
        console.log(`  ${i + 1}. ${continent.names[0]?.name} (ID: ${continent.id})`);
      });
    }
    console.log();

    // Example 4: Browse North America (continent_68)
    console.log('4. Browsing North America countries...');
    const northAmericaCountries = await client.browseLocations(['top', 'continent_68']);
    const naResult = northAmericaCountries.find(r => r.id === 'continent_68');
    if (naResult) {
      console.log('North American countries:');
      naResult.locations.slice(0, 5).forEach((country, i) => {
        console.log(`  ${i + 1}. ${country.names[0]?.name} (ID: ${country.id})`);
      });
    }
    console.log();

    // Example 5: Get cemeteries in a bounding box (around New York area)
    console.log('5. Finding cemeteries near New York (bounding box search)...');
    const nearbyCemeteries = await client.getCemeteriesInBoundingBox({
      from: 0,
      size: 10,
      boundingBox: {
        top_left: { lat: 41.0, lon: -74.5 },
        bottom_right: { lat: 40.5, lon: -73.5 },
      },
    });
    console.log(`Found ${nearbyCemeteries.cemeteries.length} cemeteries:`);
    nearbyCemeteries.cemeteries.slice(0, 3).forEach((cemetery, i) => {
      console.log(`  ${i + 1}. ${cemetery.names[0]?.name}`);
      if (cemetery.locations[0]) {
        const loc = cemetery.locations[0];
        console.log(`     ${loc.city}, ${loc.county}, ${loc.state}`);
      }
      if (cemetery.coordinates) {
        console.log(`     Coordinates: ${cemetery.coordinates.lat}, ${cemetery.coordinates.lon}`);
      }
      console.log(`     Memorials: ${cemetery.memorialCount || 0}`);
    });
    console.log();

    // Example 6: Get location details by ID
    console.log('6. Getting details for Paramus, NJ (city_96091)...');
    const locationDetails = await client.getLocationById(['city_96091']);
    if (locationDetails.locations.length > 0) {
      const loc = locationDetails.locations[0];
      console.log(`Location ID: ${loc.id}`);
      if (loc.locations[0]) {
        const hierarchy = loc.locations[0];
        console.log(`Full hierarchy: ${hierarchy.city}, ${hierarchy.county}, ${hierarchy.state}, ${hierarchy.country}`);
      }
      if (loc.coordinates) {
        console.log(`Coordinates: ${loc.coordinates.lat}, ${loc.coordinates.lon}`);
      }
    }
    console.log();

    // Example 7: Search for memorials (REST endpoint)
    console.log('7. Searching for memorials with lastname "Smith" in cemetery 99920...');
    const memorialSearchHtml = await client.searchMemorials('99920', {
      lastname: 'Smith',
      cemeteryName: 'Cedar Park Cemetery',
    });
    console.log(`Memorial search returned ${memorialSearchHtml.length} characters of HTML`);
    console.log('Note: Memorial search returns HTML that would need to be parsed');
    console.log();

    // Example 8: Using helper functions
    console.log('8. Using helper functions...');

    console.log('Quick cemetery search:');
    const quickCemeteries = await searchCemeteries('Riverside');
    console.log(`Found ${quickCemeteries.length} cemeteries named Riverside`);

    console.log('Quick location search:');
    const quickLocations = await searchLocations('Brooklyn');
    console.log(`Found ${quickLocations.length} locations named Brooklyn`);

    console.log('Cemeteries near coordinates (40.7, -74.0):');
    const nearbyCems = await getCemeteriesNear(40.7, -74.0, 0.05);
    console.log(`Found ${nearbyCems.length} cemeteries nearby`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  examples();
}

export { examples };
