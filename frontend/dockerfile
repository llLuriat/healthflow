# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# URL da API embutida no bundle em build time
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ─── Production stage — serve com nginx ───────────────────────────────────────
FROM nginx:alpine AS production

# Remove config padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia os assets compilados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia o config do nginx (arquivo externo — evita heredoc no Dockerfile)
COPY nginx/healthflow.conf /etc/nginx/conf.d/healthflow.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
