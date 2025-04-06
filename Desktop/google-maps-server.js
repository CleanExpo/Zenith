const express = require('express');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'google-maps-demo.html'));
});

// Helper function to execute MCP commands
function executeMcpCommand(toolName, args) {
    return new Promise((resolve, reject) => {
        // Spawn a process to run the MCP command
        const child = spawn('node', ['./node_modules/@modelcontextprotocol/server-google-maps/dist/index.js'], {
            env: {
                ...process.env,
                GOOGLE_MAPS_API_KEY: 'AIzaSyDBAl2DLElY3-k2zcRivOr6U7bWxU13L14'
            }
        });

        let stdout = '';
        let stderr = '';

        // Collect stdout data
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        // Collect stderr data
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        // Handle process completion
        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`MCP command failed with code ${code}: ${stderr}`));
                return;
            }

            try {
                // Parse the JSON response
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (error) {
                reject(new Error(`Failed to parse MCP response: ${error.message}`));
            }
        });

        // Send the MCP command
        const command = {
            jsonrpc: '2.0',
            method: 'callTool',
            params: {
                name: toolName,
                arguments: args
            },
            id: 1
        };

        child.stdin.write(JSON.stringify(command) + '\n');
        child.stdin.end();
    });
}

// API Routes

// Geocoding: Convert address to coordinates
app.post('/api/maps_geocode', async (req, res) => {
    try {
        const { address } = req.body;
        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }

        const result = await executeMcpCommand('maps_geocode', { address });
        res.json(result);
    } catch (error) {
        console.error('Geocoding error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reverse Geocoding: Convert coordinates to address
app.post('/api/maps_reverse_geocode', async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }

        const result = await executeMcpCommand('maps_reverse_geocode', { latitude, longitude });
        res.json(result);
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Place Search: Search for places
app.post('/api/maps_search_places', async (req, res) => {
    try {
        const { query, location, radius } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const args = { query };
        if (location) args.location = location;
        if (radius) args.radius = radius;

        const result = await executeMcpCommand('maps_search_places', args);
        res.json(result);
    } catch (error) {
        console.error('Place search error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Directions: Get directions between points
app.post('/api/maps_directions', async (req, res) => {
    try {
        const { origin, destination, mode } = req.body;
        if (!origin || !destination) {
            return res.status(400).json({ error: 'Origin and destination are required' });
        }

        const args = { origin, destination };
        if (mode) args.mode = mode;

        const result = await executeMcpCommand('maps_directions', args);
        res.json(result);
    } catch (error) {
        console.error('Directions error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Google Maps MCP Demo server running at http://localhost:${port}`);
});
