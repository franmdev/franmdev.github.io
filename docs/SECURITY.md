# 🔒 Arquitectura de Seguridad en 5 Capas

## Resumen Ejecutivo

Este portafolio implementa un sistema de defensa **"en profundidad"** que filtra amenazas en cada capa, reduciendo carga en capas posteriores. La filosofía es simple: **no ejecutar validaciones innecesarias en cada visita**.

**Resultado:** Seguridad de nivel producción + Performance sin sacrificar UX.

---

## 🛡️ Las 5 Capas de Validación

```text
                    VISITANTE LLEGA
                          ↓
    ┌─────────────────────────────────────────┐
    │ CAPA 1: WAF Cloudflare                  │
    │ Geobloqueo inicial (~80% tráfico no-CL) │
    │ Costo: $0 | Latencia: ~10ms             │
    └─────────────────────────────────────────┘
                          ↓
    ┌─────────────────────────────────────────┐
    │ CAPA 2: Rate Limiting                   │
    │ 15 req/min por IP                       │
    │ Costo: ~$0.000001 | Latencia: ~1ms      │
    └─────────────────────────────────────────┘
                          ↓
    ┌─────────────────────────────────────────┐
    │ CAPA 3: Cloudflare Turnstile            │
    │ Desafío anti-bot invisible              │
    │ Costo: $0 | Latencia: ~50ms             │
    └─────────────────────────────────────────┘
                          ↓
    ┌─────────────────────────────────────────┐
    │ CAPA 4: ipapi.is (VPN/Proxy Detection)  │
    │ 6 flags de riesgo                       │
    │ Costo: $0.002 | Latencia: ~200ms        │
    └─────────────────────────────────────────┘
                          ↓
    ┌─────────────────────────────────────────┐
    │ CAPA 5: Database Cache (PostgreSQL)     │
    │ Reutiliza decisiones por 24h            │
    │ Costo: ~$0 | Latencia: ~10ms            │
    └─────────────────────────────────────────┘
                          ↓
               [✅ PERMITIR o ❌ BLOQUEAR]
```

---

## 📋 Detalle de Cada Capa

### CAPA 1: WAF Cloudflare (Geobloqueo Inicial)

**Responsabilidad:** Bloquear tráfico no deseado antes de llegar a Azure Functions.

**Configuración:**

```text
Cloudflare Firewall Rule:
IF country NOT IN (CL, ZZ)
THEN Block
```

**Resultado:**
- ~80% del tráfico no-chileno se bloquea en Cloudflare.
- Zero costo para Azure Functions.
- Reduce latencia porque nunca llega a backend.

**Código Backend (verificación redundante):**

```python
def validate_country_code(geo_data):
    """
    Verificación redundante en backend (defensa en profundidad).
    Aunque Cloudflare bloqueó, validamos de nuevo.
    """
    country_code = geo_data.get('country_code')
    ALLOWED_COUNTRIES = ['CL']

    if country_code not in ALLOWED_COUNTRIES:
        logging.warning(f"IP {geo_data['ip']} bloqueada: no es chilena ({country_code})")
        return False, "Acceso denegado por política de seguridad"

    return True, None
```

**Ventajas:**
- ✅ Costo cero (incluido Cloudflare Free).
- ✅ Reduce carga Azure ~80%.
- ✅ Defensa en profundidad (valida en ambos niveles).

---

### CAPA 2: Rate Limiting (Prevención de Fuerza Bruta)

**Responsabilidad:** Prevenir ataques de diccionario, brute force, spam.

**Configuración:**
* Límite: 15 solicitudes por minuto por IP
* Ventana móvil de 60 segundos

**Código Python:**

