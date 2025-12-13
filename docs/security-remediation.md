## Remoção da credencial exposta (Company Email Password)

1. **Gire a credencial** imediatamente (senha nova na conta de e-mail) antes de qualquer passo de limpeza.
2. **Instale o git-filter-repo** na máquina que fará a limpeza:
   ```bash
   python -m pip install --upgrade git-filter-repo
   ```
3. **Defina o segredo a remover em uma variável de ambiente** (sem registrá-lo neste repositório) e crie o arquivo de substituições:
   ```bash
   export SECRET_TO_PURGE="EXAMPLE_SECRET_VALUE_TO_PURGE"  # pragma: allowlist secret
   cat > /tmp/redactions.txt <<EOF
   $SECRET_TO_PURGE==>***REMOVIDO***
   EOF
   ```
   > Dica: mantenha esse arquivo apenas em `/tmp` e nunca faça commit dele; apague-o após a execução. Este placeholder é somente um exemplo — não registre o segredo real neste ou em qualquer outro arquivo versionado. O comentário `pragma: allowlist secret` existe apenas para evitar falsos positivos do scanner nesta linha de exemplo.
4. **Reescreva todo o histórico** (branch padrão + tags):
   ```bash
   git filter-repo --replace-text /tmp/redactions.txt --force
   git push origin --force-with-lease --all
   git push origin --force-with-lease --tags
   ```
   > Atenção: esse passo sobrescreve o histórico remoto. Faça backup/local mirror antes de executar e comunique a equipe para evitar perda de trabalho.
5. **Revalide** que o segredo sumiu:
   ```bash
   git grep -n "$SECRET_TO_PURGE" $(git rev-list --since="6 months ago" --all) || echo "OK - não encontrado"
   detect-secrets scan --exclude-files "(pnpm-lock\\.yaml|package-lock\\.json|yarn\\.lock)"
   ```
   > A checagem incremental (`--since`) é rápida para incidentes recentes; se precisar revisar todo o histórico, remova o `--since="6 months ago"` ciente de que pode ser bem mais lento. Caso não haja commits nesse intervalo, ajuste a janela (ex.: `--since="12 months ago"`) ou use `--all` para garantir que o grep encontre o histórico completo. O mesmo `SECRET_TO_PURGE` definido no passo 3 é reutilizado aqui para validar a limpeza.

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
