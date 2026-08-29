FROM node:20-alpine

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm install --verbose 2>&1 | tee npm-install.log || (echo "=== npm install failed ===" && cat npm-debug.log 2>/dev/null || echo "No npm-debug.log found" && exit 1)

# Build all packages
RUN npm run build

# Debug: check what was built
RUN echo "=== Checking dist structure ===" && find dist -name "*.js" | head -20
RUN echo "=== Checking web client build ===" && find packages/web/client/dist -type f | head -20

# Expose port
EXPOSE 3000

# Start MCP server
CMD ["node", "dist/mcp-server/src/index.js"]
