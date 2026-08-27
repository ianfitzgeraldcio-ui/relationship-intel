FROM node:20-alpine

WORKDIR /app

# Copy all files
COPY . .

# Debug: verify file structure
RUN ls -la && echo "=== package.json ===" && cat package.json && echo "=== packages dir ===" && ls -la packages/

# Install dependencies with npm (matches root package.json workspaces)
RUN npm install --verbose 2>&1 | tee npm-install.log || (echo "=== npm install failed ===" && cat npm-debug.log 2>/dev/null || echo "No npm-debug.log found" && exit 1)

# Build all packages
RUN npm run build

# Expose port
EXPOSE 3000

# Start MCP server from the compiled output
CMD ["node", "dist/packages/mcp-server/src/index.js"]