# Baby Book Worker

Serviço de background para processamento assíncrono de tarefas pesadas.

## Funcionalidades
- Processamento de filas (Cloudflare Queues / Postgres)
- Processamento de mídia (FFmpeg)
- Envio de e-mails transacionais
- Geração de thumbnails

## Estrutura
- `app/`: Código fonte
  - `main.py`: Entrypoint
  - `queue.py`: Consumidor de filas
  - `notifications.py`: Handler de notificações/e-mails
- `templates/`: Templates HTML (Jinja2) para e-mails

## Jobs Suportados

### `notification`
Envia e-mails transacionais.
- **Payload**:
  - `type`: "email"
  - `to`: destinatário
  - `template`: nome do template (ex: `guestbook_invite`)
  - `context`: variáveis para o template
  - `subject`: assunto do e-mail

## Desenvolvimento
Dependências são gerenciadas via poetry/pip no `pyproject.toml`.

Variáveis de ambiente necessárias:
- `RESEND_API_KEY`: Para envio de e-mails
- `WORKER_TEMPLATES_DIR`: Caminho para templates (opcional, default: `apps/workers/templates`)
