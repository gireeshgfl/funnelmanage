# RSA Keys for JWT (RS256)

Funnel Management uses RS256 exclusively for JWT signing and verification.

## Required Files

| File | Purpose | Git |
|------|---------|-----|
| `private.pem` | Sign tokens (standalone auth) | ❌ Ignored |
| `public.pem` | Verify Funnel tokens | ✅ Committed |

## Generate Keys

```bash
# From server/ directory
mkdir -p keys
cd keys

# Generate private key (2048-bit RSA)
openssl genrsa -out private.pem 2048
chmod 600 private.pem

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem
```

## Usage

- **Standalone:** Funnel signs tokens with `private.pem`, verifies with `public.pem`
- **Plugin mode:** Eduvocate SSO tokens are verified with Eduvocate's public key (env: `EDUVOCATE_JWT_PUBLIC_KEY`)

## Env Variables

```env
JWT_PRIVATE_KEY_PATH=keys/private.pem
JWT_PUBLIC_KEY_PATH=keys/public.pem
```

## Reference

Same pattern as Eduvocate: `eduvocate/server/keys/` has `public.pem` committed, `private.pem` gitignored. All apps use keys — see `docs/ENV_AND_PLUGIN_REGISTRATION.md` Section 0.
