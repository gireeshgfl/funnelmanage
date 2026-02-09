# Authentication Flow: Eduvocate → Plugins (Hackathon & Psychometric)

## Overview

This document explains the authentication flow when users access plugins (like Hackathon or Psychometric) from the Eduvocate dashboard, and addresses common JWT token validation issues.

---

## 1. Authentication Flow: Eduvocate → Plugin

### 1.1 Flow Diagram

```
┌─────────────────┐
│   Eduvocate     │
│   Dashboard     │
└────────┬────────┘
         │ 1. User clicks plugin
         │
         ▼
┌─────────────────────────────────────────┐
│   Eduvocate API                         │
│   /api/v1/plugin-proxy/{plugin}/access-url │
│                                         │
│   Generates JWT with:                   │
│   - iss: "eduvocate"                    │
│   - aud: "plugin:{plugin_id}"            │
│   - sub: user_id                        │
│   - email, role, scopes, etc.           │
└────────┬────────────────────────────────┘
         │ 2. Returns access_url with token
         │
         ▼
┌─────────────────────────────────────────┐
│   Plugin Client                         │
│   (e.g., hackathon.eduvocate.org)       │
│                                         │
│   Receives:                             │
│   /sso?token=eyJhbGci...                │
└────────┬────────────────────────────────┘
         │ 3. Stores token in cookie
         │    (hackathon_token, etc.)
         │
         ▼
┌─────────────────────────────────────────┐
│   Plugin API                            │
│   (e.g., /api/v1/hackathon/.../login)   │
│                                         │
│   Validates token:                      │
│   - Verifies signature (RS256)          │
│   - Checks audience (aud)               │
│   - Checks issuer (iss)                 │
│   - Validates expiration                │
└─────────────────────────────────────────┘
```

### 1.2 Token Structure

When Eduvocate generates a token for a plugin, it includes:

```json
{
  "sub": "698829e392ccd78eefcdbd25",
  "email": "student1@eduvocate.com",
  "r": "student",
  "fn": "John Doe",
  "sa": false,
  "pid": "698829d8eac7b60d65aa5df0",  // Plugin ID
  "scp": ["read:profile", "read:courses", "write:progress"],
  "iat": 1770621141,
  "exp": 1770707541,
  "nbf": 1770621141,
  "iss": "eduvocate",                  // Issuer
  "aud": "plugin:698829d8eac7b60d65aa5df0",  // Audience (plugin ID)
  "jti": "ElQqGdpt2SpJfH-kTQzGGueDzmAvSrW8GzxiDIhSvxQ"
}
```

**Key Fields:**
- `iss` (issuer): Always `"eduvocate"` for SSO tokens
- `aud` (audience): `"plugin:{plugin_id}"` format
- `pid`: The plugin ID (MongoDB ObjectId)
- `scp`: Scopes granted to the plugin

---

## 2. Issue #1: Audience Mismatch in Hackathon Service

### 2.1 Problem

**Error:** `{"detail":"Invalid token: Audience doesn't match"}`

**Root Cause:**
The Hackathon service is validating the JWT token but checking for a different audience value than what Eduvocate provides.

**Token from Eduvocate:**
```json
{
  "aud": "plugin:698829d8eac7b60d65aa5df0"
}
```

**What Hackathon expects:**
The service might be checking for:
- `aud: "hackathon"` (hardcoded)
- `aud: "plugin:hackathon"` (string plugin ID)
- Or not handling the `plugin:{objectId}` format correctly

### 2.2 Solution

The Hackathon service needs to:

1. **Accept multiple audience formats:**
   ```python
   # Accept either:
   # - "plugin:{plugin_id}" (ObjectId format)
   # - "plugin:hackathon" (string plugin ID)
   # - "hackathon" (legacy format)
   ```

