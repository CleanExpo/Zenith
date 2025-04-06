# Google Maps MCP Server Demo

This project demonstrates the capabilities of the Google Maps MCP server by providing a web interface to interact with various Google Maps API features.

## Features

- **Geocoding**: Convert addresses to coordinates
- **Reverse Geocoding**: Convert coordinates to addresses
- **Place Search**: Search for places using text queries
- **Directions**: Get directions between two points

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. Open your browser and navigate to http://localhost:3000

## MCP Server Configuration

The Google Maps MCP server is configured in the `cline_mcp_settings.json` file with the following settings:

```json
{
  "mcpServers": {
    "github.com/modelcontextprotocol/servers/tree/main/src/google-maps": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-google-maps"
      ],
      "env": {
        "GOOGLE_MAPS_API_KEY": "YOUR_API_KEY"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Available Tools

The Google Maps MCP server provides the following tools:

1. `maps_geocode`: Convert address to coordinates
   - Input: `address` (string)
   - Returns: location, formatted_address, place_id

2. `maps_reverse_geocode`: Convert coordinates to address
   - Inputs:
     - `latitude` (number)
     - `longitude` (number)
   - Returns: formatted_address, place_id, address_components

3. `maps_search_places`: Search for places using text query
   - Inputs:
     - `query` (string)
     - `location` (optional): { latitude: number, longitude: number }
     - `radius` (optional): number (meters, max 50000)
   - Returns: array of places with names, addresses, locations

4. `maps_place_details`: Get detailed information about a place
   - Input: `place_id` (string)
   - Returns: name, address, contact info, ratings, reviews, opening hours

5. `maps_distance_matrix`: Calculate distances and times between points
   - Inputs:
     - `origins` (string[])
     - `destinations` (string[])
     - `mode` (optional): "driving" | "walking" | "bicycling" | "transit"
   - Returns: distances and durations matrix

6. `maps_elevation`: Get elevation data for locations
   - Input: `locations` (array of {latitude, longitude})
   - Returns: elevation data for each point

7. `maps_directions`: Get directions between points
   - Inputs:
     - `origin` (string)
     - `destination` (string)
     - `mode` (optional): "driving" | "walking" | "bicycling" | "transit"
   - Returns: route details with steps, distance, duration

## License

This project is licensed under the MIT License.
