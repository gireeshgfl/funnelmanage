# Funnel Management — Detailed Migration Plan

## Overview

This document provides a comprehensive migration plan to align the Funnel Management platform's **server** and **client** with the architecture, patterns, and tooling used in the Eduvocate reference repository. The migration enables:

- **Server**: Nameko → AioRPC, generic routes → typed REST endpoints, centralized schemas, event-driven design
- **Client**: Next.js API proxy layer → direct backend calls, structured state management, improved testing and i18n

### Dual-Mode Operation (Critical Requirement)

**Funnel Management must operate in two modes:**

1. **Eduvocate Plugin Mode** — When integrated with Eduvocate:
   - Eduvocate users click the Funnel plugin in the dashboard
   - Eduvocate generates an SSO token (RS256 JWT) and redirects to Funnel with `?token=...`
   - Funnel validates the Eduvocate SSO token using Eduvocate's public key
   - User is logged in without Funnel-specific credentials (no email/password needed)
   - Seamless single sign-on from Eduvocate

2. **Standalone Mode** — When used independently:
   - Full native auth: register, signin, refresh_token, signout, OTP, etc.
   - Users create accounts and log in directly in Funnel
   - No Eduvocate dependency — works as a fully independent application
   - Same feature set, different auth source

**Auth:** RS256 only. Eduvocate SSO tokens (validated with Eduvocate public key) or Funnel's own tokens (signed with Funnel's private key, verified with Funnel's public key). No HS256.

---

## Table of Contents

