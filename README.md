# Relationship Intelligence CRM

A purpose-built CRM for managing executive/stakeholder relationships in the Energy & Utilities industry, powered by Claude through an MCP (Model Context Protocol) interface.

## MVP Features

- **Organization tracking** — utilities, regulators, vendors, consultants
- **Contact management** — people at organizations with career history
- **Relationship mapping** — firm colleague ↔ contact relationships with strength scores
- **Interaction logging** — meetings, calls, emails, notes with automatic relationship updates
- **Technology deployments** — track tech stack (AMI, ADMS, DERMS, etc.) at utilities
- **Vendor partnerships** — manage and track consultant/vendor relationships
- **Tag-based filtering** — label contacts, relationships, and vendors for easy discovery

## Architecture

```
packages/
  ├── db/              # Postgres schema, migrations, typed repositories
  ├── core/            # Zod schemas, business logic, strength-score calculation
  └── mcp-server/      # Express app + MCP tool provider (Claude integration)
```

The MCP server exposes relationship management as Claude tools, accessible via:
- Claude Desktop (add as custom remote MCP server)
- Claude Web (custom connectors)
- Any Claude surface that supports remote MCP servers

## Quick Start (Local Development)

### Prerequisites
- Node.js ≥20
- PostgreSQL (local or remote)

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your DATABASE_URL and MCP_AUTH_TOKEN
   ```

3. **Create database and run migrations:**
   ```bash
   createdb relationship_intel
   npm run migrate
   ```

4. **Start the MCP server (development):**
   ```bash
   cd packages/mcp-server
   npm run dev
   ```

   Server will listen on `http://localhost:3000`
   MCP endpoint: `http://localhost:3000/mcp` (requires Bearer token)

### Connect to Claude Desktop

1. Get your `MCP_AUTH_TOKEN` from `.env`
2. In Claude Desktop, go to Settings → MCPs
3. Add a new custom remote MCP server:
   - URL: `http://localhost:3000/mcp`
   - Header: `Authorization: Bearer <your-token>`
4. Restart Claude Desktop

Now you can use natural language to interact with your relationships:
- "Create an organization called Duke Energy, utility type, North Carolina"
- "Who do we know at PG&E?"
- "Log that I met with the CFO of Duke Energy yesterday to discuss the rate case"
- "Show me all hot prospects"

## License

Internal use only (Energy & Utilities consulting partnership).
