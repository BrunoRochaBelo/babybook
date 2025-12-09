# Observability Dashboard Configuration

Este documento define as métricas, dashboards e alertas para monitoramento do Baby Book.

## Arquitetura de Observabilidade

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Fontes de Dados                            │
├─────────────────────────────────────────────────────────────────────┤
│ Cloudflare Analytics │ Fly.io Metrics │ Neon Dashboard │ Modal Logs │
└──────────┬───────────┴───────┬────────┴───────┬────────┴─────┬──────┘
           │                   │                │              │
           ▼                   ▼                ▼              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Dashboards & Alertas                          │
├─────────────────────────────────────────────────────────────────────┤
│  • Cloudflare Dashboard (Edge/CDN)                                  │
│  • Fly.io Dashboard (API)                                           │
│  • Neon Console (Database)                                          │
│  • Custom Grafana (opcional)                                        │
└─────────────────────────────────────────────────────────────────────┘
```

## SLIs e SLOs

### God SLO (Custo)

| Métrica                    | Target    | Fonte         |
| -------------------------- | --------- | ------------- |
| Custo de Estoque/conta/ano | ≤ R$ 2,00 | FinOps manual |

### Performance SLOs

| Métrica                   | Target   | Fonte          |
| ------------------------- | -------- | -------------- |
| API Read Latency (p95)    | ≤ 500ms  | Fly.io metrics |
| API Write Latency (p95)   | ≤ 800ms  | Fly.io metrics |
| Upload Accept (p95)       | ≤ 1500ms | API logs       |
| Time-to-Ready (p95)       | ≤ 2 min  | Worker logs    |
| Edge Worker Latency (p95) | ≤ 200ms  | Cloudflare     |

### Availability SLOs

| Métrica               | Target | Janela  |
| --------------------- | ------ | ------- |
| API Availability      | 99.5%  | 30 dias |
| Edge Availability     | 99.9%  | 30 dias |
| Database Availability | 99.9%  | 30 dias |

---

## Dashboards por Serviço

### 1. Edge Worker (Cloudflare)

**Localização:** Cloudflare Dashboard → Workers & Pages → babybook-edge → Analytics

| Painel                  | Métrica             | Query/Filtro                |
| ----------------------- | ------------------- | --------------------------- |
| Request Rate            | requests/sec        | `sum(rate(requests))`       |
| Error Rate              | % 4xx + 5xx         | `(4xx + 5xx) / total * 100` |
| Latency p50/p95/p99     | ms                  | `histogram_quantile`        |
| CPU Time                | ms                  | `avg(cpuTime)`              |
| Geographic Distribution | requests by country | Cloudflare Analytics        |
| Cache Hit Rate          | %                   | `cacheStatus = "hit"`       |

**Alertas:**

```yaml
- name: edge-error-rate-high
  condition: error_rate > 1%
  duration: 5m
  severity: critical
  notify: slack #alerts

- name: edge-latency-high
  condition: p95_latency > 500ms
  duration: 10m
  severity: warning
```

### 2. API (Fly.io)

**Localização:** Fly.io Dashboard → babybook-api → Metrics

| Painel             | Métrica     | Descrição              |
| ------------------ | ----------- | ---------------------- |
| Request Rate       | req/sec     | Total de requests      |
| Response Time      | p50/p95/p99 | Latência por percentil |
| Error Rate         | % 5xx       | Erros de servidor      |
| Memory Usage       | MB          | Uso de memória         |
| CPU Usage          | %           | Utilização de CPU      |
| Active Connections | count       | Conexões HTTP ativas   |

**Custom Metrics (via StatsD):**

```python
# apps/api/babybook_api/observability.py

