FROM node:18-alpine

WORKDIR /usr/src/app

COPY order-service/package*.json ./
RUN npm install --omit=dev

COPY order-service/. .

EXPOSE 3004

CMD ["node", "src/server.js"]
