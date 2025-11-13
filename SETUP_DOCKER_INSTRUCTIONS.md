# 🐳 Guia Prático: Instalando Docker Desktop

## Por que Docker é crítico?

O Baby Book depende de 2 serviços que rodam em containers Docker:

- **Postgres 15**: Banco de dados (porta 5432)
- **MinIO**: Storage S3 compatível (porta 9000/9001)

Sem Docker, você não consegue rodar a API localmente.

---

## 📥 PASSO 1: Baixar Docker Desktop

### Windows (sua plataforma)

1. Acesse: **https://www.docker.com/products/docker-desktop**
2. Clique em **"Download for Windows"**
3. Escolha a versão correta:
   - **ARM64** (M1/M2/M3 Mac) - NÃO é seu caso
   - **x86_64** (Processador Intel/AMD padrão) - **ESCOLHA ESTA**
4. Salve o arquivo `Docker Desktop Installer.exe`

### Alternativa (WSL2 + Docker)

Se você prefere uma abordagem mais leve:

- Instale **Windows Subsystem for Linux 2 (WSL2)**
- Depois instale Docker Desktop com integração WSL2

---

## 🔧 PASSO 2: Instalar Docker Desktop

1. Execute `Docker Desktop Installer.exe`
2. Siga o wizard de instalação (clique "Next" até o fim)
3. **IMPORTANTE**: Marque a opção **"Use WSL 2 instead of Hyper-V"** (recomendado)
4. Clique "Install"
5. Aguarde a instalação completar (~5 minutos)
6. Reinicie o computador quando solicitado

---

## ✅ PASSO 3: Validar Instalação

Abra um **novo terminal PowerShell** (importante: terminal NOVO) e execute:

```powershell
docker --version
docker run hello-world
```

Esperado:

```
Docker version 27.0.0 (ou superior)
Hello from Docker!
```

Se vir isso, Docker está instalado e funcionando! 🎉

---

## 🚀 PASSO 4: Subir Postgres + MinIO (após Docker OK)

Agora, no diretório raiz do projeto (`c:\Users\bruno\OneDrive\Temp\source\repos\babybook\babybook`), execute:

```powershell
docker compose up -d
```

Isso vai:

1. Baixar as imagens do Postgres e MinIO (primeira vez)
2. Criar os containers
3. Iniciar os serviços em background

Validar que está rodando:

```powershell
docker compose ps
```

Esperado:

```
NAME                    STATUS
babybook_db_local       Up 30 seconds (healthy)
babybook_storage_local  Up 25 seconds (healthy)
```

---

## 🔄 PASSO 5: Aplicar Migrações do Banco

Com Postgres rodando, aplique o schema do banco:

```powershell
cd apps/api
alembic upgrade head
cd ../..
```

Esperado:

```
[main] Running upgrade... -> xxx: ... (vai exibir várias migrações)
```

Se vir isso, o banco está configurado corretamente! ✅

---

## 🎯 PASSO 6: Verificar Conectividade

Teste que a API consegue conectar ao banco:

```powershell
# Dentro do venv ativado
python -c "from babybook_api.deps import get_db; print('✅ Database module OK')"
```

Se não houver erro, está funcionando! ✅

---

## 🛑 Troubleshooting

### "Docker: command not found"

- Você instalou Docker, mas o terminal não reconhece
- **Solução**: Feche o terminal e abra um novo

### "Cannot connect to Docker daemon"

- Docker Desktop não está rodando
- **Solução**: Procure por "Docker" no menu Iniciar e inicie o aplicativo

### "Containers failed to start"

- Portas 5432 ou 9000 já estão em uso
- **Solução**:
  ```powershell
  netstat -ano | findstr ":5432"  # Verificar qual processo usa a porta
  docker compose down             # Parar containers
  docker compose up -d            # Reiniciar
  ```

### "Alembic: command not found"

- Alembic não está no PATH
- **Solução**:
  ```powershell
  .\.venv\Scripts\Activate.ps1    # Garantir que venv está ativado
  pip install alembic
  ```

---

## 📝 Checklist Final

Após completar todos os passos, você deve ter:

- [ ] Docker Desktop instalado e rodando
- [ ] `docker --version` funciona no PowerShell
- [ ] `docker compose ps` mostra 2 containers "healthy"
- [ ] `alembic upgrade head` completou sem erros
- [ ] `.env.local` existe na raiz do projeto

Quando TUDO acima estiver marcado ✅, você está pronto para rodar os serviços!

---

## 🚀 Próximo Passo: Rodar os Serviços

Após Docker estar OK, execute em 4 terminais separados:

```powershell
# TERMINAL 1: API
pnpm dev:api

# TERMINAL 2: Web (SPA)
pnpm dev:web

# TERMINAL 3: Edge (Workers)
pnpm dev:edge

# TERMINAL 4: Workers (Background)
pnpm dev:workers
```

Depois acesse:

- **Web**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001 (user: minioadmin / pass: minioadmin)

---

**Dúvidas?** Volte aqui após Docker estar instalado!
