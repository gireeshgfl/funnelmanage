# Funnel Management — Environment Variables & Plugin Registration

This document defines environment variables for Funnel Management in both **standalone** and **Eduvocate plugin** modes, for **local** and **production** environments. Reference: Eduvocate repository.

---

## 0. Keys Across All Apps (RS256)

All apps use RSA keys for JWT. Summary:

| App | Keys Directory | private.pem | public.pem | Eduvocate Public Key |
|-----|----------------|-------------|------------|----------------------|
| **Eduvocate** | `server/keys/` | Signs tokens | Verifies tokens | — |
| **Hackathon** | `plugins/hackathon/server/keys/` | — | Copy of Eduvocate's | Verifies SSO |
| **Psychometric** | `plugins/psychometric_test/server/keys/` | Optional (sign own) | Copy of Eduvocate's | Verifies SSO |
| **Funnel Management** | `server/keys/` | Signs standalone tokens | Verifies Funnel tokens | `EDUVOCATE_JWT_PUBLIC_KEY` (plugin mode) |

**Key flow (Plugin):** Eduvocate signs SSO token with its private key → Plugin verifies with Eduvocate's public key.  
**Key flow (Standalone):** Funnel signs with its private key → Verifies with its public key.

**Generate Funnel keys:** See `server/keys/README.md` or Section 5 below.

---

## 1. Eduvocate Side (Reference Project)

### 1.1 Plugin Registration

Funnel is registered in Eduvocate via `eduvocate/server/scripts/register_plugins.py`:

```python
# Plugin ID used everywhere (Eduvocate + Funnel)
plugin_id = "funnel"

funnel_plugin = {
    "plugin_id": "funnel",
    "name": "Funnel Management",
    "app_url": os.getenv("FUNNEL_APP_URL", "http://localhost:3004"),
    "metadata": {
        "service_name": "funnel_service_v1",
        "database": "eduvocate_funnel",
        "allowed_roles": ["admin", "subadmin", "student", "mentor", "trainer"],
        "auth_config": {
            "supports_independent_auth": True,
            "requires_installation": True,
            "default_scopes": ["profile:read", "funnel:read", "funnel:write"]
        },
        # ...
    }
}
```

**Register plugin:** From Eduvocate server root:
```bash
cd eduvocate/server
python scripts/register_plugins.py
```

### 1.2 Eduvocate Environment Variables — Plugin URLs

| Variable | Local (development) | Production |
|----------|---------------------|------------|
| `FUNNEL_APP_URL` | `http://localhost:3004` | `https://funnel.eduvocate.org` |

**Eduvocate `.env` (local):**
```env
FUNNEL_APP_URL=http://localhost:3004
```

**Eduvocate `.env.production`:**
```env
FUNNEL_APP_URL=https://funnel.eduvocate.org
```

**Note:** `FUNNEL_APP_URL` is the URL users are redirected to when clicking the Funnel plugin in Eduvocate dashboard. It should point to the Funnel Management client (Next.js app). SSO redirect will be: `{FUNNEL_APP_URL}/sso?token=...`

### 1.3 Eduvocate Plugin URL Reference (All Plugins)

| Plugin | Local | Production |
|--------|-------|------------|
| Psychometric | `http://localhost:8010` or `3001` | `https://psychometric.eduvocate.org` |
| Hackathon | `http://localhost:3002` or `8011` | `https://hackathon.eduvocate.org` |
| Exam | `http://localhost:3003` | `https://exam.eduvocate.org` |
| **Funnel** | `http://localhost:3004` | `https://funnel.eduvocate.org` |

---

## 2. Funnel Management — Server Environment

### 2.1 Local Development (Standalone)

**File:** `funnelmanage/server/.env.example` → copy to `.env`

