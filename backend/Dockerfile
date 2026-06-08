FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy source code
COPY src/ ./src/
COPY public/ ./public/

# Create temp upload directory
RUN mkdir -p public/temp

EXPOSE 8000

CMD ["node", "src/index.js"]
