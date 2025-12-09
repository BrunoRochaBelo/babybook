# Runbook: Reprocessamento da DLQ (Dead Letter Queue)

Nota: procedimentos de reprocessamento devem respeitar quotas e SLOs definidos no [BABY BOOK: DOSSIÊ DE EXECUÇÃO](../Dossie_Execucao.md). Consulte o dossiê para impacto financeiro e políticas de retry.

**Severidade:** Sev2  
**Tempo Estimado:** 15-30 minutos  
**Última Atualização:** Janeiro 2025

## Sintomas

- Mensagens acumulando na DLQ do Cloudflare Queues
- Workers não processando jobs
- Assets ficando em status `queued` ou `processing` por muito tempo
- Alertas de "DLQ depth > threshold"

## Pré-requisitos

- Acesso ao dashboard Cloudflare
- `wrangler` CLI instalado e autenticado
- Acesso ao banco de dados (Neon)

## Diagnóstico

### 1. Verificar profundidade da DLQ

```bash
# Via Cloudflare Dashboard
# Account > Workers & Pages > Queues > babybook-dlq

# Ou via API
curl -X GET "https://api.cloudflare.com/client/v4/accounts/{account_id}/queues/{queue_id}/messages" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json"
```

### 2. Verificar logs do Worker

```bash
# Ver logs recentes do Modal
modal logs --app babybook-workers --tail 100

# Ou no dashboard Modal
# https://modal.com/apps/babybook-workers/logs
```

### 3. Identificar causa comum

| Erro              | Causa Provável               | Ação             |
| ----------------- | ---------------------------- | ---------------- |
| `timeout`         | Worker lento, arquivo grande | Aumentar timeout |
| `memory_error`    | Arquivo muito grande         | Fallback ou skip |
| `storage_error`   | B2/R2 indisponível           | Verificar status |
| `invalid_payload` | Mensagem corrompida          | Descartar        |

## Procedimento de Reprocessamento

### Opção A: Reprocessar Todas as Mensagens

```bash
# 1. Pausar produção de novas mensagens (opcional)
# Isso evita que novas mensagens entrem enquanto reprocessamos

# 2. Mover mensagens da DLQ para a fila principal
wrangler queues consumer add babybook-main \
  --dead-letter-queue babybook-dlq \
  --max-retries 3

# 3. Monitorar processamento
watch -n 5 'wrangler queues list'
```

### Opção B: Reprocessar Mensagens Seletivas

```python
# Script Python para reprocessar seletivamente
import httpx
import json

CLOUDFLARE_API = "https://api.cloudflare.com/client/v4"
ACCOUNT_ID = "your-account-id"
QUEUE_ID = "babybook-dlq"
API_TOKEN = "your-api-token"

headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}

# 1. Listar mensagens da DLQ
response = httpx.get(
    f"{CLOUDFLARE_API}/accounts/{ACCOUNT_ID}/queues/{QUEUE_ID}/messages",
    headers=headers,
    params={"limit": 100}
)
messages = response.json()["result"]

# 2. Filtrar por tipo de erro
reprocessable = [
    msg for msg in messages
    if msg.get("error_type") in ["timeout", "storage_error"]
]

# 3. Republicar na fila principal
for msg in reprocessable:
    httpx.post(
        f"{CLOUDFLARE_API}/accounts/{ACCOUNT_ID}/queues/babybook-main/messages",
        headers=headers,
        json={"body": msg["body"]}
    )
    print(f"Republished: {msg['id']}")
```

### Opção C: Descartar Mensagens Inválidas

```sql
-- Se as mensagens são para assets que já não existem
-- Primeiro, identificar os asset_ids nas mensagens DLQ

-- Marcar assets como 'error' se não puderam ser processados
UPDATE assets
SET status = 'error',
    error_message = 'Failed after max retries - DLQ cleanup'
WHERE id IN ('asset-id-1', 'asset-id-2')
  AND status IN ('queued', 'processing');
```

## Prevenção

### Configurar Alertas

```yaml
# Alerta quando DLQ > 10 mensagens por 5 minutos
alert:
  name: dlq-depth-high
  condition: cloudflare.queues.dlq.depth > 10
  duration: 5m
  severity: warning
  runbook: docs/runbooks/dlq-reprocessing.md
```

### Ajustar Retries

```toml
# wrangler.toml
[[queues.consumers]]
queue = "babybook-main"
max_retries = 3
max_batch_size = 10
max_batch_timeout = 30
dead_letter_queue = "babybook-dlq"
```

## Rollback

Se o reprocessamento causar problemas:

1. Pausar o consumer da fila principal
2. Verificar logs para novo padrão de erro
3. Corrigir a causa raiz antes de continuar

## Métricas de Sucesso

- [ ] DLQ depth volta a zero
- [ ] Assets em `queued`/`processing` completam para `ready` ou `error`
- [ ] Nenhum novo acúmulo em 1 hora

## Referências

- [Cloudflare Queues Docs](https://developers.cloudflare.com/queues/)
- [Modal Logs](https://modal.com/docs/guide/logs)
- Arquitetura: `docs/Arquitetura_do_Sistema.md` seção 9.3
