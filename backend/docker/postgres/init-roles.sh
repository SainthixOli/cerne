#!/usr/bin/env sh
set -eu

psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
    --set=app_password="$DB_PASSWORD" \
    --set=global_password="$DB_GLOBAL_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE cerne_app LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS', :'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cerne_app') \gexec
SELECT format('CREATE ROLE cerne_global LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS', :'global_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cerne_global') \gexec

GRANT CONNECT ON DATABASE :"DBNAME" TO cerne_app, cerne_global;
GRANT USAGE ON SCHEMA public TO cerne_app, cerne_global;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cerne_app, cerne_global;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO cerne_app, cerne_global;
SQL