2. **Validate audience correctly:**
   ```python
   import jwt
   from api_gateway.config import EDUVOCATE_JWT_PUBLIC_KEY, EDUVOCATE_PLUGIN_ID
   
   def validate_plugin_token(token: str):
       try:
           # Decode with Eduvocate's public key
           payload = jwt.decode(
               token,
               EDUVOCATE_JWT_PUBLIC_KEY,
               algorithms=["RS256"],
               options={
                   "verify_signature": True,
                   "verify_exp": True,
                   "verify_iss": True,
                   "verify_aud": False  # We'll check manually
               }
           )
           
           # Verify issuer
           if payload.get("iss") != "eduvocate":
               raise ValueError("Invalid issuer")
           
           # Verify audience - accept multiple formats
           aud = payload.get("aud")
           plugin_id = payload.get("pid")  # Plugin ID from token
           
           expected_audiences = [
               f"plugin:{plugin_id}",      # ObjectId format
               f"plugin:{EDUVOCATE_PLUGIN_ID}",  # String plugin ID
               EDUVOCATE_PLUGIN_ID,        # Just plugin ID
               "hackathon"                 # Legacy format
           ]
           
           if aud not in expected_audiences:
               raise ValueError(f"Invalid audience: {aud}. Expected one of {expected_audiences}")
           
           return payload
           
       except jwt.ExpiredSignatureError:
           raise ValueError("Token has expired")
       except jwt.InvalidTokenError as e:
           raise ValueError(f"Invalid token: {str(e)}")
   ```

3. **Update middleware/auth.py:**
   ```python
   # In hackathon/server/api_gateway/middleware/auth.py
   
   @app.middleware("http")
   async def authorization_middleware(request: Request, call_next):
       # ... existing code ...
       
       try:
           # Try to validate as Eduvocate SSO token first
           if token.startswith("Bearer "):
               token = token[len("Bearer "):]
           
           # Check if it's an Eduvocate token (has 'iss' = 'eduvocate')
           # We can decode without verification first to check issuer
           unverified = jwt.decode(token, options={"verify_signature": False})
           
           if unverified.get("iss") == "eduvocate":
               # Validate with Eduvocate public key
               payload = validate_plugin_token(token)
           else:
               # Validate with Hackathon's own key (standalone mode)
               payload = jwt.decode(token, HACKATHON_PUBLIC_KEY, algorithms=["RS256"])
           
           request.state.user = {
               "user_id": payload.get("sub"),
               "email": payload.get("email"),
               "role": payload.get("r"),
               "auth_source": "sso" if payload.get("iss") == "eduvocate" else "local"
           }
           
       except ValueError as e:
           return JSONResponse(
               status_code=401,
               content={"detail": str(e)}
           )
   ```

### 2.3 Configuration

**Hackathon `.env`:**
```env
# Eduvocate Integration
EDUVOCATE_PLUGIN_ID=hackathon
EDUVOCATE_API_URL=https://api.eduvocate.org
EDUVOCATE_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----"

# Hackathon's own keys (for standalone mode)
JWT_PUBLIC_KEY_PATH=server/keys/public.pem
```

---

## 3. Issue #2: Psychometric Service Timeout Parameter

### 3.1 Problem

**Error:** `TypeError: PsychometricService.get_dashboard_data() got an unexpected keyword argument 'timeout'`

**Root Cause:**
The API gateway or RPC caller is passing a `timeout` parameter to `get_dashboard_data()`, but the method signature doesn't accept it.

### 3.2 Solution

**Option 1: Remove timeout from method call (Recommended)**

If the timeout is being passed incorrectly from the API gateway:

```python
# In psychometric/server/api_gateway/routers/v1/services.py or similar

# BEFORE (incorrect):
response = service_method(payload, timeout=10)

# AFTER (correct):
response = service_method(payload)
```

**Option 2: Add timeout parameter to method (If timeout is needed)**

If you actually need timeout functionality:

```python
# In psychometric/server/services/v1/psychometric_service/psychometric_service.py

class PsychometricService:
    name = 'psychometric_service'
    
    @rpc
    def get_dashboard_data(self, payload, timeout=None):
        """
        Get dashboard data for psychometric tests.
        
        Args:
            payload: User payload from JWT token
            timeout: Optional timeout (not used, kept for compatibility)
        """
        # Your existing implementation
        user_id = payload.get('user_id') or payload.get('sub')
        
        # ... rest of the method
        return {
            "status": 200,
            "data": {
                # ... dashboard data
            }
        }
```

**Option 3: Fix RPC call wrapper**

If the timeout is coming from an RPC wrapper:

```python
# In psychometric/server/api_gateway/routers/v1/services.py

async def rpc_call(service: str, method: str, *args, **kwargs):
    """
    Helper function to perform an RPC call using Nameko.
    Note: timeout is handled at the anyio level, not passed to service methods.
    """
    try:
        def make_rpc_call():
            with ClusterRpcProxy(CONFIG) as rpc:
                service_proxy = getattr(rpc, service)
                service_method = getattr(service_proxy, method)
                
                # Remove timeout from kwargs if present (it's not a service method parameter)
                kwargs_clean = {k: v for k, v in kwargs.items() if k != 'timeout'}
                
                return service_method(*args, **kwargs_clean)
        
        # Timeout is handled here, not passed to service method
        with anyio.fail_after(10.0):  # 10 second timeout
            result = await anyio.to_thread.run_sync(make_rpc_call)
            return result
    except Exception as e:
        logger.exception("Error in rpc_call: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")
```

