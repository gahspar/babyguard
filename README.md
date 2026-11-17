# 🛡️ BabyGuard — Babá Eletrônica IP Privada

<p align="center">
  <img src="public/icons/icon-192.png" alt="BabyGuard" width="96" />
</p>

<p align="center">
  <strong>Sistema privado de babá eletrônica IP com transmissão P2P criptografada, detecção inteligente de choro e segurança de nível profissional.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/WebRTC-P2P-green" alt="WebRTC" />
  <img src="https://img.shields.io/badge/Supabase-Auth+RLS-purple" alt="Supabase" />
  <img src="https://img.shields.io/badge/PWA-Instalável-orange" alt="PWA" />
</p>

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Funcionalidades](#-funcionalidades)
- [Pré-Requisitos](#-pré-requisitos)
- [Instalação Local](#-instalação-local)
- [Configuração do Supabase](#-configuração-do-supabase)
- [Configuração de TURN (Opcional)](#-configuração-de-turn-opcional)
- [Deploy na Vercel](#-deploy-na-vercel)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Uso](#-uso)
- [Segurança](#-segurança)
- [Testes](#-testes)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Roteiro Futuro](#-roteiro-futuro)
- [Licença](#licença)

---

## 🎯 Visão Geral

O **BabyGuard** é uma aplicação web de babá eletrônica IP desenvolvida com foco absoluto em **privacidade** e **segurança**. O vídeo e áudio trafegam **diretamente entre seus dispositivos** via WebRTC (P2P com DTLS-SRTP), sem passar por servidores intermediários ou ser armazenado em qualquer lugar.

### Para quem é?
- Pais que precisam monitorar recém-nascidos com privacidade total
- Funciona com um **PC Windows + Webcam USB Logitech HD 720p** como transmissor
- **iPhone com Safari** como receptor/monitor
- Futuro suporte a Android com USB OTG

---

## 🏗 Arquitetura

```
┌─────────────────────┐         WebRTC P2P (DTLS-SRTP)        ┌──────────────────────┐
│   ESTAÇÃO DA CÂMERA │◄══════════════════════════════════════►│   MONITOR DO BEBÊ    │
│   (PC + Logitech)   │  Vídeo + Áudio Direto Criptografado   │   (iPhone Safari)    │
│                     │                                        │                      │
│  - Captura Webcam   │                                        │  - Vídeo ao Vivo     │
│  - Captura Áudio    │                                        │  - Alertas de Choro  │
│  - Detecção Choro   │                                        │  - Controles         │
│  - IA Local         │                                        │  - Wake Lock         │
└────────┬────────────┘                                        └──────────┬───────────┘
         │  Sinalização (SDP/ICE)                                         │
         │  via Supabase Realtime                                         │
         │  (somente metadados, ZERO mídia)                               │
         ▼                                                                ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                        SUPABASE (Backend)                              │
    │                                                                        │
    │  Auth (Login, Registro, Sessões)                                       │
    │  PostgreSQL + RLS (Dispositivos, Pareamento, Eventos)                  │
    │  Realtime (Sinalização WebRTC, Alertas de Choro)                       │
    │                                                                        │
    │  ⚠️ NUNCA armazena vídeo ou áudio                                      │
    └─────────────────────────────────────────────────────────────────────────┘
         ▲
         │  Hosting (SSR + API Routes)
         │
    ┌────┴──────────┐
    │    VERCEL      │
    │  Next.js 14    │
    │  (Frontend +   │
    │   API Routes)  │
    └───────────────┘
```

---

## ✨ Funcionalidades

| Funcionalidade | Status |
|---|---|
| ✅ Login/Registro com Supabase Auth | Implementado |
| ✅ Proteção de rotas (Middleware + Layout) | Implementado |
| ✅ Row Level Security (RLS) completo | Implementado |
| ✅ Headers de segurança (CSP, HSTS, etc.) | Implementado |
| ✅ Captura de webcam USB (prioridade Logitech) | Implementado |
| ✅ Seleção de câmera e microfone | Implementado |
| ✅ Preview local com VU-meter de áudio | Implementado |
| ✅ Transmissão WebRTC P2P (DTLS-SRTP) | Implementado |
| ✅ Sinalização via Supabase Realtime | Implementado |
| ✅ Credenciais TURN efêmeras (HMAC-SHA1) | Implementado |
| ✅ Pareamento seguro com código criptográfico | Implementado |
| ✅ Gerenciamento e revogação de dispositivos | Implementado |
| ✅ Detecção espectral de choro de bebê | Implementado |
| ✅ Alertas visuais e sonoros | Implementado |
| ✅ PWA instalável (manifest + Service Worker) | Implementado |
| ✅ Wake Lock para manter tela ligada (iPhone) | Implementado |
| ✅ Interface mobile-first otimizada para Safari | Implementado |
| ✅ Configurações de sensibilidade e qualidade | Implementado |
| ✅ Testes automatizados (9 arquivos, 30+ testes) | Implementado |

---

## 📦 Pré-Requisitos

- **Node.js** ≥ 18.17 (recomendado v20 LTS)
- **npm** ≥ 9
- **Conta no [Supabase](https://supabase.com)** (plano gratuito funciona)
- **Conta na [Vercel](https://vercel.com)** (para deploy)
- **Webcam USB** (testado com Logitech HD 720p)
- **iPhone com Safari** (para monitoramento)

---

## 🚀 Instalação Local

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/babyguard.git
cd babyguard

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase (veja seção abaixo)

# 4. Rode em modo desenvolvimento
npm run dev

# 5. Acesse no navegador
# http://localhost:3000
```

---

## 🔧 Configuração do Supabase

### 1. Criar Projeto

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Clique em **"New Project"**
3. Escolha um nome (ex: `babyguard`)
4. Defina uma senha forte para o banco de dados
5. Selecione a região mais próxima (ex: `South America (São Paulo)`)

### 2. Obter Credenciais

1. No painel do projeto, vá em **Settings → API**
2. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (**⚠️ NÃO use prefixo NEXT_PUBLIC_!**)

### 3. Executar Migrations SQL

1. Vá em **SQL Editor** no painel do Supabase
2. Execute o arquivo `supabase/migrations/20261107000000_init_schema.sql` **primeiro**
3. Depois execute `supabase/migrations/20261107000001_security_rls.sql`

### 4. Habilitar Realtime

1. Vá em **Database → Replication**
2. Ative replicação para as tabelas:
   - `monitoring_sessions`
   - `connection_events`
3. (As migrations já tentam fazer isso automaticamente)

### 5. Configurar Auth

1. Vá em **Authentication → Settings**
2. Em **Site URL**, adicione `http://localhost:3000` (dev) e sua URL de produção
3. Em **Redirect URLs**, adicione:
   - `http://localhost:3000/callback`
   - `https://seu-dominio.vercel.app/callback`
4. Desative provedores que não usa (ex: GitHub, Google) se preferir apenas email/senha

---

## 🔄 Configuração de TURN (Opcional)

O WebRTC usa STUN (Google) por padrão para NAT traversal. TURN é necessário apenas quando ambos os dispositivos estão atrás de NATs simétricos ou firewalls corporativos.

### Opções gratuitas/baratas:

**Opção 1: Cloudflare Calls (Recomendado)**
```env
TURN_SERVER_URLS=turn:turn.cloudflare.com:3478,turns:turn.cloudflare.com:5349
TURN_SECRET_KEY=sua-chave-secreta-cloudflare
```

**Opção 2: Metered TURN**
```env
TURN_SERVER_URLS=turn:a.relay.metered.ca:80,turn:a.relay.metered.ca:443
TURN_USERNAME=seu-usuario
TURN_CREDENTIAL=sua-credencial
```

**Opção 3: CoTURN próprio (VPS)**
```env
TURN_SERVER_URLS=turn:seu-servidor.com:3478
TURN_SECRET_KEY=sua-chave-secreta
```

> **Nota:** Para uso doméstico na mesma rede Wi-Fi, TURN geralmente não é necessário. STUN é suficiente.

---

## ☁️ Deploy na Vercel

### 1. Preparar repositório

```bash
git init
git add .
git commit -m "BabyGuard v1.0.0 — Initial release"
git remote add origin https://github.com/seu-usuario/babyguard.git
git push -u origin main
```

### 2. Deploy

1. Acesse [vercel.com](https://vercel.com) e importe o repositório
2. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TURN_SERVER_URLS` (se usar TURN)
   - `TURN_SECRET_KEY` (se usar TURN com HMAC)
3. Clique em **Deploy**

### 3. Pós-deploy

1. Adicione a URL da Vercel nas **Redirect URLs** do Supabase Auth
2. Atualize o **Site URL** no Supabase para a URL de produção

---

## 🔐 Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Chave pública anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ Servidor | Chave de serviço (**NUNCA no frontend**) |
| `NEXTAUTH_URL` | ✅ | URL base da aplicação |
| `TURN_SERVER_URLS` | ❌ | URLs do servidor TURN (separadas por vírgula) |
| `TURN_SECRET_KEY` | ❌ | Secret para credenciais HMAC-SHA1 efêmeras |
| `TURN_USERNAME` | ❌ | Usuário TURN estático (fallback) |
| `TURN_CREDENTIAL` | ❌ | Senha TURN estática (fallback) |
| `NEXT_PUBLIC_APP_URL` | ❌ | URL pública da aplicação |

---

## 📱 Uso

### 1. Criar Conta

Acesse a aplicação e clique em **"Cadastrar Conta do Proprietário"**. Use um email válido e senha com 8+ caracteres.

### 2. Configurar Estação da Câmera (PC Windows)

1. Conecte a Webcam Logitech USB ao PC
2. Acesse a aplicação no navegador (Chrome recomendado)
3. Faça login → vá em **"Estação da Câmera"**
4. Permita acesso à câmera e microfone quando solicitado
5. A webcam Logitech será detectada e selecionada automaticamente
6. Clique em **"Iniciar Câmera e Microfone"**

### 3. Monitorar no iPhone

1. Abra Safari no iPhone
2. Acesse a aplicação e faça login
3. Vá em **"Monitor do Bebê"**
4. O vídeo ao vivo será exibido assim que a conexão P2P for estabelecida

### 4. Instalar como PWA

- **iPhone:** Safari → Compartilhar → "Adicionar à Tela de Início"
- **Android/PC:** Chrome → Menu → "Instalar aplicativo"

---

## 🔒 Segurança

### Modelo de Segurança

| Camada | Proteção |
|---|---|
| **Autenticação** | Supabase Auth com sessões protegidas |
| **Autorização** | RLS em todas as tabelas — owner-only |
| **Transmissão** | WebRTC DTLS-SRTP — criptografia ponto-a-ponto |
| **Pareamento** | Código criptográfico de uso único, expiração 5 min |
| **Credenciais TURN** | HMAC-SHA1 efêmeras (24h), nunca no código |
| **Headers** | CSP, HSTS, X-Frame-Options, Permissions-Policy |
| **Armazenamento** | ZERO mídia armazenada em qualquer lugar |
| **Rate Limiting** | Proteção contra brute force em login e pareamento |

### Garantias

- ❌ Nenhum vídeo ou áudio é gravado ou armazenado
- ❌ Nenhuma mídia passa por servidores (exceto TURN quando necessário)
- ❌ Nenhuma credencial privada é exposta no frontend
- ❌ Nenhuma URL pública permite acesso à câmera
- ✅ Toda conexão exige autenticação e autorização
- ✅ Dispositivos podem ser revogados a qualquer momento
- ✅ Sessões expiram e são encerradas no logout

---

## 🧪 Testes

```bash
# Executar todos os testes
npm run test

# Executar com watch mode
npm run test:watch

# Type checking
npx tsc --noEmit

# Build de produção
npm run build
```

### Cobertura de Testes

| Arquivo | Área |
|---|---|
| `security-rules.test.ts` | Proteção de rotas, chaves seguras |
| `security-advanced.test.ts` | Isolamento RLS, expiração, brute force, TURN |
| `pairing-crypto.test.ts` | Geração e hash de códigos criptográficos |
| `rate-limiter.test.ts` | Proteção contra ataques de força bruta |
| `media-capture.test.ts` | Abstração de câmera e compatibilidade |
| `device-pairing.test.ts` | Fluxo completo de pareamento |
| `webrtc-transmission.test.ts` | STUN/TURN, sinalização, qualidade |
| `cry-detector.test.ts` | Análise espectral e estados de choro |
| `notifications.test.ts` | Alarmes sonoros e notificações |

---

## 📁 Estrutura do Projeto

```
babyguard/
├── public/
│   ├── icons/                  # Ícones PWA
│   ├── manifest.json           # Manifest PWA
│   └── sw.js                   # Service Worker
├── src/
│   ├── app/
│   │   ├── (auth)/             # Login, registro, recuperação de senha
│   │   ├── (dashboard)/        # Dashboard, estação, monitor, dispositivos, configurações
│   │   ├── api/
│   │   │   ├── devices/        # API pareamento e revogação
│   │   │   └── webrtc/         # API credenciais TURN
│   │   └── layout.tsx          # Layout raiz com PWA
│   ├── components/
│   │   ├── layout/             # Header, Nav
│   │   ├── monitor/            # VideoPlayer
│   │   ├── notifications/      # NotificationBanner
│   │   ├── station/            # CameraPreview, DeviceSelector, AudioTester, etc.
│   │   └── ui/                 # Button, Card, Input, Badge, Modal
│   ├── hooks/
│   │   ├── use-audio-meter.ts
│   │   ├── use-camera-station.ts
│   │   ├── use-cry-detector.ts
│   │   ├── use-wake-lock.ts
│   │   └── use-webrtc-stream.ts
│   ├── lib/
│   │   ├── ai/                 # Detecção espectral de choro
│   │   ├── media/              # Abstração de captura de mídia
│   │   ├── notifications/      # Manager de notificações e alarmes
│   │   ├── security/           # Crypto de pareamento e rate limiter
│   │   ├── supabase/           # Cliente, servidor e middleware
│   │   ├── webrtc/             # Peer connection, sinalização, ICE
│   │   └── utils.ts
│   ├── test/                   # 9 arquivos de testes
│   ├── types/                  # Tipos TypeScript (database, device, webrtc)
│   └── middleware.ts           # Proteção de rotas
├── supabase/
│   └── migrations/             # SQL: schema + RLS policies
├── .env.example                # Template de variáveis
├── .eslintrc.json
├── .gitignore
├── next.config.mjs             # Security headers + CSP
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

## 🗺 Roteiro Futuro

- [ ] Visão noturna (filtros CSS + processamento de imagem)
- [ ] Áudio bidirecional (falar com o bebê pelo monitor)
- [ ] Suporte Android USB OTG (provider já preparado)
- [ ] TensorFlow.js para detecção de choro com modelo ML treinado
- [ ] Histórico de eventos com gráficos (dashboard avançado)
- [ ] Múltiplas câmeras simultâneas
- [ ] Gravação local opcional (IndexedDB, sem nuvem)
- [ ] Notificações push nativas com VAPID keys

---

## Licença

Projeto privado. Uso pessoal. Todos os direitos reservados.
