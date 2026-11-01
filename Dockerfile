FROM node:22-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ ./

COPY --from=frontend-builder /app/frontend/out ./public_html

RUN mkdir -p tmp

ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

CMD ["npm", "start"]
