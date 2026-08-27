FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages ./packages
COPY tsconfig.base.json ./

# Install dependencies
RUN npm install

# Build all packages
RUN npm run build

# Expose port
EXPOSE 3000

# Start MCP server
WORKDIR /app/packages/mcp-server
CMD ["node", "../../dist/packages/mcp-server/src/index.js"]
