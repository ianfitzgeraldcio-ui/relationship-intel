FROM node:20-alpine

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm install

# Build all packages
RUN npm run build

# Expose port
EXPOSE 3000

# Start MCP server from the compiled output
CMD ["node", "dist/packages/mcp-server/src/index.js"]
