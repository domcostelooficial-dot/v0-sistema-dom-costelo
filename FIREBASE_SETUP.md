# Guia de Configuração Firebase - Sistema Dom Costelo

## Passo 1: Criar Projeto no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Nome do projeto: `dom-costelo-sistema`
4. Desabilite o Google Analytics (opcional)
5. Clique em "Criar projeto"

## Passo 2: Configurar Authentication

1. No menu lateral, clique em **Authentication**
2. Clique em "Começar"
3. Ative o método **Email/senha**
4. Clique em "Salvar"

## Passo 3: Criar Usuário Administrador Inicial

1. Ainda em **Authentication**, vá para a aba **Users**
2. Clique em "Adicionar usuário"
3. Email: `thiago@domcostelo.com` (ou seu email preferido)
4. Senha: `123456` (ou sua senha preferida)
5. Copie o **User UID** que foi gerado

## Passo 4: Configurar Firestore Database

1. No menu lateral, clique em **Firestore Database**
2. Clique em "Criar banco de dados"
3. Escolha **Iniciar no modo de produção**
4. Escolha a localização: `southamerica-east1` (São Paulo)
5. Clique em "Ativar"

## Passo 5: Criar Documento de Usuário Admin

1. Ainda no Firestore, clique em "Iniciar coleção"
2. ID da coleção: `usuarios`
3. ID do documento: cole o **User UID** copiado no passo 3
4. Adicione os campos:
   ```
   role: "admin"
   permissoes: ["estoque", "entrada", "producao", "financeiro", "dashboard", "lista-compras", "admin"]
   senha: "" (deixe vazio, não é usado)
   createdAt: (clique em timestamp e escolha "Now")
   ```
5. Clique em "Salvar"

## Passo 6: Aplicar Regras de Segurança

1. Em **Firestore Database**, vá para a aba **Regras**
2. Copie o conteúdo do arquivo `firestore.rules` deste projeto
3. Cole no editor de regras
4. Clique em "Publicar"

## Passo 7: Obter Credenciais do Firebase

1. No menu lateral, clique no ícone de engrenagem ⚙️ > **Configurações do projeto**
2. Role até "Seus aplicativos"
3. Clique no ícone **</>** (Web)
4. Nome do app: `Dom Costelo Sistema`
5. NÃO marque "Configurar Firebase Hosting"
6. Clique em "Registrar app"
7. Copie as credenciais do `firebaseConfig`

## Passo 8: Adicionar Variáveis de Ambiente no v0

No v0, clique em **Settings** (canto superior direito) > **Vars** e adicione:

```
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

## Passo 9: Ativar Firebase no Código

Edite o arquivo `/app/page.tsx` e troque:
```typescript
import { LoginForm } from "@/components/login-form"
```
Por:
```typescript
import { FirebaseLoginForm } from "@/components/firebase-login-form"
```

E também troque:
```typescript
<LoginForm onLogin={handleLogin} />
```
Por:
```typescript
<FirebaseLoginForm onLogin={handleLogin} />
```

## Passo 10: Testar o Sistema

1. Faça login com o email e senha do admin criado
2. O sistema agora usa Firebase para tudo!

## Passo 11: Deploy no Firebase Hosting (Opcional)

### Instalar Firebase CLI
```bash
npm install -g firebase-tools
```

### Login no Firebase
```bash
firebase login
```

### Inicializar projeto
```bash
firebase init hosting
```
- Escolha "Use an existing project"
- Selecione seu projeto
- Public directory: `out`
- Configure as a single-page app: `Yes`
- Set up automatic builds: `No`

### Build e Deploy
```bash
npm run build
firebase deploy --only hosting
```

Seu site estará disponível em: `https://seu-projeto.web.app`

## Criar Novos Usuários via Interface Admin

Após o primeiro login como admin:
1. Acesse a aba **Administração**
2. Vá para **Usuários**
3. Clique em "Adicionar Usuário"
4. Preencha email, senha, role e permissões
5. O sistema criará automaticamente a conta no Firebase Authentication e o perfil no Firestore

## Estrutura de Dados no Firestore

```
firestore/
├── usuarios/
│   └── {userId}/
│       ├── role: "admin" | "operador"
│       ├── permissoes: string[]
│       └── createdAt: timestamp
└── users/
    └── {userId}/
        ├── estoque/
        │   ├── itens: Item[]
        │   └── updatedAt: timestamp
        ├── historico/
        │   ├── entries: HistoricoEntry[]
        │   └── updatedAt: timestamp
        └── receitas/
            ├── receitas: Receita[]
            └── updatedAt: timestamp
```

## Notas Importantes

- Todos os dados são salvos automaticamente no Firestore
- Cada usuário tem seus próprios dados isolados
- Admins podem ver dados de todos os usuários
- As regras de segurança protegem os dados
- O Firebase Authentication gerencia login e sessões de forma segura