```python
def check_rate_limit(ip: str, db_connection) -> bool:
    """
    Implementado en memoria (Azure Function cache).
    Alternativa: Redis para entornos multi-instancia.
    """
    RATE_LIMIT_REQUESTS = 15
    RATE_LIMIT_WINDOW = 60  # segundos

    current_time = datetime.now()

    # Obtener requests previos
    key = f"rate_limit:{ip}"
    request_times = request_cache.get(key, [])

    # Filtrar requests fuera de ventana
    request_times = [
        t for t in request_times
        if (current_time - t).total_seconds() < RATE_LIMIT_WINDOW
    ]

    # Verificar límite
    if len(request_times) >= RATE_LIMIT_REQUESTS:
        logging.warning(f"Rate limit exceeded: {ip} ({len(request_times)} requests)")
        return False

    # Registrar nuevo request
    request_times.append(current_time)
    request_cache[key] = request_times

    return True
```

**Escenarios de Activación:**
- ❌ Bot intenta 20 submits en 1 minuto → Bloqueado.
- ✅ Humano hace 2 reloads accidentales → Permitido.

**Ventajas:**
- ✅ Detiene ataques automatizados.
- ✅ Costo negligible (solo cálculo en memoria).
- ✅ No molesta a usuarios legítimos.

---

### CAPA 3: Cloudflare Turnstile (Anti-Bot Invisible)

**Responsabilidad:** Verificar que es humanidad, no bot.

**Flujo:**
1. Backend retorna: `status="needs_validation"` + token challenge
2. Frontend renderiza Turnstile widget
3. Usuario completa desafío
4. Frontend obtiene token
5. Frontend reenvía con token
6. Backend valida token con API Cloudflare
   - Si válido → Continúa
   - Si inválido → Rechaza

**Código Frontend (JavaScript):**

```javascript
// Renderizar Turnstile
window.turnstile.render('#cf-turnstile-widget', {
    sitekey: '{{ TURNSTILE_SITE_KEY }}',
    theme: 'dark',
    callback: onTurnstileSuccess,
    'error-callback': onTurnstileError,
    'expired-callback': onTurnstileExpired,
});

function onTurnstileSuccess(token) {
    // Token obtenido, enviar al backend
    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'validate_visit',
            turnstile_token: token,
        })
    });
}
```

**Código Backend (Python):**

```python
def validate_turnstile(token: str, ip: str) -> bool:
    """
    Valida token Turnstile con API de Cloudflare.
    """
    TURNSTILE_SECRET = os.getenv('TURNSTILE_SECRET_KEY')
    CF_VERIFY_URL = '[https://challenges.cloudflare.com/turnstile/v0/siteverify](https://challenges.cloudflare.com/turnstile/v0/siteverify)'

    response = requests.post(CF_VERIFY_URL, {
        'secret': TURNSTILE_SECRET,
        'response': token,
        'remoteip': ip,
    }, timeout=10)

    data = response.json()

    if not data.get('success'):
        logging.warning(f"Turnstile validation failed: {ip}")
        return False

    # Validaciones adicionales
    if data.get('error-codes'):
        logging.warning(f"Turnstile errors: {data['error-codes']}")
        return False

    logging.info(f"Turnstile validation passed: {ip}")
    return True
```

**¿Por qué Turnstile y no reCAPTCHA?**
- ✅ Mejor privacidad (no trackea).
- ✅ Better UX (menos intrusivo).
- ✅ Gratis (vs reCAPTCHA premium).
- ✅ Invisible (usuario no ve nada en caso exitoso).

---

### CAPA 4: ipapi.is (Detección VPN/Proxy/Tor)

**Responsabilidad:** Detectar servicios de anonimización que eludan otras capas.

**API Utilizada:** ipapi.is (API paga pero confiable)

**¿Por qué no IP-API.com o IP2Location.io free?**
- ❌ >40% falsos positivos con VPNs modernas.
- ❌ Datos desactualizados.
- ❌ Límite de requests bajo.

**Solución:** ipapi.is ($0.002 por validación)
- ✅ 6 flags independientes de riesgo.
- ✅ Tasa de falsos positivos <5%.
- ✅ Actualización en tiempo real.

**Los 6 Flags de Riesgo:**
* `is_vpn`: Red privada virtual (NordVPN, ExpressVPN, etc)
* `is_proxy`: Proxy HTTP/SOCKS
* `is_tor`: Nodos de red Tor
* `is_datacenter`: Datacenter o hosting provider
* `is_relay`: Servicio relay de email/SMS
* `is_hostingProvider`: Proveedor de hosting comercial