```env
# ============================================================================
# Funnel Management Server - LOCAL (Standalone)
# ============================================================================
# cp .env.example .env

# ================== Application ==================
APP_NAME=Funnel Management
APP_VERSION=1.0.0
ENVIRONMENT=development
DEBUG=true

# ================== API Gateway ==================
API_HOST=0.0.0.0
API_PORT=8001

# ================== Database ==================
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=funnel_management
MONGODB_MAX_POOL_SIZE=10

# ================== Redis ==================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
REDIS_URL=redis://localhost:6379/0

# ================== RabbitMQ / Nameko ==================
AMQP_URI=amqp://guest:guest@localhost:5672

# ================== Security (RS256 Only - No HS256) ==================
JWT_ALGORITHM=RS256
JWT_PRIVATE_KEY_PATH=server/keys/private.pem
JWT_PUBLIC_KEY_PATH=server/keys/public.pem
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# ================== Eduvocate Integration (Optional - for Plugin Mode) ==================
# Leave empty for standalone-only. Set when running as Eduvocate plugin.
EDUVOCATE_PLUGIN_ID=
EDUVOCATE_API_URL=
# For verifying Eduvocate SSO tokens (get from /api/v1/plugins/funnel/sso/public-key)
EDUVOCATE_JWT_PUBLIC_KEY=

# ================== AWS S3 ==================
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
S3_BUCKET_NAME=funnel-management

# ================== CORS ==================
CORS_ORIGINS=["http://localhost:3001", "http://localhost:3004", "http://localhost:5173"]

# ================== Frontend URL (for redirects, emails) ==================
FRONTEND_URL=http://localhost:3004
```

### 2.2 Local Development (Plugin Mode — with Eduvocate)

**File:** `funnelmanage/server/.env` (when testing plugin integration)

```env
# Same as above, plus:

# Eduvocate Integration
EDUVOCATE_PLUGIN_ID=funnel
EDUVOCATE_API_URL=http://localhost:8000
# For verifying Eduvocate SSO tokens
EDUVOCATE_JWT_PUBLIC_KEY=

# CORS - add Eduvocate origins
CORS_ORIGINS=["http://localhost:3000", "http://localhost:3004", "http://localhost:8000"]
```

### 2.3 Production (Standalone)

**File:** `funnelmanage/server/.env.production`

```env
# ============================================================================
# Funnel Management Server - PRODUCTION (Standalone)
# ============================================================================

APP_NAME=Funnel Management
APP_VERSION=1.0.0
ENVIRONMENT=production
DEBUG=false

API_HOST=0.0.0.0
API_PORT=8001

MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=funnel_management
MONGODB_MAX_POOL_SIZE=50

REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_URL=redis://redis-host:6379/0

AMQP_URI=amqp://user:pass@rabbitmq-host:5672

JWT_ALGORITHM=RS256
JWT_PRIVATE_KEY_PATH=/app/keys/private.pem
JWT_PUBLIC_KEY_PATH=/app/keys/public.pem
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Standalone - no Eduvocate
EDUVOCATE_PLUGIN_ID=
EDUVOCATE_API_URL=
EDUVOCATE_JWT_PUBLIC_KEY=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
S3_BUCKET_NAME=funnel-management-prod

CORS_ORIGINS=["https://funnel.yourdomain.com", "https://www.funnel.yourdomain.com"]
FRONTEND_URL=https://funnel.yourdomain.com
```

### 2.4 Production (Plugin Mode — Eduvocate Integration)

**File:** `funnelmanage/server/.env.production` (when deployed as Eduvocate plugin)

```env
# Same as Standalone Production, plus:

EDUVOCATE_PLUGIN_ID=funnel
EDUVOCATE_API_URL=https://api.eduvocate.org
EDUVOCATE_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
<Eduvocate's RS256 public key - get from /api/v1/plugins/funnel/sso/public-key>
-----END PUBLIC KEY-----"

# CORS - add Eduvocate domain
CORS_ORIGINS=["https://funnel.eduvocate.org", "https://eduvocate.org", "https://api.eduvocate.org"]
FRONTEND_URL=https://funnel.eduvocate.org
```

---

## 3. Funnel Management — Client Environment

### 3.1 Local Development (Standalone)

**File:** `funnelmanage/client/.env.example` → copy to `.env.local`

```env
# ============================================================================
# Funnel Management Client - LOCAL (Standalone)
# ============================================================================
# cp .env.example .env.local

# API URL - points to Funnel backend (Next.js proxy or direct)
# When using Next.js API routes as proxy: use relative or proxy URL
# When calling backend directly:
NEXT_PUBLIC_API_URL=http://localhost:8001

# Host endpoint (if used)
NEXT_PUBLIC_HOST_ENDPOINT=http://localhost:3004

# S3 (for presigned URLs, etc.)
NEXT_PUBLIC_S3_BUCKET=funnel-management
```

### 3.2 Local Development (Plugin Mode)

