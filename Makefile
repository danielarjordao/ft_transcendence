NAME = ft_transcendence

# Inicia o projeto construindo as imagens
all: up

up:
	docker compose up --build

# Desliga os conteineres sem apagar o banco de dados
down:
	docker compose down

# Desliga tudo e apaga os volumes (reseta o banco de dados)
clean:
	docker compose down -v

# Limpeza total: desliga tudo, apaga volumes, imagens e redes orfas
fclean: clean
	docker system prune -af

# Reseta o projeto do zero
re: fclean all

.PHONY: all up down clean fclean re
