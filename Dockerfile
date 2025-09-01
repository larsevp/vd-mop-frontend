# syntax=docker/dockerfile:1

######## Base with Node.js ########
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

######## Dev image (hot reload) ########
FROM base AS dev
# Install all dependencies including dev dependencies
RUN npm ci
COPY . .
ENV NODE_ENV=development
# Use dev script with Vite hot reload
EXPOSE 3000
CMD ["npm", "run", "dev"]

######## Build stage ########
FROM base AS builder
# Install all dependencies for building
RUN npm ci
COPY . .
ENV NODE_ENV=production
# Build the application
RUN npm run build

######## Prod image (default/final) ########
FROM nginx:alpine AS prod
# Install wget for health checks
RUN apk add --no-cache wget
# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
# Health check for nginx
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/health || exit 1
CMD ["nginx", "-g", "daemon off;"]