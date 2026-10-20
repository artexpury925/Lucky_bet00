import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { setupApiRoutes } from './serverApi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Enable JSON body parsing for API requests
app.use(express.json());

// Health check endpoint for Render zero-downtime health monitors
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Real-time API endpoints for cross-device users & deposits sync
setupApiRoutes(app);

// Serve static assets from Vite build output directory
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath, {
  maxAge: '1d',
  etag: true,
}));

// SPA Fallback: return index.html for all client-side routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 Lucky Bet production server running on http://${HOST}:${PORT}`);
  console.log(`📡 Ready for Render cloud deployments`);
});