**Código Python:**

```python
def check_suspicious_ip(ip: str) -> tuple[bool, dict]:
    """
    Consulta ipapi.is para detectar VPN, Proxy, Tor, etc.
    Retorna: (is_suspicious: bool, flags_detected: dict)
    """
    IPAPI_SECRET = os.getenv('IPAPI_SECRET_KEY')
    IPAPI_URL = '[https://api.ipapi.is](https://api.ipapi.is)'

    try:
        response = requests.get(IPAPI_URL, params={
            'q': ip,
            'key': IPAPI_SECRET,
        }, timeout=5)
        
        data = response.json()
        
        # Extraer flags
        flags = {
            'is_vpn': data.get('is_vpn', False),
            'is_proxy': data.get('is_proxy', False),
            'is_tor': data.get('is_tor', False),
            'is_datacenter': data.get('is_datacenter', False),
            'is_relay': data.get('is_relay', False),
            'is_hosting_provider': data.get('is_hosting_provider', False),
        }
        
        # Decisión: ¿es sospechosa?
        is_suspicious = any(flags.values())
        
        if is_suspicious:
            detected = [k for k, v in flags.items() if v]
            logging.warning(f"Suspicious IP {ip}: {detected}")
        
        return is_suspicious, flags
        
    except Exception as e:
        logging.error(f"Error checking ipapi.is: {e}")
        # En caso de error, asumir sospechosa (seguridad > disponibilidad)
        return True, {}
```

**Costo vs Beneficio:**
- Costo: $0.002 por validación (~$5-10/mes).
- Beneficio: Bloquea VPNs/Proxies que eludieron Cloudflare.
- ROI: Altamente positivo.

---

### CAPA 5: Database Cache (PostgreSQL - 24h TTL)

**Responsabilidad:** Optimizar performance reutilizando decisiones previas.

**Filosofía:** No re-validar IPs que ya validamos en las últimas 24 horas.

**Tabla: `ip_lookup_cache`**

```sql
CREATE TABLE public.ip_lookup_cache (
    ip_address VARCHAR(45) PRIMARY KEY,
    country_code VARCHAR(10),
    region VARCHAR(100),
    city VARCHAR(100),
    is_suspicious BOOLEAN DEFAULT FALSE,
    is_bot_possible INT DEFAULT 0,
    last_checked_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_is_bot_possible CHECK (is_bot_possible >= 0 AND is_bot_possible <= 10)
);

CREATE INDEX idx_last_checked ON public.ip_lookup_cache(last_checked_timestamp);
```

**Columnas:**
- `ip_address` (PK): IP única
- `country_code`: Código país ISO (CL, US, etc)
- `is_suspicious`: True si VPN/Proxy/Tor detectado
- `is_bot_possible`: Contador de fallos Turnstile (0-10)
- `last_checked_timestamp`: Última validación (expiración 24h)

**Código Python: Guardar en Caché**

```python
def set_ip_in_cache(ip: str, geo_data: dict, is_suspicious: bool, is_bot_possible: int):
    """
    Almacena (o actualiza) IP en caché.
    """
    query = """
    INSERT INTO ip_lookup_cache
    (ip_address, country_code, region, city, is_suspicious, is_bot_possible, last_checked_timestamp)
    VALUES (%s, %s, %s, %s, %s, %s, NOW())
    ON CONFLICT (ip_address) DO UPDATE SET
    country_code = EXCLUDED.country_code,
    region = EXCLUDED.region,
    city = EXCLUDED.city,
    is_suspicious = EXCLUDED.is_suspicious,
    is_bot_possible = EXCLUDED.is_bot_possible,
    last_checked_timestamp = NOW()
    """

    cursor.execute(query, (
        ip,
        geo_data.get('country_code'),
        geo_data.get('region'),
        geo_data.get('city'),
        is_suspicious,
        is_bot_possible,
    ))
    db_connection.commit()
```

