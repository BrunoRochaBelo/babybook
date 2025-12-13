# Runbook: Falhas no Edge Worker

Nota: regras de autorização e TTL de presigned URLs descritas no [BABY BOOK: DOSSIÊ DE EXECUÇÃO](../Dossie_Execucao.md) são a referência para este runbook. Confirme configurações do Worker antes de alterar assumptos de segurança.

**Severidade:** Sev1  
**Tempo Estimado:** 5-15 minutos  
**Última Atualização:** Janeiro 2025

## Sintomas

- Arquivos não carregando (404, 403, 500)
- Imagens/vídeos não aparecem no app
- Erro "Failed to fetch" no console do navegador
- Latência alta no carregamento de mídia
- Alerta de "Edge Worker Error Rate High"

## Arquitetura do Edge Worker

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   Cliente   │────▶│ Cloudflare Edge │────▶│ R2 Bucket   │
│  (Browser)  │     │    Worker       │     │  (Privado)  │
└─────────────┘     └─────────────────┘     └─────────────┘

                                │
                    ┌──────┴──────┐
                    │ 1. JWT Auth  │
                    │ 2. ACL Check │
                    │ 3. Sign Req  │
                    │ 4. Stream    │
                    └─────────────┘
```

## Diagnóstico Rápido

### 1. Verificar Status do Worker

```bash
# Health check
curl -I https://edge.babybook.com/health

# Verificar se worker está deployado
wrangler deployments list

# Ver logs em tempo real
wrangler tail babybook-edge --format pretty
```

### 2. Testar Acesso a Arquivo

```bash
# Com token válido
curl -v "https://edge.babybook.com/v1/file/sys/test.jpg"

# Com autenticação
curl -v "https://edge.babybook.com/v1/file/u/{user_id}/m/{moment_id}/photo.jpg" \
  -H "Authorization: Bearer {jwt_token}"
```

### 3. Verificar Métricas Cloudflare

1. Dashboard Cloudflare → Workers & Pages → babybook-edge
2. Verificar:
   - Request count
   - Error rate
   - CPU time

- Subrequests (chamadas ao R2)

## Cenários de Resolução

### Cenário 1: Worker Crashando (500 errors)

```bash
# Ver logs de erro
wrangler tail babybook-edge --format json | jq 'select(.level == "error")'

# Causas comuns:
# 1. JWT_SECRET não configurado
# 2. R2 credentials inválidas
# 3. Código com bug

# Verificar secrets
wrangler secret list

# Redeployar versão anterior
wrangler rollback
```

### Cenário 2: Erros de Autenticação (401/403)

```bash
# Verificar se JWT_SECRET está correto
# Comparar com o secret da API

# Na API (Fly.io)
fly secrets list -a babybook-api | grep SECRET_KEY

# No Edge Worker
wrangler secret list | grep JWT_SECRET

# Se diferentes, atualizar:
wrangler secret put JWT_SECRET
# (colar o mesmo valor da API)
```

### Cenário 3: Erros de Storage (502/504)

```bash
# Verificar conectividade com R2
curl -I https://{account_id}.r2.cloudflarestorage.com

# Verificar credentials R2
wrangler secret list | grep -E "R2_|CLOUDFLARE_"

# Testar assinatura S3 manualmente
aws s3 ls s3://bb-production-v1/ \
  --endpoint-url https://{account_id}.r2.cloudflarestorage.com \
  --profile babybook-r2
```

### Cenário 4: Rate Limiting

```bash
# Verificar se há throttling/rate limiting do storage (R2) ou do próprio Worker
# Sinais comuns: 429/503, aumento de subrequests, cache hit baixo.

# Ver uso no Cloudflare Dashboard
# R2 → Analytics (Operations/Errors) e Workers → Analytics (Subrequests/CPU)

# Mitigações típicas:
# - aumentar cache TTL e cache hit rate
# - reduzir subrequests (ex: agrupar reads, evitar HEAD redundante)
# - garantir que arquivos públicos passem por cache na edge quando possível
```

### Cenário 5: Worker Desatualizado

```bash
# Verificar versão deployada
wrangler deployments list

# Redeployar
cd apps/edge
pnpm run deploy

# Ou via CI/CD
git push origin main  # trigger deploy
```

## Comandos de Emergência

### Rollback Imediato

```bash
# Voltar para versão anterior
wrangler rollback

# Ou deployar versão específica
wrangler deployments view
wrangler rollback --deployment-id {id}
```

### Bypass do Edge (Emergência)

Se o Edge Worker estiver totalmente down, configurar bypass temporário:

```bash
# Opção 1: Redirect direto para R2 (perde proteção!)
# NÃO RECOMENDADO - usar apenas em emergência extrema

# Opção 2: Usar signed URLs da API
# Atualizar frontend para buscar URLs assinadas da API
# em vez de usar Edge Worker
```

### Limpar Cache

```bash
# Limpar cache do Cloudflare
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything": true}'
```

## Monitoramento

### Alertas Recomendados

```yaml
alerts:
  - name: edge-worker-error-rate
    condition: rate(edge_5xx_total[5m]) / rate(edge_requests_total[5m]) > 0.01
    severity: critical
    runbook: docs/runbooks/edge-worker-issues.md

  - name: edge-worker-latency
    condition: histogram_quantile(0.95, edge_request_duration_seconds) > 2
    severity: warning

  - name: edge-worker-cpu-exceeded
    condition: edge_cpu_time_ms > 45 # limite é 50ms
    severity: warning
```

### Dashboard Essencial

| Métrica           | Normal  | Warning    | Critical |
| ----------------- | ------- | ---------- | -------- |
| Error Rate        | < 0.1%  | 0.1-1%     | > 1%     |
| p95 Latency       | < 500ms | 500-2000ms | > 2000ms |
| CPU Time          | < 20ms  | 20-40ms    | > 40ms   |
| Subrequest Errors | 0       | 1-5/min    | > 5/min  |

## Prevenção

### Checklist de Deploy

- [ ] Rodar `pnpm test` antes de deploy
- [ ] Verificar wrangler.toml está correto
- [ ] Secrets configurados em staging
- [ ] Testar em staging antes de prod
- [ ] Monitorar por 5min após deploy

### Configuração de Retry

```toml
# wrangler.toml
[triggers]
crons = []

[build]
command = "pnpm run build"

# Limites
[limits]
cpu_ms = 50
```

## Métricas de Sucesso

- [ ] Health check retornando 200
- [ ] Error rate < 0.1%
- [ ] Arquivos carregando no app
- [ ] Latência p95 < 500ms

## Referências

- Edge Worker: `apps/edge/`
- Auth: `apps/edge/src/lib/auth.ts`
- Storage: `apps/edge/src/lib/storage.ts`
- Cloudflare Docs: https://developers.cloudflare.com/workers/
