FROM node:20-alpine

WORKDIR /app

# Copy all files
COPY . .

# Debug: verify file structure
RUN ls -la && echo "=== package.json ===" && cat package.json && echo "=== packages dir ===" && ls -la packages/

# Install dependencies with npm install and ensure dev dependencies (--include=dev is npm v9+ default, but be explicit)
RUN npm install --verbose 2>&1 | tee npm-install.log || (echo "=== npm install failed ===" && cat npm-debug.log 2>/dev/null || echo "No npm-debug.log found" && exit 1)

# Check if typescript is installed
RUN echo "=== Checking for tsc ===" && find node_modules -name "tsc" -o -name "typescript" 2>/dev/null | head -20 || echo "TypeScript not found!"
RUN echo "=== node_modules structure ===" && ls -la node_modules/.bin/ | grep -E "tsc|typescript" || echo "tsc not in .bin/"

# Build all packages
RUN npm run build

# Expose port
EXPOSE 3000

# Start MCP server from the compiled output
CMD ["node", "dist/packages/mcp-server/src/index.js"]