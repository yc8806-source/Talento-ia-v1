FROM node:18-alpine

# Force rebuild 2026-07-08
WORKDIR /app

COPY backend/package*.json ./

RUN npm install --production

COPY backend/ .

EXPOSE 3000

CMD ["npm", "start"]
