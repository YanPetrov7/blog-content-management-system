default: seed-databases

seed-databases:
    @if [ ! -f .env ]; then \
        echo "Error: .env file not found."; \
        exit 1; \
    fi

    env $(cat .env | grep -v '^#' | xargs) ./db_seed.sh
