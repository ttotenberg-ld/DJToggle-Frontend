import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80; // Default to 80 for Docker

app.use(cors());
app.use(express.json());

// API Proxy Endpoint
app.get('/api/config', async (req, res) => {
    try {
        const { DJToggleAPIKey, project_key, env_key } = process.env;

        if (!DJToggleAPIKey) {
            return res.status(500).json({ error: 'Missing API Key configuration' });
        }

        const project = project_key || 'dj-toggle';

        // Fetch flags for the project
        const response = await axios.get(
            `https://app.launchdarkly.com/api/v2/flags/${project}`,
            {
                headers: {
                    'Authorization': DJToggleAPIKey
                },
                params: {
                    env: env_key || 'production',
                    summary: false
                }
            }
        );

        // Filter and transform the data
        const relevantFlags = ['bass', 'drums', 'leadArrangement'];
        const tracks = {};

        response.data.items.forEach(flag => {
            if (relevantFlags.includes(flag.key)) {
                tracks[flag.key] = {
                    name: flag.name,
                    options: flag.variations.map((v, i) => ({
                        id: `option${i + 1}`, // Mapping index to option ID matching our pattern logic
                        name: v.name || v.value // Use variation name or value
                    }))
                };
            }
        });

        res.json(tracks);
    } catch (error) {
        console.error('API Proxy Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch configuration' });
    }
});

// Serve static files from the build directory
const distPath = join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));

    // SPA Fallback
    app.use((req, res) => {
        if (req.method === 'GET') {
            res.sendFile(join(distPath, 'index.html'));
        } else {
            res.status(404).send('Not Found');
        }
    });
} else {
    console.warn("WARNING: dist/ directory not found. API mode only?");
    app.get('/', (req, res) => res.send('Backend Server Running. React App not built/found.'));
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
