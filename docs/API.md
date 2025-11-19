# 🔌 API Documentation: Azure Functions Endpoints

## Resumen Ejecutivo

Este documento detalla los endpoints REST de Azure Functions que manejan la validación de seguridad y acceso al portafolio.

---

## 📋 Overview

* **Base URL:** `https://franciscomora-api.azurewebsites.net`
* **Autenticación:** API Key en headers (internamente en Azure)
* **Formato:** JSON
* **Versionado:** Embedded en acción (v1, v2, etc)

---

## 🔐 Endpoint Único: `/api/validate`

### Filosofía

Un solo endpoint con múltiples **acciones** (no REST puro, pero más flexible):

```text
POST /api/validate
  ├─ action: "check_ip"       → Validar IP inicial
  └─ action: "validate_visit" → Validar con token Turnstile
```

**¿Por qué?**
- ✅ Simple (no múltiples endpoints)
- ✅ Flexible (nuevas acciones sin nuevos endpoints)
- ✅ Versionable (action: "check_ip_v2")
- ✅ Escalable

---

## 📤 Acción 1: `check_ip`

### Propósito
**Primera llamada:** Verificar IP y determinar si necesita validación adicional.

### Request

```http
POST /api/validate HTTP/1.1
Content-Type: application/json

{
  "action": "check_ip"
}
```

**Headers (automáticos del cliente):**
* `User-Agent`: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
* `X-Forwarded-For`: 186.78.20.109 (IP del cliente, extraída por Cloudflare)

### Response: Caso 1.1a (Cache Hit, Confiable)

**Status:** `200 OK`

```json
{
  "status": "known_good",
  "message": "Visitante conocido y confiable",
  "sensitiveLinks": {
    "linkedin": "[https://linkedin.com/in/franciscomora](https://linkedin.com/in/franciscomora)",
    "github": "[https://github.com/franmdev](https://github.com/franmdev)",
    "email": "francisco@example.com"
  },
  "metadata": {
    "cached": true,
    "validatedAt": "2025-11-19T10:05:55.123Z",
    "ttl": 86400
  }
}
```

**Significado:**
- IP está en caché y es confiable.
- Puede acceder inmediatamente.
- Links sensibles visibles.
- Sin Turnstile necesario.

---

### Response: Caso 1.1b (Cache Hit, Con Intentos Fallidos)

**Status:** `200 OK`

```json
{
  "status": "needs_validation",
  "message": "Se requiere validación adicional (Intento 2/3)",
  "turnstileRequired": true,
  "metadata": {
    "cached": true,
    "attempts": 2,
    "attemptLimit": 3
  }
}
```

**Significado:**
- IP está en caché pero tiene intentos fallidos previos.
- Mostrar Turnstile.
- Oportunidad para reintentar.

---

### Response: Caso 2.1 (Nueva IP Chilena, No Sospechosa)

**Status:** `200 OK`

```json
{
  "status": "needs_validation",
  "message": "IP desconocida, requiere validación Turnstile",
  "turnstileRequired": true,
  "turnstileSiteKey": "0x4AAvC_K_hRz1I6Z3...",
  "metadata": {
    "cached": false,
    "country": "CL",
    "city": "Santiago",
    "validated": false
  }
}
```

**Significado:**
- IP nueva y chilena.
- No es VPN/Proxy.
- Mostrar Turnstile para humanidad check.

---

### Response: Caso 0 (IP No Chilena)

**Status:** `200 OK` (no es error HTTP, es decisión de negocio)

```json
{
  "status": "known_bad",
  "message": "Acceso denegado por política de seguridad",
  "reason": "geographic_restriction",
  "metadata": {
    "country": "US",
    "blocked": true
  }
}
```

**Significado:**
- IP no es chilena.
- Acceso denegado inmediato.
- Sin Turnstile (es inútil).

---

### Response: Caso 2.2 (VPN/Proxy Detectado)

**Status:** `200 OK`

```json
{
  "status": "known_bad",
  "message": "Acceso denegado por política de seguridad",
  "reason": "suspicious_ip",
  "metadata": {
    "country": "CL",
    "suspicious": {
      "is_vpn": true,
      "is_proxy": false,
      "is_tor": false,
      "is_datacenter": false,
      "is_relay": false,
      "is_hosting_provider": false
    },
    "blocked": true
  }
}
```

