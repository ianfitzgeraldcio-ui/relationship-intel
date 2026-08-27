FROM node:22-alpine

WORKDIR /app

# Copy all files
COPY . .

# Clean install
RUN rm -rf node_modules package-lock.json
RUN npm install

# Build all packages
RUN npm run build

# Expose port
EXPOSE 3000

# Start MCP server
CMD ["node", "dist/packages/mcp-server/src/index.js"]