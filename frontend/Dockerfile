# Build Stage
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remover shell history para segurança
RUN rm -f ~/.bash_history ~/.sh_history

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
