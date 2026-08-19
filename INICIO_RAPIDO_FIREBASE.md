# Início Rápido — Firebase

## 1. Authentication

No Firebase Console, ative o provedor **E-mail/senha**.

O Responsável Principal do Dom Costelo PRO é `admin@domcostelo.com`. A credencial é administrada exclusivamente pelo Firebase Authentication e não é armazenada neste projeto ou nesta documentação.

Não crie, recrie, redefina, desative ou substitua essa conta durante a configuração.

## 2. Firestore

Crie o banco em modo de produção e publique as regras do arquivo `firestore.rules`.

O perfil oficial fica em `usuarios/{uid}` e deve conter, conforme a arquitetura atual:

- `role`: `owner`, `admin` ou `operador`
- `ativo`: booleano
- `permissoes`: array de permissões
- `email`, `uid`, `createdAt` e `updatedAt`

O login é responsabilidade do Firebase Authentication. Role, status de acesso e permissões são responsabilidade do Firestore.

## 3. Configuração pública do Firebase

As configurações client-side podem ser fornecidas pelas variáveis de ambiente `NEXT_PUBLIC_FIREBASE_*`. `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId` e `appId` são configurações públicas do Firebase Client SDK; não substitua essas variáveis por chaves privadas ou credenciais de service account.

## 4. Fichas técnicas

O Firestore é a fonte oficial das fichas técnicas. `seedFichas` só é executado de forma controlada quando a coleção estiver vazia. Fichas já existentes, preços, quantidades e ingredientes nunca são sobrescritos pelo seed.

## 5. Regras

1. Abra Firestore > Regras.
2. Cole o conteúdo de `firestore.rules`.
3. Publique.

As regras mantêm `owner`, `admin`, `operador`, a coleção `/compras` e deny-by-default. O fallback do owner é `admin@domcostelo.com`, sem armazenar senha no código.

## 6. Dados legados

Estoque, histórico e receitas ainda possuem rotinas híbridas por compatibilidade. Essa migração será tratada separadamente. `localStorage` não determina login, role, ativo, permissões ou owner.

## 7. Desenvolvimento e validação

Use o gerenciador indicado pelo lockfile do projeto:

```bash
pnpm install
pnpm test
pnpm build
```

As credenciais são administradas exclusivamente pelo Firebase Authentication e não são armazenadas no código, no Firestore ou no localStorage.
