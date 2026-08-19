# Ativar Firebase — Dom Costelo PRO

O projeto já utiliza Firebase Authentication para login e Firestore para dados oficiais.

## Authentication

Ative E-mail/senha no Firebase Authentication. `admin@domcostelo.com` é o Responsável Principal existente e deve ser preservado. A senha atual não é conhecida pelo código, não é solicitada, não é redefinida e não é armazenada em nenhum arquivo.

## Firestore

Publique `firestore.rules` em modo de produção. Perfis oficiais ficam em `usuarios/{uid}` e controlam `role`, `ativo` e `permissoes`. As roles válidas são `owner`, `admin` e `operador`.

## Owner

`settings/system.ownerUid` deve apontar para o UID existente do Responsável Principal quando configurado. O fallback arquitetural é `admin@domcostelo.com`. Não crie outro administrador para substituir essa conta.

## Fichas técnicas

O Firestore é a fonte oficial. `seedFichas` só inicializa a coleção quando ela está realmente vazia e nunca sobrescreve fichas existentes. O seed registra `seedVersion` em `settings/system`.

## Compatibilidade

Estoque, histórico e receitas ainda podem usar rotinas híbridas por compatibilidade. Isso não altera autorização: localStorage não determina login, role, ativo, permissões ou owner.

## Verificação

```bash
pnpm install
pnpm test
pnpm build
```

As credenciais são administradas exclusivamente pelo Firebase Authentication e não são armazenadas no código ou na documentação.
