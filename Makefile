NAME = ft_transcendence

# Starts the project by building the images
all: up

up:
	docker compose up --build

# Stops the containers (Database remains INTACT)
down:
	docker compose down

# Cleans Docker garbage, but PROTECTS the volumes (Database remains INTACT)
clean:
	docker compose down
	docker system prune -f

# Deep Docker clean, but still PROTECTS the volumes
fclean: clean
	docker system prune -af

# DANGER COMMAND: Deletes containers AND the database volumes
reset-db:
	docker compose down -v
	@echo "Warning: The database has been completely reset!"

# Resets the project from scratch (but without deleting the database)
re: fclean all

.PHONY: all up down clean fclean reset-db re
