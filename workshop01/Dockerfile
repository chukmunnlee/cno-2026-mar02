FROM node:23

WORKDIR /app

COPY *.json .
COPY src src

RUN npm ci

ENV PORT=5000
ENV DB_USER=root DB_PASSWORD=changeit DB_SERVER=127.0.0.1 DB_PORT=3306
ENV OTEL_COLLECTOR=127.0.0.1

EXPOSE ${PORT}

SHELL [ "/bin/sh", "-c" ]

ENTRYPOINT node --require ./src/instrument.js src/main.js
