FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm i

COPY . .

CMD ["npm", "run", "start"]

EXPOSE 8080
