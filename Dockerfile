FROM node:20-alpine

WORKDIR /app

# Copy all files
COPY . .

# Upgrade npm to support workspace protocol
RUN npm install -g npm@latest

# Debug: verify file structure
RUN ls -la && echo "=== package.json ===" && cat package.json && echo "=== packages dir ===" && ls -la packages/

# Remove any cached node_modules to ensure clean install
RUN rm -rf node_modules package-lock.json

# Generate package-lock.json and install all dependencies (including devDependencies)
RUN npm install --verbose 2>&1 | tail -50

# Verify typescript is installed
RUN echo "=== Checking TypeScript installation ===" && ls -la node_modules/.bin/tsc && which tsc

# Build all packages
RUN npm run build

# Expose port
EXPOSE 3000

# Start MCP server from the compiled output
CMD ["node", "dist/packages/mcp-server/src/index.js"]