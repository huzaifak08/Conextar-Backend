# --- Stage 1: Build Phase ---
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install ALL dependencies (including TypeScript devDependencies)
RUN npm ci

# Copy configuration and source files
COPY tsconfig.json ./
COPY src/ ./src

# Compile TypeScript to JavaScript
RUN npm run build

# Prune node_modules down to only production dependencies
RUN npm prune --production


# --- Stage 2: Final Production Runtime ---
FROM node:22-alpine AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy only the compiled JavaScript and minimized node_modules from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Expose the application port
EXPOSE 3000

# Run the compiled application as a non-root user for security
USER node

CMD ["node", "dist/index.js"]