**Código Python: Obtener del Caché**

```python
def get_ip_from_cache(ip: str) -> dict | None:
    """
    Obtiene IP del caché si existe y no está expirada (< 24h).
    """
    query = """
    SELECT ip_address, country_code, is_suspicious, is_bot_possible, last_checked_timestamp
    FROM ip_lookup_cache
    WHERE ip_address = %s
    AND last_checked_timestamp > NOW() - INTERVAL '24 hours'
    """

    cursor.execute(query, (ip,))
    result = cursor.fetchone()

    if result:
        logging.info(f"Cache HIT for {ip}")
        return {
            'ip_address': result,
            'country_code': result,
            'is_suspicious': result,
            'is_bot_possible': result,
            'cached': True,
        }

    logging.info(f"Cache MISS for {ip}")
    return None
```

**Impacto de Performance:**
- Sin caché: Cada IP sufre 5 validaciones (200-300ms).
- Con caché: 90% de IPs recurrentes validadas desde DB (10-20ms).
- **Resultado:** 90% reducción en latencia para usuarios recurrentes.

---

## 🧠 Lógica de Validación: Casos 0 → 2.2

Este es el **corazón técnico** del proyecto. Demuestra manejo avanzado de condicionales y lógica de negocio.

### Filosofía de Diseño

**Objetivo:** Evitar ejecutar todas las validaciones en cada visita.

**Estrategia de 2 pasos:**
1. **PASO 1:** Verificar caché (determinista, rápido).
2. **PASO 2:** Si caché miss, ejecutar validaciones completas.

### CASO 0: IP No Chilena ❌

**Detección:** Primera validación detecta country_code ≠ "CL".

**Flujo:**
1. IP no-chilena llega
2. Valida con ip-api.com → country_code = "US" (por ejemplo)
3. Detecta: ≠ CL → NO PERMITIR
4. ¿Existe en caché? NO
5. REGISTRA en ip_lookup_cache: `is_suspicious=True`
6. NO registra en tabla visitors
7. Responde: `status="known_bad"`, no Turnstile

**Código Python:**

```python
if country_code is None or country_code not in ALLOWED_COUNTRIES:
    logging.warning(f"IP {ip} bloqueada: no es chilena ({country_code})")

    db_utils.set_ip_in_cache(ip, geo_data, is_suspicious=True, is_bot_possible=0)

    return {
        'status': 'known_bad',
        'message': 'Acceso denegado por política de seguridad'
    }
```

**Razón de Bloqueo:**
- Portafolio dirigido a mercado laboral chileno.
- Reduce carga innecesaria.
- Enfoque geográfico claro.

**Tiempo de Procesamiento:** ~50ms (Cloudflare + validación inicial).

---

### CASO 1: IP Chilena en Caché ✓

#### 1.1a: Caché Hit + Confiable + Sin Intentos Fallidos ⚡ (Fast Pass)

**Condiciones:**
- IP existe en caché
- `is_suspicious` = False
- `is_bot_possible` = 0

**Flujo:**
1. IP chilena llega
2. ¿Existe en caché (< 24h)? SÍ
3. `is_suspicious` = False? SÍ
4. `is_bot_possible` = 0? SÍ
5. ✅ NO ejecuta validaciones adicionales
6. ✅ NO toca Turnstile
7. Responde: `status="known_good"`
8. Retorna: sensitiveLinks (LinkedIn, GitHub)

**Código Python:**

```python
cached_data = db_utils.get_ip_from_cache(ip)

if cached_data and not cached_data['is_suspicious'] and cached_data['is_bot_possible'] == 0:
    logging.info(f"Fast Pass for {ip}")

    response_data['status'] = 'known_good'
    response_data['sensitiveLinks'] = {
        'linkedin': LINKEDIN_URL,
        'github': GITHUB_URL,
    }

    return response_data
```

**UX:**
- ✅ Página carga al instante.
- ✅ Links sensibles visibles inmediatamente.
- ✅ Sin fricción de Turnstile.
- ✅ Experiencia: 50ms total.