**Significado:**
- IP chilena pero es VPN.
- Acceso denegado.
- No revelar razón exacta (privacy).

---

### Response: Error

**Status:** `500 Internal Server Error`

```json
{
  "status": "error",
  "message": "Error validando IP",
  "error": "Database connection failed",
  "timestamp": "2025-11-19T10:05:55.123Z"
}
```

---

## 📤 Acción 2: `validate_visit`

### Propósito
**Segunda llamada:** Validar token Turnstile y registrar visita si es exitosa.

### Request

```http
POST /api/validate HTTP/1.1
Content-Type: application/json

{
  "action": "validate_visit",
  "turnstile_token": "0x4AAvC_K_hRz1I6Z3...",
  "turnstile_error_code": null
}
```

**Parámetros:**
- `action`: String, siempre `"validate_visit"`
- `turnstile_token`: String, token generado por widget Turnstile
- `turnstile_error_code`: String o null, errores del widget

---

### Response: Exitosa (Status="known_good")

**Status:** `200 OK`

```json
{
  "status": "known_good",
  "message": "Validación exitosa, bienvenido",
  "sensitiveLinks": {
    "linkedin": "[https://linkedin.com/in/franciscomora](https://linkedin.com/in/franciscomora)",
    "github": "[https://github.com/franmdev](https://github.com/franmdev)",
    "email": "francisco@example.com"
  },
  "analytics": {
    "visitorId": "186.78.20.109",
    "visitedAt": "2025-11-19T10:05:55.123Z",
    "sessionExpiry": 3600
  },
  "metadata": {
    "turnstileValid": true,
    "ipRegistered": true
  }
}
```

**Significado:**
- Turnstile validado exitosamente.
- Visita registrada en DB.
- Links sensibles disponibles.
- IP guardada en caché como confiable.

---

### Response: Fallo Turnstile

**Status:** `200 OK` (no es error HTTP)

```json
{
  "status": "known_bad",
  "message": "No ha superado validador de Cloudflare",
  "metadata": {
    "turnstileValid": false,
    "reason": "invalid_token",
    "ipUpdated": true,
    "attemptCount": 2
  }
}
```

**Significado:**
- Token Turnstile inválido o expirado.
- Visita NO registrada.
- IP marcada con intento fallido (contador++).
- Usuario puede reintentar.

---

### Response: IP Sospechosa (Caso 2.2)

**Status:** `200 OK`

```json
{
  "status": "known_bad",
  "message": "Acceso denegado por política de seguridad",
  "metadata": {
    "reason": "suspicious_ip_detected",
    "suspended": true
  }
}
```

**Significado:**
- Turnstile válido pero IP es VPN/Proxy.
- Visita NO registrada.
- Acceso denegado.

---

## 🔄 Flujo Completo: Frontend ↔ Backend

### Secuencia Normal (Caso 2.1: Nueva IP)

```text
      FRONTEND                            BACKEND
         │                                   │
         ├─→ GET / (page load)               │
         │                                   │
         ├─→ DOMContentLoaded                │
         │                                   │
         ├─→ fetch("/api/validate", {        │
         │     action: "check_ip"            │
         │   })                              │
         │                                   │
         │        ←──────────────────────────┤
         │          { status: "needs_        │
         │            validation" }          │
         │                                   │
         ├─ Mostrar Turnstile                │
         │  window.turnstile.render(...)     │
         │                                   │
         ├─ Usuario completa challenge       │
         │                                   │
         ├─→ Turnstile callback obtiene token│
         │                                   │
         ├─→ fetch("/api/validate", {        │
         │     action: "validate_visit",     │
         │     turnstile_token: "..."        │
         │   })                              │
         │                                   │
         │        ←──────────────────────────┤
         │          { status: "known_        │
         │            good" }                │
         │                                   │
         ├─ Mostrar contenido                │
         │  sensitiveLinks disponibles       │
         │                                   │
```

---

## 🐍 Código Backend (Python/Azure Functions)

### Estructura Básica