**File:** `funnelmanage/client/.env.local` (when testing with Eduvocate)

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_EDUVOCATE_URL=http://localhost:3000
NEXT_PUBLIC_HOST_ENDPOINT=http://localhost:3004
```

### 3.3 Production (Standalone)

**File:** `funnelmanage/client/.env.production`

```env
NEXT_PUBLIC_API_URL=https://api.funnel.yourdomain.com
NEXT_PUBLIC_EDUVOCATE_URL=
NEXT_PUBLIC_HOST_ENDPOINT=https://funnel.yourdomain.com
NEXT_PUBLIC_S3_BUCKET=funnel-management-prod
```

### 3.4 Production (Plugin Mode)

**File:** `funnelmanage/client/.env.production`

```env
NEXT_PUBLIC_API_URL=https://api.funnel.eduvocate.org
NEXT_PUBLIC_EDUVOCATE_URL=https://eduvocate.org
NEXT_PUBLIC_HOST_ENDPOINT=https://funnel.eduvocate.org
NEXT_PUBLIC_S3_BUCKET=funnel-management
```

---

## 4. Port & Domain Mapping

### 4.1 Local Development

| Component | Port | URL |
|-----------|------|-----|
| Funnel Client (Next.js) | 3001 or 3004 | `http://localhost:3001` or `http://localhost:3004` |
| Funnel Server (API) | 8001 | `http://localhost:8001` |
| Eduvocate Client | 3000 | `http://localhost:3000` |
| Eduvocate API | 8000 | `http://localhost:8000` |

**Consistency:** Set `FUNNEL_APP_URL=http://localhost:3004` in Eduvocate when Funnel client runs on 3004. Match `NEXT_PUBLIC_HOST_ENDPOINT` in Funnel client.

### 4.2 Production (Eduvocate Plugin)

| Component | Domain |
|-----------|--------|
| Eduvocate | `https://eduvocate.org` |
| Eduvocate API | `https://api.eduvocate.org` |
| Funnel Management | `https://funnel.eduvocate.org` |
| Funnel API | `https://api.funnel.eduvocate.org` (or same host with path) |
| Hackathon | `https://hackathon.eduvocate.org` |
| Psychometric | `https://psychometric.eduvocate.org` |

---

## 5. RSA Key Generation

**Generate Funnel's key pair** (for standalone tokens):
```bash
# Create keys directory
mkdir -p server/keys

# Generate private key
openssl genrsa -out server/keys/private.pem 2048

# Extract public key
openssl rsa -in server/keys/private.pem -pubout -out server/keys/public.pem
```

**Eduvocate public key:** Fetch when in plugin mode:
```bash
curl https://api.eduvocate.org/api/v1/plugins/funnel/sso/public-key
```

---

## 6. Summary Table — Key Variables

| Variable | Funnel Server | Funnel Client | Eduvocate Server |
|----------|---------------|---------------|------------------|
| **Standalone Local** | | | |
| API URL | `API_PORT=8001` | `NEXT_PUBLIC_API_URL=http://localhost:8001` | — |
| Frontend | `FRONTEND_URL=http://localhost:3004` | — | — |
| **Plugin Local** | | | |
| EDUVOCATE_PLUGIN_ID | `funnel` | — | — |
| EDUVOCATE_API_URL | `http://localhost:8000` | `NEXT_PUBLIC_EDUVOCATE_URL=http://localhost:3000` | — |
| FUNNEL_APP_URL | — | — | `http://localhost:3004` |
| **Plugin Production** | | | |
| EDUVOCATE_PLUGIN_ID | `funnel` | — | — |
| EDUVOCATE_API_URL | `https://api.eduvocate.org` | `NEXT_PUBLIC_EDUVOCATE_URL=https://eduvocate.org` | — |
| FUNNEL_APP_URL | — | — | `https://funnel.eduvocate.org` |

---

## 7. Checklist — Plugin Registration & Env Setup

**Eduvocate (reference project):**
- [ ] Add `FUNNEL_APP_URL` to `eduvocate/server/.env` (local) and `.env.production`
- [ ] Run `python scripts/register_plugins.py` after adding funnel plugin
- [ ] Verify `plugins` collection has document with `plugin_id: "funnel"`

**Funnel Management:**
- [ ] Create `server/.env.example` and `server/.env` (from examples above)
- [ ] Create `client/.env.example` and `client/.env.local`
- [ ] For plugin mode: set `EDUVOCATE_PLUGIN_ID`, `EDUVOCATE_API_URL`, `JWT_PUBLIC_KEY` on server
- [ ] For plugin mode: set `NEXT_PUBLIC_EDUVOCATE_URL` on client
