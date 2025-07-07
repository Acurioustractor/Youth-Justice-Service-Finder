import pino from 'pino';

const logger = pino({ name: 'geocoding-service' });

// Mock geocoding service
export async function geocodeAddress(address) {
  logger.info({ address }, 'Would geocode address');
  
  // In production, use Google Maps API or similar
  // For now, return mock Queensland coordinates
  
  const mockCoordinates = {
    'Brisbane': { lat: -27.4678, lng: 153.0281 },
    'Gold Coast': { lat: -28.0167, lng: 153.4000 },
    'Sunshine Coast': { lat: -26.6500, lng: 153.0667 },
    'Townsville': { lat: -19.2576, lng: 146.8178 },
    'Cairns': { lat: -16.9186, lng: 145.7781 }
  };
  
  // Try to match city
  for (const [city, coords] of Object.entries(mockCoordinates)) {
    if (JSON.stringify(address).includes(city)) {
      return {
        ...coords,
        formatted_address: `${address.address_1 || ''}, ${city}, QLD`,
        state: 'QLD'
      };
    }
  }
  
  // Default to Brisbane
  return {
    lat: -27.4678,
    lng: 153.0281,
    formatted_address: 'Brisbane, QLD',
    state: 'QLD'
  };
}