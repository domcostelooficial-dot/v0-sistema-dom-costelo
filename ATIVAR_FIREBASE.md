# 🔥 Como Ativar o Firebase

## Status Atual
✅ Firebase instalado
✅ Variáveis de ambiente configuradas
✅ Sistema compilando sem erros

## Você está usando: localStorage (funciona offline)

Para mudar para Firebase (dados na nuvem), siga os passos abaixo:

---

## 🚀 Ativar Firebase em 2 Passos

### Passo 1: Configure o Projeto Firebase

1. Acesse: https://console.firebase.google.com/
2. Clique em **"Adicionar projeto"**
3. Nome do projeto: `dom-costelo` (ou outro nome)
4. **Desabilite** Google Analytics (não é necessário)
5. Clique em **"Criar projeto"**

### Passo 2: Configure Authentication e Firestore

**2.1 - Authentication (Login)**
1. No menu lateral, clique em **"Authentication"**
2. Clique em **"Vamos começar"**
3. Escolha **"E-mail/senha"**
4. **Ative** a primeira opção (E-mail/senha)
5. Clique em **"Salvar"**

**2.2 - Firestore Database**
1. No menu lateral, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha **"Iniciar no modo de teste"** (ou produção com as regras do arquivo `firestore.rules`)
4. Escolha a localização: **southamerica-east1** (São Paulo)
5. Clique em **"Ativar"**

**2.3 - Criar Primeiro Usuário Admin**
1. Volte em **"Authentication"**
2. Clique na aba **"Users"**
3. Clique em **"Adicionar usuário"**
4. Email: `admin@domcostelo.com` (ou outro)
5. Senha: `SuaSenhaSegura123`
6. Clique em **"Adicionar usuário"**

### Passo 3: Ativar no Código (v0)

Abra o arquivo `/app/page.tsx` e faça as seguintes alterações:

**Linha 16** - Trocar o import:
```typescript
// DE:
import { LoginForm } from "@/components/login-form"

// PARA:
import { FirebaseLoginForm } from "@/components/firebase-login-form"
```

**Linha 198** - Trocar o componente:
```typescript
// DE:
<LoginForm onLogin={handleLogin} />

// PARA:
<FirebaseLoginForm onLogin={handleLogin} />
```

### Passo 4: Testar

1. Recarregue a página
2. Faça login com o email e senha que criou no Firebase
3. Seus dados agora estão na nuvem!

---

## 🔄 Migrar Dados do localStorage para Firebase

Se você já tem dados no localStorage e quer migrar para Firebase:

1. Faça login no sistema (ainda com localStorage)
2. Anote os dados importantes do estoque
3. Ative o Firebase seguindo os passos acima
4. Faça login no Firebase
5. Recadastre os dados manualmente (ou use o painel de Admin)

---

## 📋 Regras de Segurança

As regras de segurança do Firestore estão no arquivo `/firestore.rules`.

Para aplicá-las:
1. No Firebase Console, vá em **Firestore Database**
2. Clique na aba **"Regras"**
3. Cole o conteúdo do arquivo `firestore.rules`
4. Clique em **"Publicar"**

---

## ❓ Dúvidas Comuns

**P: Posso voltar para localStorage depois?**
R: Sim! Basta reverter as alterações no `/app/page.tsx`.

**P: Os dados ficam sincronizados entre dispositivos?**
R: Sim! Com Firebase, você pode acessar de qualquer lugar.

**P: Precisa pagar pelo Firebase?**
R: O plano gratuito é suficiente para começar (50k leituras/dia, 20k escritas/dia).

**P: Como criar mais usuários?**
R: Após fazer login como admin, vá na aba "Administração" e crie novos usuários.

---

## 📞 Suporte

- [Documentação Completa](./FIREBASE_SETUP.md)
- [Guia Rápido](./INICIO_RAPIDO_FIREBASE.md)
