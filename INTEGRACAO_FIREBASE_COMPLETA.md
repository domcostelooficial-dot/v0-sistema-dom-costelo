# Integração Firebase — Dom Costelo PRO

## Arquitetura atual

- Firebase Authentication: identidade, login, sessão e alteração voluntária de senha.
- Firestore `usuarios/{uid}`: `role`, `ativo` e `permissoes`.
- Firestore: fonte oficial das fichas técnicas após inicialização.
- `settings/system`: `ownerUid` e `seedVersion`.

O Responsável Principal é `admin@domcostelo.com`. Essa conta existente, seu UID, e-mail, role owner, status e credencial atual devem ser preservados. Nenhum seed, startup, deploy ou migração altera sua senha ou recria seu usuário.

## Senhas

O projeto não contém senhas administrativas. A troca voluntária usa `EmailAuthProvider.credential()`, `reauthenticateWithCredential()` e `updatePassword()`. A senha atual é validada no Firebase Authentication e os campos são limpos após a operação.

Nenhuma senha é armazenada em Firestore ou localStorage.

## Fichas técnicas

`seedFichas` é a única estrutura de seed. Ele só executa quando a coleção do Firestore está vazia, é idempotente e registra `seedVersion`. Dados existentes têm prioridade e não são sobrescritos. `defaultFichasTecnicas` não é utilizado.

## Dados híbridos legados

Estoque, histórico e receitas ainda mantêm algumas rotinas Firebase + localStorage por compatibilidade. Essa migração será feita em etapa separada. localStorage não é fonte de identidade, autorização ou fichas financeiras oficiais.

## Segurança

As regras em `firestore.rules` implementam owner, admin, operador, `/compras` e deny-by-default. Admin comum não pode substituir o owner, remover o último Responsável Principal ou alterar a credencial do owner.

## Validação

```bash
pnpm install
pnpm test
pnpm build
```
