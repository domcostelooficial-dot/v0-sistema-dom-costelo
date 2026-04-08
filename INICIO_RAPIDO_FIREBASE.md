# 🚀 Início Rápido - Firebase

## ⚡ Configuração em 5 Minutos

### 1️⃣ Criar Projeto Firebase
- Acesse: https://console.firebase.google.com/
- Clique em "Adicionar projeto"
- Nome: `dom-costelo`
- Clique em "Criar projeto"

### 2️⃣ Ativar Authentication
- Menu lateral > **Authentication** > Começar
- Ative **Email/senha**
- Salvar

### 3️⃣ Criar Primeiro Admin
- Em Authentication > Users > **Adicionar usuário**
- Email: `admin@domcostelo.com`
- Senha: `Admin123!`
- **COPIE O UID** que aparece (ex: `abc123def456`)

### 4️⃣ Ativar Firestore
- Menu lateral > **Firestore Database** > Criar banco de dados
- Modo: **Produção**
- Local: `southamerica-east1` (São Paulo)
- Ativar

### 5️⃣ Criar Perfil do Admin
- No Firestore, clique em **Iniciar coleção**
- ID da coleção: `usuarios`
- ID do documento: **cole o UID copiado**
- Adicionar campos:
  - `role` (string): `admin`
  - `permissoes` (array): adicione cada item abaixo como string:
    - `estoque`
    - `entrada`
    - `producao`
    - `financeiro`
    - `dashboard`
    - `lista-compras`
    - `admin`
- Salvar

### 6️⃣ Pegar Credenciais
- Engrenagem ⚙️ > **Configurações do projeto**
- Role até "Seus aplicativos"
- Clique em **</>** (Web)
- Nome: `Dom Costelo`
- Registrar app
- **COPIE as credenciais**

### 7️⃣ Adicionar no v0
No v0, clique em **Settings** (canto superior direito) > **Vars**:

```
NEXT_PUBLIC_FIREBASE_API_KEY=cole_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456:web:abc123
```

### 8️⃣ Ativar Regras de Segurança
- Firestore > **Regras**
- Cole isso e clique em **Publicar**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /usuarios/{userId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
      allow read: if isAuthenticated() && request.auth.uid == userId;
    }
    
    match /users/{userId}/{document=**} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
      allow read: if isAdmin();
    }
  }
}
```

## ✅ Pronto! Agora:

1. Faça login com `admin@domcostelo.com` e senha `Admin123!`
2. Todos os dados serão salvos na nuvem automaticamente
3. Crie novos usuários pela aba **Administração**

## 📱 Para Publicar Online

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar
firebase init hosting

# Build
npm run build

# Deploy
firebase deploy --only hosting
```

Seu site ficará em: `https://seu-projeto.web.app`
