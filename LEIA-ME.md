# Santana.com — Guia de Configuração

Este projeto usa **Firebase** (Authentication, Firestore e Storage) e é feito em
HTML/CSS/JS puro — não precisa de Node.js nem de build para rodar.

## 1. Ativar os serviços no Firebase Console

Acesse https://console.firebase.google.com/project/santanacom-e543e e, no menu
lateral em **Build**, ative cada um destes serviços (clique em "Get started" / "Vamos começar" em cada):

1. **Authentication**
   - Vá em "Sign-in method"
   - Ative o provedor **E-mail/senha**
   - Ative o provedor **Google**

2. **Firestore Database**
   - Crie o banco de dados (modo produção)
   - Escolha uma região (ex.: `southamerica-east1` para ficar mais perto do Brasil)

3. **Storage**
   - Ative o Storage (modo produção)

## 2. Publicar as regras de segurança

Os arquivos `firestore.rules` e `storage.rules` já estão prontos com as permissões
de cada cargo (Administrador, Editor, Colunista, Revisor). Para publicá-los:

**Opção simples (pelo navegador):**
- No Firestore: vá na aba "Regras", apague o conteúdo padrão e cole o conteúdo
  de `firestore.rules`. Clique em Publicar.
- No Storage: vá na aba "Regras", apague o conteúdo padrão e cole o conteúdo
  de `storage.rules`. Clique em Publicar.

**Opção avançada (linha de comando, opcional):**
```
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,storage:rules
```

## 3. Criar o primeiro Administrador (você e seu pai)

As regras de segurança não permitem que um usuário se autopromova a Administrador
pelo site — isso é proposital, por segurança. Então o primeiro Admin precisa ser
definido manualmente, direto no Firestore:

1. Acesse `cadastro.html` no site e crie sua conta normalmente (ou use "Criar conta com Google").
2. No Firebase Console, vá em **Firestore Database** → coleção `usuarios`.
3. Encontre o documento com seu e-mail.
4. Edite o campo `cargo` de `"pendente"` para `"administrador"`.
5. Repita para a conta do seu pai.

A partir daí, vocês dois já conseguem entrar em `admin/usuarios.html` e promover
qualquer pessoa nova (Editor, Colunista, Revisor) direto pela interface, sem
precisar tocar no Firestore manualmente de novo.

## 4. Hospedar o site (Firebase Hosting — opcional, mas recomendado)

```
firebase init hosting
firebase deploy --only hosting
```//
Aponte o diretório público para a raiz deste projeto. O Firebase vai te dar uma
URL gratuita do tipo `santanacom-e543e.web.app`.

## 5. Estrutura do projeto

```
├── index.html              → Página inicial (carrega notícias do Firestore)
├── noticia.html             → Página de notícia individual
├── categoria.html            → Lista de notícias por categoria
├── busca.html                → Resultado de pesquisa
├── login.html / cadastro.html / recuperar-senha.html
├── style.css / script.js     → Visual e comportamento do site público
├── css/auth.css              → Estilo das páginas de login/cadastro
├── css/admin.css             → Estilo do painel administrativo
├── js/firebase-config.js     → Conexão com seu projeto Firebase
├── js/auth.js                → Login, cadastro, cargos e proteção de páginas
├── js/noticias.js            → CRUD de notícias e fluxo de aprovação
├── firestore.rules           → Regras de permissão por cargo (banco de dados)
├── storage.rules             → Regras de permissão para upload de imagens
└── admin/
    ├── dashboard.html         → Painel inicial (conteúdo varia por cargo)
    ├── publicar.html          → Criar/editar notícia
    ├── gerenciar-noticias.html → Lista, aprova, devolve, publica, exclui
    ├── usuarios.html           → Definir cargo de cada pessoa (só Admin)
    └── configuracoes.html      → Logo, banner, redes sociais, categorias (só Admin)
```

## 6. Como funciona o fluxo de cargos

| Cargo | O que pode fazer |
|---|---|
| **Administrador** | Tudo: notícias, usuários, categorias, configurações do site |
| **Editor** | Criar, editar, aprovar e publicar qualquer notícia; organizar categorias |
| **Colunista** | Escrever e editar só os próprios artigos; enviar para revisão (não publica direto) |
| **Revisor** | Aprovar ou devolver notícias que estão "em revisão" (não escreve as próprias) |

Fluxo de uma notícia escrita por um Colunista:
`Rascunho → Enviada para revisão → Revisor aprova ou devolve → Editor/Admin publica`

Notícias escritas por Admin/Editor podem ser publicadas direto, sem passar por revisão.
