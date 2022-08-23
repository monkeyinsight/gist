FROM redis
CMD [ "redis-server", "/usr/local/etc/redis/redis.conf" ]

FROM node:16

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD [ "node", "server.js" ]