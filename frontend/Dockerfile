# Build Stage
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_TENANT_SLUG
ARG VITE_API_URL=/api
ENV VITE_TENANT_SLUG=$VITE_TENANT_SLUG
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remover shell history para segurança
RUN rm -f ~/.bash_history ~/.sh_history

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
