FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node src ./src
RUN mkdir -p /app/uploads /app/data && chown -R node:node /app/uploads /app/data
USER node
EXPOSE 5000
CMD ["node", "--max-old-space-size=384", "src/server.js"]
