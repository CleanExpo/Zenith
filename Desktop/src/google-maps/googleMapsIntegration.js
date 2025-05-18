// googleMapsIntegration.js

// Import the Google Maps library
import { Client } from '@googlemaps/google-maps-services-js';

// Initialize the Google Maps client with your API key
const mapsClient = new Client({
  apiKey: process.env.GOOGLE_MAPS_API_KEY,
});

// Function to fetch directions
async function fetchDirections(start, end) {
  try {
const response = await mapsClient.directions({
  params: {
    origin: start,
    destination: end,
    mode: 'driving',
    units: 'metric',
  },
});
    return response.json;
  } catch (error) {
    console.error('Error fetching directions:', error);
    return null;
  }
}

// Function to fetch the geocode for a location
async function fetchGeocode(location) {
  try {
const response = await mapsClient.geocode({
  params: {
    address: location,
  },
});
    return response.json;
  } catch (error) {
    console.error('Error fetching geocode:', error);
    return null;
  }
}

// Export the functions for use in other parts of the application
export { fetchDirections, fetchGeocode };
