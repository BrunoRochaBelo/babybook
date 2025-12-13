## Remoção da credencial exposta (Company Email Password)

1. **Gire a credencial** imediatamente (senha nova na conta de e-mail) antes de qualquer passo de limpeza.
2. **Instale o git-filter-repo** na máquina que fará a limpeza:
   ```bash
   python -m pip install --upgrade git-filter-repo
   ```
3. **Crie o arquivo de redactions** com o valor exato vazado (substitua `VALOR_SECRETO_ATUAL` pela senha real):
   ```bash
   cat > /tmp/redactions.txt <<'EOF'
   VALOR_SECRETO_ATUAL==>***REMOVIDO***
   EOF
   ```
4. **Reescreva todo o histórico** (branch padrão + tags):
   ```bash
   git filter-repo --replace-text /tmp/redactions.txt --force
   git push origin --force-with-lease --all
   git push origin --force-with-lease --tags
   ```
5. **Revalide** que o segredo sumiu:
   ```bash
   git grep -n "VALOR_SECRETO_ATUAL" $(git rev-list --all) || echo "OK - não encontrado"
   detect-secrets scan --exclude-files "(pnpm-lock\\.yaml|package-lock\\.json|yarn\\.lock)"
   ```

### Como a equipe deve se realinhar após o push forçado
- Desenvolvedores com clone existente:
  ```bash
  git fetch origin
  git checkout main
  git reset --hard origin/main
  git clean -fd
  ```
- Branches em andamento devem ser **rebaseados sobre o novo histórico** ou recriados:
  ```bash
  git checkout minha-branch
  git rebase origin/main
  ```
- Reabra PRs se necessário para garantir que nenhum commit antigo (pré-limpeza) volte.

### Boas práticas adicionais
- Nunca commitar segredos: mantenha `.env` e arquivos de chaves fora do Git.
- Execute `pre-commit install` para habilitar os hooks locais, incluindo o scanner de segredos configurado neste repositório.
- Mantenha a baseline `.secrets.baseline` atualizada quando novos falsos positivos forem justificados:
  ```bash
  detect-secrets scan --exclude-files "(pnpm-lock\\.yaml|package-lock\\.json|yarn\\.lock)" > .secrets.baseline
  ```