### 3.3 Quick Fix

The quickest fix is to ensure the API gateway doesn't pass `timeout` to service methods:

```python
# Find where get_dashboard_data is called and remove timeout parameter
# Example location: psychometric/server/api_gateway/routers/v1/services.py

@router.get("/psychometric/dashboard")
async def get_dashboard(
    request: Request,
    token: str = Depends(cookie_or_header_token)
):
    payload = decode_token(token)
    
    # BEFORE:
    # response = await rpc_call("psychometric_service", "get_dashboard_data", payload, timeout=10)
    
    # AFTER:
    response = await rpc_call("psychometric_service", "get_dashboard_data", payload)
    
    return Response(content=orjson.dumps(response), status_code=response.get("status", 200))
```

---

## 4. Common Patterns Across All Plugins

### 4.1 Token Validation Pattern

All plugins should follow this pattern:

```python
def validate_token(token: str, expected_plugin_id: str):
    """
    Validate JWT token from Eduvocate or plugin's own auth.
    
    Returns:
        dict: Decoded payload
    """
    try:
        # Try to decode without verification to check issuer
        unverified = jwt.decode(token, options={"verify_signature": False})
        issuer = unverified.get("iss")
        
        if issuer == "eduvocate":
            # SSO token from Eduvocate
            public_key = EDUVOCATE_JWT_PUBLIC_KEY
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_iss": True,
                    "verify_aud": False  # Check manually
                }
            )
            
            # Verify audience
            aud = payload.get("aud")
            pid = payload.get("pid")
            
            valid_audiences = [
                f"plugin:{pid}",
                f"plugin:{expected_plugin_id}",
                expected_plugin_id
            ]
            
            if aud not in valid_audiences:
                raise ValueError(f"Invalid audience: {aud}")
                
        else:
            # Plugin's own token (standalone mode)
            public_key = load_public_key(JWT_PUBLIC_KEY_PATH)
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"]
            )
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {str(e)}")
```

### 4.2 Environment Variables Pattern

All plugins should have:

```env
# Plugin mode (Eduvocate integration)
EDUVOCATE_PLUGIN_ID={plugin_id}  # e.g., "hackathon", "psychometric"
EDUVOCATE_API_URL=https://api.eduvocate.org
EDUVOCATE_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----..."

# Standalone mode
JWT_ALGORITHM=RS256
JWT_PUBLIC_KEY_PATH=server/keys/public.pem
JWT_PRIVATE_KEY_PATH=server/keys/private.pem  # If plugin signs its own tokens
```

---

## 5. Testing

### 5.1 Test Token Validation

```python
# Test script to verify token validation
import jwt

# Decode token without verification to inspect
token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

unverified = jwt.decode(token, options={"verify_signature": False})
print("Issuer:", unverified.get("iss"))
print("Audience:", unverified.get("aud"))
print("Plugin ID:", unverified.get("pid"))
print("User ID:", unverified.get("sub"))
```

### 5.2 Test with curl

```bash
# Test hackathon login endpoint
curl 'https://hackathon.eduvocate.org/api/v1/hackathon/hackathons/{id}/login' \
  -X 'POST' \
  -H 'authorization: Bearer {token}' \
  -H 'content-type: application/json'

# Test psychometric dashboard
curl 'https://psychometric.eduvocate.org/api/v1/psychometric/dashboard' \
  -H 'authorization: Bearer {token}' \
  -H 'content-type: application/json'
```

---

## 6. Summary

### Hackathon Audience Issue
- **Problem:** Token has `aud: "plugin:{objectId}"` but service expects different format
- **Fix:** Update audience validation to accept `plugin:{pid}` format
- **Location:** `hackathon/server/api_gateway/middleware/auth.py`

### Psychometric Timeout Issue
- **Problem:** `timeout` parameter passed to service method that doesn't accept it
- **Fix:** Remove `timeout` from method call or add it to method signature
- **Location:** `psychometric/server/api_gateway/routers/v1/services.py` or service method

### General Pattern
- All plugins should validate both Eduvocate SSO tokens and standalone tokens
- Audience validation should be flexible to handle different formats
- RPC timeouts should be handled at the gateway level, not passed to service methods
