FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

# Migration script to run on start? Or use a wrapper.
# For now, simplest is direct start. User can run migrations via 'docker exec'.

EXPOSE 3333

CMD ["npm", "start"]