1. [Current vs Target Architecture](#1-current-vs-target-architecture)
2. [Dual-Mode: Eduvocate Plugin + Standalone](#2-dual-mode-eduvocate-plugin--standalone)
3. [Server Migration Plan](#3-server-migration-plan)
4. [Client Migration Plan](#4-client-migration-plan)
5. [Implementation Phases](#5-implementation-phases)
6. [Risk Mitigation & Rollback](#6-risk-mitigation--rollback)
7. [Reference Files (Eduvocate)](#7-reference-files-eduvocate)
8. [Quick Migration Examples](#8-quick-migration-examples)
9. [Summary](#9-summary)

---

## 1. Current vs Target Architecture

### 1.1 Server — Current State (Funnelmanage)

| Component | Current | Issues |
|-----------|---------|--------|
| **RPC Framework** | Nameko (eventlet) | Eventlet monkey-patching, Docker compatibility, sync-only |
| **API Gateway** | FastAPI with generic `/{service}/{method}` routes | No OpenAPI/docs, no typed contracts |
| **Service Structure** | `nameko_services/services/v1/` — flat | Shared `DAO.py`, tight coupling |
| **Config** | `api_gateway/config.py` + `config.yaml` | Split config, env scattered |
| **Auth** | JWT in middleware, RBAC in services | No centralized RBAC middleware |
| **Validation** | Ad-hoc in services | No Pydantic schemas |
| **Events** | None | No event bus |

### 1.2 Server — Target State (Eduvocate-style)

| Component | Target | Benefits |
|-----------|--------|----------|
| **RPC Framework** | AioRPC (aio-pika) | Async, Docker-safe, no monkey-patching |
| **API Gateway** | FastAPI with individual route handlers | OpenAPI, typed endpoints, versioning |
| **Service Structure** | `services/{domain}/v1/` (dao, service, handlers) | Clear separation, per-service DAOs |
| **Config** | `config/` with pydantic-settings | Single source of truth |
| **Auth** | Middleware RBAC, permission checks | Centralized, consistent |
| **Validation** | Pydantic schemas in `schemas/` | Reusable, documented |
| **Events** | RabbitMQ event bus (optional Phase 2) | Event-driven, decoupled |

### 1.3 Client — Current State (Funnelmanage)

| Component | Current | Issues |
|-----------|---------|--------|
| **API Calls** | Next.js API routes proxy to backend (`/get/{service}/{method}`) | Extra hop, coupling to backend URL structure |
| **Auth** | `AuthContext` + cookies | No Redux, no permission caching |
| **Routing** | Next.js App Router | Fine |
| **State** | Context only | No persistence, no permission hierarchy |
| **i18n** | None | Single language |
| **Testing** | None | No unit/integration tests |
| **UI** | Custom components | No shared design system |

### 1.4 Client — Target State (Eduvocate-style)

| Component | Target | Benefits |
|-----------|--------|----------|
| **API Calls** | Direct fetch to backend `/api/v1/...` | Simpler, fewer moving parts |
| **Auth** | Redux + PermissionProvider | Caching, hierarchy, debugger |
| **Routing** | Next.js App Router | Same |
| **State** | Redux + Redux Persist | Persistence, permission caching |
| **i18n** | next-intl (optional Phase 2) | Multi-language ready |
| **Testing** | Vitest + MSW | Unit and integration coverage |
| **UI** | Radix UI + Tailwind (optional) | Accessible, consistent |

---

## 2. Dual-Mode: Eduvocate Plugin + Standalone

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Funnel Management - Dual Mode                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PLUGIN MODE (Eduvocate Integration)          STANDALONE MODE                │
│  ─────────────────────────────────           ─────────────────              │
│                                                                             │
│  Eduvocate Dashboard                          Direct access                  │
│       │                                            │                        │
│       │ User clicks "Funnel" plugin                 │ User visits            │
│       ▼                                            │ funnelmanage.com       │
│  /plugins/{id}/access-url                           ▼                        │
│       │                                       /login or /register           │
│       │ Returns: app_url/sso?token=JWT             │                        │
│       ▼                                            │                        │
│  Redirect → Funnel App                              │                        │
│  /sso?token=<Eduvocate_RS256_JWT>                   │                       │
│       │                                            │                        │
│       └──────────────────┬─────────────────────────┘                        │
│                          │                                                  │
│                          ▼                                                  │
│              ┌───────────────────────┐                                      │
│              │  Auth Middleware      │                                      │
│              │  RS256 only: Eduvocate public key (SSO) or                   │
│              │  Funnel public key (standalone)                              │
│              └───────────────────────┘                                      │
│                          │                                                  │
│                          ▼                                                  │
│              User authenticated → Access Funnel features                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Server-Side Requirements

#### 2.2.1 Auth Middleware (RS256 Only)

**Pattern:** RS256 exclusively. No HS256.

| Token Source | Algorithm | Key | When Used |
|--------------|-----------|-----|-----------|
| Eduvocate SSO | RS256 | Eduvocate public key (`EDUVOCATE_JWT_PUBLIC_KEY`) | User came from Eduvocate dashboard |
| Funnel native | RS256 | Funnel public key (`JWT_PUBLIC_KEY`) | User registered/logged in directly in Funnel |

**Implementation reference:** `eduvocate/plugins/hackathon/server/api_gateway/middleware/auth.py`

#### 2.2.2 Endpoints to Add

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/v1/auth/sso` | GET | SSO callback — receives `?token=` from Eduvocate redirect, validates, returns/sets session | None (token in query) |
| `/api/v1/auth/sso/validate` | GET | Validate SSO token without creating session (optional) | None |
| `/api/v1/auth/me` | GET | Return current user (works for both SSO and standalone tokens) | Bearer or Cookie |

**Existing (standalone) — keep as-is:**
- `/api/v1/auth/register` — POST
- `/api/v1/auth/login` — POST
- `/api/v1/auth/refresh-token` — GET
- `/api/v1/auth/signout` — DELETE
- OTP, email verification, etc.

#### 2.2.3 Config Variables (RS256 Only)

```env
# Funnel's own RSA keys (standalone tokens - always required)
JWT_ALGORITHM=RS256
JWT_PRIVATE_KEY_PATH=server/keys/private.pem  # For signing tokens
JWT_PUBLIC_KEY_PATH=server/keys/public.pem    # For verifying Funnel tokens

# Eduvocate Plugin Integration (only when used as plugin)
EDUVOCATE_PLUGIN_ID=funnel
EDUVOCATE_API_URL=https://api.eduvocate.org
EDUVOCATE_JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...  # For verifying Eduvocate SSO tokens
```

**Full env reference:** See `docs/ENV_AND_PLUGIN_REGISTRATION.md` for local vs production, standalone vs plugin, and Eduvocate-side `FUNNEL_APP_URL` setup.

**Logic:** Both modes use RS256. Standalone: Funnel signs with `JWT_PRIVATE_KEY`, verifies with `JWT_PUBLIC_KEY`. Plugin: Funnel verifies Eduvocate tokens with `EDUVOCATE_JWT_PUBLIC_KEY`.

### 2.3 Eduvocate-Side Requirements (Plugin Registration)

To run as an Eduvocate plugin, Funnel must be registered in Eduvocate:

1. **Register plugin** in Eduvocate marketplace (via `register_plugins.py` or admin):
   ```json
   {
     "plugin_id": "funnel",
     "name": "Funnel Management",
     "service_name": "funnel_service_v1",
     "app_url": "https://funnel.yourdomain.com",
     "database": "funnel_management",
     "auth_config": {
       "default_scopes": ["profile:read", "sessions:read", "sessions:write"],
       "allowed_roles": ["student", "trainer", "super-admin"]
     }
   }
   ```

2. **Access URL flow:** When a user clicks the Funnel plugin in Eduvocate dashboard:
   - Eduvocate calls `GET /api/v1/plugin-proxy/funnel/access-url`
   - Returns `{ "access_url": "https://funnel.app/sso?token=JWT" }`
   - User is redirected to Funnel's `/sso?token=...`

3. **Eduvocate generates JWT** with: `user_id`, `email`, `role`, `scopes`, `aud: "plugin:funnel"`, `iss: "eduvocate"`.

### 2.4 Client-Side Requirements

#### 2.4.1 SSO Landing Page

**Route:** `/sso` (or `/auth/sso`)

**Behavior:**
1. Read `token` from `window.location.search`
2. Store token in cookie (e.g., `access_token` or `funnel_token`)
3. Redirect to dashboard (or role-based: student → `/dashboard/student`, trainer → `/dashboard/trainer`)

**Reference:** `eduvocate/plugins/hackathon/client/src/app/sso/page.js`

#### 2.4.2 Auth Utilities

**Unified auth check:**
- `isAuthenticated()` — checks cookie/Redux for valid token (works for both SSO and standalone)
- `getCurrentUser()` — decode token, return `{ userId, email, role, auth_source }`
- `auth_source`: `"sso"` or `"local"` — useful for UI (e.g., "Signed in via Eduvocate" badge)

#### 2.4.3 Login Page Behavior

| Mode | Login Page |
|------|------------|
| **Standalone** | Show email/password form; optional "Sign in with Eduvocate" link if `EDUVOCATE_API_URL` is configured |
| **Plugin** | If user landed via SSO, redirect to dashboard (no login form needed) |
| **Hybrid** | Login form + "Access via Eduvocate" button that redirects to Eduvocate's plugin auth flow |

### 2.5 Deployment Modes

| Deployment | EDUVOCATE_* vars | Behavior |
|------------|------------------|----------|
| **Standalone only** | Not set | Funnel auth (register, login) — tokens signed with Funnel's RSA keys |
| **Plugin only** | Set (embedded in Eduvocate) | SSO from Eduvocate — tokens validated with Eduvocate's public key |
| **Hybrid** | Set | Both SSO and standalone — both use RS256 |

### 2.6 Migration Checklist — Dual Mode

- [ ] Add `/api/v1/auth/sso` GET endpoint (validate Eduvocate token, return/set session)
- [ ] Update auth middleware: RS256 only (Eduvocate or Funnel public key)
- [ ] Add `JWT_PRIVATE_KEY_PATH`, `JWT_PUBLIC_KEY_PATH`, `EDUVOCATE_JWT_PUBLIC_KEY`, `EDUVOCATE_API_URL`, `EDUVOCATE_PLUGIN_ID` to config
- [ ] Create client `/sso` page — parse token from URL, set cookie, redirect
- [ ] Update `lib/auth.js` — `handleSSOToken()`, `auth_source` in user payload
- [ ] Register Funnel plugin in Eduvocate (when deploying as plugin)
- [ ] Document standalone vs plugin deployment in README

---

## 3. Server Migration Plan

### Phase 3.1: Project Structure & Config

#### 3.1.1 Create New Directory Layout

```
server/
├── api_gateway/           # Keep, refactor
│   ├── main.py
│   ├── middleware/        # NEW: rbac, security, rate_limit, versioning
│   ├── routes/            # NEW: Individual route files
│   │   └── v1/
│   │       ├── auth.py
│   │       ├── sessions.py
│   │       ├── questions.py
│   │       ├── chat.py
│   │       ├── funnel.py
│   │       ├── media.py
│   │       ├── super_admin.py
│   │       └── health.py
│   └── services/          # NEW: nameko_client wrapper → call_service
├── config/                # NEW: pydantic-settings
│   ├── __init__.py
│   └── base.py
├── schemas/               # NEW: Pydantic schemas
│   ├── __init__.py
│   ├── base.py
│   ├── auth.py
│   ├── session.py
│   ├── question.py
│   └── ...
├── exceptions/            # NEW: Custom exceptions
│   └── custom.py
├── common/                # NEW: Shared utilities
│   ├── logging_config.py
│   ├── redis_client.py
│   └── ...
└── services/              # Migrated from nameko_services
    ├── auth/
    │   └── v1/
    │       ├── dao.py
    │       ├── service.py
    │       └── handlers.py
    ├── sessions/
    │   └── v1/
    ├── questions/
    │   └── v1/
    ├── chat/
    │   └── v1/
    ├── funnel/
    │   └── v1/
    ├── media/
    │   └── v1/
    ├── super_admin/
    │   └── v1/
    └── common/
        ├── database.py
        ├── dependencies.py
        └── event_validator.py
```

#### 3.1.2 Config Migration

**Tasks:**
1. Add `config/base.py` with Pydantic `BaseSettings` (MongoDB, Redis, AMQP, JWT, AWS).
2. Replace `api_gateway/config.py` and YAML usage with `from config import settings`.
3. Create `server/.env.example` with all required variables (mirror Eduvocate).

**Migration Checklist:**
- [ ] Create `config/base.py` with `BaseConfig`
- [ ] Add `MONGODB_URI`, `MONGODB_DATABASE`, `REDIS_*`, `AMQP_URI`, `JWT_ALGORITHM=RS256`, `JWT_PRIVATE_KEY_PATH`, `JWT_PUBLIC_KEY_PATH`
- [ ] Create `server/.env.example`
- [ ] Update all imports from `api_gateway.config` to `config`

---

### Phase 3.2: Pydantic Schemas

#### 3.2.1 Create Schemas for All Domains

| Domain | Schema File | Key Models |
|--------|-------------|------------|
| Auth | `schemas/auth.py` | `RegisterRequest`, `LoginRequest`, `TokenResponse`, `UserResponse` |
| Session | `schemas/session.py` | `SessionCreate`, `SessionUpdate`, `SessionResponse`, `SessionList` |
| Question | `schemas/question.py` | `QuestionCreate`, `TopicCreate`, `MCQPayload` |
| Chat | `schemas/chat.py` | `ChatMessage`, `ChatFetchRequest` |
| Funnel | `schemas/funnel.py` | `ParticipantPayload`, `FunnellingRequest` |
| Media | `schemas/media.py` | `UploadRequest` |
| Super Admin | `schemas/super_admin.py` | `TrainerStatusUpdate`, `TrainerResponse` |

**Tasks:**
1. Extract request/response shapes from existing Nameko services.
2. Define Pydantic models with validators.
3. Add `schemas/base.py` with `APIResponse`, `RoleEnum`, `PermissionEnum`.

**Migration Checklist:**
- [ ] Create `schemas/base.py` (APIResponse, common enums)
- [ ] Create `schemas/auth.py` (mirror auth_service_fun payloads)
- [ ] Create `schemas/session.py` (mirror sessions_management payloads)
- [ ] Create `schemas/question.py` (mirror question_bank_generation payloads)
- [ ] Create `schemas/chat.py`, `schemas/funnel.py`, `schemas/media.py`, `schemas/super_admin.py`
- [ ] Export all from `schemas/__init__.py`

---

### Phase 3.3: AioRPC Framework & Service Migration

#### 3.3.1 Add AioRPC

**Tasks:**
1. Copy `common/aio_rpc/` from Eduvocate (or implement equivalent).
2. Add `aio-pika` to `requirements.txt`.
3. Create service runner script (e.g., `services/runner.py`) to start AioRPC services.

#### 3.3.2 Migrate Each Nameko Service to AioRPC

| Current Service | New Location | RPC Methods to Migrate |
|-----------------|--------------|-------------------------|
| `auth_service_fun` | `services/auth/v1/` | register, signin, signout, refresh_token, generate_otp, verify_otp_and_change_password, resend_verification, email_verification, generate_captcha, participants_token |
| `sessions_management` | `services/sessions/v1/` | save_session, update_session, get_sessions, delete_session, add_participants, get_participant_sessions, get_session_status, save_mcq, save_points, get_points, get_question_topics, get_questions, save_pushed_questions, get_pushed_questions, get_in_session_questions, save_session_points, get_sessions_with_questions |
| `question_bank_generation` | `services/questions/v1/` | save_questions, delete_question, update_question, get_questions, get_topics, save_topic, delete_topic, update_topic, get_participants, save_media, generate_questions, approve_question, get_question_topics |
| `chat_service` | `services/chat/v1/` | save_chat, fetch_chat, delete_chat |
| `funnel_service` | `services/funnel/v1/` | save_participants, get_participants, funnelling |
| `media_service` | `services/media/v1/` | upload |
| `super_admin` | `services/super_admin/v1/` | get_trainers, delete_trainer, trainer_status |

**Per-Service Migration Steps:**
1. Create `services/{domain}/v1/dao.py` — move DB logic from `DAO.py` (split by domain).
2. Create `services/{domain}/v1/service.py` — convert `@rpc` to AioRPC `@rpc`, `def` → `async def`.
3. Create `services/{domain}/v1/handlers.py` — business logic helpers if needed.
4. Replace `BaseClassDAO` usage with `services/common/database.py` (Motor async MongoDB).
5. Remove `bson_serialization` usage — use Pydantic + `jsonable_encoder` where needed.

**Migration Checklist:**
- [ ] Add `common/aio_rpc/` and `services/runner.py`
- [ ] Migrate `auth_service_fun` → `services/auth/v1/`
- [ ] Migrate `sessions_management` → `services/sessions/v1/`
- [ ] Migrate `question_bank_generation` → `services/questions/v1/`
- [ ] Migrate `chat_service` → `services/chat/v1/`
- [ ] Migrate `funnel_service` → `services/funnel/v1/`
- [ ] Migrate `media_service` → `services/media/v1/`
- [ ] Migrate `super_admin` → `services/super_admin/v1/`
- [ ] Split `DAO.py` into per-service DAOs
- [ ] Remove `nameko_services/`, `bson_serilizer/`

---

### Phase 3.4: API Gateway — Individual Routes

#### 3.4.1 Create Route Handlers

Replace generic `/get/{service}/{method}` and `/{service}/{method}` with typed endpoints:

| Current Pattern | New Endpoint | Method |
|-----------------|--------------|--------|
| `/get/auth_service_fun/register` | `/api/v1/auth/register` | POST |
| `/get/auth_service_fun/signin` | `/api/v1/auth/login` | POST |
| `/get/auth_service_fun/refresh_token` | `/api/v1/auth/refresh-token` | GET |
| `/get/auth_service_fun/signout` | `/api/v1/auth/signout` | DELETE |
| `/get/auth_service_fun/participants_token` | `/api/v1/auth/participants-token` | POST |
| `/get/auth_service_fun/generate_otp` | `/api/v1/auth/generate-otp` | POST |
| `/get/auth_service_fun/verify_otp_and_change_password` | `/api/v1/auth/verify-otp-change-password` | POST |
| `/get/auth_service_fun/resend_verification` | `/api/v1/auth/resend-verification` | GET |
| `/get/auth_service_fun/email_verification` | `/api/v1/auth/email-verification` | POST |
| `/get/auth_service_fun/generate_captcha` | `/api/v1/auth/generate-captcha` | GET |
| `/{service}/{method}` (POST) | `/api/v1/sessions/...`, `/api/v1/questions/...`, etc. | POST |
| `/{service}/{method}` (GET) | Same | GET |
| `/{service}/{method}` (DELETE) | Same | DELETE |
| `/key` | Keep or refactor into specific endpoints | GET |
| `/home/{service}/{method}` | `/api/v1/home/...` | GET |

#### 3.4.2 Route Implementation Pattern

**Example: Auth Routes**

```python
# api_gateway/routes/v1/auth.py
from fastapi import APIRouter, Depends
from schemas import LoginRequest, TokenResponse, APIResponse
from api_gateway.services.nameko_client import call_service
from api_gateway.middleware import get_current_user

router = APIRouter()

@router.post("/auth/register", response_model=APIResponse)
async def register(data: RegisterRequest):
    result = await call_service("auth", "register", data.model_dump())
    return result

@router.post("/auth/login", response_model=APIResponse)
async def login(data: LoginRequest):
    result = await call_service("auth", "signin", data.model_dump())
    return result

@router.get("/auth/refresh-token")
async def refresh_token(token: str = Depends(get_current_user)):
    result = await call_service("auth", "refresh_token", token)
    return result
```

**Migration Checklist:**
- [ ] Create `api_gateway/services/nameko_client.py` (wrapper around AioRPC `call_service`)
- [ ] Create `api_gateway/routes/v1/auth.py` (all auth endpoints)
- [ ] Create `api_gateway/routes/v1/sessions.py`
- [ ] Create `api_gateway/routes/v1/questions.py`
- [ ] Create `api_gateway/routes/v1/chat.py`
- [ ] Create `api_gateway/routes/v1/funnel.py`
- [ ] Create `api_gateway/routes/v1/media.py`
- [ ] Create `api_gateway/routes/v1/super_admin.py`
- [ ] Create `api_gateway/routes/v1/health.py`
- [ ] Update `api_gateway/main.py` to include new routers, remove generic routes
- [ ] Add `X-API-Version: v1` header support (optional)

---

### Phase 3.5: Middleware & RBAC

#### 3.5.1 Middleware to Add

| Middleware | Purpose | Source |
|------------|---------|--------|
| `SecurityMiddleware` | CORS, headers, path validation | Eduvocate |
| `VersioningMiddleware` | `X-API-Version` | Eduvocate |
| `rbac.py` | `get_current_user`, `require_authenticated`, `require_permissions` | Eduvocate |
| `RateLimitMiddleware` | Redis rate limiting (optional) | Eduvocate |
| `RequestSizeLimitMiddleware` | Body size limits | Eduvocate |

#### 3.5.2 RBAC Migration

**Current:** RBAC decorators (`@rbac_check`, `@get_rbac_check`) in each Nameko service method.

**Target:** Centralized middleware; services receive decoded JWT payload.

**Tasks:**
1. Implement `get_current_user` — decode JWT, attach to `request.state.user`.
2. Implement `require_authenticated` — dependency that requires valid token.
3. Implement `require_permissions` — check permission bitmap/array from token.
4. Remove RBAC decorators from services; pass `payload` from gateway.

**Migration Checklist:**
- [ ] Create `api_gateway/middleware/rbac.py`
- [ ] Create `api_gateway/middleware/security.py`
- [ ] Create `api_gateway/middleware/versioning.py`
- [ ] Update route handlers to use `Depends(require_authenticated)` where needed
- [ ] Map existing roles (student, trainer, super-admin) to new permission system

---

### Phase 3.6: GraphQL (Optional)

If homepage/GraphQL is retained:
1. Move GraphQL router to `api_gateway/gql_api/` (Eduvocate style).
2. Replace `homepage_service.graphql` RPC with new `graphql_service` AioRPC service.
3. Or migrate to REST `/api/v1/home` endpoints.

**Migration Checklist:**
- [ ] Decide: keep GraphQL or migrate to REST
- [ ] If keeping: migrate to `gql_api/` structure
- [ ] If REST: create `/api/v1/home/courses`, `/api/v1/home/mentors`, etc.

---

### Phase 3.6.5: RS256 Migration (Remove HS256)

**Current code uses:** `SECRET_KEY`, `ALGORITHM=HS256` in `api_gateway/config.py`, `auth_service_fun`, `main.py`, `routers/v1/services.py`, `routers/v2/services.py`, client `jwtUtils.js`.

**Migration tasks:**
- [ ] Replace `SECRET_KEY` with `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH`
- [ ] Load RSA keys from PEM files (or env)
- [ ] Use `jwt.encode(..., private_key, algorithm="RS256")` for signing
- [ ] Use `jwt.decode(..., public_key, algorithms=["RS256"])` for verification
- [ ] Auth middleware: try Eduvocate public key first (if token `aud`/`iss` indicates Eduvocate), else Funnel public key
- [ ] Client: RS256 verification requires public key — either fetch from server or bundle; no symmetric SECRET_KEY

---

### Phase 3.7: Dependencies & Cleanup

**requirements.txt updates:**
- Add: `pydantic-settings`, `aio-pika`, `motor`
- Remove: `nameko`, `eventlet`, `pika` (Nameko stack)
- Keep: `fastapi`, `uvicorn`, `pyjwt`, `orjson`, `python-dotenv`

**Remove:**
- `nameko_services/` (after migration)
- `bson_serilizer/`
- `api_gateway/routers/v1/services.py` generic routes
- `config.yaml` (use `.env` only)

---

## 4. Client Migration Plan

### Phase 4.1: API Client Layer

#### 3.1.1 Replace Proxy with Direct Backend Calls

**Current Flow:**
```
Browser → Next.js API route (/funnel-management/api/v1/auth_service_fun/signin)
        → Backend (API_BASE_URL/get/auth_service_fun/signin)
```

**Target Flow:**
```
Browser → Backend directly (NEXT_PUBLIC_API_URL/api/v1/auth/login)
```

**Tasks:**
1. Add `NEXT_PUBLIC_API_URL` (e.g., `https://api.funnelmanage.example.com`).
2. Create `lib/api/client.js` — base fetch wrapper with:
   - Base URL from env
   - Credentials: `include` for cookies
   - `Authorization: Bearer <token>` from cookie or state
   - Error handling and logging
3. Create `lib/api/endpoints.js` — endpoint constants matching new backend:
   ```js
   export const API = {
     AUTH: {
       LOGIN: '/api/v1/auth/login',
       REGISTER: '/api/v1/auth/register',
       REFRESH_TOKEN: '/api/v1/auth/refresh-token',
       SIGNOUT: '/api/v1/auth/signout',
       // ...
     },
     SESSIONS: { /* ... */ },
     QUESTIONS: { /* ... */ },
     // ...
   };
   ```

#### 3.1.2 Remove Next.js API Route Proxies

**Tasks:**
1. Delete `app/api/v1/` directory (or keep only for BFF patterns if needed).
2. Update all components/hooks to call `lib/api/client.js` instead of `/funnel-management/api/...`.

**Migration Checklist:**
- [ ] Create `lib/api/client.js` (fetch wrapper)
- [ ] Create `lib/api/endpoints.js` (endpoint map)
- [ ] Create `lib/api/auth.js` (auth-specific helpers)
- [ ] Create `lib/api/sessions.js`, `lib/api/questions.js`, etc.
- [ ] Migrate `useAuth`, `useSessionQuestionQueue`, etc. to use new client
- [ ] Remove or deprecate `app/api/v1/*`

---

### Phase 4.2: State Management — Redux (Optional)

#### 3.2.1 Add Redux

**Tasks:**
1. Install: `@reduxjs/toolkit`, `react-redux`, `redux-persist`.
2. Create `lib/store/index.js` — configure store with slices.
3. Create slices: `authSlice`, `userSlice` (and others as needed).
4. Wrap app in `ReduxProvider` and `PersistGate`.

#### 3.2.2 Auth State Migration

**Current:** `AuthContext` + cookies.

**Target:** Redux `authSlice` + cookies (cookies still used for httpOnly tokens).

**Migration Checklist:**
- [ ] Add Redux dependencies
- [ ] Create `lib/store/slices/authSlice.js`
- [ ] Create `lib/store/index.js`
- [ ] Replace `AuthContext` with Redux in layout
- [ ] Update `useAuth` to use `useSelector`/`useDispatch`

---

### Phase 4.3: Permissions System (Optional)

#### 3.3.1 Add Permission Provider

**Tasks:**
1. Copy `components/permissions/` from Eduvocate (PermissionGuard, PermissionProvider, permissionUtils).
2. Create `lib/permissions/permissionUtils.js` — map roles to permissions (student, trainer, super-admin).
3. Replace ad-hoc role checks with `<PermissionGuard required={PERMISSIONS.ADMIN.USERS.ALL}>`.

**Migration Checklist:**
- [ ] Create `lib/permissions/permissionUtils.js`
- [ ] Create `components/permissions/PermissionGuard.jsx`
- [ ] Create `components/permissions/PermissionProvider.jsx`
- [ ] Create `docs/MIGRATION.md` (permissions) — step-by-step for developers
- [ ] Update dashboard layouts to use PermissionGuard

---

### Phase 4.4: Config & Environment

**Tasks:**
1. Add `client/.env.example`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8001
   ```
2. Update `config.js` — replace `API_ROUTES` with new endpoints or remove if using `lib/api/endpoints.js`.

**Migration Checklist:**
- [ ] Create `client/.env.example`
- [ ] Update `config.js` or replace with `lib/api/endpoints.js`
- [ ] Document env vars in README

---

### Phase 4.5: Testing (Optional)

**Tasks:**
1. Install Vitest, MSW, Testing Library.
2. Create `__tests__/setup.js`, `__tests__/mocks/handlers.js`.
3. Add unit tests for hooks (`useAuth`, `useQuestions`, etc.).
4. Add API integration tests with MSW.

**Migration Checklist:**
- [ ] Add Vitest, MSW, @testing-library/react
- [ ] Create test setup and mocks
- [ ] Add tests for `useAuth`, `lib/api/client.js`
- [ ] Add `npm run test` script

---

### Phase 4.6: UI & i18n (Optional)

**Tasks:**
1. Consider Radix UI for accessible components.
2. Add `next-intl` for i18n if multi-language is required.
3. Align Tailwind config with Eduvocate if design consistency is desired.

---

## 5. Implementation Phases

### Phase A: Foundation (Weeks 1–2)
- **Dual-mode:** SSO endpoint (`/api/v1/auth/sso`), auth middleware (RS256 only — Eduvocate public key or Funnel public key), client `/sso` page
- Server: config, schemas, AioRPC setup, migrate 1 service (auth)
- Client: API client, endpoint constants, remove one proxy route

### Phase B: Core Services (Weeks 3–4)
- Server: Migrate sessions, questions, chat, funnel, media, super_admin
- Client: Migrate all API calls to direct backend, update hooks

### Phase C: Gateway & Middleware (Week 5)
- Server: Individual routes, RBAC middleware, remove generic routes
- Client: Optional Redux, PermissionProvider

### Phase D: Hardening (Weeks 6–7)
- Server: GraphQL decision, tests, docs
- Client: Tests, env docs, rollout checklist

---

## 6. Risk Mitigation & Rollback

### 5.1 Parallel Running
- Run Nameko and AioRPC side-by-side during migration.
- Use feature flag or env to switch between old and new backend.
- Client can point to either via `NEXT_PUBLIC_API_URL`.

### 5.2 Rollback Plan
1. Revert `NEXT_PUBLIC_API_URL` to proxy URL.
2. Restore Next.js API routes from git.
3. Restart Nameko services.
4. Document rollback steps in `DEPLOYMENT.md`.

### 5.3 Testing Checklist
- [ ] All auth flows (login, register, refresh, signout)
- [ ] Session CRUD, participant management
- [ ] Question bank, topics, MCQ creation
- [ ] Chat save/fetch/delete
- [ ] Funnel participants, funnelling
- [ ] Media upload
- [ ] Super admin trainer management
- [ ] Role-based access (student, trainer, super-admin)

---

## 7. Reference Files (Eduvocate)

| Area | Eduvocate Path |
|------|----------------|
| Config | `server/config/base.py` |
| Schemas | `server/schemas/` |
| AioRPC | `server/common/aio_rpc/` |
| Nameko client | `server/api_gateway/services/nameko_client.py` |
| Auth routes | `server/api_gateway/routes/v1/auth.py` |
| RBAC | `server/api_gateway/middleware/rbac.py` |
| Auth service | `server/services/auth/v1/` |
| Client API | `client/lib/` (fetch patterns) |
| Permissions | `client/components/permissions/` |
| Permissions migration | `client/components/permissions/MIGRATION.md` |
| **Plugin + Standalone Auth** | |
| Hackathon plugin auth | `plugins/hackathon/server/api_gateway/middleware/auth.py` |
| Hackathon SSO page | `plugins/hackathon/client/src/app/sso/page.js` |
| Psychometric auth (SSO + standalone) | `plugins/psychometric_test/server/api_gateway/routes/v1/auth.py` |
| Eduvocate plugin SSO | `server/api_gateway/routes/v1/plugin.py` (generate_plugin_sso_token) |
| **Funnel env & plugin registration** | `docs/ENV_AND_PLUGIN_REGISTRATION.md` |

---

## 8. Quick Migration Examples

### 8.1 Server — Service Method (Before/After)

**Before (Nameko):**
```python
# nameko_services/services/v1/auth_service_fun/auth_service_fun.py
from nameko.rpc import rpc

class AuthService:
    name = "auth_service_fun"

    @rpc
    @error_handler
    def signin(self, data):
        email = data.get('email')
        password = data.get('password')
        # ... sync logic
        return {"access_token": "...", "status": 200}
```

**After (AioRPC):**
```python
# services/auth/v1/service.py
from common.aio_rpc import rpc

class AuthService:
    name = "auth"

    @rpc
    async def signin(self, data: dict):
        email = data.get('email')
        password = data.get('password')
        # ... async logic
        return {"access_token": "...", "status": 200}
```

### 8.2 Server — API Route (Before/After)

**Before (Generic):**
```python
# api_gateway/routers/v1/services.py
@router.post("/{service}/{method}")
async def process_data_post_v1(request, service: str, method: str, token: str = Depends(...)):
    payload = decode_token(token)
    data = await request.json()
    response = await rpc_call(service, method, payload, data)
    return Response(content=orjson.dumps(response))
```

**After (Typed):**
```python
# api_gateway/routes/v1/sessions.py
@router.post("/sessions", response_model=APIResponse)
async def save_session(data: SessionCreate, user=Depends(require_authenticated)):
    result = await call_service("sessions", "save_session", user, data.model_dump())
    return result
```

### 8.3 Client — API Call (Before/After)

**Before (Proxy):**
```javascript
// Client calls Next.js API route
const response = await fetch(`/funnel-management/api/v1/auth_service_fun/signin`, {
  method: 'POST',
  body: JSON.stringify({ email, password, role }),
});
// Next.js route proxies to: API_BASE_URL/get/auth_service_fun/signin
```

**After (Direct):**
```javascript
// lib/api/auth.js
import { apiClient } from './client';

export async function login(email, password, role) {
  return apiClient.post('/api/v1/auth/login', { email, password, role });
}
// apiClient uses NEXT_PUBLIC_API_URL
```

### 8.4 Client — Auth Hook (Before/After)

**Before:**
```javascript
// useAuth uses AuthContext + fetch to /funnel-management/api/...
const { user, login } = useAuth();
await login(email, password);
```

**After:**
```javascript
// useAuth uses lib/api/auth.js + Redux (optional)
import { login as apiLogin } from '@/lib/api/auth';
const dispatch = useDispatch();
await apiLogin(email, password);
dispatch(setUser(response.user));
```

---

## 9. Summary

| Component | Effort | Priority |
|-----------|--------|----------|
| **Dual-mode (Plugin + Standalone)** | Medium | P0 |
| SSO endpoint + auth middleware (RS256 only) | Medium | P0 |
| Client `/sso` page + `handleSSOToken()` | Low | P0 |
| Plugin registration in Eduvocate | Low | P0 |
| Server config & schemas | Medium | P0 |
| AioRPC & service migration | High | P0 |
| API gateway routes | Medium | P0 |
| Client API client & proxy removal | Medium | P0 |
| RBAC middleware | Medium | P1 |
| Redux / permissions | Low–Medium | P2 |
| Testing | Medium | P2 |
| i18n | Low | P3 |

**Estimated Total:** 6–8 weeks for full migration (P0+P1). P2/P3 can follow incrementally.
