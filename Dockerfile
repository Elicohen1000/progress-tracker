FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY server.js ./
COPY public/ ./public/

EXPOSE 8507

ENV PORT=8507
ENV STATE_FILE=/data/state.json

CMD ["node", "server.js"]
