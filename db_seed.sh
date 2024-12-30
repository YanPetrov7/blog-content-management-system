#!/bin/bash

POSTGRES_CONTAINER_NAME=blog-postgresdb
SQL_FILE=seed/seed.sql

MONGO_CONTAINER_NAME=blog-mongodb
MONGO_COLLECTION=comments
JSON_FILE=seed/comments.json

# Exit immediately if a command exits with a non-zero status
set -e

# Function to check if a required environment variable is set
function require_env_var() {
  local var_name="$1"
  if [ -z "${!var_name}" ]; then
    echo "Error: Environment variable '$var_name' is not set."
    exit 1
  fi
}

# List of required environment variables
required_vars=(
  POSTGRES_DB
  POSTGRES_USER
  POSTGRES_PASSWORD
  MONGO_DB
  MONGO_INITDB_ROOT_USERNAME
  MONGO_INITDB_ROOT_PASSWORD
)

# Verify that all required environment variables are set
echo "Checking required environment variables..."
for var in "${required_vars[@]}"; do
  require_env_var "$var"
done
echo "All required environment variables are set."

# Function to check if a Docker container is running
function is_container_running() {
  local container_name="$1"
  docker ps \
    --filter "name=^${container_name}$" \
    --filter "status=running" \
    --format "{{.Names}}" | grep -wq "$container_name"
}

echo "Starting database seeding script..."

# Check the status of required containers
echo "Checking the status of required Docker containers..."
missing_containers=()

if ! is_container_running "$POSTGRES_CONTAINER_NAME"; then
    missing_containers+=("$POSTGRES_CONTAINER_NAME")
fi

if ! is_container_running "$MONGO_CONTAINER_NAME"; then
    missing_containers+=("$MONGO_CONTAINER_NAME")
fi

if [ ${#missing_containers[@]} -ne 0 ]; then
    echo "Error: The following required containers are not running: ${missing_containers[*]}"
    exit 1
fi

# Check if seed data files exist
if [ ! -f "$SQL_FILE" ]; then
    echo "Error: PostgreSQL seed file '$SQL_FILE' not found."
    exit 1
fi

if [ ! -f "$JSON_FILE" ]; then
    echo "Error: MongoDB seed file '$JSON_FILE' not found."
    exit 1
fi

# Seed PostgreSQL
echo "Seeding PostgreSQL database '$POSTGRES_DB'..."
set +e
docker exec -i "$POSTGRES_CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$SQL_FILE"
psql_exit_code=$?
set -e

if [ $psql_exit_code -eq 0 ]; then
    echo "PostgreSQL database '$POSTGRES_DB' seeded successfully."
else
    echo "Error: Failed to seed PostgreSQL database '$POSTGRES_DB'."
    exit 1
fi

# Seed MongoDB
echo "Seeding MongoDB database '$MONGO_DB'..."
set +e
docker exec -i "$MONGO_CONTAINER_NAME" mongoimport \
    --db "$MONGO_DB" \
    --collection "$MONGO_COLLECTION" \
    --jsonArray \
    --username "$MONGO_INITDB_ROOT_USERNAME" \
    --password "$MONGO_INITDB_ROOT_PASSWORD" \
    --authenticationDatabase "admin" < "$JSON_FILE"
mongo_exit_code=$?
set -e

if [ $mongo_exit_code -eq 0 ]; then
    echo "MongoDB database '$MONGO_DB' seeded successfully."
else
    echo "Error: Failed to seed MongoDB database '$MONGO_DB'."
    exit 1
fi

echo "Database seeding completed successfully."
