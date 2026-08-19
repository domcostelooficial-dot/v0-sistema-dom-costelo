# Sistema Dom Costelo PRO

Sistema de gestão de estoque, produção e financeiro para restaurantes.

## Autenticação e autorização

- **Firebase Authentication** é a fonte oficial de identidade, login e sessão.
- **Firestore `usuarios/{uid}`** é a fonte oficial de `role`, `ativo` e `permissoes`.
- Roles válidas: `owner`, `admin` e `operador`.
- `admin@domcostelo.com` é o Responsável Principal existente e funciona como fallback do owner.
- A senha dessa conta é administrada exclusivamente pelo Firebase Authentication e não é armazenada no código, Firestore, localStorage ou documentação.

## Dados

O Firestore é a fonte oficial das fichas técnicas. `seedFichas` só inicializa a coleção quando ela está vazia e não sobrescreve dados atuais. Estoque, histórico e receitas ainda possuem rotinas híbridas por compatibilidade; essa migração será feita separadamente.

`localStorage` não determina login, role, ativo, permissões, owner ou fichas financeiras oficiais.

## Firebase

Consulte:

- [Início rápido](./INICIO_RAPIDO_FIREBASE.md)
- [Configuração](./FIREBASE_SETUP.md)
- [Ativação](./ATIVAR_FIREBASE.md)
- [Integração completa](./INTEGRACAO_FIREBASE_COMPLETA.md)

As variáveis `NEXT_PUBLIC_FIREBASE_*` são configurações públicas do Firebase Client SDK. Nunca adicione senhas, tokens privados, service accounts ou private keys ao repositório.

## Validação

Use o package manager indicado pelo lockfile:

```bash
pnpm install
pnpm test
pnpm build
```

## Tecnologias

- Next.js 16
- TypeScript
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- shadcn/ui
