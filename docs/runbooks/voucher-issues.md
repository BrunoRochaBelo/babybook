# Runbook: Problemas com Vouchers

Nota: consulte o [BABY BOOK: DOSSIÊ DE EXECUÇÃO](../Dossie_Execucao.md) para as políticas de pagamento, pricing e fluxo de resgate que impactam este runbook.

**Severidade:** Sev3  
**Tempo Estimado:** 10-20 minutos  
**Última Atualização:** Janeiro 2025

## Sintomas

- Voucher não sendo aceito no resgate
- Erro "Voucher inválido" ou "Voucher expirado"
- Arquivos não aparecendo após resgate
- Partner não consegue gerar vouchers
- Usuário reporta código que "não funciona"

## Pré-requisitos

- Acesso ao banco de dados (Neon)
- Código do voucher em questão
- ID do parceiro (se aplicável)

## Diagnóstico

### 1. Verificar Status do Voucher

```sql
-- Buscar voucher pelo código
SELECT
    v.code,
    v.status,
    v.partner_id,
    v.delivery_id,
    v.redeemed_by_user_id,
    v.redeemed_at,
    v.created_at,
    p.name as partner_name,
    d.status as delivery_status,
    d.client_name
FROM vouchers v
LEFT JOIN partners p ON p.id = v.partner_id
LEFT JOIN deliveries d ON d.id = v.delivery_id
WHERE v.code = 'VOUCHER-CODE';
```

### 2. Verificar Estado da Delivery

```sql
-- Ver assets da delivery
SELECT
    d.id,
    d.status,
    d.assets_payload,
    d.created_at,
    jsonb_array_length(d.assets_payload->'files') as file_count
FROM deliveries d
WHERE d.id = 'delivery-uuid';
```

### 3. Verificar Logs da API

```bash
# Buscar tentativas de resgate
fly logs -a babybook-api | grep "voucher" | grep "VOUCHER-CODE"
```

## Cenários de Resolução

### Cenário 1: Voucher Marcado como "USED" Mas Não Resgatado

```sql
-- Verificar se há momento criado
SELECT m.id, m.created_at, m.child_id
FROM moments m
JOIN assets a ON a.moment_id = m.id
WHERE a.original_key LIKE '%delivery-uuid%';

-- Se não há momento, resetar voucher
UPDATE vouchers
SET status = 'ACTIVE',
    redeemed_by_user_id = NULL,
    redeemed_at = NULL
WHERE code = 'VOUCHER-CODE'
  AND status = 'USED';

-- Também resetar delivery
UPDATE deliveries
SET status = 'PENDING'
WHERE id = 'delivery-uuid';
```

### Cenário 2: Voucher Expirado Prematuramente

```sql
-- Verificar data de expiração
SELECT code, status, created_at,
       created_at + INTERVAL '365 days' as expected_expiry
FROM vouchers
WHERE code = 'VOUCHER-CODE';

-- Se expirou incorretamente, reativar
UPDATE vouchers
SET status = 'ACTIVE'
WHERE code = 'VOUCHER-CODE'
  AND status = 'EXPIRED';
```

### Cenário 3: Arquivos Não Transferidos Após Resgate

```sql
-- Verificar se momento foi criado
SELECT
    v.code,
    v.redeemed_by_user_id,
    m.id as moment_id,
    m.created_at as moment_created
FROM vouchers v
LEFT JOIN moments m ON m.source_delivery_id = v.delivery_id
WHERE v.code = 'VOUCHER-CODE';

-- Se momento existe mas sem arquivos, verificar assets
SELECT a.id, a.status, a.original_key
FROM assets a
WHERE a.moment_id = 'moment-uuid';
```

**Se arquivos não foram copiados:**

```python
# Executar cópia manual
from babybook_api.storage.partner_service import PartnerStorageService

service = PartnerStorageService()
await service.copy_delivery_to_user(
    partner_id="partner-uuid",
    delivery_id="delivery-uuid",
    user_id="user-uuid",
    moment_id="moment-uuid"
)
```

### Cenário 4: Partner Sem Saldo de Vouchers

```sql
-- Verificar saldo do parceiro
SELECT id, name, email, voucher_balance, created_at
FROM partners
WHERE id = 'partner-uuid';

-- Adicionar créditos (após confirmação de pagamento)
UPDATE partners
SET voucher_balance = voucher_balance + 10
WHERE id = 'partner-uuid';

-- Registrar transação
INSERT INTO partner_transactions (
    partner_id, type, amount, description, created_at
) VALUES (
    'partner-uuid', 'credit', 10, 'Manual adjustment - support ticket #123', NOW()
);
```

### Cenário 5: Código Digitado Incorretamente

```sql
-- Buscar códigos similares (fuzzy match)
SELECT code, status, partner_id
FROM vouchers
WHERE code ILIKE '%ABC123%'  -- parte do código
   OR levenshtein(code, 'ABC123XYZ') <= 2;  -- distância de edição

-- Se encontrar o correto, informar ao usuário
```

### Cenário 6: Delivery Sem Arquivos

```sql
-- Verificar se parceiro fez upload
SELECT
    d.id,
    d.assets_payload,
    d.status
FROM deliveries d
WHERE d.id = 'delivery-uuid';

-- Se assets_payload está vazio, delivery incompleta
-- Notificar parceiro para completar o upload
```

## Prevenção

### Validações no Resgate

```python
# Checklist de validação (implementado em routes/vouchers.py)
1. Voucher existe? → 404 "Código não encontrado"
2. Status == ACTIVE? → 400 "Voucher já utilizado/expirado"
3. Delivery associada? → 400 "Voucher sem entrega vinculada"
4. Delivery.status == PENDING? → 400 "Entrega já processada"
5. Arquivos existem no storage? → 500 "Erro ao processar arquivos"
```

### Monitoramento

```yaml
alerts:
  - name: voucher-redemption-failures
    condition: rate(voucher_redemption_errors_total[1h]) > 5
    severity: warning

  - name: partner-low-balance
    condition: partner_voucher_balance < 2
    severity: info
    # Notificar parceiro para recarregar
```

## Comunicação com Usuário

### Templates de Resposta

**Voucher Inválido:**

> Olá! Verificamos o código informado e ele não está em nosso sistema.
> Por favor, verifique se digitou corretamente. O código deve ter
> exatamente X caracteres. Se o problema persistir, entre em contato
> com o fotógrafo que forneceu o código.

**Voucher Já Usado:**

> Este código já foi utilizado em {data}. Se você não fez o resgate,
> por favor entre em contato conosco para investigarmos.

**Arquivos Não Aparecem:**

> Identificamos o problema e seus arquivos estão sendo processados.
> Eles devem aparecer em sua conta em até 15 minutos.

## Métricas de Sucesso

- [ ] Voucher em status correto (ACTIVE/USED)
- [ ] Delivery com status correto
- [ ] Momento criado para o usuário
- [ ] Arquivos visíveis no app

## Referências

- Routes: `apps/api/babybook_api/routes/vouchers.py`
- Schemas: `apps/api/babybook_api/schemas/vouchers.py`
- Storage: `apps/api/babybook_api/storage/partner_service.py`
