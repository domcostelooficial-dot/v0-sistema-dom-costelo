# Guia de Configuração Firebase — Dom Costelo PRO

## Authentication

Ative o provedor E-mail/senha no Firebase Authentication. O usuário principal é `admin@domcostelo.com` e já existe no Firebase Authentication. Preserve sua conta, UID, e-mail, role owner, status ativo e credencial atual. Nunca recrie ou redefina esse usuário durante setup, seed ou deploy.

A senha é gerenciada exclusivamente pelo Firebase Authentication e não é armazenada no projeto, no Firestore, no localStorage ou nesta documentação.

## Firestore

Crie o banco em modo de produção e publique `firestore.rules`. O documento oficial de perfil é `usuarios/{uid}` com `role`, `ativo`, `permissoes`, `email`, `uid`, `createdAt` e `updatedAt`.

A arquitetura de autorização é:

- Firebase Authentication: identidade, login e sessão.
- Firestore `usuarios/{uid}`: role, ativo e permissões.
- Roles válidas: `owner`, `admin` e `operador`.
- `settings/system.ownerUid`: identificação persistida do Responsável Principal.
- Fallback do owner: `admin@domcostelo.com`.

## Variáveis públicas do Firebase

Configure as variáveis `NEXT_PUBLIC_FIREBASE_*` do projeto. `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId` e `appId` são configurações públicas do Firebase Client SDK. Não adicione service accounts, private keys, tokens privados ou senhas.

## Fichas técnicas

Firestore é a única fonte oficial após a inicialização. `seedFichas` é executado apenas quando a coleção de fichas está vazia, registra `seedVersion` em `settings/system` e não sobrescreve documentos existentes nem cria duplicidades. Não existe `defaultFichasTecnicas` como fonte concorrente.

## Compatibilidade local

Estoque, histórico e receitas ainda têm rotinas híbridas Firebase + localStorage por compatibilidade. Essa migração não faz parte desta etapa. localStorage não decide login, owner, role, ativo ou permissões.

## Validação

```bash
pnpm install
pnpm test
pnpm build
```

As regras publicadas no Firebase Console devem corresponder ao arquivo `firestore.rules` deste projeto.