```python
import azure.functions as func
import json
from shared_code import db_utils, security_utils

def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Endpoint único /api/validate
    Maneja actions: check_ip, validate_visit
    """
    try:
        # Obtener body JSON
        req_body = req.get_json()
        action = req_body.get('action')
        
        # Extraer IP desde headers (Cloudflare)
        ip = req.headers.get('X-Forwarded-For', '0.0.0.0')
        
        # Dispatcher según action
        if action == 'check_ip':
            return handle_check_ip(ip, req_body)
        
        elif action == 'validate_visit':
            return handle_validate_visit(ip, req_body)
        
        else:
            return func.HttpResponse(
                json.dumps({'error': 'Invalid action'}),
                status_code=400,
                mimetype='application/json'
            )

    except Exception as e:
        logging.error(f"API error: {e}")
        return func.HttpResponse(
            json.dumps({'status': 'error', 'message': str(e)}),
            status_code=500,
            mimetype='application/json'
        )
```

### Handler: `check_ip`

```python
def handle_check_ip(ip: str, req_body: dict) -> func.HttpResponse:
    """
    Acción 1: Verificar IP
    Retorna: status (known_good|known_bad|needs_validation)
    """
    # PASO 1: Verificar caché
    cached = db_utils.get_ip_from_cache(ip)
    
    if cached:
        # IP en caché
        if cached['is_suspicious']:
            # Caso 1.2: Sospechosa
            return func.HttpResponse(
                json.dumps({
                    'status': 'known_bad',
                    'message': 'Acceso denegado'
                }),
                status_code=200,
                mimetype='application/json'
            )
        
        elif cached['is_bot_possible'] > 0:
            # Caso 1.1b: Intentos fallidos
            return func.HttpResponse(
                json.dumps({
                    'status': 'needs_validation',
                    'message': f"Intento {cached['is_bot_possible'] + 1}/3"
                }),
                status_code=200,
                mimetype='application/json'
            )
        
        else:
            # Caso 1.1a: Fast Pass
            return func.HttpResponse(
                json.dumps({
                    'status': 'known_good',
                    'sensitiveLinks': {
                        'linkedin': LINKEDIN_URL,
                        'github': GITHUB_URL
                    }
                }),
                status_code=200,
                mimetype='application/json'
            )

    # PASO 2: Caché miss, validaciones completas
    
    # Validar país
    geo_data = security_utils.get_geo_info(ip)
    if geo_data['country_code'] != 'CL':
        # Caso 0: No chilena
        db_utils.set_ip_in_cache(ip, geo_data, is_suspicious=True, is_bot_possible=0)
        return func.HttpResponse(
            json.dumps({'status': 'known_bad'}),
            status_code=200,
            mimetype='application/json'
        )

    # Validar VPN/Proxy
    is_suspicious, flags = security_utils.check_suspicious_ip(ip)
    if is_suspicious:
        # Caso 2.2: VPN detectada
        db_utils.set_ip_in_cache(ip, geo_data, is_suspicious=True, is_bot_possible=0)
        return func.HttpResponse(
            json.dumps({'status': 'known_bad'}),
            status_code=200,
            mimetype='application/json'
        )

    # Caso 2.1: Nueva IP chilena, limpia
    db_utils.set_ip_in_cache(ip, geo_data, is_suspicious=False, is_bot_possible=0)
    return func.HttpResponse(
        json.dumps({
            'status': 'needs_validation',
            'turnstileRequired': True,
            'turnstileSiteKey': os.getenv('TURNSTILE_SITE_KEY')
        }),
        status_code=200,
        mimetype='application/json'
    )
```

### Handler: `validate_visit`

```python
def handle_validate_visit(ip: str, req_body: dict) -> func.HttpResponse:
    """
    Acción 2: Validar Turnstile y registrar visita
    """
    token = req_body.get('turnstile_token')
    
    # Validar token
    if not security_utils.validate_turnstile(token, ip):
        # Fallo Turnstile
        db_utils.increment_bot_counter(ip)
        return func.HttpResponse(
            json.dumps({
                'status': 'known_bad',
                'message': 'No ha superado validador'
            }),
            status_code=200,
            mimetype='application/json'
        )

    # Token válido
    geo_data = security_utils.get_geo_info(ip)
    
    # Verificar nuevamente si es sospechosa
    is_suspicious, _ = security_utils.check_suspicious_ip(ip)
    if is_suspicious:
        return func.HttpResponse(
            json.dumps({
                'status': 'known_bad',
                'message': 'IP sospechosa'
            }),
            status_code=200,
            mimetype='application/json'
        )

    # Registrar visita (ÚNICA VEZ aquí)
    user_agent = req.headers.get('User-Agent', '')
    browser = parse_browser(user_agent)
    db_utils.insert_visitor_data(ip, geo_data, user_agent, browser)
    
    db_utils.set_ip_in_cache(ip, geo_data, is_suspicious=False, is_bot_possible=0)

    # Respuesta exitosa
    return func.HttpResponse(
        json.dumps({
            'status': 'known_good',
            'sensitiveLinks': {
                'linkedin': LINKEDIN_URL,
                'github': GITHUB_URL
            }
        }),
        status_code=200,
        mimetype='application/json'
    )
```

