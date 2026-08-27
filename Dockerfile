FROM node:20.14-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY packages/*/package.json ./packages/

# Update npm to version that supports workspace protocol
RUN npm install -g npm@12.0.0 --force

# Copy all remaining files
COPY . .

# Clean install with the new npm
RUN rm -rf node_modules package-lock.json
RUN npm install

# Build all packages
RUN npm run build

# Expose port
EXPOSE 3000

# Start MCP server
CMD ["node", "dist/packages/mcp-server/src/index.js"]