# 🍖 Sistema Dom Costelo

Sistema completo de gestão de estoque, produção e financeiro para restaurantes.

## 🎯 Funcionalidades

- ✅ **Controle de Estoque** - Gerenciamento completo com alertas de estoque mínimo
- ✅ **Entrada de Mercadorias** - Registro de compras com histórico
- ✅ **Produção** - Transformação de ingredientes em produtos acabados
- ✅ **Financeiro** - Acompanhamento de gastos e custos
- ✅ **Dashboard** - Métricas e indicadores em tempo real
- ✅ **Lista de Compras** - Geração automática com cálculo de valores
- ✅ **Administração** - Gestão de usuários e permissões

## 🔐 Autenticação e Dados

Este sistema oferece **duas opções** de armazenamento:

### Opção 1: localStorage (Atual - Funciona offline)
✅ **Já está ativo e funcionando**
- Dados salvos localmente no navegador
- Funciona offline
- Não precisa configurar nada
- Login: `thiago` / Senha: `123`

### Opção 2: Firebase (Nuvem - Dados sincronizados)
📋 **Precisa configurar** (leva 5 minutos)
- Dados salvos na nuvem
- Acesso de qualquer lugar
- Backup automático
- Sincronização em tempo real

**[📖 Ver guia rápido de configuração Firebase](./INICIO_RAPIDO_FIREBASE.md)**

## 🚀 Como Usar

### Com localStorage (padrão)
1. Faça login com usuário `thiago` e senha `123`
2. Comece a usar o sistema normalmente

### Com Firebase (após configurar)
1. Siga o **[Guia Rápido Firebase](./INICIO_RAPIDO_FIREBASE.md)**
2. Adicione as variáveis de ambiente
3. Edite `/app/page.tsx`:
   - Linha 16: Troque `LoginForm` por `FirebaseLoginForm`
   - Linha 198: Troque `<LoginForm` por `<FirebaseLoginForm`
4. Faça login com as credenciais criadas no Firebase

## Built with v0

This repository is linked to a [v0](https://v0.app) project.

[Continue working on v0 →](https://v0.app/chat/projects/prj_K4VRQUbdCybA8yVU7V7gLCWa1g7e)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## 📦 Tecnologias

- **Next.js 16** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Firebase** (opcional) - Autenticação e banco de dados
- **Firestore** (opcional) - Banco de dados NoSQL
- **Shadcn/ui** - Componentes UI

## 🔑 Usuários Padrão (localStorage)

| Usuário | Senha | Perfil    | Permissões |
|---------|-------|-----------|------------|
| thiago  | 123   | Admin     | Todas      |
| debora  | 456   | Operador  | Sem Admin  |
| marcos  | 789   | Operador  | Sem Admin  |

## 🌐 Deploy

### Vercel (Recomendado para localStorage)
```bash
vercel deploy
```

### Firebase Hosting (Recomendado se usar Firebase)
```bash
npm run build
firebase deploy --only hosting
```

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
- [Firebase Documentation](https://firebase.google.com/docs) - learn about Firebase services.

<a href="https://v0.app/chat/api/kiro/clone/domcostelooficial-dot/v0-sistema-dom-costelo" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