---

## 📊 Formatos de Respuesta

### Success Response

```json
{
  "status": "known_good|known_bad|needs_validation",
  "message": "Human readable message",
  "sensitiveLinks": {
    "linkedin": "URL",
    "github": "URL"
  },
  "metadata": {
    "cached": true|false,
    "validatedAt": "ISO8601",
    "ttl": 86400
  }
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Error description",
  "error": "Detailed error",
  "timestamp": "ISO8601"
}
```

---

## 🧪 Testing con cURL

### Test 1: Check IP (Nueva)

```bash
curl -X POST [https://franciscomora-api.azurewebsites.net/api/validate](https://franciscomora-api.azurewebsites.net/api/validate) \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 186.78.20.109" \
  -d '{
    "action": "check_ip"
  }'
```

**Respuesta esperada:**
```json
{
  "status": "needs_validation",
  "turnstileRequired": true
}
```

### Test 2: Validate Visit (Con token)

```bash
curl -X POST [https://franciscomora-api.azurewebsites.net/api/validate](https://franciscomora-api.azurewebsites.net/api/validate) \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 186.78.20.109" \
  -d '{
    "action": "validate_visit",
    "turnstile_token": "0x4AAvC_K_..."
  }'
```

---

## ⚙️ Configuration

### Environment Variables (Azure App Settings)

```env
TURNSTILE_SITE_KEY=0x4AAvC_K_...
TURNSTILE_SECRET_KEY=0x4AAvC_K_...
DB_HOST=franciscomora-db.postgres.database.azure.com
DB_USER=postgres
DB_PASSWORD=***
DB_NAME=portafolio
IPAPI_SECRET_KEY=***
LINKEDIN_URL=[https://linkedin.com/in/](https://linkedin.com/in/)...
GITHUB_URL=[https://github.com/](https://github.com/)...
```

---

## 🔍 Error Handling

### HTTP Status Codes

| Code | Meaning | Example |
|:---:|---|---|
| **200** | OK (incluso si status="known_bad") | Decisión de negocio |
| **400** | Bad request (action inválida) | action="unknown" |
| **500** | Server error (DB falla, API externa) | PostgreSQL down |
| **503** | Service unavailable (Azure Functions) | Throttled |

### Retry Logic (Frontend)

```javascript
async function validateWithRetry(data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        body: JSON.stringify(data),
        timeout: 5000
      });

      if (response.ok) {
        return await response.json();
      } else if (response.status === 503) {
        // Retry después de delay exponencial
        await sleep(Math.pow(2, i) * 1000);
        continue;
      }
      
      return null;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
    }
  }
}
```

---

## 📈 Rate Limiting

**Azure Functions:** Automático por tier
**Custom Rate Limit:** 15 req/min por IP (en el código)

```python
def check_rate_limit(ip: str) -> bool:
    """
    Implementado en caché de Azure Functions
    Límite: 15 requests/min
    """
    LIMIT = 15
    WINDOW = 60 # segundos
    # ... lógica ...
    return allowed
```

---

## 🎓 Lecciones de API Design

✅ **Endpoint único con acciones** → Flexible, escalable
✅ **HTTP 200 para decisiones de negocio** → Distinguir errores reales
✅ **JSON responses** → Estándar, fácil parsear
✅ **Logging exhaustivo** → Debug en producción
✅ **Timeout y retry logic** → Resilencia

---

## 📚 Referencias

- [Azure Functions HTTP Bindings](https://learn.microsoft.com/azure/azure-functions/functions-bindings-http-webhook)
- [REST API Best Practices](https://restfulapi.net/)
- [Turnstile API Docs](https://developers.cloudflare.com/turnstile/get-started/)

---

**Última actualización:** Noviembre 19, 2025
**Audiencia objetivo:** Backend Engineers, API Consumers
**Tiempo de lectura:** 8-10 minutos
**Complejidad técnica:** ⭐⭐⭐ (Media)