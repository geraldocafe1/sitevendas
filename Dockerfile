# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Run CSS compilation
RUN npm run build:css

# Production Stage
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
# Copy compiled CSS from builder
COPY --from=builder /app/public/css/app.css ./public/css/app.css
# Copy everything else
COPY . .

# Setup permissions for non-root user 'node'
RUN mkdir -p database public/uploads && chown -R node:node /app

USER node
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
