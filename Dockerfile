FROM node:22-alpine

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy the entire project
COPY . .

WORKDIR /app/web

# Install dependencies and build the Nuxt app
RUN npm install
RUN npm run build

# Default environment variables
ENV NODE_ENV=production
ENV DISABLE_UPDATES=true
# Set database URL to a persistent volume path
ENV DATABASE_URL="file:/app/data/pawbby.db"
ENV PORT=3333

EXPOSE 3333

# Push the schema to the database volume before starting the server
CMD npx prisma db push && node .output/server/index.mjs
