FROM node:20-alpine
WORKDIR /app
COPY package.json ./package.json
RUN npm install --omit=dev
COPY schema.sql ./schema.sql
COPY webstats.min.js ./webstats.min.js
COPY src ./src
EXPOSE 8080
ENV PORT=8080
ENV DB_PATH=/data/webstats.sqlite3
CMD ["npm", "start"]
