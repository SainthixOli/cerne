FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

# Remover shell history para segurança
RUN rm -f ~/.bash_history ~/.sh_history

EXPOSE 3000

CMD ["npm", "start"]
