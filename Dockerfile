FROM node:18-alpine

# Force rebuild: 2026-07-10-2000
WORKDIR /app

COPY backend/package*.json ./

RUN npm install --production

COPY backend/ .

# Copiar .env.production EXPLÍCITAMENTE con dos nombres para asegurar disponibilidad
COPY backend/.env.production .env.production
COPY backend/.env.production .env

EXPOSE 3000

CMD ["npm", "start"]
