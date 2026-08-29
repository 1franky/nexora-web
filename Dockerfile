# Misma imagen para dev local (compose.yaml) y para el despliegue en el VPS;
# lo que cambia entre ambos es el .env (ver .env.example / README.md).
#
# Es una SPA: no hay servidor de aplicación, solo archivos estáticos ya
# compilados (VITE_API_BASE_URL queda incrustado en el bundle en el build).

# --- Etapa de build ---
FROM node:24-alpine AS build
WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY . .
RUN npm run build

# --- Etapa de ejecución ---
FROM node:24-alpine
WORKDIR /app
RUN npm install -g serve@14

COPY --from=build /workspace/dist ./dist

EXPOSE 3006
CMD ["serve", "-s", "dist", "-l", "3006"]
