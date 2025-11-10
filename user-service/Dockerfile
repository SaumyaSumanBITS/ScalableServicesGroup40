FROM node:18-alpine

WORKDIR /usr/src/app

COPY user-service/package*.json ./
RUN npm install --omit=dev

COPY user-service/. .

EXPOSE 3001

CMD ["node", "src/server.js"]
