# Runbook: Recuperação de Storage (R2/B2)

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

┌─────────────────┐     ┌─────────────────┐
│   Cloudflare R2 │     │   Backblaze B2  │
│   (Hot Storage) │     │  (Cold Storage) │
├─────────────────┤     ├─────────────────┤
│ • Thumbnails    │     │ • Originais     │
│ • Previews      │     │ • Vídeos HD     │
│ • Acesso rápido │     │ • Backup        │
└─────────────────┘     └─────────────────┘
```

## Diagnóstico

### 1. Verificar Status dos Providers

```bash
# Cloudflare R2
curl -I https://media.babybook.com/health

# Backblaze B2 Status
curl https://status.backblaze.com/api/v2/status.json

# Edge Worker
curl https://edge.babybook.com/health
```

### 2. Verificar Conectividade da API

```bash
# Testar acesso ao R2 via API
curl -X GET "https://api.babybook.com/v1/storage/health" \
  -H "Authorization: Bearer {token}"
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
aws s3 ls s3://bb-production-v1/u/{user_id}/m/{moment_id}/ \
  --endpoint-url https://s3.us-west-004.backblazeb2.com

# 3. Se existir no B2 mas não no R2, copiar
aws s3 cp \
  s3://bb-production-v1/u/{user_id}/m/{moment_id}/preview.jpg \
  s3://bb-r2-bucket/u/{user_id}/m/{moment_id}/preview.jpg \
  --endpoint-url https://{account_id}.r2.cloudflarestorage.com
```

### Cenário 2: Thumbnails/Previews Corrompidos

```python
# Regenerar derivados via API
curl -X POST "https://api.babybook.com/v1/assets/{asset_id}/regenerate" \
  -H "Authorization: Bearer {service_token}" \
  -H "Content-Type: application/json" \
  -d '{"targets": ["thumb", "preview"]}'

# Ou via SQL + Worker
UPDATE assets 
SET status = 'queued', 
    derivs = '{}'
WHERE id = 'asset-uuid';

# O worker vai reprocessar automaticamente
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

### Lifecycle Rules B2

```xml
<!-- Configurar no dashboard B2 -->
<LifecycleConfiguration>
  <Rule>
    <ID>tmp-cleanup</ID>
    <Prefix>tmp/</Prefix>
    <Status>Enabled</Status>
    <Expiration>
      <Days>1</Days>
    </Expiration>
  </Rule>
  <Rule>
    <ID>partners-cleanup</ID>
    <Prefix>partners/</Prefix>
    <Status>Enabled</Status>
    <Expiration>
      <Days>365</Days>
    </Expiration>
  </Rule>
</LifecycleConfiguration>
```

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

1. **Não deletar originais** - sempre preservar arquivos em B2
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
