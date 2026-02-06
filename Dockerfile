# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_LAUNCHDARKLY_CLIENT_ID
ARG VITE_STRUDEL_SAMPLES_URL
ENV VITE_LAUNCHDARKLY_CLIENT_ID=$VITE_LAUNCHDARKLY_CLIENT_ID
ENV VITE_STRUDEL_SAMPLES_URL=$VITE_STRUDEL_SAMPLES_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Copy built assets and server dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.js ./

# Install production dependencies only
RUN npm ci --omit=dev

EXPOSE 80

CMD ["node", "server.js"]
