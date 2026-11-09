# Contexto de build: raiz do repositório (ver docker-compose.yml).
# Estágio 1: compila o front (tsc + vite build, gera também o service worker).
FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Estágio 2: Caddy serve o front em HTTPS e repassa /api para a API.
FROM caddy:2-alpine
COPY proxy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
