FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies with pnpm
RUN pnpm install

# Build all packages
RUN pnpm run build

# Expose port
EXPOSE 3000

# Start MCP server from the compiled output
CMD ["node", "dist/packages/mcp-server/src/index.js"]
