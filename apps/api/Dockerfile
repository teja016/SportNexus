FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/

RUN npm ci --workspaces

COPY . .

RUN npm run db:generate

EXPOSE 3000

CMD ["npx", "tsx", "apps/api/src/index.ts"]
