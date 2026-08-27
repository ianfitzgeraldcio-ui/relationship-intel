import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/httpServerTransport.js';
import { registerTools } from './tools/index.js';

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const authToken = process.env.MCP_AUTH_TOKEN || 'change-me';

app.use(express.json());

// Auth middleware
app.use('/mcp', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.slice(7);
  if (token !== authToken) {
    return res.status(403).json({ error: 'Invalid token' });
  }
  next();
});

// MCP Server
const server = new McpServer({
  name: 'relationship-intel',
  version: '0.1.0',
});

// Register tools
registerTools(server);

// HTTP transport for MCP
const transport = new StreamableHTTPServerTransport('/mcp', app);

// Health check
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const httpServer = app.listen(port, () => {
  console.log(`✓ MCP server listening on http://localhost:${port}`);
  console.log(`✓ MCP endpoint: http://localhost:${port}/mcp`);
  console.log(`✓ Health check: http://localhost:${port}/healthz`);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  httpServer.close();
  process.exit(0);
});
