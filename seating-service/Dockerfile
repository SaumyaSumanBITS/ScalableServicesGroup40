FROM node:18-alpine

WORKDIR /usr/src/app

COPY seating-service/package*.json ./
RUN npm install --omit=dev

COPY seating-service/. .

EXPOSE 3003

CMD ["node", "src/server.js"]
