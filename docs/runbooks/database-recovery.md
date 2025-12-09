# Runbook: Recuperação de Banco de Dados (Neon)

Nota: antes de executar recoveries que afetem esquema ou migrações, consulte o [BABY BOOK: DOSSIÊ DE EXECUÇÃO](../Dossie_Execucao.md) para validar impactos em PCE, tabelas novas (partners/deliveries/vouchers) e políticas de retenção.

**Severidade:** Sev1  
**Tempo Estimado:** 15-45 minutos  
**Última Atualização:** Janeiro 2025

## Sintomas

- API retornando 500 Internal Server Error
- Timeout em operações de banco
- "Connection refused" nos logs
- Dados inconsistentes ou corrompidos
- Alerta "Database connection pool exhausted"

## Arquitetura do Banco

```
┌─────────────────────────────────────────────┐
│                   Neon                       │
├─────────────────────────────────────────────┤
│ • PostgreSQL serverless                      │
│ • Autosuspend após 5min de inatividade       │
│ • PITR (Point-in-Time Recovery)              │
│ • Branching para dev/staging                 │
├─────────────────────────────────────────────┤
│ Connection String:                           │
│ postgresql+asyncpg://user:pass@host/db      │
│                                             │
│ Pool: min=0, max=20 (via asyncpg)           │
└─────────────────────────────────────────────┘
```

## Diagnóstico Rápido

### 1. Verificar Status do Neon

```bash
# Dashboard Neon
# https://console.neon.tech/app/projects/{project_id}

# Verificar se endpoint está ativo
curl -I "https://{endpoint}.neon.tech"
```

### 2. Verificar Conexão da API

```bash
# Health check da API
curl https://api.babybook.com/health

# Logs da API
fly logs -a babybook-api | grep -i "database\|connection\|pool"
```

### 3. Verificar Métricas Neon

No dashboard Neon, verificar:

- Connection count
- Query latency
- Compute hours
- Storage usage

## Cenários de Resolução

### Cenário 1: Endpoint Suspenso (Cold Start)

```bash
# Neon suspende após 5min de inatividade
# Primeiro request após suspensão leva ~500ms-2s

# Forçar wake-up
psql "postgresql://user:pass@{endpoint}/babybook" -c "SELECT 1"

# Ou via API health check
curl https://api.babybook.com/health
```

**Prevenção:**

```python
# Implementar keep-alive job (a cada 4 min)
# Ou aceitar cold start como trade-off de custo
```

### Cenário 2: Pool de Conexões Esgotado

```bash
# Verificar conexões ativas
psql "postgresql://..." -c "
SELECT count(*) as total,
       state,
       usename
FROM pg_stat_activity
GROUP BY state, usename;
"

# Se muitas conexões idle, pode ser leak
# Reiniciar API para limpar pool
fly machines restart -a babybook-api
```

**Ajustar pool:**

```python
# settings.py ou database.py
# Reduzir max_connections se necessário
DATABASE_POOL_SIZE = 10  # ao invés de 20
DATABASE_MAX_OVERFLOW = 5
```

### Cenário 3: Query Lenta Bloqueando

```sql
-- Encontrar queries lentas
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '30 seconds'
  AND state != 'idle';

-- Cancelar query específica
SELECT pg_cancel_backend(pid);

-- Ou forçar término
SELECT pg_terminate_backend(pid);
```

### Cenário 4: Dados Corrompidos / Precisa Rollback

```bash
# Usar PITR do Neon (Point-in-Time Recovery)

# 1. No dashboard Neon, ir em "Branches"
# 2. Criar novo branch de recovery:
#    - Parent: main
#    - Point in time: selecionar timestamp antes do problema

# 3. Testar no branch de recovery
psql "postgresql://...@{recovery-endpoint}/babybook" -c "
SELECT count(*) FROM users;
SELECT count(*) FROM moments;
"

# 4. Se dados estão corretos, promover branch
# Ou fazer dump e restore
pg_dump "postgresql://...@{recovery}/babybook" > backup.sql
psql "postgresql://...@{main}/babybook" < backup.sql
```

### Cenário 5: Migration Falhou

```bash
# Verificar status das migrations
cd apps/api
alembic current
alembic history

# Se migration parcial, tentar downgrade
alembic downgrade -1

# Se downgrade falhar, restaurar via PITR
# (ver Cenário 4)

# Corrigir migration e reaplicar
alembic upgrade head
```

### Cenário 6: Credenciais Inválidas

```bash
# Verificar se secret está correto
fly secrets list -a babybook-api | grep DATABASE

# Atualizar se necessário
fly secrets set DATABASE_URL="postgresql+asyncpg://..." -a babybook-api

# Reiniciar para aplicar
fly machines restart -a babybook-api
```

## Comandos de Emergência

### Modo Read-Only (Degraded)

```python
# Se banco está instável, colocar app em modo read-only
# Temporariamente desabilitar writes

# Via feature flag
fly secrets set FEATURE_READ_ONLY_MODE=true -a babybook-api
```

### Backup Manual

```bash
# Dump completo
pg_dump "postgresql://...@{endpoint}/babybook" \
  --format=custom \
  --file=backup_$(date +%Y%m%d_%H%M%S).dump

# Restore
pg_restore --dbname="postgresql://...@{endpoint}/babybook" backup.dump
```

### Reset de Conexões

```sql
-- Terminar todas conexões (exceto a atual)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid <> pg_backend_pid()
  AND datname = 'babybook';
```

## Monitoramento

### Alertas Recomendados

```yaml
alerts:
  - name: db-connection-errors
    condition: rate(db_connection_errors_total[5m]) > 1
    severity: critical

  - name: db-query-latency
    condition: histogram_quantile(0.95, db_query_duration_seconds) > 1
    severity: warning

  - name: db-pool-exhausted
    condition: db_pool_available == 0
    duration: 1m
    severity: critical
```

### Queries de Diagnóstico

```sql
-- Uso de storage
SELECT pg_size_pretty(pg_database_size('babybook'));

-- Tabelas maiores
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;

-- Índices não utilizados
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%pkey%';
```

## Prevenção

### Configuração Recomendada

```python
# database.py
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=5,
    pool_timeout=30,
    pool_recycle=1800,  # reciclar conexões a cada 30min
    pool_pre_ping=True,  # verificar conexão antes de usar
)
```

### Checklist de Manutenção

- [ ] Verificar uso de storage mensalmente
- [ ] Revisar queries lentas semanalmente
- [ ] Testar PITR recovery trimestralmente
- [ ] Atualizar índices conforme padrões de query

## Métricas de Sucesso

- [ ] API respondendo normalmente
- [ ] Health check passando
- [ ] Latência de query < 100ms (p95)
- [ ] Pool de conexões saudável

## Referências

- Neon Docs: https://neon.tech/docs
- Neon Dashboard: https://console.neon.tech
- Database: `apps/api/babybook_api/db/`
- Migrations: `apps/admin/alembic/`
