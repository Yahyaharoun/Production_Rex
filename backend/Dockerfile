# Étape 1 : Build de l'application
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

# Générer le client Prisma et compiler TypeScript
RUN npx prisma generate
RUN npm run build

# Étape 2 : Lancement en Production
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 5000

# Utilisation de la commande pour appliquer les migrations et lancer le serveur
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
