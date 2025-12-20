# Runbook: Recuperação de Storage (R2)

Nota: políticas de lifecycle e paths de buckets devem ser compatíveis com o [BABY BOOK: DOSSIÊ DE EXECUÇÃO](../Dossie_Execucao.md). Verifique prefixes (partners/, tmp/, u/) e regras de expiração antes de qualquer cópia em massa.

**Severidade:** Sev2  
**Tempo Estimado:** 30-60 minutos  
**Última Atualização:** Janeiro 2025

## Sintomas

- Arquivos não carregando no app
- Erros 404/403 ao acessar mídia
- Upload completando mas arquivo não aparece
- Thumbnails não gerando
- Edge Worker retornando erros de storage

## Arquitetura de Storage

```
┌─────────────────────────────────────────────────────────┐
│                    Estrutura de Pastas                  │
├─────────────────────────────────────────────────────────┤
│ tmp/{uuid}/           → Uploads temporários (1 dia)     │
│ partners/{id}/        → Assets de parceiros (365 dias)  │
│ u/{user_id}/m/{id}/   → Momentos do usuário (permanente)│
│ sys/                  → Assets do sistema (permanente)  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│               Cloudflare R2             │
│            (Storage R2-only)            │
├─────────────────────────────────────────┤
│ • Originais (u/)                        │
│ • Derivados (recriáveis)                │
│ • Exports (TTL curto)                   │
└─────────────────────────────────────────┘
```

## Diagnóstico

### 1. Verificar Status dos Providers

```bash
# Cloudflare R2
curl -I https://media.babybook.com/health

# Edge Worker
curl https://edge.babybook.com/health
```

### 2. Verificar Conectividade da API

```bash
# Health check da API (por trás do proxy em /api)
curl -I "https://app.babybook.com/api/health"

# Observação:
# Neste repo, não existe um endpoint público canônico do tipo /storage/health.
# Para diagnosticar storage, use os checks de R2/Edge Worker acima + logs (wrangler tail) e, quando necessário,
# inspeção no banco (assets.original_key/variants/status).
```

### 3. Verificar Logs do Edge Worker

```bash
# Via wrangler
wrangler tail babybook-edge --format pretty

# Procurar por erros específicos
wrangler tail babybook-edge --format json | grep -i "error"
```

## Cenários de Recuperação

### Cenário 1: Arquivo Individual Não Encontrado

```python
# 1. Verificar se o arquivo existe no banco
SELECT id, original_key, status, derivs
FROM assets
WHERE id = 'asset-uuid';

# 2. Verificar se existe no storage
# Via AWS CLI (compatível com S3)
aws s3 ls s3://bb-r2-bucket/u/{user_id}/m/{moment_id}/ \
  --endpoint-url https://{account_id}.r2.cloudflarestorage.com

# 3. Se o objeto NÃO existe no R2:
# - Se for derivado (thumb/preview), siga para “Cenário 2” (regenerar).
# - Se for original, tratar como incidente de perda de dados: interromper ações destrutivas,
#   coletar evidências (logs/audit_event) e escalar (Sev1) para investigação.
```

### Cenário 2: Thumbnails/Previews Corrompidos

```python
# Regenerar derivados (fluxo recomendado): via SQL + Worker
UPDATE assets
SET status = 'queued',
    derivs = '{}'
WHERE id = 'asset-uuid';

# O worker vai reprocessar automaticamente

# Alternativa (service-to-service): marcar status/variants via PATCH /assets/{asset_id}
# (usa autenticação de serviço e depende do pipeline/worker ler o status)
# Endpoint: PATCH https://app.babybook.com/api/assets/{asset_id}
```

### Cenário 3: Voucher Redemption Não Transferiu Arquivos

```python
# Verificar status da delivery
SELECT d.id, d.status, d.assets_payload, v.code, v.redeemed_at
FROM deliveries d
JOIN vouchers v ON v.delivery_id = d.id
WHERE v.code = 'VOUCHER-CODE';

# Se delivery foi marcada mas arquivos não copiados
# Executar cópia manual via partner_service
from babybook_api.storage.partner_service import PartnerStorageService

service = PartnerStorageService()
await service.copy_delivery_to_user(
    partner_id="partner-uuid",
    delivery_id="delivery-uuid",
    user_id="user-uuid",
    moment_id="moment-uuid"
)
```

### Cenário 4: Upload Travado em tmp/

```sql
-- Encontrar uploads órfãos (mais de 24h em tmp/)
SELECT id, original_key, created_at, status
FROM assets
WHERE original_key LIKE 'tmp/%'
  AND created_at < NOW() - INTERVAL '24 hours'
  AND status IN ('uploading', 'queued');

-- Opção 1: Marcar como erro
UPDATE assets
SET status = 'error',
    error_message = 'Upload abandoned - cleanup'
WHERE id IN (SELECT id FROM ...);

-- Opção 2: Reprocessar (se arquivo existe)
UPDATE assets
SET status = 'queued'
WHERE id IN (SELECT id FROM ...);
```

### Cenário 5: Edge Worker Negando Acesso

```bash
# 1. Verificar se JWT está válido
curl -X GET "https://edge.babybook.com/v1/file/u/{user_id}/m/{moment_id}/photo.jpg" \
  -H "Authorization: Bearer {jwt_token}" \
  -v

# 2. Verificar claims do JWT
# Decodificar em jwt.io e verificar:
# - sub (user_id) corresponde ao path
# - exp não expirou
# - role está correto

# 3. Se problema é de configuração
wrangler secret list
wrangler secret put JWT_SECRET
```

## Prevenção

### Política de retenção (TTL) — R2

Implementar retenção por prefixo (via regras nativas do R2 quando disponíveis, ou via job/worker “reaper”):

- `tmp/` expira em 1 dia
- `partners/` expira em 365 dias
- `exports/` expira conforme definido (ex: 72h)

**Importante:** nunca aplicar TTL em `u/` (originais do usuário).

### Monitoramento

```yaml
# Alertas recomendados
alerts:
  - name: storage-errors-high
    condition: rate(storage_errors_total[5m]) > 10
    severity: warning

  - name: edge-worker-5xx
    condition: rate(edge_worker_5xx_total[5m]) > 5
    severity: critical
```

## Rollback

Se a recuperação causar problemas:

1. **Não deletar originais** - sempre preservar arquivos no storage (R2)
2. Reverter alterações no banco via PITR do Neon
3. Restaurar derivados a partir dos originais

## Métricas de Sucesso

- [ ] Arquivos carregando normalmente no app
- [ ] Taxa de erro < 0.1%
- [ ] Edge Worker respondendo com 200
- [ ] Thumbnails visíveis em todos os momentos

## Referências

- Storage: `apps/api/babybook_api/storage/paths.py`
- Edge Worker: `apps/edge/README.md`
- Arquitetura: `docs/Arquitetura_do_Sistema.md` seção 2.5, 2.6