# Métricas customizadas a emitir:
- babybook.api.upload.init.duration
- babybook.api.upload.complete.duration
- babybook.api.voucher.redeem.duration
- babybook.api.voucher.redeem.success
- babybook.api.voucher.redeem.failure
```

### 3. Database (Neon)

**Localização:** Neon Console → Project → Monitoring

| Painel        | Métrica | Descrição              |
| ------------- | ------- | ---------------------- |
| Compute Hours | hours   | Uso de compute (custo) |
| Storage Used  | GB      | Armazenamento          |
| Connections   | count   | Conexões ativas        |
| Query Latency | ms      | Tempo de query         |
| Data Transfer | GB      | Egress                 |

**Query de Diagnóstico:**

```sql
-- Top queries por tempo
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

### 4. Workers (Modal)

**Localização:** Modal Dashboard → babybook-workers

| Painel               | Métrica | Descrição              |
| -------------------- | ------- | ---------------------- |
| Function Invocations | count   | Execuções              |
| Duration             | p50/p95 | Tempo de processamento |
| Errors               | count   | Falhas                 |
| Cold Starts          | count   | Inicializações a frio  |
| GPU/CPU Time         | seconds | Uso de recursos        |

### 5. Storage (R2 + B2)

**R2 (Cloudflare):**

- Dashboard → R2 → babybook-bucket → Analytics
- Métricas: Operations, Storage, Egress

**B2 (Backblaze):**

- B2 Dashboard → Caps & Alerts
- Métricas: API Calls, Storage, Bandwidth

---

## Alertas Configurados

### Critical (Sev1) - Notificação Imediata

```yaml
alerts:
  - name: api-down
    condition: up{job="babybook-api"} == 0
    duration: 2m
    runbook: docs/runbooks/database-recovery.md

  - name: edge-down
    condition: up{job="babybook-edge"} == 0
    duration: 1m
    runbook: docs/runbooks/edge-worker-issues.md

  - name: error-rate-critical
    condition: error_rate > 5%
    duration: 5m
```

### Warning (Sev2) - Notificação em Horário Comercial

```yaml
alerts:
  - name: dlq-depth-high
    condition: dlq_messages > 10
    duration: 15m
    runbook: docs/runbooks/dlq-reprocessing.md

  - name: storage-errors
    condition: storage_errors_rate > 1%
    duration: 10m
    runbook: docs/runbooks/storage-recovery.md

  - name: db-latency-high
    condition: db_query_p95 > 500ms
    duration: 10m
```

### Info (Sev3) - Log/Dashboard Apenas

```yaml
alerts:
  - name: partner-low-balance
    condition: partner_voucher_balance < 5
    action: log

  - name: upload-queue-backlog
    condition: queue_depth > 100
    action: log
```

---

## Configuração Grafana (Opcional)

Se usar Grafana para consolidar métricas:

### Data Sources

```yaml
datasources:
  - name: cloudflare
    type: cloudflare
    access: proxy

  - name: flyio
    type: prometheus
    url: https://api.fly.io/prometheus

  - name: neon
    type: postgres
    url: postgresql://...
```

### Dashboard JSON

```json
{
  "title": "Baby Book Overview",
  "panels": [
    {
      "title": "Request Rate",
      "type": "timeseries",
      "datasource": "cloudflare",
      "targets": [{ "expr": "sum(rate(requests_total[5m]))" }]
    },
    {
      "title": "Error Rate",
      "type": "gauge",
      "thresholds": { "warning": 1, "critical": 5 }
    },
    {
      "title": "Active Users",
      "type": "stat",
      "datasource": "neon"
    }
  ]
}
```

---

## Checklist de Setup

### Cloudflare

- [ ] Analytics habilitado para Zone
- [ ] Workers Analytics habilitado
- [ ] Notifications configuradas

### Fly.io

- [ ] Metrics exportadas
- [ ] Alertas configurados

### Neon

- [ ] Monitoring habilitado
- [ ] Query insights ativado

### Modal

- [ ] Logs configurados
- [ ] Webhooks de erro (opcional)

---

## Referências

- DevOps: `docs/DevOps_Observabilidade.md`
- Arquitetura: `docs/Arquitetura_do_Sistema.md`
- Runbooks: `docs/runbooks/`
