# 📚 SOUARTISTA - DOCUMENTAÇÃO COMPLETA

> **Versão:** 2.0  
> **Última atualização:** Janeiro 2025  
> **Autor:** Equipe SouArtista  
> **Linhas de código:** 50.000+

---

## 📋 ÍNDICE

1. [Visão Geral da Plataforma](#1-visão-geral-da-plataforma)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Sistema de Autenticação](#4-sistema-de-autenticação)
5. [Sistema de Roles e Permissões](#5-sistema-de-roles-e-permissões)
6. [Banco de Dados Completo](#6-banco-de-dados-completo)
7. [Edge Functions](#7-edge-functions)
8. [Sistema de Pagamentos](#8-sistema-de-pagamentos)
9. [Sistema de Indicações (Referral)](#9-sistema-de-indicações-referral)
10. [Push Notifications](#10-push-notifications)
11. [Sistema de Suporte](#11-sistema-de-suporte)
12. [Painel Administrativo](#12-painel-administrativo)
13. [Modo Demo](#13-modo-demo)
14. [Recursos por Role](#14-recursos-por-role)
15. [Hooks Customizados](#15-hooks-customizados)
16. [Integrações Externas](#16-integrações-externas)
17. [Sistema de Backup](#17-sistema-de-backup)
18. [Disaster Recovery](#18-disaster-recovery)
19. [Deploy e CI/CD](#19-deploy-e-cicd)
20. [Segurança](#20-segurança)
21. [Dados Brasileiros](#21-dados-brasileiros)
22. [Performance](#22-performance)
23. [Componentes UI](#23-componentes-ui)
24. [Fluxos de Usuário](#24-fluxos-de-usuário)
25. [Troubleshooting](#25-troubleshooting)

---

# 1. VISÃO GERAL DA PLATAFORMA

## 1.1 O que é o SouArtista?

O **SouArtista** é uma plataforma completa de gerenciamento financeiro e de carreira para profissionais da música no Brasil. Desenvolvida especificamente para atender às necessidades de artistas e músicos freelancers, a plataforma oferece ferramentas para:

- 📅 **Gerenciamento de Shows** - Cadastro completo de apresentações
- 💰 **Controle Financeiro** - Receitas, despesas e lucro líquido
- 👥 **Gestão de Equipe** - Músicos contratados e cachês
- 🚗 **Despesas de Locomoção** - Combustível, Uber, pedágios
- 📊 **Relatórios Detalhados** - Exportação para PDF e Excel
- 📱 **App Mobile Nativo** - iOS e Android

## 1.2 Público-Alvo

### Artistas (Bandas/Cantores)
Profissionais ou grupos que **contratam** músicos para suas apresentações. São responsáveis por:
- Negociar cachês com contratantes
- Contratar músicos freelancers
- Gerenciar a equipe e pagamentos
- Controlar custos operacionais

### Músicos (Freelancers)
Profissionais que **são contratados** por artistas/bandas para tocar em shows. Precisam:
- Registrar os shows que participam
- Controlar seus ganhos como freelancer
- Gerenciar despesas pessoais
- Acompanhar agenda de compromissos

## 1.3 Modelo de Negócio

### Planos de Assinatura

| Plano | Preço Web (BR) | Preço iOS | Benefícios |
|-------|----------------|-----------|------------|
| **Mensal** | R$ 29,90 | $4.99 (USD) | Acesso completo por 30 dias |
| **Anual** | R$ 300,00 | $49.99 (USD) | 12 meses + 2 meses grátis |

### Período de Trial
- **Cartão de Crédito:** 7 dias grátis, depois cobrança automática
- **PIX:** Sem trial, pagamento antecipado
- **iOS:** Gerenciado pela App Store (7 dias grátis)

### Taxas de Processamento
| Método | Taxa | Processador |
|--------|------|-------------|
| PIX | 1,99% | Asaas |
| Cartão de Crédito | 3,49% | Asaas |
| Apple Pay | 15% | Apple (Small Business) |

## 1.4 URLs da Plataforma

| Ambiente | URL |
|----------|-----|
| **Produção (Web)** | https://souartista.lovable.app |
| **Preview (Dev)** | https://id-preview--eeefb965-be39-4b04-94b6-0ec88e4c5a55.lovable.app |
| **App Store** | [Link iOS] |
| **Play Store** | [Link Android] |

---

# 2. ARQUITETURA TÉCNICA

## 2.1 Stack Frontend

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
├─────────────────────────────────────────────────────────────┤
│  React 18.3.1          │  Biblioteca UI principal           │
│  Vite                  │  Build tool e dev server           │
│  TypeScript            │  Tipagem estática                  │
│  Tailwind CSS          │  Estilização utility-first         │
│  shadcn/ui             │  Componentes (Radix UI + Tailwind) │
│  React Router DOM 6.30 │  Roteamento SPA                    │
│  TanStack Query 5.x    │  Gerenciamento de estado servidor  │
│  Recharts              │  Gráficos e visualizações          │
│  Lucide React          │  Ícones                            │
│  date-fns              │  Manipulação de datas              │
│  zod                   │  Validação de schemas              │
│  react-hook-form       │  Gerenciamento de formulários      │
└─────────────────────────────────────────────────────────────┘
```

## 2.2 Stack Backend (Lovable Cloud/Supabase)

```
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND                                 │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL            │  Banco de dados relacional         │
│  Supabase Auth         │  Autenticação                      │
│  Supabase Storage      │  Armazenamento de arquivos         │
│  Edge Functions (Deno) │  Lógica serverless (39 funções)    │
│  Row Level Security    │  Segurança a nível de linha        │
│  Realtime              │  Websockets para dados em tempo    │
└─────────────────────────────────────────────────────────────┘
```

## 2.3 Apps Nativos (Capacitor)

```
┌─────────────────────────────────────────────────────────────┐
│                  MOBILE (CAPACITOR)                          │
├─────────────────────────────────────────────────────────────┤
│  @capacitor/core       │  Core do Capacitor                 │
│  @capacitor/ios        │  Plugin iOS                        │
│  @capacitor/android    │  Plugin Android                    │
│  @capacitor/camera     │  Acesso à câmera                   │
│  @capacitor/push-notifications │  Push nativas             │
│  @capacitor-firebase/messaging │  FCM integration          │
│  @capawesome/capacitor-app-update │  Verificar updates     │
│  @capacitor-community/in-app-review │  Solicitar avaliação │
│  @revenuecat/purchases-capacitor │  In-App Purchases       │
└─────────────────────────────────────────────────────────────┘
```

## 2.4 Diagrama de Arquitetura

```
                                    ┌──────────────────┐
                                    │   App Store      │
                                    │   Play Store     │
                                    └────────┬─────────┘
                                             │
┌─────────────────┐                          │
│   Web Browser   │◄────────────────────────►│
└────────┬────────┘                          │
         │                          ┌────────▼─────────┐
         │                          │   Mobile App     │
         │                          │   (Capacitor)    │
         │                          └────────┬─────────┘
         │                                   │
         │         ┌─────────────────────────┼─────────────────────────┐
         │         │                         │                         │
         ▼         ▼                         ▼                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           REACT FRONTEND                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │   Pages    │  │ Components │  │   Hooks    │  │   Utils    │         │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘         │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE CLIENT                                   │
│                    src/integrations/supabase/client.ts                   │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   SUPABASE AUTH  │    │  SUPABASE DB     │    │ SUPABASE STORAGE │
│                  │    │  (PostgreSQL)    │    │                  │
│  - Email/Pass    │    │  - 35+ Tables    │    │  - profile-photos│
│  - OTP Verify    │    │  - RLS Policies  │    │  - attachments   │
│  - Session Mgmt  │    │  - Triggers      │    │                  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         EDGE FUNCTIONS (39)                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │   Payments      │  │  Notifications  │  │    Backup       │          │
│  │   - Asaas       │  │  - FCM Push     │  │  - Daily auto   │          │
│  │   - RevenueCat  │  │  - Email OTP    │  │  - 35+ tables   │          │
│  │   - Webhooks    │  │  - In-app       │  │  - Storage      │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│      ASAAS       │    │     FIREBASE     │    │   REVENUECAT     │
│  (Pagamentos BR) │    │   (FCM Push)     │    │   (iOS IAP)      │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

# 3. ESTRUTURA DE PASTAS

## 3.1 Visão Geral

```
souartista/
├── 📁 android/                    # Código nativo Android
│   └── app/src/main/
│       └── AndroidManifest.xml
├── 📁 ios/                        # Código nativo iOS
│   └── App/App/
│       └── Info.plist
├── 📁 public/                     # Assets estáticos
│   ├── favicon.ico
│   ├── logo.png
│   ├── placeholder.svg
│   └── robots.txt
├── 📁 resources/                  # Recursos nativos
│   ├── GoogleService-Info.plist  # Config Firebase iOS
│   ├── icon.png                  # Ícone do app
│   └── splash.png                # Splash screen
├── 📁 src/                        # Código fonte principal
│   ├── 📁 assets/                # Imagens/logos
│   ├── 📁 components/            # Componentes React
│   ├── 📁 data/                  # Dados estáticos
│   ├── 📁 hooks/                 # Hooks customizados
│   ├── 📁 integrations/          # Integrações externas
│   ├── 📁 lib/                   # Utilitários
│   ├── 📁 pages/                 # Páginas da aplicação
│   ├── 📁 providers/             # Context Providers
│   ├── App.tsx                   # Componente raiz
│   ├── index.css                 # Estilos globais
│   ├── main.tsx                  # Entry point
│   └── vite-env.d.ts             # Types do Vite
├── 📁 supabase/                   # Backend
│   ├── 📁 functions/             # Edge Functions (39)
│   ├── 📁 migrations/            # Migrações SQL
│   └── config.toml               # Config Supabase
├── .env                           # Variáveis de ambiente
├── capacitor.config.ts            # Config Capacitor
├── codemagic.yaml                 # CI/CD mobile
├── tailwind.config.ts             # Config Tailwind
├── vite.config.ts                 # Config Vite
└── 📄 Documentação
    ├── DISASTER-RECOVERY-COMPLETO.md
    ├── EMERGENCY-CHECKLIST.md
    ├── SECRETS-TEMPLATE.md
    └── WEBHOOKS-CONFIG.md
```

## 3.2 Páginas (`src/pages/`)

```
pages/
├── 📄 Landing.tsx          # Página inicial pública
├── 📄 Login.tsx            # Login com email/senha
├── 📄 Register.tsx         # Cadastro completo
├── 📄 VerifyEmail.tsx      # Verificação OTP
├── 📄 ResetPassword.tsx    # Recuperar senha
├── 📄 SelectRole.tsx       # Escolher: Artista ou Músico
├── 📄 CompleteProfile.tsx  # Completar dados do perfil
├── 📄 Subscribe.tsx        # Página de assinatura
├── 📄 AppHub.tsx           # Hub principal pós-login
├── 📄 Support.tsx          # Suporte (público)
├── 📄 Terms.tsx            # Termos de uso
├── 📄 Privacy.tsx          # Política de privacidade
├── 📄 Contador.tsx         # Contador público de usuários
├── 📄 ReferralRedirect.tsx # Redirecionamento de indicação
├── 📄 NotFound.tsx         # Página 404
├── 📄 Admin.tsx            # Painel administrativo
│
├── 📁 artist/              # Páginas do ARTISTA
│   ├── Dashboard.tsx       # Dashboard principal
│   ├── Shows.tsx           # CRUD de shows
│   ├── Calendar.tsx        # Calendário de apresentações
│   ├── Musicians.tsx       # Gerenciar músicos
│   ├── Venues.tsx          # Gerenciar locais
│   ├── Expenses.tsx        # Despesas gerais
│   ├── Transportation.tsx  # Despesas de locomoção
│   ├── Reports.tsx         # Relatórios financeiros
│   ├── Profile.tsx         # Perfil do usuário
│   ├── Settings.tsx        # Configurações
│   ├── Subscription.tsx    # Gerenciar assinatura
│   ├── Support.tsx         # Suporte in-app
│   ├── InvoiceSimulator.tsx# Simulador de NF
│   ├── Tutorial.tsx        # Tutorial do app
│   ├── Updates.tsx         # Notas de versão
│   ├── Terms.tsx           # Termos
│   └── Privacy.tsx         # Privacidade
│
├── 📁 musician/            # Páginas do MÚSICO
│   ├── Dashboard.tsx       # Dashboard principal
│   ├── Shows.tsx           # Shows que participou
│   ├── Calendar.tsx        # Calendário
│   ├── Artists.tsx         # Artistas que trabalha
│   ├── Expenses.tsx        # Despesas pessoais
│   ├── Transportation.tsx  # Locomoção
│   ├── Reports.tsx         # Relatórios
│   ├── Profile.tsx         # Perfil
│   ├── Settings.tsx        # Configurações
│   ├── Subscription.tsx    # Assinatura
│   ├── Support.tsx         # Suporte
│   ├── Tutorial.tsx        # Tutorial
│   ├── Updates.tsx         # Atualizações
│   ├── Terms.tsx           # Termos
│   └── Privacy.tsx         # Privacidade
│
└── 📁 demo/                # Modo demonstração
    ├── 📁 artist/          # Demo artista (10 páginas)
    └── 📁 musician/        # Demo músico (10 páginas)
```

## 3.3 Componentes (`src/components/`)

```
components/
├── 📁 ui/                    # Componentes shadcn/ui (50+)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── table.tsx
│   └── ... (47 mais)
│
├── 📁 admin/                 # Componentes do Admin
│   ├── AdminTOTPGate.tsx     # Gate de 2FA
│   ├── AdminTOTPSetup.tsx    # Setup do TOTP
│   ├── AdminTOTPVerification.tsx
│   ├── AnnouncementsTab.tsx  # Aba de anúncios
│   ├── AsaasTab.tsx          # Aba Asaas
│   ├── BackupGodTab.tsx      # Gerenciar backups
│   ├── DeletedUsersTab.tsx   # Usuários deletados
│   ├── RevenueCatTab.tsx     # Dados iOS
│   └── UserCounterTab.tsx    # Contador
│
├── 📄 Sidebars
│   ├── AdminSidebar.tsx      # Menu lateral admin
│   ├── ArtistSidebar.tsx     # Menu lateral artista
│   ├── MusicianSidebar.tsx   # Menu lateral músico
│   ├── DemoArtistSidebar.tsx # Menu demo artista
│   └── DemoMusicianSidebar.tsx
│
├── 📄 Navigation
│   ├── MobileBottomNav.tsx   # Navegação mobile
│   ├── DemoMobileBottomNav.tsx
│   ├── NavLink.tsx           # Link de navegação
│   ├── UserMenu.tsx          # Menu do usuário
│   └── DemoUserMenu.tsx
│
├── 📄 Notifications
│   ├── NotificationBell.tsx  # Sino de notificações
│   ├── NotificationItem.tsx  # Item de notificação
│   ├── GlobalAnnouncementModal.tsx
│   └── PushNotificationLogs.tsx
│
├── 📄 Forms
│   ├── CreditCardForm.tsx    # Formulário de cartão
│   ├── FeedbackForm.tsx      # Formulário de feedback
│   └── ImageEditor.tsx       # Editor de imagem/crop
│
├── 📄 Subscription
│   ├── PaymentHistory.tsx    # Histórico de pagamentos
│   └── ReferralProgress.tsx  # Progresso de indicações
│
├── 📄 Schedule
│   ├── WeeklySchedule.tsx    # Agenda semanal
│   ├── DemoWeeklySchedule.tsx
│   └── PeriodFilter.tsx      # Filtro de período
│
├── 📄 Support
│   ├── EscalatedTicketsTab.tsx
│   └── FeedbackHistory.tsx
│
├── 📄 Modals
│   ├── DemoLockedModal.tsx   # Modal demo bloqueado
│   ├── LgpdRequestModal.tsx  # Modal LGPD
│   ├── Onboarding.tsx        # Onboarding modal
│   └── ReturningUserModal.tsx
│
├── 📄 Banners
│   ├── DemoBanner.tsx        # Banner modo demo
│   ├── OfflineBanner.tsx     # Banner offline
│   └── UpdateBanner.tsx      # Banner de atualização
│
├── 📄 Core
│   ├── LoadingScreen.tsx     # Tela de loading
│   ├── ProtectedRoute.tsx    # Rota protegida
│   ├── RouteSelector.tsx     # Seletor de rota
│   └── SafeAreaWrapper.tsx   # Wrapper safe area
```

## 3.4 Hooks (`src/hooks/`)

```
hooks/
├── 📄 Autenticação
│   ├── useAuth.tsx           # Contexto auth completo
│   └── useAdmin.tsx          # Verificar se é admin
│
├── 📄 Dados
│   ├── useShows.tsx          # CRUD de shows
│   ├── useArtistStats.tsx    # Stats do artista
│   ├── useMusicianStats.tsx  # Stats do músico
│   ├── useMonthlyData.tsx    # Dados mensais
│   ├── useUpcomingShows.tsx  # Próximos shows
│   ├── useLocomotionData.tsx # Despesas locomoção
│   └── useReferrals.tsx      # Sistema indicação
│
├── 📄 Plataforma
│   ├── useNativePlatform.tsx # Detectar iOS/Android/Web
│   ├── usePushNotifications.tsx # Config FCM
│   ├── useAppUpdate.tsx      # Verificar atualização
│   ├── useAppleIAP.tsx       # Compras iOS
│   ├── useInAppReview.tsx    # Solicitar avaliação
│   ├── useCamera.tsx         # Acesso à câmera
│   ├── useOnlineStatus.tsx   # Status de conexão
│   ├── useTimezoneSync.tsx   # Sincronizar timezone
│   ├── useLastSeen.tsx       # Último acesso
│   └── usePixNotificationChecker.tsx
│
├── 📄 UI
│   ├── use-mobile.tsx        # Detectar mobile
│   ├── use-toast.ts          # Sistema de toasts
│   ├── useReportVisibility.tsx # Ocultar valores
│   ├── usePlanType.tsx       # Tipo de plano
│   ├── useSupport.tsx        # Sistema suporte
│   └── useInactivityTimer.tsx # Timer inatividade
```

## 3.5 Edge Functions (`supabase/functions/`)

```
functions/
├── 📁 _shared/                    # Código compartilhado
│   ├── fcm-sender.ts              # Envio FCM
│   └── timezone-utils.ts          # Utils de timezone
│
├── 📄 Pagamentos (11)
│   ├── create-asaas-subscription/ # Criar assinatura
│   ├── asaas-webhook/             # Webhook Asaas
│   ├── apple-subscription-webhook/# Webhook Apple
│   ├── verify-apple-receipt/      # Verificar recibo
│   ├── cancel-subscription/       # Cancelar
│   ├── check-expired-subscriptions/
│   ├── check-payment-status/
│   ├── get-pending-payment/
│   ├── sync-asaas-payments/
│   ├── sync-revenuecat-subscriptions/
│   └── send-subscription-reminders/
│
├── 📄 Notificações (11)
│   ├── send-push-notification/    # Enviar push FCM
│   ├── send-otp-email/            # Email OTP
│   ├── send-report-email/         # Relatório por email
│   ├── send-referral-notification/
│   ├── send-engagement-tips/
│   ├── send-marketing-notifications/
│   ├── send-pending-user-reminders/
│   ├── check-show-reminders/
│   ├── check-pix-notifications/
│   ├── create-notification/
│   └── test-push-notification/
│
├── 📄 Usuários (6)
│   ├── delete-account/            # Deletar conta
│   ├── cleanup-deleted-users/     # Limpar deletados
│   ├── create-support-user/       # Criar suporte
│   ├── support-manage-user/       # Gerenciar user
│   ├── verify-otp/                # Verificar OTP
│   └── validate-referrals/        # Validar indicações
│
├── 📄 Admin/Backup (6)
│   ├── database-backup/           # Backup diário
│   ├── backup-auth-users/         # Backup auth
│   ├── verify-backup-secrets/     # Verificar secrets
│   ├── admin-totp-setup/          # Setup TOTP
│   ├── admin-totp-verify/         # Verificar TOTP
│   └── admin-totp-status/         # Status TOTP
│
├── 📄 Outros (5)
│   ├── improve-text/              # IA melhorar texto
│   ├── import-firebase-shows/     # Importar shows
│   ├── get-asaas-subscriber/      # Dados Asaas
│   ├── get-revenuecat-subscriber/ # Dados RevenueCat
│   └── seed-test-account/         # Conta teste
```

---

# 4. SISTEMA DE AUTENTICAÇÃO

## 4.1 Fluxo de Registro

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE REGISTRO                            │
└─────────────────────────────────────────────────────────────────────┘

1. PÁGINA DE REGISTRO (/register)
   ┌────────────────────────────────────────┐
   │  Campos obrigatórios:                  │
   │  - Nome completo                       │
   │  - Email                               │
   │  - Senha (mín. 6 caracteres)           │
   │  - CPF (único, validado)               │
   │  - Telefone                            │
   │  - Data de nascimento                  │
   │  - Gênero                              │
   │  - Código de indicação (opcional)      │
   └────────────────────────────────────────┘
                    │
                    ▼
2. ENVIO DE OTP
   ┌────────────────────────────────────────┐
   │  Edge Function: send-otp-email         │
   │  - Gera código de 6 dígitos            │
   │  - Validade: 10 minutos                │
   │  - Envia via Resend                    │
   │  - Salva em tabela otp_codes           │
   └────────────────────────────────────────┘
                    │
                    ▼
3. VERIFICAÇÃO DE EMAIL (/verify-email)
   ┌────────────────────────────────────────┐
   │  Edge Function: verify-otp             │
   │  - Valida código OTP                   │
   │  - Cria usuário no auth.users          │
   │  - Trigger: handle_new_user            │
   │    → Cria perfil em profiles           │
   │  - Trigger: generate_referral_code     │
   │    → Gera código de indicação          │
   │  - Trigger: send_welcome_notification  │
   │    → Envia notificação de boas-vindas  │
   └────────────────────────────────────────┘
                    │
                    ▼
4. SELEÇÃO DE ROLE (/select-role)
   ┌────────────────────────────────────────┐
   │  Opções:                               │
   │  - 🎤 Sou Artista (artist)             │
   │  - 🎸 Sou Músico (musician)            │
   │                                        │
   │  Salva em: user_roles                  │
   └────────────────────────────────────────┘
                    │
                    ▼
5. VERIFICAÇÃO DE ASSINATURA
   ┌────────────────────────────────────────┐
   │  Se status_plano != 'active':          │
   │  → Redireciona para /subscribe         │
   │                                        │
   │  Se status_plano == 'active':          │
   │  → Redireciona para /app-hub           │
   └────────────────────────────────────────┘
```

## 4.2 Fluxo de Login

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE LOGIN                              │
└─────────────────────────────────────────────────────────────────────┘

1. PÁGINA DE LOGIN (/login)
   ┌────────────────────────────────────────┐
   │  - Email                               │
   │  - Senha                               │
   │  - Link "Esqueci minha senha"          │
   └────────────────────────────────────────┘
                    │
                    ▼
2. SUPABASE AUTH
   ┌────────────────────────────────────────┐
   │  supabase.auth.signInWithPassword()    │
   │  - Valida credenciais                  │
   │  - Retorna session                     │
   │  - Salva token em localStorage         │
   └────────────────────────────────────────┘
                    │
                    ▼
3. VERIFICAÇÕES PÓS-LOGIN
   ┌────────────────────────────────────────┐
   │  useAuth.tsx verifica:                 │
   │                                        │
   │  a) Tem role definido?                 │
   │     NÃO → /select-role                 │
   │                                        │
   │  b) Perfil completo?                   │
   │     NÃO → /complete-profile            │
   │                                        │
   │  c) Assinatura ativa?                  │
   │     NÃO → /subscribe                   │
   │                                        │
   │  TUDO OK → /app-hub                    │
   └────────────────────────────────────────┘
```

## 4.3 Recuperação de Senha

```
1. Usuário clica "Esqueci minha senha"
2. Digita email cadastrado
3. Supabase envia email com link mágico
4. Usuário clica no link
5. Redireciona para /reset-password
6. Usuário define nova senha
7. Redireciona para /login
```

## 4.4 Logout Completo

O processo de logout limpa TODOS os dados locais:

```typescript
// Em useAuth.tsx - função signOut()
const signOut = async () => {
  // 1. Limpa localStorage
  localStorage.removeItem('supabase.auth.token');
  localStorage.removeItem('currentUserRole');
  localStorage.removeItem('lastLoginEmail');
  // ... mais 10 itens

  // 2. Limpa sessionStorage
  sessionStorage.clear();

  // 3. Limpa IndexedDB (cache do TanStack Query)
  const databases = await indexedDB.databases();
  databases.forEach(db => indexedDB.deleteDatabase(db.name));

  // 4. Limpa cookies
  document.cookie.split(";").forEach(cookie => {
    document.cookie = cookie.replace(/^ +/, "")
      .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
  });

  // 5. Supabase signOut
  await supabase.auth.signOut();

  // 6. Redireciona
  window.location.href = '/login';
};
```

---

# 5. SISTEMA DE ROLES E PERMISSÕES

## 5.1 Roles Disponíveis

| Role | Descrição | Acesso |
|------|-----------|--------|
| `artist` | Artistas/Bandas | Dashboard artista, gerenciar músicos |
| `musician` | Músicos Freelancers | Dashboard músico, registrar shows |
| `support` | Funcionários de Suporte | Gerenciar tickets, visualizar usuários |
| `admin` | Administradores | Acesso total ao sistema |

## 5.2 Tabelas de Controle

### user_roles
```sql
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,  -- 'artist' | 'musician' | 'support'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);
```

### admin_users
```sql
CREATE TABLE public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 5.3 Funções SQL de Verificação

```sql
-- Verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = _user_id
  )
$$;

-- Verificar se é suporte
CREATE OR REPLACE FUNCTION public.is_support(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'support'
  )
$$;

-- Verificar role específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Obter role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;
```

## 5.4 Proteção de Rotas (Frontend)

```typescript
// ProtectedRoute.tsx
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, userRole, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/app-hub" replace />;
  }

  return children;
};

// Uso no App.tsx
<Route path="/artist/*" element={
  <ProtectedRoute requiredRole="artist">
    <ArtistLayout />
  </ProtectedRoute>
} />
```

## 5.5 Verificação Admin com TOTP

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FLUXO ADMIN COM 2FA                             │
└─────────────────────────────────────────────────────────────────────┘

1. Usuário acessa /admin
   │
   ▼
2. AdminTOTPGate verifica:
   ┌────────────────────────────────────┐
   │  a) É admin? (is_admin SQL)        │
   │     NÃO → Acesso negado            │
   │                                    │
   │  b) TOTP configurado?              │
   │     NÃO → AdminTOTPSetup           │
   │     (Mostra QR Code p/ config)     │
   │                                    │
   │  c) TOTP verificado na sessão?     │
   │     NÃO → AdminTOTPVerification    │
   │     (Pede código de 6 dígitos)     │
   │                                    │
   │  TUDO OK → Acesso ao painel        │
   └────────────────────────────────────┘
```

---

# 6. BANCO DE DADOS COMPLETO

## 6.1 Enums

```sql
-- Roles do sistema
CREATE TYPE public.app_role AS ENUM ('artist', 'musician', 'support');

-- Categorias de despesas
CREATE TYPE public.expense_category AS ENUM (
  'equipamento',    -- Instrumentos, equipamentos
  'acessorio',      -- Acessórios musicais
  'manutencao',     -- Reparos e manutenção
  'vestuario',      -- Roupas de palco
  'marketing',      -- Divulgação
  'formacao',       -- Cursos, aulas
  'software',       -- Apps, plugins
  'outros'          -- Diversos
);

-- Tipos de locomoção
CREATE TYPE public.expense_type AS ENUM (
  'uber',     -- Uber/99
  'km',       -- Carro próprio (por km)
  'van',      -- Van/transporte fretado
  'onibus',   -- Ônibus
  'aviao'     -- Avião
);
```

## 6.2 Tabelas Principais

### profiles (Perfis de Usuário)
```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY,                    -- Mesmo ID do auth.users
    email VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    cpf VARCHAR UNIQUE,                     -- CPF único
    phone VARCHAR,
    birth_date DATE,
    gender VARCHAR,                         -- 'M', 'F', 'O'
    photo_url TEXT,                         -- URL da foto
    plan_type VARCHAR,                      -- 'monthly', 'annual'
    status_plano VARCHAR DEFAULT 'pending', -- 'pending', 'active', 'canceled'
    plan_purchased_at TIMESTAMPTZ,
    fcm_token TEXT,                         -- Token push notification
    timezone VARCHAR DEFAULT 'America/Sao_Paulo',
    last_seen_at TIMESTAMPTZ,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### shows (Apresentações)
```sql
CREATE TABLE public.shows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid UUID REFERENCES profiles(id) NOT NULL,  -- Dono do show
    venue_name VARCHAR NOT NULL,                 -- Nome do local
    date_local DATE NOT NULL,                    -- Data do show
    time_local TIME NOT NULL,                    -- Horário
    duration_hours DECIMAL,                      -- Duração em horas
    fee DECIMAL DEFAULT 0,                       -- Cachê total
    is_private_event BOOLEAN DEFAULT FALSE,      -- Evento particular?
    team_musician_ids UUID[],                    -- IDs dos músicos (para músicos verem)
    expenses_team JSONB,                         -- Custos da equipe
    expenses_other JSONB,                        -- Outros custos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estrutura expenses_team:
-- [
--   {"musician_id": "uuid", "name": "João", "instrument": "Guitarra", "fee": 500},
--   {"musician_id": "uuid", "name": "Maria", "instrument": "Baixo", "fee": 400}
-- ]

-- Estrutura expenses_other:
-- [
--   {"description": "Som", "cost": 1000},
--   {"description": "Iluminação", "cost": 500}
-- ]
```

### musicians (Músicos - cadastrados por artistas)
```sql
CREATE TABLE public.musicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_uid UUID REFERENCES profiles(id) NOT NULL,  -- Artista dono
    name VARCHAR NOT NULL,
    instrument VARCHAR NOT NULL,
    default_fee DECIMAL DEFAULT 0,                    -- Cachê padrão
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### artists (Artistas - cadastrados por músicos)
```sql
CREATE TABLE public.artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_uid UUID REFERENCES profiles(id) NOT NULL,  -- Músico dono
    name VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### venues (Casas de Show - artistas)
```sql
CREATE TABLE public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_uid UUID REFERENCES profiles(id) NOT NULL,
    name VARCHAR NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### musician_venues (Locais - músicos)
```sql
CREATE TABLE public.musician_venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_uid UUID REFERENCES profiles(id) NOT NULL,
    name VARCHAR NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### musician_instruments (Instrumentos do Músico)
```sql
CREATE TABLE public.musician_instruments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_uid UUID REFERENCES profiles(id) NOT NULL,
    name VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 6.3 Tabelas de Despesas

### locomotion_expenses (Despesas de Locomoção)
```sql
CREATE TABLE public.locomotion_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid UUID REFERENCES profiles(id) NOT NULL,
    show_id UUID REFERENCES shows(id),            -- Vinculado a um show (opcional)
    type expense_type NOT NULL,                    -- uber, km, van, etc
    cost DECIMAL DEFAULT 0,
    distance_km DECIMAL,                           -- Distância percorrida
    vehicle_consumption DECIMAL,                   -- Consumo L/km
    price_per_liter DECIMAL,                       -- Preço do combustível
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### additional_expenses (Despesas Extras)
```sql
CREATE TABLE public.additional_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid UUID REFERENCES profiles(id) NOT NULL,
    show_id UUID REFERENCES shows(id),
    category expense_category NOT NULL,
    description VARCHAR NOT NULL,
    cost DECIMAL DEFAULT 0,
    expense_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 6.4 Tabelas de Assinatura

### subscriptions (Assinaturas)
```sql
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL UNIQUE,
    plan_type VARCHAR NOT NULL,                -- 'monthly', 'annual'
    amount DECIMAL NOT NULL,                   -- Valor
    status VARCHAR DEFAULT 'pending',          -- pending, active, canceled, expired
    payment_method VARCHAR,                    -- 'PIX', 'CREDIT_CARD'
    payment_platform VARCHAR,                  -- 'asaas', 'apple', 'revenuecat'
    next_due_date DATE,                        -- Próximo vencimento
    
    -- Asaas
    asaas_customer_id VARCHAR,
    asaas_subscription_id VARCHAR,
    
    -- Apple
    apple_original_transaction_id VARCHAR,
    apple_product_id VARCHAR,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### payment_history (Histórico de Pagamentos)
```sql
CREATE TABLE public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    subscription_id UUID REFERENCES subscriptions(id) NOT NULL,
    asaas_payment_id VARCHAR,
    amount DECIMAL NOT NULL,
    status VARCHAR NOT NULL,                   -- CONFIRMED, PENDING, OVERDUE
    payment_method VARCHAR,
    payment_date DATE NOT NULL,
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 6.5 Tabelas de Indicação

### referral_codes (Códigos de Indicação)
```sql
CREATE TABLE public.referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL UNIQUE,
    code VARCHAR(8) NOT NULL UNIQUE,           -- Código único de 8 chars
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### referrals (Indicações)
```sql
CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES profiles(id) NOT NULL,  -- Quem indicou
    referred_id UUID REFERENCES profiles(id) NOT NULL UNIQUE,  -- Quem foi indicado
    referred_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR DEFAULT 'pending',          -- pending, paid, expired
    validated_at TIMESTAMPTZ,
    validation_deadline TIMESTAMPTZ,           -- 30 dias para validar
    paid_at TIMESTAMPTZ,
    payment_platform VARCHAR,                  -- asaas, apple
    first_payment_id VARCHAR,
    extended_trial_granted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### referral_rewards (Recompensas de Indicação)
```sql
CREATE TABLE public.referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    reward_type VARCHAR DEFAULT 'days_added',
    days_added INT DEFAULT 30,
    referrals_count INT DEFAULT 5,
    original_next_due_date DATE,
    granted_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 6.6 Tabelas de Notificação

### notifications (Notificações In-App)
```sql
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,                              -- NULL = todos os usuários
    target_role VARCHAR,                       -- 'artist', 'musician', NULL = todos
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR,                              -- Link para ação
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### notification_reads (Leituras)
```sql
CREATE TABLE public.notification_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(id) NOT NULL,
    user_id UUID NOT NULL,
    read_at TIMESTAMPTZ DEFAULT NOW()
);
```

### notification_hidden (Ocultadas)
```sql
CREATE TABLE public.notification_hidden (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(id) NOT NULL,
    user_id UUID NOT NULL,
    hidden_at TIMESTAMPTZ DEFAULT NOW()
);
```

### push_notification_logs (Logs de Push)
```sql
CREATE TABLE public.push_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    notification_id UUID,
    title VARCHAR NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR NOT NULL,                   -- sent, failed
    platform VARCHAR,                          -- ios, android, web
    device_id VARCHAR,
    fcm_token_preview VARCHAR,                 -- Primeiros chars do token
    error_code VARCHAR,
    error_message TEXT,
    response_data JSONB,
    source VARCHAR,                            -- manual, scheduled, webhook
    sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 6.7 Tabelas de Suporte

### support_tickets (Tickets)
```sql
CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subject VARCHAR NOT NULL,
    message TEXT NOT NULL,
    attachment_url TEXT,
    priority VARCHAR DEFAULT 'medium',         -- low, medium, high
    status VARCHAR DEFAULT 'open',             -- open, in_progress, resolved, closed
    escalated_to_admin BOOLEAN DEFAULT FALSE,
    escalated_at TIMESTAMPTZ,
    escalated_by UUID,
    escalation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### support_responses (Respostas)
```sql
CREATE TABLE public.support_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id) NOT NULL,
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_feedback (Feedback/Sugestões)
```sql
CREATE TABLE public.user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR DEFAULT 'pending',          -- pending, reviewed, implemented
    admin_response TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### lgpd_requests (Solicitações LGPD)
```sql
CREATE TABLE public.lgpd_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_name VARCHAR NOT NULL,
    user_email VARCHAR NOT NULL,
    request_type VARCHAR NOT NULL,             -- 'data_export', 'data_deletion', 'data_correction'
    description TEXT,
    status VARCHAR DEFAULT 'pending',          -- pending, in_progress, completed
    admin_notes TEXT,
    handled_by UUID,
    handled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 6.8 Tabelas de Sistema

### admin_users (Administradores)
```sql
CREATE TABLE public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### admin_totp_secrets (Segredos TOTP)
```sql
CREATE TABLE public.admin_totp_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    totp_secret VARCHAR NOT NULL,              -- Secret em base32
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### admin_totp_attempts (Tentativas TOTP)
```sql
CREATE TABLE public.admin_totp_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    success BOOLEAN,
    attempted_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_devices (Dispositivos)
```sql
CREATE TABLE public.user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    device_id VARCHAR NOT NULL,
    platform VARCHAR NOT NULL,                 -- ios, android, web
    device_name VARCHAR,
    fcm_token VARCHAR,
    timezone VARCHAR,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### fcm_token_history (Histórico de Tokens)
```sql
CREATE TABLE public.fcm_token_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    device_id VARCHAR NOT NULL,
    platform VARCHAR NOT NULL,
    device_name VARCHAR,
    fcm_token VARCHAR NOT NULL,
    old_token VARCHAR,
    action VARCHAR NOT NULL,                   -- created, updated, deleted
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### otp_codes (Códigos OTP)
```sql
CREATE TABLE public.otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### system_announcements (Anúncios Globais)
```sql
CREATE TABLE public.system_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR DEFAULT 'info',               -- info, warning, error
    target_role VARCHAR,                       -- artist, musician, NULL = todos
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### announcement_dismissed (Anúncios Dispensados)
```sql
CREATE TABLE public.announcement_dismissed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID REFERENCES system_announcements(id) NOT NULL,
    user_id UUID NOT NULL,
    dismissed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### app_updates (Notas de Versão)
```sql
CREATE TABLE public.app_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    release_date DATE DEFAULT CURRENT_DATE,
    is_published BOOLEAN DEFAULT FALSE,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### deleted_users (Usuários Deletados - Soft Delete)
```sql
CREATE TABLE public.deleted_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_user_id UUID NOT NULL,
    email VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    cpf VARCHAR,
    phone VARCHAR,
    birth_date DATE,
    gender VARCHAR,
    photo_url TEXT,
    plan_type VARCHAR,
    status_plano VARCHAR,
    fcm_token TEXT,
    timezone VARCHAR,
    
    -- Dados relacionados (JSONB)
    user_roles JSONB,
    artists JSONB,
    musicians JSONB,
    venues JSONB,
    musician_venues JSONB,
    musician_instruments JSONB,
    shows JSONB,
    locomotion_expenses JSONB,
    subscriptions JSONB,
    referral_codes JSONB,
    referrals_as_referrer JSONB,
    referrals_as_referred JSONB,
    support_tickets JSONB,
    support_responses JSONB,
    
    -- Metadados
    deleted_by UUID NOT NULL,
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    scheduled_permanent_delete_at TIMESTAMPTZ NOT NULL,  -- +30 dias
    status VARCHAR DEFAULT 'pending_deletion',           -- pending_deletion, restored
    restored_at TIMESTAMPTZ,
    restored_by UUID,
    permanently_deleted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### backup_logs (Logs de Backup)
```sql
CREATE TABLE public.backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR DEFAULT 'started',          -- started, completed, failed
    tables_copied INT DEFAULT 0,
    records_copied INT DEFAULT 0,
    files_copied INT DEFAULT 0,
    duration_seconds DECIMAL,
    error_message TEXT,
    details JSONB,                             -- Detalhes por tabela
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 6.9 Tabelas de Logs

### show_notification_logs
```sql
CREATE TABLE public.show_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id UUID REFERENCES shows(id) NOT NULL,
    user_id UUID NOT NULL,
    notification_type VARCHAR NOT NULL,        -- 24h_before, 3h_before
    sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

### subscription_reminder_logs
```sql
CREATE TABLE public.subscription_reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) NOT NULL,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    reminder_type VARCHAR NOT NULL,            -- 7_days, due_today, overdue
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### pending_user_reminder_logs
```sql
CREATE TABLE public.pending_user_reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    reminder_type VARCHAR NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### engagement_tip_logs
```sql
CREATE TABLE public.engagement_tip_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    tip_id VARCHAR NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

### marketing_notification_logs
```sql
CREATE TABLE public.marketing_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    notification_type VARCHAR NOT NULL,
    message_id VARCHAR NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 6.10 Triggers

### handle_new_user
```sql
-- Cria perfil automaticamente quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, ...)
  VALUES (NEW.id, NEW.email, ...);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### generate_referral_code
```sql
-- Gera código de indicação único para novos usuários
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, UPPER(SUBSTRING(MD5(...) FROM 1 FOR 8)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_generate_code
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();
```

### send_welcome_notification
```sql
-- Envia notificação de boas-vindas
CREATE OR REPLACE FUNCTION public.send_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (title, message, user_id)
  VALUES ('Bem-vindo ao Sou Artista! 🎉', '...', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### update_updated_at
```sql
-- Atualiza campo updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### backup_fcm_token
```sql
-- Faz backup do token FCM quando alterado
CREATE OR REPLACE FUNCTION public.backup_fcm_token()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.fcm_token_history (user_id, fcm_token, action, ...)
  VALUES (NEW.user_id, NEW.fcm_token, 'updated', ...);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

# 7. EDGE FUNCTIONS

## 7.1 Estrutura de uma Edge Function

```typescript
// supabase/functions/nome-da-funcao/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Lógica da função
    const body = await req.json();
    // ...

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## 7.2 Funções de Pagamento

### create-asaas-subscription
**Propósito:** Criar assinatura no Asaas (PIX ou Cartão)

```typescript
// Entrada
{
  userId: string;
  planType: 'monthly' | 'annual';
  paymentMethod: 'PIX' | 'CREDIT_CARD';
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}

// Saída (PIX)
{
  success: true;
  subscriptionId: string;
  paymentId: string;
  pixQrCodeUrl: string;
  pixCopyPaste: string;
  dueDate: string;
}

// Saída (Cartão)
{
  success: true;
  subscriptionId: string;
  paymentId: string;
  status: 'PENDING' | 'CONFIRMED';
}
```

### asaas-webhook
**Propósito:** Processar eventos de pagamento do Asaas

```typescript
// Eventos tratados:
// - PAYMENT_CONFIRMED: Pagamento confirmado
// - PAYMENT_RECEIVED: Pagamento recebido (PIX)
// - PAYMENT_OVERDUE: Pagamento atrasado
// - SUBSCRIPTION_DELETED: Assinatura cancelada

// Ações:
// 1. Atualiza status da assinatura
// 2. Registra no payment_history
// 3. Atualiza status_plano do usuário
// 4. Envia notificação push
// 5. Valida indicações (se for primeiro pagamento)
```

### apple-subscription-webhook
**Propósito:** Processar eventos do RevenueCat (iOS)

```typescript
// Eventos tratados:
// - INITIAL_PURCHASE: Primeira compra
// - RENEWAL: Renovação
// - CANCELLATION: Cancelamento
// - EXPIRATION: Expiração

// Ações:
// - Atualiza subscription no banco
// - Atualiza status_plano
// - Processa indicações
```

### cancel-subscription
**Propósito:** Cancelar assinatura ativa

```typescript
// Entrada
{ userId: string }

// Ações:
// 1. Cancela no Asaas (se aplicável)
// 2. Atualiza status para 'canceled'
// 3. Mantém acesso até next_due_date
```

## 7.3 Funções de Notificação

### send-push-notification
**Propósito:** Enviar push notification via FCM

```typescript
// Entrada
{
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Processo:
// 1. Busca FCM token do usuário
// 2. Envia via Firebase Admin SDK
// 3. Registra em push_notification_logs
```

### send-otp-email
**Propósito:** Enviar código OTP por email

```typescript
// Entrada
{ email: string }

// Processo:
// 1. Gera código de 6 dígitos
// 2. Salva em otp_codes (válido por 10 min)
// 3. Envia email via Resend
```

### check-show-reminders
**Propósito:** Enviar lembretes de shows (cron job)

```typescript
// Executa: A cada hora
// Verifica shows nas próximas 24h e 3h
// Envia push se ainda não enviou (verifica show_notification_logs)
```

## 7.4 Funções de Usuário

### delete-account
**Propósito:** Soft delete de conta

```typescript
// Entrada
{ userId: string }

// Processo:
// 1. Copia todos os dados para deleted_users
// 2. Define scheduled_permanent_delete_at (+30 dias)
// 3. Remove dados das tabelas originais
// 4. NÃO remove do auth.users ainda
```

### cleanup-deleted-users
**Propósito:** Limpeza final de contas deletadas (cron job)

```typescript
// Executa: Diariamente
// Verifica deleted_users com scheduled_permanent_delete_at < NOW()
// Remove permanentemente do auth.users
// Marca permanently_deleted_at
```

## 7.5 Funções de Backup

### database-backup
**Propósito:** Backup diário automático

```typescript
// Executa: Diariamente às 3h (América/São_Paulo)
// 
// Processo:
// 1. Conecta ao projeto de backup
// 2. Para cada tabela (35+):
//    a. Deleta dados existentes no backup
//    b. Copia novos dados
//    c. Registra contagem
// 3. Copia arquivos do Storage
// 4. Registra em backup_logs

// Tabelas copiadas:
const tablesToBackup = [
  'profiles',
  'user_roles',
  'admin_users',
  'shows',
  'musicians',
  'artists',
  'venues',
  'locomotion_expenses',
  'additional_expenses',
  'subscriptions',
  'payment_history',
  'referral_codes',
  'referrals',
  'notifications',
  'support_tickets',
  // ... mais 20 tabelas
];
```

## 7.6 Secrets Necessárias

| Secret | Usado em | Descrição |
|--------|----------|-----------|
| `SUPABASE_URL` | Todas | URL do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | Todas | Chave admin |
| `ASAAS_API_KEY` | Pagamentos | API key Asaas |
| `ASAAS_WEBHOOK_TOKEN` | Webhook | Token verificação |
| `REVENUECAT_API_KEY` | iOS | API key RevenueCat |
| `REVENUECAT_WEBHOOK_AUTH_KEY` | Webhook | Token verificação |
| `FIREBASE_SERVICE_ACCOUNT` | Push | Credenciais Firebase |
| `RESEND_API_KEY` | Emails | API key Resend |
| `BACKUP_SUPABASE_URL` | Backup | URL projeto backup |
| `BACKUP_SUPABASE_SERVICE_ROLE_KEY` | Backup | Chave projeto backup |

---

# 8. SISTEMA DE PAGAMENTOS

## 8.1 Arquitetura de Pagamentos

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA DE PAGAMENTOS                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      WEB         │     │      iOS         │     │     Android      │
│   (Browser)      │     │   (App Store)    │     │   (Play Store)   │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      ASAAS       │     │   APPLE IAP      │     │      ASAAS       │
│                  │     │   (RevenueCat)   │     │                  │
│  - PIX           │     │                  │     │  - PIX           │
│  - Cartão        │     │  - Monthly $4.99 │     │  - Cartão        │
│                  │     │  - Annual $49.99 │     │                  │
│  Mensal R$29,90  │     │                  │     │  Anual R$300     │
│  Anual R$300     │     │                  │     │                  │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         WEBHOOKS                                      │
│                                                                       │
│  asaas-webhook/          apple-subscription-webhook/                 │
│                                                                       │
│  Eventos:                Eventos:                                    │
│  - PAYMENT_CONFIRMED     - INITIAL_PURCHASE                          │
│  - PAYMENT_RECEIVED      - RENEWAL                                   │
│  - PAYMENT_OVERDUE       - CANCELLATION                              │
│  - SUBSCRIPTION_DELETED  - EXPIRATION                                │
└────────────────────────────────────┬─────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        BANCO DE DADOS                                 │
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │
│  │  subscriptions  │  │ payment_history │  │    profiles     │       │
│  │                 │  │                 │  │                 │       │
│  │  status         │  │  amount         │  │  status_plano   │       │
│  │  plan_type      │  │  payment_date   │  │  plan_type      │       │
│  │  next_due_date  │  │  status         │  │                 │       │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘       │
└──────────────────────────────────────────────────────────────────────┘
```

## 8.2 Fluxo PIX

```
1. Usuário seleciona PIX
   │
   ▼
2. Frontend chama create-asaas-subscription
   │
   ▼
3. Edge Function:
   a. Cria/busca customer no Asaas
   b. Cria subscription com billingType: 'PIX'
   c. Retorna QR Code e código copia-cola
   │
   ▼
4. Frontend mostra QR Code
   │
   ▼
5. Usuário paga
   │
   ▼
6. Asaas envia webhook (PAYMENT_RECEIVED)
   │
   ▼
7. asaas-webhook:
   a. Atualiza subscription.status = 'active'
   b. Registra em payment_history
   c. Atualiza profiles.status_plano = 'active'
   d. Envia push: "Pagamento confirmado! 🎉"
   e. Valida indicação (se aplicável)
```

## 8.3 Fluxo Cartão de Crédito

```
1. Usuário preenche dados do cartão
   │
   ▼
2. Frontend chama create-asaas-subscription
   │
   ▼
3. Edge Function:
   a. Cria customer com dados do titular
   b. Cria subscription com:
      - billingType: 'CREDIT_CARD'
      - creditCard: dados tokenizados
      - nextDueDate: +7 dias (trial)
   │
   ▼
4. Asaas processa:
   - Trial: sem cobrança imediata
   - Após 7 dias: primeira cobrança automática
   │
   ▼
5. Webhook ao confirmar pagamento
```

## 8.4 Fluxo iOS (Apple IAP)

```
1. App detecta iOS nativo (useNativePlatform)
   │
   ▼
2. Mostra botões Apple Pay:
   - Mensal: $4.99
   - Anual: $49.99
   │
   ▼
3. useAppleIAP.purchaseMonthly() ou purchaseAnnual()
   │
   ▼
4. RevenueCat processa compra
   │
   ▼
5. RevenueCat envia webhook para apple-subscription-webhook
   │
   ▼
6. Edge Function:
   a. Valida autenticação do webhook
   b. Busca/cria subscription
   c. Atualiza status
   d. Processa indicação
```

## 8.5 Verificação de Assinatura

```typescript
// usePlanType.tsx
export const usePlanType = () => {
  const { userData } = useAuth();
  
  // Verifica status_plano do perfil
  const isActive = userData?.status_plano === 'active';
  const planType = userData?.plan_type; // 'monthly' ou 'annual'
  
  return { isActive, planType };
};

// Uso em componentes
const { isActive } = usePlanType();
if (!isActive) {
  return <Navigate to="/subscribe" />;
}
```

## 8.6 Preços e Conversões

| Mercado | Mensal | Anual | Economia |
|---------|--------|-------|----------|
| Brasil (Asaas) | R$ 29,90 | R$ 300,00 | ~16% |
| iOS (Apple) | $4.99 | $49.99 | ~17% |

---

# 9. SISTEMA DE INDICAÇÕES (REFERRAL)

## 9.1 Visão Geral

O sistema de indicações permite que usuários ganhem dias grátis ao indicar novos assinantes. A cada 5 indicações que resultam em pagamento, o usuário ganha +30 dias de assinatura.

## 9.2 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE INDICAÇÃO                               │
└─────────────────────────────────────────────────────────────────────┘

USUÁRIO A (Indicador)
┌────────────────────────────────────────────────────────────────────┐
│ 1. Acessa página de configurações                                  │
│ 2. Visualiza seu código único: "ABC12345"                          │
│ 3. Compartilha link: souartista.lovable.app/r/ABC12345             │
└────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
USUÁRIO B (Indicado)
┌────────────────────────────────────────────────────────────────────┐
│ 1. Acessa link de indicação                                        │
│ 2. ReferralRedirect.tsx salva código no localStorage               │
│ 3. Redireciona para /register                                      │
│ 4. Código é pré-preenchido no campo de indicação                   │
│ 5. Completa registro normalmente                                   │
└────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
REGISTRO NO BANCO
┌────────────────────────────────────────────────────────────────────┐
│ Tabela: referrals                                                  │
│ - referrer_id: UUID do Usuário A                                   │
│ - referred_id: UUID do Usuário B                                   │
│ - status: 'pending'                                                │
│ - validation_deadline: NOW() + 30 dias                             │
└────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
PAGAMENTO CONFIRMADO
┌────────────────────────────────────────────────────────────────────┐
│ Webhook (asaas ou apple) detecta primeiro pagamento                │
│                                                                    │
│ Edge Function: validate-referrals                                  │
│ 1. Busca referral do pagante                                       │
│ 2. Atualiza status: 'paid'                                         │
│ 3. Registra paid_at e first_payment_id                             │
│ 4. Conta indicações pagas do referrer                              │
│ 5. Se múltiplo de 5:                                               │
│    - Adiciona +30 dias em next_due_date                            │
│    - Registra em referral_rewards                                  │
│    - Envia notificação ao referrer                                 │
└────────────────────────────────────────────────────────────────────┘
```

## 9.3 Tabelas Envolvidas

### referral_codes
```sql
-- Gerado automaticamente pelo trigger generate_referral_code
user_id  | code
---------|----------
uuid-123 | ABC12345
uuid-456 | XYZ78901
```

### referrals
```sql
id | referrer_id | referred_id | status  | paid_at    | validation_deadline
---|-------------|-------------|---------|------------|--------------------
1  | uuid-123    | uuid-789    | pending | NULL       | 2025-02-18
2  | uuid-123    | uuid-012    | paid    | 2025-01-15 | 2025-02-10
```

### referral_rewards
```sql
id | user_id  | days_added | referrals_count | granted_at
---|----------|------------|-----------------|------------
1  | uuid-123 | 30         | 5               | 2025-01-20
2  | uuid-123 | 30         | 10              | 2025-02-15
```

## 9.4 Componente ReferralProgress

```tsx
// Mostra progresso das indicações
<ReferralProgress />

// Exibe:
// - Código do usuário para compartilhar
// - Quantas indicações pendentes
// - Quantas indicações pagas
// - Próxima recompensa (a cada 5)
// - Histórico de recompensas
```

## 9.5 Trial Estendido

Quando alguém é indicado e faz o primeiro pagamento, o indicador pode receber um trial estendido se ainda não tiver assinatura ativa:

```sql
-- Campo na tabela referrals
extended_trial_granted BOOLEAN DEFAULT FALSE

-- Lógica no validate-referrals
IF referrer não tem assinatura ativa AND extended_trial_granted = FALSE:
  - Cria subscription com 7 dias grátis
  - Marca extended_trial_granted = TRUE
```

---

# 10. PUSH NOTIFICATIONS

## 10.1 Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                   PUSH NOTIFICATIONS (FCM)                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐                              ┌──────────────────┐
│   iOS App        │                              │   Android App    │
│                  │                              │                  │
│  Capacitor       │                              │  Capacitor       │
│  FCM Plugin      │                              │  FCM Plugin      │
└────────┬─────────┘                              └────────┬─────────┘
         │                                                 │
         │              ┌─────────────────┐                │
         └──────────────►   FCM Token     ◄────────────────┘
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   SUPABASE      │
                        │                 │
                        │  user_devices   │
                        │  (fcm_token)    │
                        │                 │
                        │  profiles       │
                        │  (fcm_token)    │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ EDGE FUNCTIONS  │
                        │                 │
                        │ send-push-      │
                        │ notification    │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   FIREBASE      │
                        │   (FCM API)     │
                        │                 │
                        │ Service Account │
                        └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
            ┌─────────────┐           ┌─────────────┐
            │  APNs       │           │  FCM        │
            │  (Apple)    │           │  (Android)  │
            └─────────────┘           └─────────────┘
```

## 10.2 Configuração no App

### usePushNotifications.tsx
```typescript
export const usePushNotifications = () => {
  const { user } = useAuth();
  const { isNative } = useNativePlatform();

  useEffect(() => {
    if (!isNative || !user) return;

    const setupPush = async () => {
      // 1. Solicitar permissão
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== 'granted') return;

      // 2. Registrar no FCM
      await PushNotifications.register();

      // 3. Listener para receber token
      PushNotifications.addListener('registration', async (token) => {
        // 4. Salvar token no banco
        await supabase
          .from('profiles')
          .update({ fcm_token: token.value })
          .eq('id', user.id);

        // 5. Salvar em user_devices
        await supabase
          .from('user_devices')
          .upsert({
            user_id: user.id,
            device_id: deviceId,
            platform: platform,
            fcm_token: token.value,
          });
      });

      // 6. Listener para notificações recebidas
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received:', notification);
      });

      // 7. Listener para clique na notificação
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        // Navegar para link se existir
        if (action.notification.data?.link) {
          window.location.href = action.notification.data.link;
        }
      });
    };

    setupPush();
  }, [isNative, user]);
};
```

## 10.3 Enviando Notificações

### Edge Function: send-push-notification
```typescript
// Entrada
{
  userId: string;
  title: string;
  body: string;
  data?: { link?: string };
}

// Processo
async function sendPush(userId, title, body, data) {
  // 1. Buscar token do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('fcm_token')
    .eq('id', userId)
    .single();

  if (!profile?.fcm_token) {
    throw new Error('Token não encontrado');
  }

  // 2. Enviar via Firebase Admin SDK
  const message = {
    token: profile.fcm_token,
    notification: { title, body },
    data: data || {},
    android: {
      priority: 'high',
      notification: { sound: 'default' },
    },
    apns: {
      payload: {
        aps: { sound: 'default', badge: 1 },
      },
    },
  };

  const response = await admin.messaging().send(message);

  // 3. Registrar no log
  await supabase.from('push_notification_logs').insert({
    user_id: userId,
    title,
    body,
    status: 'sent',
    fcm_token_preview: profile.fcm_token.substring(0, 20),
  });

  return response;
}
```

## 10.4 Tipos de Notificações

| Tipo | Trigger | Título | Exemplo |
|------|---------|--------|---------|
| Lembrete 24h | Cron job | "📅 Show amanhã!" | "Você tem show no Bar do João às 21h" |
| Lembrete 3h | Cron job | "🎤 Show em 3 horas!" | "Prepare-se para o show no Clube XYZ" |
| Pagamento OK | Webhook | "✅ Pagamento confirmado!" | "Sua assinatura está ativa" |
| Pagamento Pendente | Cron job | "⏰ Pagamento pendente" | "Seu PIX vence hoje" |
| Indicação | Registro | "🎉 Nova indicação!" | "João usou seu código de indicação" |
| Indicação Paga | Webhook | "💰 Indicação validada!" | "Sua indicação resultou em pagamento" |
| Recompensa | Automático | "🎁 Você ganhou 30 dias!" | "5 indicações pagas = +30 dias grátis" |
| Boas-vindas | Registro | "👋 Bem-vindo!" | "Explore todas as funcionalidades" |
| Marketing | Admin | Variável | Promoções e novidades |

## 10.5 Cron Jobs de Notificação

| Função | Horário | Descrição |
|--------|---------|-----------|
| check-show-reminders | Cada hora | Lembretes de shows |
| send-subscription-reminders | 10h diário | Lembretes de pagamento |
| send-engagement-tips | 14h diário | Dicas de engajamento |
| send-pending-user-reminders | 11h diário | Lembrar usuários inativos |
| check-pix-notifications | Cada 30min | Verificar PIX pendente |

---

# 11. SISTEMA DE SUPORTE

## 11.1 Estrutura

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE SUPORTE                               │
└─────────────────────────────────────────────────────────────────────┘

USUÁRIO                          SUPORTE                         ADMIN
┌────────┐                    ┌────────────┐                 ┌────────┐
│ Abre   │                    │ Responde   │                 │ Escalado│
│ Ticket │────────────────────► Tickets    │─────────────────► Resolve │
└────────┘                    └────────────┘                 └────────┘
    │                              │                              │
    │  support_tickets             │  support_responses           │
    │  - status: open              │  - is_admin: false           │
    │  - priority: medium          │                              │
    │  - escalated: false          │                              │
    │                              │                              │
    └──────────────────────────────┴──────────────────────────────┘
```

## 11.2 Fluxo de Ticket

```
1. ABERTURA
   ┌────────────────────────────────────────┐
   │ Usuário acessa /artist/support         │
   │ ou /musician/support                   │
   │                                        │
   │ Preenche:                              │
   │ - Assunto                              │
   │ - Mensagem                             │
   │ - Anexo (opcional)                     │
   │ - Prioridade (low/medium/high)         │
   │                                        │
   │ Status inicial: 'open'                 │
   └────────────────────────────────────────┘
                    │
                    ▼
2. RESPOSTA DO SUPORTE
   ┌────────────────────────────────────────┐
   │ Funcionário de suporte acessa painel   │
   │ (role: 'support')                      │
   │                                        │
   │ Pode:                                  │
   │ - Responder ticket                     │
   │ - Mudar status                         │
   │ - Escalonar para admin                 │
   │                                        │
   │ Status: 'in_progress'                  │
   └────────────────────────────────────────┘
                    │
                    ▼
3. ESCALAÇÃO (se necessário)
   ┌────────────────────────────────────────┐
   │ Suporte clica "Escalonar para Admin"   │
   │                                        │
   │ Preenche:                              │
   │ - Motivo da escalação                  │
   │                                        │
   │ Campos atualizados:                    │
   │ - escalated_to_admin: true             │
   │ - escalated_at: NOW()                  │
   │ - escalated_by: user_id                │
   │ - escalation_reason: "..."             │
   └────────────────────────────────────────┘
                    │
                    ▼
4. RESOLUÇÃO
   ┌────────────────────────────────────────┐
   │ Admin ou Suporte marca como resolvido  │
   │                                        │
   │ Status: 'resolved'                     │
   │                                        │
   │ Usuário pode reabrir se necessário     │
   │                                        │
   │ Status final: 'closed'                 │
   └────────────────────────────────────────┘
```

## 11.3 Prioridades

| Prioridade | Cor | Tempo de Resposta |
|------------|-----|-------------------|
| `low` | Cinza | 72 horas |
| `medium` | Amarelo | 24 horas |
| `high` | Vermelho | 4 horas |

## 11.4 Status do Ticket

| Status | Descrição |
|--------|-----------|
| `open` | Recém criado, aguardando resposta |
| `in_progress` | Sendo analisado pelo suporte |
| `resolved` | Problema resolvido |
| `closed` | Encerrado definitivamente |

## 11.5 Funcionários de Suporte

### Criação via Edge Function
```typescript
// create-support-user
{
  email: string;
  password: string;
  name: string;
}

// Processo:
// 1. Cria usuário no auth.users
// 2. Cria perfil em profiles
// 3. Adiciona role 'support' em user_roles
```

### Permissões
- Visualizar todos os tickets
- Responder tickets
- Mudar status de tickets
- Escalonar para admin
- Visualizar perfis de usuários (somente leitura)
- **NÃO PODE:** Editar dados de usuários, acessar pagamentos

---

# 12. PAINEL ADMINISTRATIVO

## 12.1 Acesso

```
URL: /admin

Requisitos:
1. Estar logado
2. Ser admin (is_admin SQL function)
3. Ter TOTP configurado
4. Passar verificação TOTP
```

## 12.2 Abas Disponíveis

### 📊 Usuários
```
- Listar todos os usuários
- Buscar por nome, email, CPF
- Filtrar por status (ativo, pendente, cancelado)
- Ver detalhes do usuário
- Editar dados do usuário
- Ativar/cancelar assinatura manualmente
- Enviar notificação individual
- Excluir usuário (soft delete)
```

### 💰 Financeiro
```
- Receita total por período
- Receita por plataforma (Asaas, Apple)
- Quantidade de assinaturas ativas
- Taxa de conversão
- Gráfico de receita mensal
- Exportar relatório
```

### 🔔 Notificações
```
- Enviar notificação in-app
- Filtrar por role (artista/músico/todos)
- Histórico de notificações enviadas
```

### 📱 Push Mobile
```
- Enviar push notification
- Selecionar usuários ou todos
- Ver logs de envio
- Taxa de entrega
```

### 📞 Contatos
```
- Lista de WhatsApp dos usuários
- Filtrar por status de assinatura
- Exportar para CSV
```

### 🎫 Suporte
```
- Ver todos os tickets
- Filtrar por status/prioridade
- Responder como admin
- Ver tickets escalados
```

### 💬 Feedback
```
- Sugestões dos usuários
- Marcar como revisado
- Responder feedback
- Implementar sugestões
```

### 🔒 LGPD
```
- Solicitações de dados
- Solicitações de exclusão
- Marcar como atendido
- Adicionar notas
```

### 📝 Atualizações
```
- Criar nota de versão
- Editar existentes
- Publicar/despublicar
```

### 👷 Funcionários
```
- Criar funcionário de suporte
- Ver funcionários ativos
- Remover acesso
```

### 🔧 Backup God
```
- Ver status dos backups
- Executar backup manual
- Ver logs detalhados
- Verificar integridade
```

### 📊 RevenueCat
```
- Dados de assinantes iOS
- Receita por produto
- Churn rate
```

### 💳 Asaas
```
- Dados de assinantes
- Pagamentos recentes
- Inadimplência
```

### 📢 Anúncios
```
- Criar anúncio global
- Definir tipo (info/warning/error)
- Definir expiração
- Filtrar por role
```

### 📈 Contador
```
- Total de usuários
- Por role
- Por status
- Novos por período
```

## 12.3 Proteção TOTP

### Setup Inicial
```
1. Admin acessa /admin pela primeira vez
2. AdminTOTPGate verifica se tem secret
3. Não tem → Mostra AdminTOTPSetup
4. Gera secret aleatório
5. Mostra QR Code para escanear
6. Usuário escaneia com Google Authenticator/Authy
7. Digita código de verificação
8. Secret é salvo como verificado
```

### Verificação
```
1. Admin acessa /admin
2. Já tem secret verificado
3. Mostra AdminTOTPVerification
4. Digita código de 6 dígitos
5. Edge Function valida código
6. Registra tentativa em admin_totp_attempts
7. Se válido → Acesso liberado
8. Se inválido → Tenta novamente (máx 5x)
```

### Segurança
```
- Códigos válidos por 30 segundos
- Tolerância de 1 código anterior/posterior
- Limpeza automática de tentativas antigas (24h)
- Bloqueio após 5 tentativas falhas
```

---

# 13. MODO DEMO

## 13.1 Propósito

O modo demo permite que usuários experimentem a plataforma sem criar conta, usando dados fictícios pré-carregados.

## 13.2 URLs

```
/demo/artist/dashboard    - Dashboard do artista
/demo/artist/shows        - Shows do artista
/demo/artist/calendar     - Calendário
/demo/artist/expenses     - Despesas
/demo/artist/reports      - Relatórios
... (todas as páginas do artista)

/demo/musician/dashboard  - Dashboard do músico
/demo/musician/shows      - Shows do músico
... (todas as páginas do músico)
```

## 13.3 Dados Fictícios

### demoData.ts
```typescript
export const demoShows = [
  {
    id: 'demo-1',
    venue_name: 'Bar do João',
    date_local: '2025-01-20',
    time_local: '21:00',
    fee: 2500,
    expenses_team: [
      { name: 'Carlos', instrument: 'Guitarra', fee: 400 },
      { name: 'Maria', instrument: 'Baixo', fee: 350 },
    ],
  },
  // ... mais shows
];

export const demoMusicians = [
  { id: 'demo-m1', name: 'Carlos Silva', instrument: 'Guitarra', default_fee: 400 },
  { id: 'demo-m2', name: 'Maria Santos', instrument: 'Baixo', default_fee: 350 },
  // ...
];

export const demoVenues = [
  { id: 'demo-v1', name: 'Bar do João', address: 'Rua das Flores, 123' },
  { id: 'demo-v2', name: 'Clube Harmonia', address: 'Av. Principal, 456' },
  // ...
];

export const demoStats = {
  totalShows: 45,
  grossRevenue: 112500,
  totalCosts: 28750,
  netProfit: 83750,
};
```

## 13.4 Componentes Demo

### DemoBanner
```tsx
// Exibido no topo de todas as páginas demo
<DemoBanner />

// Mostra:
// "🎭 Modo Demonstração - Dados fictícios"
// [Criar Conta Grátis]
```

### DemoLockedModal
```tsx
// Aparece quando usuário tenta ação restrita
<DemoLockedModal
  isOpen={showLockedModal}
  onClose={() => setShowLockedModal(false)}
/>

// Ações bloqueadas:
// - Salvar show
// - Editar dados
// - Exportar relatório
// - Acessar configurações
```

### DemoWeeklySchedule
```tsx
// Calendário com shows fictícios
<DemoWeeklySchedule shows={demoShows} />
```

## 13.5 Navegação

```
Landing Page
    │
    ├── "Experimente Grátis"
    │       │
    │       ▼
    │   DemoSelectRole.tsx
    │       │
    │       ├── "Sou Artista" → /demo/artist/dashboard
    │       │
    │       └── "Sou Músico" → /demo/musician/dashboard
    │
    └── "Criar Conta" → /register
```

---

# 14. RECURSOS POR ROLE

## 14.1 Artista

### Dashboard
```
┌─────────────────────────────────────────────────────────────────────┐
│                    DASHBOARD DO ARTISTA                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ Total Shows  │  │ Receita      │  │ Lucro        │               │
│  │     45       │  │ R$ 112.500   │  │ R$ 83.750    │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    GRÁFICO MENSAL                            │    │
│  │  ████████                                                    │    │
│  │  ██████████                                                  │    │
│  │  ████████████                                                │    │
│  │  Jan  Fev  Mar  Abr  Mai  Jun                                │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  PRÓXIMOS SHOWS                              │    │
│  │  • 20/01 - Bar do João - 21h                                 │    │
│  │  • 25/01 - Clube Harmonia - 22h                              │    │
│  │  • 02/02 - Evento Particular - 20h                           │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Shows
```
Funcionalidades:
- Listar todos os shows
- Filtrar por período
- Buscar por local
- Criar novo show
- Editar show existente
- Excluir show
- Ver detalhes (equipe, custos)

Campos do Show:
- Local (venue)
- Data e hora
- Duração
- Cachê total
- Evento particular?
- Equipe (músicos + cachês)
- Outros custos
```

### Músicos
```
Funcionalidades:
- Cadastrar músicos
- Definir instrumento
- Definir cachê padrão
- Editar/excluir

Uso:
- Ao criar show, seleciona músicos cadastrados
- Cachê padrão é pré-preenchido
- Pode ajustar cachê por show
```

### Locais (Venues)
```
Funcionalidades:
- Cadastrar casas de show
- Adicionar endereço
- Editar/excluir

Uso:
- Ao criar show, seleciona local ou digita novo
- Autocomplete com locais cadastrados
```

### Despesas
```
Categorias:
- Equipamento
- Acessórios
- Manutenção
- Vestuário
- Marketing
- Formação
- Software
- Outros

Campos:
- Categoria
- Descrição
- Valor
- Data
- Vinculado a show? (opcional)
```

### Transporte
```
Tipos:
- Uber/99
- Carro próprio (km)
- Van
- Ônibus
- Avião

Para carro próprio:
- Distância (km)
- Consumo (km/L)
- Preço do combustível
- Cálculo automático do custo
```

### Relatórios
```
Tipos de relatório:
- Mensal
- Trimestral
- Anual
- Período personalizado

Dados incluídos:
- Receita bruta
- Custos de equipe
- Custos de locomoção
- Outros custos
- Lucro líquido
- Média por show

Exportação:
- PDF (jsPDF)
- Excel (xlsx)
- Email
```

## 14.2 Músico

### Dashboard
```
┌─────────────────────────────────────────────────────────────────────┐
│                    DASHBOARD DO MÚSICO                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ Total Shows  │  │ Ganhos       │  │ Artistas     │               │
│  │     32       │  │ R$ 24.500    │  │     8        │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              PRÓXIMOS COMPROMISSOS                           │    │
│  │  • 20/01 - Banda XYZ no Bar do João                          │    │
│  │  • 22/01 - Solo no Restaurante ABC                           │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Shows
```
Campos diferentes do artista:
- Artista que contratou
- Instrumento tocado
- Cachê recebido

O músico registra os shows DELE como freelancer
```

### Artistas
```
Funcionalidades:
- Cadastrar artistas que trabalha
- Histórico por artista
- Média de cachê por artista
```

### Instrumentos
```
Funcionalidades:
- Cadastrar instrumentos que toca
- Usar ao registrar shows
```

### Locais
```
Similar ao artista:
- Cadastrar locais onde toca
- Autocomplete ao criar show
```

### Despesas e Transporte
```
Idêntico ao artista:
- Registrar despesas pessoais
- Controlar locomoção
```

### Relatórios
```
Similar ao artista:
- Foco nos ganhos como freelancer
- Por artista
- Por período
```

---

# 15. HOOKS CUSTOMIZADOS

## 15.1 useAuth

O hook principal de autenticação. Gerencia todo o estado do usuário.

```typescript
interface AuthContextType {
  user: User | null;              // Usuário do Supabase Auth
  userData: UserData | null;      // Dados do perfil (profiles)
  userRole: 'artist' | 'musician' | null;  // Role atual
  session: Session | null;        // Sessão ativa
  loading: boolean;               // Carregando dados
  
  signIn: (email, password) => Promise<void>;
  signUp: (email, password, metadata) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserData: (data) => Promise<void>;
  setUserRole: (role) => Promise<void>;
  refetchUserData: () => Promise<void>;
  verifyOtp: (email, code) => Promise<void>;
  resendOtp: (email) => Promise<void>;
}

// Uso
const { user, userData, userRole, signOut } = useAuth();
```

## 15.2 useShows

Gerencia dados de shows com TanStack Query.

```typescript
interface Show {
  id: string;
  venue_name: string;
  date_local: string;
  time_local: string;
  fee: number;
  expenses_team: TeamExpense[];
  expenses_other: OtherExpense[];
  // ...
}

const { 
  shows,        // Lista de shows
  loading,      // Carregando
  error,        // Erro se houver
  refetch,      // Recarregar
} = useShows();
```

## 15.3 useArtistStats

Estatísticas do artista por período.

```typescript
interface ArtistStats {
  totalShows: number;
  grossRevenue: number;
  totalCosts: number;
  netProfit: number;
}

const { stats, isLoading } = useArtistStats(period);
// period: '2025-01' ou 'all'
```

## 15.4 useMusicianStats

Estatísticas do músico por período.

```typescript
interface MusicianStats {
  totalShows: number;
  totalEarnings: number;
  totalArtists: number;
  totalExpenses: number;
}

const { stats, isLoading } = useMusicianStats(period);
```

## 15.5 useMonthlyData

Dados mensais para gráficos.

```typescript
interface MonthlyDataPoint {
  month: string;       // "Jan", "Fev", etc.
  revenue: number;
  expenses: number;
  profit: number;
}

const { data, isLoading } = useMonthlyData(year);
// Retorna array de 12 meses
```

## 15.6 useNativePlatform

Detecta plataforma atual.

```typescript
const { 
  isNative,    // true se iOS ou Android nativo
  isIOS,       // true se iOS
  isAndroid,   // true se Android
  isWeb,       // true se browser
  platform,    // 'ios' | 'android' | 'web'
} = useNativePlatform();
```

## 15.7 usePushNotifications

Configura push notifications.

```typescript
usePushNotifications();
// Efeitos:
// - Solicita permissão
// - Registra token FCM
// - Salva no banco
// - Configura listeners
```

## 15.8 useAppUpdate

Verifica atualizações do app.

```typescript
const { 
  updateAvailable,   // Nova versão disponível
  currentVersion,    // Versão atual
  availableVersion,  // Nova versão
  openStore,         // Abrir loja para atualizar
  dismissUpdate,     // Ignorar por 3 dias
  shouldShowBanner,  // Deve mostrar banner?
} = useAppUpdate();
```

## 15.9 useAppleIAP

Gerencia compras iOS.

```typescript
const { 
  isLoading,
  purchaseMonthly,   // Comprar mensal
  purchaseAnnual,    // Comprar anual
  restorePurchases,  // Restaurar compras
} = useAppleIAP();
```

## 15.10 useReferrals

Sistema de indicações.

```typescript
const { 
  referralCode,      // Código do usuário
  referrals,         // Lista de indicações
  paidCount,         // Indicações pagas
  pendingCount,      // Indicações pendentes
  rewards,           // Recompensas recebidas
  isLoading,
} = useReferrals();
```

## 15.11 usePlanType

Tipo de plano atual.

```typescript
const { 
  isActive,    // Plano ativo?
  planType,    // 'monthly' | 'annual'
  daysLeft,    // Dias restantes
} = usePlanType();
```

## 15.12 useOnlineStatus

Status de conexão.

```typescript
const isOnline = useOnlineStatus();
// true se conectado à internet
```

## 15.13 useIsMobile

Detecta mobile por viewport.

```typescript
const isMobile = useIsMobile();
// true se viewport < 768px
```

## 15.14 useReportVisibility

Ocultar/mostrar valores nos relatórios.

```typescript
const { isHidden, toggle } = useReportVisibility();
// Ao clicar no olho, oculta valores sensíveis
```

## 15.15 useInactivityTimer

Timer de inatividade.

```typescript
useInactivityTimer({
  timeout: 15 * 60 * 1000, // 15 minutos
  onTimeout: () => signOut(),
});
```

---

# 16. INTEGRAÇÕES EXTERNAS

## 16.1 Asaas (Pagamentos Brasil)

### Sobre
Gateway de pagamento brasileiro para PIX e Cartão de Crédito.

### Configuração
```
Secret: ASAAS_API_KEY
Webhook Secret: ASAAS_WEBHOOK_TOKEN
Ambiente: Produção (https://api.asaas.com)
```

### Endpoints Utilizados
```
POST /v3/customers           - Criar cliente
GET  /v3/customers?cpfCnpj=  - Buscar cliente por CPF
POST /v3/subscriptions       - Criar assinatura
GET  /v3/subscriptions/{id}  - Consultar assinatura
POST /v3/subscriptions/{id}/cancel - Cancelar
GET  /v3/payments/{id}       - Consultar pagamento
```

### Webhook Events
```
PAYMENT_CONFIRMED    - Pagamento confirmado
PAYMENT_RECEIVED     - PIX recebido
PAYMENT_OVERDUE      - Pagamento atrasado
SUBSCRIPTION_DELETED - Assinatura cancelada
```

## 16.2 RevenueCat (iOS In-App Purchases)

### Sobre
Plataforma de gerenciamento de assinaturas in-app para iOS.

### Configuração
```
Secret: REVENUECAT_API_KEY
Webhook Secret: REVENUECAT_WEBHOOK_AUTH_KEY
```

### Produtos Configurados
```
souartista_monthly_499  - Mensal $4.99
souartista_annual_4999  - Anual $49.99
```

### Webhook Events
```
INITIAL_PURCHASE  - Primeira compra
RENEWAL           - Renovação
CANCELLATION      - Cancelamento
EXPIRATION        - Expiração
```

## 16.3 Firebase Cloud Messaging (Push)

### Sobre
Serviço do Google para envio de push notifications.

### Configuração
```
Secret: FIREBASE_SERVICE_ACCOUNT
// JSON com credenciais do service account

Arquivos:
- resources/GoogleService-Info.plist (iOS)
- resources/google-services.json (Android)
```

### Uso
```typescript
// Edge Function: send-push-notification
import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

const app = initializeApp({
  credential: cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT)),
});

const messaging = getMessaging(app);

await messaging.send({
  token: fcmToken,
  notification: { title, body },
});
```

## 16.4 Resend (Emails)

### Sobre
Plataforma de envio de emails transacionais.

### Configuração
```
Secret: RESEND_API_KEY
Domínio: souartista.com.br (verificado)
```

### Uso
```typescript
// Edge Function: send-otp-email
const resend = new Resend(RESEND_API_KEY);

await resend.emails.send({
  from: 'Sou Artista <noreply@souartista.com.br>',
  to: email,
  subject: 'Seu código de verificação',
  html: `<p>Seu código é: <strong>${code}</strong></p>`,
});
```

## 16.5 Brevo (Backup de Emails)

### Sobre
Plataforma alternativa de emails (backup).

### Configuração
```
Secret: BREVO_API_KEY
```

## 16.6 Lovable AI

### Sobre
API de IA integrada ao Lovable para funcionalidades de texto.

### Configuração
```
Secret: LOVABLE_API_KEY
```

### Uso
```typescript
// Edge Function: improve-text
// Melhora textos com IA (descrições, mensagens)
```

---

# 17. SISTEMA DE BACKUP

## 17.1 Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SISTEMA DE BACKUP                              │
└─────────────────────────────────────────────────────────────────────┘

PROJETO PRINCIPAL                          PROJETO DE BACKUP
┌───────────────────┐                     ┌───────────────────┐
│  SUPABASE         │                     │  SUPABASE         │
│  (Produção)       │                     │  (Backup)         │
│                   │                     │                   │
│  - 35+ tabelas    │ ────────────────►   │  - 35+ tabelas    │
│  - Storage        │    Cron diário      │  - Storage        │
│  - Auth           │    (3h BRT)         │  - Auth backup    │
│                   │                     │                   │
└───────────────────┘                     └───────────────────┘
         │                                         │
         │                                         │
         ▼                                         ▼
┌───────────────────┐                     ┌───────────────────┐
│  backup_logs      │                     │  Dados espelhados │
│                   │                     │                   │
│  - Status         │                     │  - profiles       │
│  - Tabelas        │                     │  - shows          │
│  - Registros      │                     │  - subscriptions  │
│  - Arquivos       │                     │  - ...            │
│  - Duração        │                     │                   │
└───────────────────┘                     └───────────────────┘
```

## 17.2 Edge Function: database-backup

```typescript
// Executa diariamente às 3h (América/São_Paulo)

const tablesToBackup = [
  'profiles',
  'user_roles',
  'admin_users',
  'admin_totp_secrets',
  'shows',
  'musicians',
  'artists',
  'venues',
  'musician_venues',
  'musician_instruments',
  'locomotion_expenses',
  'additional_expenses',
  'subscriptions',
  'payment_history',
  'referral_codes',
  'referrals',
  'referral_rewards',
  'notifications',
  'notification_reads',
  'notification_hidden',
  'push_notification_logs',
  'support_tickets',
  'support_responses',
  'user_feedback',
  'lgpd_requests',
  'system_announcements',
  'announcement_dismissed',
  'app_updates',
  'deleted_users',
  'user_devices',
  'fcm_token_history',
  'otp_codes',
  'show_notification_logs',
  'subscription_reminder_logs',
  'pending_user_reminder_logs',
  'engagement_tip_logs',
  'marketing_notification_logs',
];

// Processo para cada tabela:
for (const table of tablesToBackup) {
  // 1. Deletar dados existentes no backup
  await backupClient.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  // 2. Buscar dados do projeto principal
  const { data } = await mainClient.from(table).select('*');
  
  // 3. Inserir no backup
  if (data?.length > 0) {
    await backupClient.from(table).insert(data);
  }
  
  // 4. Registrar contagem
  details[table] = data?.length || 0;
  totalRecords += data?.length || 0;
}

// Backup de arquivos do Storage
const buckets = ['profile-photos', 'support-attachments'];
for (const bucket of buckets) {
  const { data: files } = await mainClient.storage.from(bucket).list();
  for (const file of files) {
    const { data: fileData } = await mainClient.storage.from(bucket).download(file.name);
    await backupClient.storage.from(bucket).upload(file.name, fileData, { upsert: true });
  }
}

// Registrar log
await mainClient.from('backup_logs').insert({
  status: 'completed',
  tables_copied: tablesToBackup.length,
  records_copied: totalRecords,
  files_copied: totalFiles,
  duration_seconds: duration,
  details: details,
});
```

## 17.3 Backup de Usuários Auth

```typescript
// Edge Function: backup-auth-users
// Backup separado dos usuários do auth.users

// Usa Admin API do Supabase para listar usuários
const { data: users } = await mainClient.auth.admin.listUsers();

// Salva em tabela separada no backup
// (auth.users não é acessível diretamente)
```

## 17.4 Painel de Backup (Admin)

### BackupGodTab
```tsx
// Mostra:
// - Último backup bem-sucedido
// - Status atual
// - Detalhes por tabela
// - Botão "Executar Backup Manual"
// - Histórico de backups
```

## 17.5 Secrets Necessárias

```
BACKUP_SUPABASE_URL           - URL do projeto de backup
BACKUP_SUPABASE_SERVICE_ROLE_KEY - Chave admin do backup
```

---

# 18. DISASTER RECOVERY

## 18.1 Documentos Disponíveis

```
DISASTER-RECOVERY-COMPLETO.md   - Guia completo (1700+ linhas)
EMERGENCY-CHECKLIST.md          - Checklist rápido de emergência
SECRETS-TEMPLATE.md             - Template para reconfigurar secrets
WEBHOOKS-CONFIG.md              - URLs de webhooks para reconfigurar
backup-schema.sql               - Schema SQL para restauração
```

## 18.2 Cenários de Desastre

### Cenário 1: Supabase Corrompido
```
1. Verificar backup mais recente (backup_logs)
2. Acessar projeto de backup
3. Exportar dados
4. Criar novo projeto Supabase
5. Importar schema (backup-schema.sql)
6. Importar dados
7. Reconfigurar secrets
8. Atualizar URLs no Lovable
```

### Cenário 2: Lovable Fora do Ar
```
1. Clonar repositório do GitHub
2. npm install
3. Configurar .env local
4. npm run build
5. Deploy manual (Vercel/Netlify)
```

### Cenário 3: Perda de Acesso Admin
```
1. Acessar Supabase diretamente
2. SQL: INSERT INTO admin_users (user_id) VALUES ('...')
3. Ou usar backup para restaurar
```

## 18.3 Checklist de Recuperação

```
□ Verificar status do backup
□ Identificar último backup válido
□ Documentar o problema
□ Criar novo projeto (se necessário)
□ Restaurar schema
□ Restaurar dados
□ Configurar storage buckets
□ Configurar secrets
□ Atualizar webhooks
□ Testar autenticação
□ Testar pagamentos
□ Testar push notifications
□ Validar dados
□ Comunicar usuários
□ Documentar incidente
```

## 18.4 Contatos de Emergência

```
Responsável Técnico: [Nome]
Email: [email]
WhatsApp: [telefone]

Suporte Lovable: [contato]
Suporte Supabase: [contato]
Suporte Asaas: [contato]
```

---

# 19. DEPLOY E CI/CD

## 19.1 Deploy Web

### Lovable (Automático)
```
1. Commit no repositório
2. Lovable detecta mudanças
3. Build automático
4. Deploy em: https://souartista.lovable.app
```

### Vercel (Backup)
```
1. Conectar repositório GitHub
2. Configurar variáveis de ambiente
3. Build command: npm run build
4. Output directory: dist
```

## 19.2 Deploy Mobile

### Codemagic (CI/CD)
```yaml
# codemagic.yaml
workflows:
  ios-workflow:
    name: iOS Release
    environment:
      xcode: latest
      node: 18
      vars:
        MATCH_PASSWORD: $MATCH_PASSWORD
    scripts:
      - npm install
      - npm run build
      - npx cap sync ios
      - xcodebuild...
    publishing:
      app_store_connect:
        api_key: $APP_STORE_CONNECT_API_KEY

  android-workflow:
    name: Android Release
    environment:
      java: 17
      node: 18
    scripts:
      - npm install
      - npm run build
      - npx cap sync android
      - ./gradlew assembleRelease
    publishing:
      google_play:
        credentials: $GOOGLE_PLAY_CREDENTIALS
```

### Build Manual
```bash
# iOS
npm run build
npx cap sync ios
npx cap open ios
# Build no Xcode

# Android
npm run build
npx cap sync android
npx cap open android
# Build no Android Studio
```

## 19.3 Configuração Capacitor

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'app.lovable.eeefb965be394b0494b60ec88e4c5a55',
  appName: 'souartista',
  webDir: 'dist',
  server: {
    url: 'https://eeefb965-be39-4b04-94b6-0ec88e4c5a55.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};
```

## 19.4 Variáveis de Ambiente

### .env (Automático)
```
VITE_SUPABASE_URL=https://wjutvzmnvemrplpwbkyf.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=wjutvzmnvemrplpwbkyf
```

### Edge Functions Secrets
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
ASAAS_API_KEY
ASAAS_WEBHOOK_TOKEN
REVENUECAT_API_KEY
REVENUECAT_WEBHOOK_AUTH_KEY
FIREBASE_SERVICE_ACCOUNT
RESEND_API_KEY
BACKUP_SUPABASE_URL
BACKUP_SUPABASE_SERVICE_ROLE_KEY
LOVABLE_API_KEY
```

---

# 20. SEGURANÇA

## 20.1 Row Level Security (RLS)

Todas as tabelas têm RLS habilitado. Exemplos:

```sql
-- Usuário só vê seus próprios dados
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Usuário só edita seus próprios dados
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Artista vê seus próprios shows
CREATE POLICY "Artists can view own shows"
ON shows FOR SELECT
USING (auth.uid() = uid);

-- Músico vê shows onde está na equipe
CREATE POLICY "Musicians can view team shows"
ON shows FOR SELECT
USING (auth.uid() = ANY(team_musician_ids));

-- Admin vê tudo
CREATE POLICY "Admins can view all"
ON profiles FOR SELECT
USING (public.is_admin(auth.uid()));
```

## 20.2 Autenticação

```
- Email/senha com OTP
- Sessões com JWT
- Refresh tokens automáticos
- Logout limpa todos os dados locais
- TOTP obrigatório para admins
```

## 20.3 Validações

```
- CPF único e válido
- Email único e verificado
- Telefone formatado
- Senha mínimo 6 caracteres
- Dados sanitizados no backend
```

## 20.4 Proteção de Secrets

```
- Secrets nunca no frontend
- Apenas em Edge Functions
- Variáveis de ambiente seguras
- Rotação periódica recomendada
```

## 20.5 LGPD

```
- Solicitações de dados
- Solicitações de exclusão
- Soft delete com 30 dias de retenção
- Exclusão permanente agendada
- Painel admin para gerenciar
```

## 20.6 Rate Limiting

```
- Supabase Rate Limits padrão
- Debounce em buscas no frontend
- Cooldown em reenvio de OTP
```

## 20.7 Webhook Security

```
- Asaas: Token de verificação
- RevenueCat: Header de autenticação
- Validação de origem
```

---

# 21. DADOS BRASILEIROS

## 21.1 Estados e Cidades

```typescript
// src/data/brazilLocations.ts

export const brazilStates = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  // ... 27 estados
];

export const brazilCities = {
  'AC': ['Rio Branco', 'Cruzeiro do Sul', ...],
  'AL': ['Maceió', 'Arapiraca', ...],
  // ... 5570 cidades
};
```

## 21.2 Instrumentos Musicais

```typescript
export const instruments = [
  'Violão',
  'Guitarra',
  'Baixo',
  'Bateria',
  'Teclado',
  'Piano',
  'Saxofone',
  'Trompete',
  'Violino',
  'Flauta',
  'Cavaquinho',
  'Pandeiro',
  'Percussão',
  'Voz',
  // ... 50+ instrumentos
];
```

## 21.3 Formatação

### CPF
```typescript
// Formato: 000.000.000-00
const formatCPF = (cpf: string) => {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

// Validação
const isValidCPF = (cpf: string) => {
  // Algoritmo de validação CPF
};
```

### Telefone
```typescript
// Formato: +55 XX 9 XXXX-XXXX
const formatPhone = (phone: string) => {
  return phone.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '+55 $1 $2 $3-$4');
};
```

### Moeda
```typescript
// Formato: R$ 1.234,56
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
```

### Data
```typescript
// Formato: DD/MM/YYYY
const formatDate = (date: Date) => {
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
};
```

## 21.4 Timezone

```
Padrão: America/Sao_Paulo
Sincronização automática via useTimezoneSync
Armazenado em profiles.timezone
```

---

# 22. PERFORMANCE

## 22.1 TanStack Query

```typescript
// Configuração em QueryProvider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutos
      gcTime: 30 * 60 * 1000,    // 30 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Persistência em IndexedDB
const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{ persister }}
>
```

## 22.2 Lazy Loading

```typescript
// Componentes carregados sob demanda
const ArtistDashboard = lazy(() => import('./pages/artist/Dashboard'));
const MusicianDashboard = lazy(() => import('./pages/musician/Dashboard'));

<Suspense fallback={<LoadingScreen />}>
  <Routes>
    <Route path="/artist/dashboard" element={<ArtistDashboard />} />
  </Routes>
</Suspense>
```

## 22.3 Otimizações de Query

```typescript
// Paginação
const { data } = await supabase
  .from('shows')
  .select('*')
  .order('date_local', { ascending: false })
  .range(0, 49);  // 50 itens por página

// Seleção de campos específicos
const { data } = await supabase
  .from('profiles')
  .select('id, name, email')  // Não traz tudo
  .eq('id', userId);

// Debounce em buscas
const debouncedSearch = useMemo(
  () => debounce((term) => setSearchTerm(term), 300),
  []
);
```

## 22.4 Imagens

```typescript
// Otimização de imagens no Storage
// Supabase transforma automaticamente

const imageUrl = supabase.storage
  .from('profile-photos')
  .getPublicUrl('avatar.jpg', {
    transform: {
      width: 200,
      height: 200,
      resize: 'cover',
    },
  });
```

---

# 23. COMPONENTES UI

## 23.1 Biblioteca Base

Todos os componentes UI são baseados no **shadcn/ui**, que usa:
- **Radix UI** - Componentes acessíveis headless
- **Tailwind CSS** - Estilização
- **class-variance-authority** - Variantes

## 23.2 Componentes Disponíveis

```
Accordion       - Acordeão expansível
Alert           - Alertas e avisos
AlertDialog     - Diálogos de confirmação
AspectRatio     - Proporção de aspecto
Avatar          - Avatar de usuário
Badge           - Badges e tags
Breadcrumb      - Navegação em migalhas
Button          - Botões em várias variantes
Calendar        - Calendário
Card            - Cards com header/content/footer
Carousel        - Carrossel de imagens
Chart           - Gráficos (Recharts)
Checkbox        - Caixas de seleção
Collapsible     - Seções colapsáveis
Command         - Paleta de comandos
ContextMenu     - Menu de contexto
CurrencyInput   - Input de moeda
Dialog          - Modais
Drawer          - Drawer lateral
DropdownMenu    - Menus dropdown
Form            - Formulários com validação
HoverCard       - Cards ao passar mouse
Input           - Campos de texto
InputOTP        - Input para códigos OTP
Label           - Labels de formulário
Menubar         - Barra de menu
NavigationMenu  - Menu de navegação
Pagination      - Paginação
PasswordInput   - Input de senha com toggle
Popover         - Popovers
Progress        - Barras de progresso
RadioGroup      - Grupos de radio
Resizable       - Painéis redimensionáveis
ScrollArea      - Área com scroll customizado
Select          - Selects customizados
Separator       - Separadores
Sheet           - Sheets laterais
Sidebar         - Sidebar completa
Skeleton        - Loading skeletons
Slider          - Sliders
Sonner          - Toasts
Switch          - Switches
Table           - Tabelas
Tabs            - Abas
Textarea        - Áreas de texto
TimePicker      - Seletor de horário
Toast           - Notificações toast
Toggle          - Toggles
ToggleGroup     - Grupos de toggle
Tooltip         - Tooltips
```

## 23.3 Temas e Cores

```css
/* index.css - Variáveis de tema */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode colors */
}
```

---

# 24. FLUXOS DE USUÁRIO

## 24.1 Primeiro Acesso

```
┌──────────────────────────────────────────────────────────────┐
│                    PRIMEIRO ACESSO                            │
└──────────────────────────────────────────────────────────────┘

Landing Page (/)
      │
      ├── "Experimente Grátis"
      │         │
      │         ▼
      │   DemoSelectRole
      │         │
      │         ├── Artista → /demo/artist/dashboard
      │         └── Músico → /demo/musician/dashboard
      │
      └── "Criar Conta"
                │
                ▼
          Register (/register)
                │
          [Preenche dados]
                │
                ▼
          VerifyEmail (/verify-email)
                │
          [Digita OTP]
                │
                ▼
          SelectRole (/select-role)
                │
          [Escolhe artista/músico]
                │
                ▼
          Subscribe (/subscribe)
                │
          [Escolhe plano e paga]
                │
                ▼
          AppHub (/app-hub)
                │
                ├── Artista → /artist/dashboard
                └── Músico → /musician/dashboard
```

## 24.2 Login Recorrente

```
┌──────────────────────────────────────────────────────────────┐
│                    LOGIN RECORRENTE                           │
└──────────────────────────────────────────────────────────────┘

Landing Page (/)
      │
      └── "Entrar"
                │
                ▼
          Login (/login)
                │
          [Email + Senha]
                │
                ▼
          Verificações:
          ├── Sem role? → /select-role
          ├── Perfil incompleto? → /complete-profile
          ├── Sem assinatura? → /subscribe
          └── Tudo OK → /app-hub
                              │
                              ├── Artista → /artist/dashboard
                              └── Músico → /musician/dashboard
```

## 24.3 Criar Show (Artista)

```
┌──────────────────────────────────────────────────────────────┐
│                    CRIAR SHOW                                 │
└──────────────────────────────────────────────────────────────┘

/artist/shows
      │
      └── Clica "Novo Show"
                │
                ▼
          Modal/Formulário:
          ├── Local (autocomplete venues)
          ├── Data e Hora
          ├── Cachê Total
          ├── Duração
          ├── Evento Particular?
          │
          ▼
          Adicionar Equipe:
          ├── Seleciona músicos cadastrados
          ├── Ou adiciona novo
          ├── Define cachê de cada um
          │
          ▼
          Outros Custos:
          ├── Descrição + Valor
          │
          ▼
          [Salvar]
                │
                ▼
          Show salvo no banco
                │
          Músicos recebem notificação
          (se tiverem app)
```

## 24.4 Pagamento PIX

```
┌──────────────────────────────────────────────────────────────┐
│                    PAGAMENTO PIX                              │
└──────────────────────────────────────────────────────────────┘

/subscribe
      │
      └── Seleciona "PIX"
                │
                ▼
          Escolhe plano (Mensal/Anual)
                │
                ▼
          Clica "Pagar com PIX"
                │
                ▼
          Edge Function: create-asaas-subscription
                │
                ▼
          Retorna QR Code + Código
                │
                ▼
          Usuário paga no app do banco
                │
                ▼
          Asaas envia webhook
                │
                ▼
          Edge Function: asaas-webhook
          ├── Atualiza subscription
          ├── Atualiza perfil
          ├── Envia push
          └── Valida indicação
                │
                ▼
          Usuário acessa plataforma
```

---

# 25. TROUBLESHOOTING

## 25.1 Problemas Comuns

### "Não consigo fazer login"
```
1. Verificar se email está correto
2. Verificar se senha está correta
3. Tentar "Esqueci minha senha"
4. Verificar se email foi verificado
5. Limpar localStorage e tentar novamente
```

### "Não recebo notificações push"
```
1. Verificar permissão do app
2. Verificar se token FCM está salvo
3. Verificar conexão com internet
4. Verificar console de logs
5. Testar com edge function test-push-notification
```

### "Pagamento não foi confirmado"
```
1. Verificar status no Asaas
2. Verificar logs do webhook
3. Verificar se PIX foi pago corretamente
4. Verificar timeout do PIX
5. Atualizar manualmente se necessário
```

### "App travando no iOS"
```
1. Fechar e reabrir app
2. Verificar versão do iOS
3. Deletar e reinstalar
4. Verificar logs do Xcode
5. Verificar compatibilidade Capacitor
```

### "Dados não carregam"
```
1. Verificar conexão com internet
2. Verificar console de erros
3. Limpar cache (localStorage + IndexedDB)
4. Verificar RLS policies
5. Verificar logs do Supabase
```

## 25.2 Logs e Debug

### Console Logs (Frontend)
```typescript
console.log('[useAuth] User data:', userData);
console.log('[useShows] Fetched shows:', shows.length);
console.log('[usePushNotifications] Token:', token);
```

### Edge Function Logs
```typescript
console.log('[asaas-webhook] Event:', event);
console.log('[send-push-notification] Sending to:', userId);
console.error('[database-backup] Error:', error.message);
```

### Supabase Dashboard
```
- Logs → Edge Functions
- Logs → Auth
- Logs → Database
- Logs → Storage
```

## 25.3 Comandos Úteis

```bash
# Desenvolvimento local
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Sync Capacitor
npx cap sync

# Abrir iOS no Xcode
npx cap open ios

# Abrir Android no Android Studio
npx cap open android

# Verificar tipos TypeScript
npx tsc --noEmit

# Lint
npm run lint
```

## 25.4 Contatos de Suporte Técnico

```
Desenvolvedor Principal: [Nome]
Email: [email]
GitHub: [repo]

Suporte Lovable: support@lovable.dev
Suporte Supabase: support.supabase.com
Suporte Asaas: suporte@asaas.com
```

---

# 📝 CHANGELOG

## Versão 2.0 (Janeiro 2025)
- Sistema de backup automático diário
- Disaster recovery completo
- Sistema de indicações com recompensas
- Push notifications via FCM
- App nativo iOS/Android
- Painel administrativo com TOTP
- Sistema de suporte com escalação
- LGPD compliance
- Modo demonstração

## Versão 1.0 (2024)
- MVP inicial
- Cadastro de shows
- Relatórios básicos
- Assinatura via Asaas

---

# 🔗 LINKS ÚTEIS

- **Produção:** https://souartista.lovable.app
- **Preview:** https://id-preview--eeefb965-be39-4b04-94b6-0ec88e4c5a55.lovable.app
- **Supabase Dashboard:** (via Lovable Cloud)
- **Repositório:** (via Lovable)

---

**Documento gerado automaticamente. Última atualização: Janeiro 2025.**
