FROM mysql:8

COPY books.sql /docker-entrypoint-initdb.d

ENV MYSQL_ROOT_PASSWORD=changeit

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD mysql --user=root --password="${MYSQL_ROOT_PASSWORD}" --execute="select 1;" || exit 1

