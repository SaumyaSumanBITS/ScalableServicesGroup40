FROM node:18-alpine

WORKDIR /usr/src/app

COPY catalog-service/package*.json ./
RUN npm install --omit=dev

COPY catalog-service/. .

EXPOSE 3002

CMD ["node", "src/server.js"]
