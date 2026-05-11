FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Service hostname on the Docker Compose network (used by next.config.js rewrites)
ARG INTERNAL_API_URL=http://backend:8000
ENV INTERNAL_API_URL=$INTERNAL_API_URL

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
