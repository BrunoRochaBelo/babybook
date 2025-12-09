# Runbooks Operacionais — Baby Book

Este diretório contém procedimentos operacionais para resolução de incidentes e manutenção do sistema.

## Índice de Runbooks

| Runbook | Severidade | Tempo Estimado | Descrição |
|---------|------------|----------------|-----------|
| [dlq-reprocessing.md](./dlq-reprocessing.md) | Sev2 | 15-30min | Reprocessamento de mensagens na DLQ |
| [storage-recovery.md](./storage-recovery.md) | Sev2 | 30-60min | Recuperação de arquivos e storage |
| [voucher-issues.md](./voucher-issues.md) | Sev3 | 10-20min | Problemas com vouchers e redemption |
| [edge-worker-issues.md](./edge-worker-issues.md) | Sev1 | 5-15min | Falhas no Edge Worker |
| [database-recovery.md](./database-recovery.md) | Sev1 | 15-45min | Recuperação de banco de dados |

## Níveis de Severidade

| Severidade | Descrição | SLA de Resposta |
|------------|-----------|-----------------|
| **Sev1** | Sistema indisponível, perda de dados | < 15 minutos |
| **Sev2** | Degradação significativa, feature crítica down | < 1 hora |
| **Sev3** | Problema isolado, workaround disponível | < 4 horas |
| **Sev4** | Cosmético, baixo impacto | Próximo sprint |

## Contatos de Emergência

| Serviço | Canal | Documentação |
|---------|-------|--------------|
| Cloudflare | Dashboard + Support | https://dash.cloudflare.com |
| Fly.io | flyctl + Support | https://fly.io/docs |
| Neon | Dashboard | https://neon.tech/docs |
| Backblaze B2 | Support | https://www.backblaze.com/b2/docs |
| Modal | Dashboard | https://modal.com/docs |

## Checklist Pré-Incidente

Antes de executar qualquer runbook:

1. [ ] Verificar se há alertas ativos em outros sistemas
2. [ ] Comunicar no canal #incidents (se existir)
3. [ ] Documentar timestamp de início
4. [ ] Verificar se há deploy recente que pode ser a causa
5. [ ] Ter acesso às credenciais necessárias

## Pós-Incidente

Após resolver qualquer incidente:

1. [ ] Documentar timestamp de resolução
2. [ ] Atualizar status page (se aplicável)
3. [ ] Criar post-mortem para Sev1/Sev2
4. [ ] Atualizar runbook se houve aprendizado