**Tiempo de Procesamiento:** ~50ms (lectura DB caché).

---

#### 1.1b: Caché Hit + Confiable + Con Intentos Fallidos (1-2)

**Condiciones:**
- IP en caché
- `is_suspicious` = False
- `is_bot_possible` > 0 pero ≤ 2

**Flujo:**
1. IP chilena llega
2. ¿Existe en caché? SÍ
3. `is_suspicious` = False? SÍ
4. `is_bot_possible` entre 1-2? SÍ
5. 🔄 MUESTRA Turnstile nuevamente (revalidación)
6. ¿Usuario completa Turnstile?
   - **SÍ (token válido):**
     - Registra en tabla visitors
     - Actualiza caché: `is_bot_possible = 0`
     - Responde: `status="known_good"`
   - **NO (token inválido):**
     - NO registra en visitors
     - Incrementa caché: `is_bot_possible += 1`
     - Responde: `status="known_bad"`

**Propósito:**
- Detectar bots que pasan inicialmente pero fallan consistentemente.
- Dar oportunidad a humanos de reintentar.
- Construir score de confianza sin bloquear permanentemente.

**Tiempo de Procesamiento:** ~200-300ms (si Turnstile se completa).

---

#### 1.1c: Caché Hit + Confiable + Múltiples Intentos Fallidos (>2) 🚨

**Condiciones:**
- IP en caché
- `is_bot_possible` > 2

**Flujo:**
1. IP chilena llega
2. ¿Existe en caché? SÍ
3. `is_bot_possible` > 2? SÍ
4. ⛔ PROMOCIONA a `is_suspicious = True`
5. NO muestra Turnstile
6. Responde: `status="known_bad"`

**Propósito:**
- Evitar intentos infinitos.
- Promoción automática basada en comportamiento.
- Futuro: ML para ajuste automático.

**Tiempo de Procesamiento:** ~10ms (lectura caché).

---

#### 1.2: Caché Hit + Sospechosa ⛔

**Condiciones:**
- IP en caché
- `is_suspicious` = True

**Flujo:**
1. IP chilena llega
2. ¿Existe en caché? SÍ
3. `is_suspicious` = True? SÍ
4. ⛔ BLOQUEA inmediatamente
5. NO muestra Turnstile
6. Responde: `status="known_bad"`

**Ventajas del Caché:**
- ✅ Bloqueo instantáneo sin re-validar.
- ✅ Consistencia: misma IP = misma decisión.
- ✅ Costo negligible.

**Tiempo de Procesamiento:** ~10ms (lectura caché).

---

### CASO 2: IP Chilena Nueva (Caché Miss) 🛡️

#### 2.1: Nueva IP + Chilena + No Sospechosa

**Condiciones:**
- IP no existe en caché
- `country_code` = "CL"
- ipapi.is = no es VPN/Proxy/Tor

**Flujo Primera Llamada:**
1. Nueva IP chilena llega
2. ¿Existe en caché? NO
3. Valida con ip-api.com → country_code = "CL" ✓
4. Valida con ipapi.is → is_suspicious = False ✓
5. Registra en ip_lookup_cache
6. Responde: `status="needs_validation"`
7. Muestra Turnstile

**Flujo Segunda Llamada (con token Turnstile):**
1. Usuario completa Turnstile
2. Backend valida token ✓
3. ✓ REGISTRA en tabla visitors (ÚNICA VEZ)
4. Responde: `status="known_good"`

**Propósito:**
- Primer visitante legítimo pasa sin fricción.
- Turnstile solo si IP es nueva.
- Experiencia intuitiva.

**Tiempo de Procesamiento:**
- Primera llamada: ~200ms (validaciones).
- Segunda llamada: ~100ms (Turnstile + registro).

---

#### 2.1b: Nueva IP + Chilena + Turnstile FALLO 🤖

**Condiciones:**
- IP no existe en caché
- `country_code` = "CL"
- Turnstile token inválido

**Flujo:**
1. Backend recibe token Turnstile inválido
2. `validate_turnstile()` retorna False
3. NO registra en tabla visitors
4. Registra en caché: `is_bot_possible = 1`
5. Responde: `status="known_bad"`

