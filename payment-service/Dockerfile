FROM node:18-alpine

WORKDIR /usr/src/app

COPY payment-service/package*.json ./
RUN npm install --omit=dev

COPY payment-service/. .

EXPOSE 3005

CMD ["node", "src/server.js"]
