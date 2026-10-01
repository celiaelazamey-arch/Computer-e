FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY scripts/build.mjs ./scripts/build.mjs
COPY site ./site
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.30.5-alpine-slim
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
USER 101
