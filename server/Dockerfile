# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Final stage
FROM node:20-alpine

WORKDIR /app

COPY --from=build /app .

EXPOSE 5000

CMD ["node", "index.js"]