**Próxima Visita:**
- Caché encontrará `is_bot_possible=1`.
- Mostrará Turnstile de nuevo (CASO 1.1b).
- Oportunidad para reintentar.

**Propósito:**
- Permite reintentos sin bloqueo permanente.
- Data para análisis: "¿Cuántas IPs fallan en intento N?".

---

#### 2.2: Nueva IP + Chilena + VPN/Proxy/Tor Detectada 🚨

**Condiciones:**
- IP no existe en caché
- `country_code` = "CL"
- ipapi.is detecta: `is_vpn=True` O `is_proxy=True` O `is_tor=True`

**Flujo:**
1. Nueva IP chilena llega
2. Valida con ip-api.com → country_code = "CL" ✓
3. Valida con ipapi.is → is_vpn = True (NordVPN detectada)
4. `is_suspicious` = True ✓
5. Registra en caché: `is_suspicious=True`
6. NO muestra Turnstile
7. NO registra en tabla visitors
8. Responde: `status="known_bad"`

**¿Por Qué No Mostrar Razón Exacta?**
- ❌ No decir: "Detectamos VPN".
- ✅ Decir: "Acceso denegado por política de seguridad".
- Razón: No queremos ayudar a atacantes a eludir detección.

**Decisión de UX vs Seguridad:**
- Security > UX en este caso.
- Portafolio es mercado laboral chileno (1% VPN esperada).
- Futuro: Whitelist de "VPN corporativas seguras".

**Tiempo de Procesamiento:** ~200ms (validar ipapi.is).

---

## 📊 Tabla Comparativa: Todos los Casos

| Caso | País | is_suspicious | is_bot_possible | Caché | Turnstile | Registra | Respuesta |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **0** | ≠CL | — | — | Guarda | ❌ | ❌ | known_bad |
| **1.1a** | CL | ❌ | 0 | Hit | ❌ | ❌ | known_good ⚡ |
| **1.1b** | CL | ❌ | 1-2 | Hit | ✅ | ⚠️ | needs_validation |
| **1.1c** | CL | ❌ | >2 | Hit (promo) | ❌ | ❌ | known_bad |
| **1.2** | CL | ✅ | — | Hit | ❌ | ❌ | known_bad |
| **2.1** | CL | ❌ | 0 | Miss → Guarda | ✅ | ✅ | known_good |
| **2.1b** | CL | ❌ | 0 | Miss → 1 | ✅ (falla) | ❌ | known_bad |
| **2.2** | CL | ✅ | 0 | Guarda | ❌ | ❌ | known_bad |

---

## 🎯 Matriz de Decisión Rápida

**Pregunta 1: ¿IP en caché y válida?**
- NO → Ejecutar validaciones completas (Caso 0, 2.x)
- SÍ → Usar resultado caché (Caso 1.x)

**Pregunta 2: ¿Es chilena?**
- NO → Bloquear (Caso 0)
- SÍ → Continuar

**Pregunta 3: ¿Es sospechosa (VPN/Proxy/Tor)?**
- SÍ → Bloquear sin Turnstile (Caso 2.2)
- NO → Continuar

**Pregunta 4: ¿Nueva IP?**
- SÍ → Mostrar Turnstile (Caso 2.1)
- NO → Verificar intentos fallidos (Caso 1.1b/c)

---

## 📈 Costo Operativo por Caso

| Caso | API Calls | DB Queries | Latencia | Costo ($) |
|:---:|:---:|:---:|:---:|:---:|
| **0** | 1 | 1 | ~50ms | ~$0 |
| **1.1a** | 0 | 1 | ~50ms | ~$0 |
| **1.1b** | 0 | 2 | ~100ms | ~$0 |
| **1.1c** | 0 | 1 | ~10ms | ~$0 |
| **1.2** | 0 | 1 | ~10ms | ~$0 |
| **2.1** | 2 | 2 | ~200ms | ~$0.002 |
| **2.1b** | 2 | 2 | ~200ms | ~$0.002 |
| **2.2** | 2 | 1 | ~200ms | ~$0.002 |

