COMPOSE=docker compose -f docker-compose.local.yml

.PHONY: dev-up
dev-up:
	$(COMPOSE) up -d db minio minio-setup redis web

.PHONY: dev-down
dev-down:
	$(COMPOSE) down

.PHONY: dev-logs
dev-logs:
	$(COMPOSE) logs -f

.PHONY: db-shell
db-shell:
	docker exec -it workhub-postgres psql -U postgres -d workhub

.PHONY: minio-shell
minio-shell:
	docker exec -it workhub-minio /bin/sh