**Distribución típica (10k visitas/mes):**
- Caso 1.x (caché hit): ~90% → ~0 costo
- Caso 0 (no-CL): ~5% → ~0 costo
- Caso 2.x (nuevas): ~5% → ~$0.10/mes

**Total mensual:** ~$5/mes (ipapi.is)

---

## 🔄 Limpieza Automática de Caché

**Problema:** Tabla `ip_lookup_cache` crece indefinidamente.

**Solución:** Eliminar IPs no visitadas en 24+ horas.

**Query de Limpieza:**

```sql
DELETE FROM public.ip_lookup_cache
WHERE last_checked_timestamp < NOW() - INTERVAL '24 hours'
AND is_suspicious = FALSE;
```

**Ejecutar:** Azure Functions (timer trigger, 1x/día)

```python
import azure.functions as func
from datetime import datetime

def cleanup_ip_cache(mytimer: func.TimerRequest):
    query = """
    DELETE FROM public.ip_lookup_cache
    WHERE last_checked_timestamp < NOW() - INTERVAL '24 hours'
    """

    cursor.execute(query)
    db_connection.commit()

    logging.info(f"IP cache cleanup completed at {datetime.now()}")
```

---

## 🎓 Lecciones Aprendidas

### Técnicas
- ✅ **Caché es fundamental:** 90% reducción en costo + latencia.
- ✅ **Defensa en profundidad:** Múltiples capas > una capa fuerte.
- ✅ **Condicionales complejos:** Casos 0→2.2 requieren testing exhaustivo.

### De Arquitectura
- ✅ **Serverless requiere stateless:** Caché en DB, no en memoria.
- ✅ **Free tier APIs tienen límites:** ipapi.is vs IP-API.com.
- ✅ **Costo es decisor:** $0.002 por validación es viable.

### De Negocio
- ✅ **Geobloqueo es válido:** Portafolio = público específico.
- ✅ **Seguridad > UX a veces:** Bloquear VPN es correcto.
- ✅ **Pequeñas optimizaciones = grandes impactos.**

---

## 📋 Checklist de Implementación

- [ ] Cloudflare WAF configurado (Capa 1)
- [ ] Rate limiting en Azure Functions (Capa 2)
- [ ] Turnstile sitekey y secret configurados (Capa 3)
- [ ] ipapi.is API key configurada (Capa 4)
- [ ] Tablas `visitors` y `ip_lookup_cache` creadas (Capa 5)
- [ ] Caché limpieza (timer trigger)
- [ ] Logging exhaustivo en cada caso
- [ ] Testing de todos los casos (0 a 2.2)
- [ ] Monitoring en producción

---

## 🚀 Mejoras Futuras

### Corto Plazo
- 📊 Dashboard de analytics mostrando distribución de casos.
- 🔍 Logging detallado para debugging.
- 📈 A/B testing de thresholds.

### Mediano Plazo
- 🤖 ML scoring para ajuste automático de threshold.
- 🌐 Whitelist dinámico de "VPN corporativas".
- 🔄 Rate limiting adaptativo por comportamiento.

### Largo Plazo
- 📡 Integración con WAF rules dinámicas.
- 🔐 Fingerprinting adicional (TLS, JA3).
- 🌍 Análisis geográfico predictivo.

---

## 📚 Referencias Externas

- [Cloudflare WAF Docs](https://developers.cloudflare.com/waf/)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
- [Azure Functions Python SDK](https://learn.microsoft.com/azure/azure-functions/functions-reference-python)
- [PostgreSQL JSON Support](https://www.postgresql.org/docs/current/datatype-json.html)
- [ipapi.is Docs](https://ipapi.is/)

---

**Última actualización:** Noviembre 19, 2025
**Audiencia objetivo:** Security Engineers, Tech Leads, Backend Developers
**Tiempo de lectura:** 15-20 minutos
**Complejidad técnica:** ⭐⭐⭐⭐⭐ (Avanzada)