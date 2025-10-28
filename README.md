# Portafolio Profesional Full Stack - Francisco Mora

> **Demostración de arquitectura cloud segura, validaciones avanzadas y análisis de datos en tiempo real.**

[![Status](https://img.shields.io/badge/Status-Production-brightgreen)]()
[![License](https://img.shields.io/badge/License-MIT-blue)]()
[![Stack](https://img.shields.io/badge/Stack-Full%20Stack%20Data-orange)]()

**Sitio Web:** [https://franciscomora.dev](https://franciscomora.dev)

---

## 📋 Tabla de Contenidos

- [Visión General](#visión-general)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura de Seguridad](#-arquitectura-de-seguridad-en-capas)
- [Flujo de Validación Dinámico](#-flujo-de-validación-dinámico---caso-0-a-caso-22)
- [Base de Datos](#-estructura-de-la-base-de-datos)
- [Desafíos Técnicos](#-desafíos-técnicos-y-decisiones-clave)
- [Roadmap y Mejoras Futuras](#-roadmap-y-mejoras-futuras)
- [Diagramas Arquitectónicos](#-diagramas-arquitectónicos)

---

## 🎯 Visión General

Este proyecto no es un portafolio convencional. Es una **demostración de ingeniería profesional** que combina:

- **Full Stack Development:** Frontend moderno (HTML5/CSS3/JS) + Backend serverless (Python/Azure Functions)
- **Arquitectura en Nube:** Infraestructura escalable en Azure con base de datos PostgreSQL
- **Seguridad Avanzada:** Sistema de validación en 5 capas que filtra amenazas proactivamente
- **Optimización UX/Performance:** Caché inteligente que acelera visitantes de confianza sin comprometer seguridad
- **Análisis de Datos en Tiempo Real:** Captura y procesamiento de métricas de visitantes

### Diferenciadores Clave

| Aspecto | Enfoque |
|--------|---------|
| **Seguridad** | No es reactivoparametrosreactivo. Sistema de defensa **proactiva en 5 capas**. |
| **UX** | Flujo inteligente que diferencia visitantes conocidos (Fast Pass ⚡) vs nuevos (Full Validation 🛡️). |
| **Performance** | Caché de 24h + optimización de API calls = **90% reducción en validaciones redundantes**. |
| **Escalabilidad** | Serverless + managed DB = costos cero a millones de request sin reconfiguración. |
| **Condicionales Avanzadas** | Caso 0→2.2 demuestra manejo profesional de lógica compleja en producción. |

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Propósito | Razón de Selección |
|:---|:---|:---|:---|
| **Frontend** | HTML5 / CSS3 / JavaScript | Interfaz web responsiva | Máxima compatibilidad, sin dependencias pesadas |
| **API Serverless** | Azure Functions (Python 3.11) | Orquestación de lógica de negocio y seguridad | Escalabilidad automática, pricing por uso |
| **Base de Datos** | Azure PostgreSQL Flexible (B1ms) | Almacenamiento SQL persistente | ACID compliance, tier gratuito 12 meses |
| **DNS + WAF** | Cloudflare (Free Plan) | Geobloqueo L1, protección DDoS, SSL/TLS | Reduce carga en Azure ~80% |
| **Geolocalización** | IP-API.com (Free) | Mapeo de IP → País/Región/Ciudad | API rápida y confiable |
| **Detección VPN/Proxy** | ipapi.is (API pagada) | 6 flags de riesgo: VPN, Proxy, Tor, Datacenter, relay, Hosting | Más preciso que alternativas gratuitas |
| **Anti-Bot** | Cloudflare Turnstile | Desafío invisible contra bots | Superior a reCAPTCHA v3 en privacidad y UX |
| **Analítica** | Google Analytics 4 (GA4) | Métricas agregadas estándar | Gratuito, integración nativa |
| **Secretos** | Azure App Settings | Variables de entorno seguras | Separación código-configuración |
| **Control de Versiones** | Git / GitHub | Gestión de código fuente | Estándar de la industria |
| **Diagramación** | draw.io | Visualización de arquitectura | Open-source, colaborativo |

### Justificación del Stack

El stack fue elegido **específicamente para este contexto:**

- **Objetivo:** Portafolio + Demostración de arquitectura profesional
- **Presupuesto:** Estudiante (Azure for Students: $100/mes crédito)
- **Escala Esperada:** 1-10k visitantes/mes
- **Requisito No-Negociable:** Seguridad de nivel producción sin configuración manual

**Resultado:** Infraestructura de clase empresarial con **costo marginal cercano a cero** (solo ipapi.is → ~$5/mes).

---

## 🛡️ Arquitectura de Seguridad en Capas

La seguridad fue diseñada como un **"embudo de filtración"** que bloquea amenazas en cada capa, reduciendo carga en las capas posteriores.

```
           Visitante
              ↓
   ┌─────────────────────┐
   │  CAPA 1: WAF (CF)   │  Geobloqueo (NOT CL) → Bloquea ~80% tráfico basura
   │  (Cloudflare)       │  Costo: $0 / CPU: 0
   └─────────────────────┘
              ↓
   ┌─────────────────────┐
   │  CAPA 2: Rate Limit │  15 req/minuto por IP → Previene F5/brute force
   │  (Memory, Azure)    │  Costo: ~$0.000001 / CPU: Mínimo
   └─────────────────────┘
              ↓
   ┌─────────────────────┐
   │  CAPA 3: Anti-Bot   │  Turnstile → Verifica humanidad
   │  (Cloudflare)       │  Costo: $0 / CPU: ~50ms
   └─────────────────────┘
              ↓
   ┌─────────────────────┐
   │  CAPA 4: VPN/Proxy  │  ipapi.is → 6 flags de riesgo
   │  (API Externa)      │  Costo: $0.002 / CPU: ~200ms
   └─────────────────────┘
              ↓
   ┌─────────────────────┐
   │  CAPA 5: DB Cache   │  ip_lookup_cache → Reutiliza resultados 24h
   │  (PostgreSQL)       │  Costo: ~$0 / CPU: ~10ms
   └─────────────────────┘
              ↓
        [ PERMITIR/BLOQUEAR ]
```

### Detalle de Capas

**Capa 1: WAF (Cloudflare)**
- Geobloqueo inicial: `NOT (CL OR ZZ)` bloquea automáticamente ~80% del tráfico no-chileno
- Reduce carga en Azure Functions significativamente
- Costo: Incluido en plan gratuito

**Capa 2: Rate Limiting (Azure Function)**
- Implementado en `security_utils.check_rate_limit()`
- Límite: 15 solicitudes por minuto por IP
- Previene ataques de diccionario y bucles automatizados
- Costo: Negligible (solo cálculo en memoria)

**Capa 3: Cloudflare Turnstile**
- Desafío anti-bot invisible (mejor UX que reCAPTCHA)
- Token verificado con `security_utils.validate_turnstile()`
- Costo: Gratuito en plan Cloudflare

**Capa 4: ipapi.is (Detección VPN/Proxy)**
- Valida 6 flags de riesgo:
  - `is_vpn`: Detecta redes privadas virtuales
  - `is_proxy`: Proxies HTTP/SOCKS
  - `is_tor`: Nodos de red Tor
  - `is_datacenter`: Datacenters/hosting providers
  - `is_relay`: Servicios relay de email/SMS
  - `is_hostingProvider`: Proveedores de hosting
- Implementado en `security_utils.check_suspicious_ip()`
- Costo: ~$0.002 por validación ($5-10/mes para 10k visitas)
- **Razón del Pivote:** IP-API.com y IP2Location.io tienen tasas de falsos positivos >40% con VPNs modernas

**Capa 5: Caché Persistente (PostgreSQL)**
- Tabla `ip_lookup_cache` almacena resultados de validación por 24h
- Evita re-validaciones innecesarias
- Habilita el flujo "Fast Pass" (Caso 1)
- Costo: Negligible (almacenamiento)

---

## 📊 Flujo de Validación Dinámico - CASO 0 a CASO 2.2

Este es el **corazón técnico del proyecto**. Demuestra manejo avanzado de condicionales y lógica de negocio en un entorno de producción.

### Filosofía

Evitar ejecutar 5 validaciones + 2 llamadas a DB en **cada visita** mediante un sistema de dos pasos:
1. **PASO 1:** Verificar caché (rápido, determinista)
2. **PASO 2:** Si no existe, ejecutar validaciones completas (seguro, exhaustivo)

### Diagrama de Flujo Completo

```
                        VISITANTE LLEGA
                             ↓
                    [main.js] DOMContentLoaded
                             ↓
                    fetch(API, {action:"check_ip"})
                             ↓
        ┌───────────────────────────────────────────────────┐
        │   ¿IP existe en ip_lookup_cache (24h)?            │
        └───────────────────────────────────────────────────┘
                 ↙                              ↘
            SÍ                                   NO
            ↓                                    ↓
    ┌──────────────────┐            ┌──────────────────────┐
    │  CASO 1          │            │  CASO 0 / 2          │
    │  CACHÉ HIT       │            │  CACHÉ MISS          │
    │  (Fast Pass ⚡)   │            │  (Full Validation 🛡️) │
    └──────────────────┘            └──────────────────────┘
         ↓ ↓ ↓                             ↓ ↓ ↓
    [Tres escenarios]                [Validación completa]
         ↓                                 ↓
    [API responde]                  [Geoloc: country_code?]
    status: known_good                     ↓
    status: needs_validation        [CASO 0: NO CHILENA]
    status: known_bad               [¿country_code ≠ CL?]
                                         ↓
                                    [Registrar como
                                     is_suspicious=True]
                                         ↓
                                    [API responde]
                                   status: known_bad
                                   [SIN Turnstile]
```

### Casos Detallados

#### **CASO 0: IP NO CHILENA** ❌

```
Flujo:
  ├─ Valida con ip-api.com (obtiene country_code)
  ├─ Detecta: country_code ≠ "CL" (ej. US, DE, CN)
  ├─ Lee ip_lookup_cache: 
  │  ├─ Si existe y es_suspicious=True → BLOQUEAR (sin Turnstile)
  │  └─ Si NO existe → REGISTRAR como is_suspicious=True
  ├─ NO registra en tabla visitors
  └─ Responde: status="known_bad", message="Acceso denegado por política de seguridad"

Código Python:
  if country_code is None or country_code not in ALLOWED_COUNTRIES:
      logging.warning(f"IP {ip} NO es chilena ({country_code})")
      db_utils.set_ip_in_cache(ip, geo_data, is_suspicious=True, is_bot_possible=0)
      response_data["status"] = "known_bad"
      return HttpResponse(json.dumps(response_data), 200)

Razón:
  - Enfoque geográfico: minimizar servidor a región de interés (mercado laboral CL)
  - Reduce carga de validaciones innecesarias
  - Mejora ROI de hosting (menores costos de inversión)
```

---

#### **CASO 1: IP CHILENA EN CACHÉ** ✓

##### **CASO 1.1a: Caché Hit + is_suspicious=False + is_bot_possible=0** ⚡ (Fast Pass)

```
Flujo:
  ├─ IP existe en caché
  ├─ is_suspicious=False (ya validada previamente)
  ├─ is_bot_possible=0 (sin intentos fallidos previos)
  ├─ NO ejecuta validaciones adicionales
  ├─ NO toca ip_lookup_cache
  ├─ NO registra en tabla visitors (ya había entrado)
  └─ Responde: status="known_good", sensitiveLinks=[LinkedIn, GitHub]

Código Python:
  if cached_data and not is_suspicious and is_bot_possible == 0:
      response_data["status"] = "known_good"
      response_data["sensitiveLinks"] = {...}
      return HttpResponse(json.dumps(response_data), 200)

UX:
  - Carga página al instante SIN Turnstile
  - Muestra links sensibles inmediatamente
  - Experiencia: 50ms total (sin APIs externas)

Importancia Técnica:
  - Demuestra caché como "atajos" en lógica condicional
  - Reduce latencia 90% vs validación completa
  - Equilibrio seguridad-performance
```

##### **CASO 1.1b: Caché Hit + is_suspicious=False + 1 ≤ is_bot_possible ≤ 2**

```
Flujo:
  ├─ IP existe en caché
  ├─ is_suspicious=False
  ├─ is_bot_possible > 0 (intentos previos fallidos)
  ├─ MUESTRA Turnstile nuevamente
  ├─ Si Turnstile OK:
  │  ├─ Registra en tabla visitors
  │  └─ Actualiza ip_lookup_cache: is_bot_possible = 0
  └─ Si Turnstile FALLO:
     ├─ NO registra en visitors
     ├─ Incrementa is_bot_possible (1→2, 2→3)
     └─ Mantiene is_suspicious=False

Código Python:
  elif is_bot_possible > 0 and is_bot_possible <= BOT_POSSIBLE_THRESHOLD:
      response_data["status"] = "needs_validation"
      response_data["message"] = "Se requiere validación adicional"
      return HttpResponse(json.dumps(response_data), 200)

Importancia Técnica:
  - Implementa "segundo vistazo" para IPs intermitentes
  - Detecta bots que pasan inicialmente pero fallan consistentemente
  - Contador incrementa oportunidad para mejora UX (ej. "Intento 2/3")
```

##### **CASO 1.1c: Caché Hit + is_suspicious=False + is_bot_possible > 2** 🚨

```
Flujo:
  ├─ IP existe en caché
  ├─ Intentos fallidos previos > threshold (2)
  ├─ ACTUALIZA ip_lookup_cache: is_suspicious = True
  ├─ NO registra en tabla visitors
  ├─ NO muestra Turnstile (es permanentemente bloqueada)
  └─ Responde: status="known_bad", message="Comportamiento sospechoso detectado"

Código Python:
  else:  # is_bot_possible > BOT_POSSIBLE_THRESHOLD
      logging.warning(f"IP {ip} excedió intentos ({is_bot_possible})")
      db_utils.set_ip_in_cache(ip, None, is_suspicious=True, is_bot_possible)
      response_data["status"] = "known_bad"
      return HttpResponse(json.dumps(response_data), 200)

Importancia Técnica:
  - Promoción automática de "sospechosa" basada en comportamiento
  - Demuestra escalabilidad de scoring en lógica
  - Futuro: integración con ML para ajuste automático de threshold
```

##### **CASO 1.2: Caché Hit + is_suspicious=True** ⛔

```
Flujo:
  ├─ IP existe en caché
  ├─ is_suspicious=True (VPN, Proxy, Datacenter, o múltiples fallos)
  ├─ BLOQUEA inmediatamente (sin Turnstile)
  ├─ NO registra en tabla visitors
  └─ Responde: status="known_bad", message="Acceso denegado por política de seguridad"

Código Python:
  if is_suspicious:
      logging.warning(f"IP {ip} bloqueada (is_suspicious=True)")
      response_data["status"] = "known_bad"
      response_data["message"] = "Acceso denegado por política de seguridad"
      return HttpResponse(json.dumps(response_data), 200)

Ventaja de Caché:
  - Bloqueo instantáneo sin re-validar (reduce carga)
  - Consistencia en decisiones de seguridad
  - UX explícita: no hay ambigüedad sobre por qué se bloquea
```

---

#### **CASO 2: IP CHILENA NUEVA (CACHÉ MISS)** 🛡️

##### **CASO 2.1: Caché Miss + Geoloc=CL + ipapi.is=Not Suspicious**

```
Flujo Primera Llamada (action="check_ip"):
  ├─ No existe en caché
  ├─ Valida con ip-api.com → country_code = "CL"
  ├─ Valida con ipapi.is → is_suspicious = False
  ├─ Registra en ip_lookup_cache: is_suspicious=False, is_bot_possible=0
  └─ Responde: status="needs_validation", message="IP desconocida, requiere validación Turnstile"

Frontend recibe "needs_validation":
  ├─ Muestra página principal
  ├─ Ejecuta window.turnstile.render()
  └─ Usuario ve desafío Turnstile

Flujo Segunda Llamada (action="validate_visit" + token):
  ├─ Valida Turnstile (token correcto)
  ├─ Obtiene geoloc nuevamente (confirmación)
  ├─ Registra en tabla visitors (ENTRADA REGISTRADA)
  ├─ Actualiza ip_lookup_cache: is_bot_possible = 0
  └─ Responde: status="known_good", sensitiveLinks=[...]

Código Python (Segunda Llamada):
  if not security_utils.validate_turnstile(token, ip):
      # FALLO - ver CASO 2.1b
  else:
      # EXITOSO
      geo_data = security_utils.get_geo_info_from_api(ip)
      db_utils.set_ip_in_cache(ip, geo_data, is_suspicious=False, is_bot_possible=0)
      db_utils.insert_visitor_data(...)  # ← ÚNICO caso donde se registra
      response_data["status"] = "known_good"

Importancia Técnica:
  - Demuestra "flujo principal" de UX optima
  - Valida humanidad ANTES de registrar
  - Primer visitante chileno legítimo pasa sin fricción
  - Futuro: A/B testing con diferentes umbrales de Turnstile
```

##### **CASO 2.1b: Caché Miss + Geoloc=CL + Turnstile FALLO** 🤖

```
Flujo (Segunda Llamada con Turnstile Inválido):
  ├─ Token Turnstile inválido/expirado
  ├─ NO registra en tabla visitors
  ├─ Registra en ip_lookup_cache: is_bot_possible=1, is_suspicious=False
  └─ Responde: status="known_bad", message="No ha superado validador de Cloudflare"

Próxima Visita de Misma IP:
  ├─ IP encontrada en caché
  ├─ is_bot_possible=1 (< threshold)
  ├─ Muestra Turnstile nuevamente (CASO 1.1b)
  └─ Oportunidad para "reintentarlo"

Importancia Técnica:
  - Implementa "puntuación de confianza" sin ML complejo
  - Permite reintentos sin bloqueo permanente
  - Data para análisis futuro: "¿Cuántas IPs fallan en intento N?"
  - Entrada: "IP que falló Turnstile" → Salida: "Más datos sobre bots reales"
```

##### **CASO 2.2: Caché Miss + Geoloc=CL + ipapi.is=Suspicious** 🚨

```
Flujo (Primera Llamada):
  ├─ No existe en caché
  ├─ Valida con ip-api.com → country_code = "CL"
  ├─ Valida con ipapi.is → is_suspicious = True (VPN/Proxy/Tor detectado)
  ├─ Registra en ip_lookup_cache: is_suspicious=True, is_bot_possible=0
  ├─ NO muestra Turnstile (es inútil contra VPNs)
  └─ Responde: status="known_bad", message="Acceso denegado por política de seguridad"

Código Python:
  if is_suspicious:
      logging.warning(f"IP {ip} detectada como FRAUDULENTA (VPN/Proxy/etc)")
      db_utils.set_ip_in_cache(ip, geo_data, is_suspicious=True, is_bot_possible=0)
      response_data["status"] = "known_bad"
      return HttpResponse(json.dumps(response_data), 200)

UX:
  - Recibe rechazo inmediato (sin engaños de Turnstile)
  - Mensaje claro: "Por política de seguridad"
  - NO filtra razón específica (por privacy: no revelar que detectamos VPN)

Importancia Técnica:
  - Demuestra "negación rápida" a amenazas conocidas
  - Balanceo: Seguridad > UX para el 1% de VPN/Proxies
  - Justificación: Portafolio de mercado laboral CL ≠ Servicio público
  - Future: Whitelist de "VPN corporativas seguras" si escala
```

---

### Tabla Comparativa: Casos 0 → 2.2

| Caso | Country_Code | is_suspicious | is_bot_possible | Turnstile | Visitors | Respuesta |
|:----:|:---:|:---:|:---:|:---:|:---:|:---:|
| **0** | ≠CL | N/A | 0 | ❌ | ❌ | known_bad |
| **1.1a** | CL | ❌ | 0 | ❌ | ❌ | known_good |
| **1.1b** | CL | ❌ | 1-2 | ✅ | ⚠️ | needs_validation |
| **1.1c** | CL | ❌ | >2 | ❌ | ❌ | known_bad |
| **1.2** | CL | ✅ | - | ❌ | ❌ | known_bad |
| **2.1** | CL | ❌ | 0 | ✅ | ✅ | known_good |
| **2.1b** | CL | ❌ | 1-2 | ✅ (falla) | ❌ | known_bad |
| **2.2** | CL | ✅ | 0 | ❌ | ❌ | known_bad |

---

## 💾 Estructura de la Base de Datos

### Tabla: `public.visitors` (Almacén de Analítica)

Registra **visitas únicas y validadas** (solo de Chile, no-VPN) para análisis posterior.

```sql
CREATE TABLE public.visitors (
    id SERIAL PRIMARY KEY,
    visit_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    browser VARCHAR(50),
    country VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),
    page_visited VARCHAR(255),
    CONSTRAINT fk_ip_cache 
        FOREIGN KEY (ip_address) 
        REFERENCES ip_lookup_cache(ip_address)
        ON DELETE SET NULL
);

CREATE INDEX idx_visit_timestamp ON public.visitors(visit_timestamp);
CREATE INDEX idx_ip_address ON public.visitors(ip_address);
```

| Columna | Tipo | Descripción | Ejemplo |
|:---|:---|:---|:---|
| `id` | SERIAL | Identificador único auto-incremento | 1, 2, 3... |
| `visit_timestamp` | TIMESTAMPTZ | Fecha/Hora exacta (UTC, precisión ms) | 2025-10-28 00:06:55.123 |
| `ip_address` | VARCHAR(45) | IP limpia del visitante | 186.78.20.109 |
| `user_agent` | TEXT | User-Agent crudo | Mozilla/5.0 (X11; Linux x86_64)... |
| `browser` | VARCHAR(50) | Navegador parseado | Chrome, Firefox, Safari |
| `country` | VARCHAR(100) | País (GeoIP) | Chile |
| `region` | VARCHAR(100) | Región/Estado (GeoIP) | Región de Valparaíso |
| `city` | VARCHAR(100) | Ciudad (GeoIP) | Valparaíso |
| `page_visited` | VARCHAR(255) | URL Referer | https://franciscomora.dev/projects |

**Propósito:** Fuente de truth para analítica. Responde preguntas como:
- "¿Cuántas visitas únicas en la última semana?"
- "¿Qué navegadores usa mi audiencia?"
- "¿De qué ciudades de Chile acceden?"

---

### Tabla: `public.ip_lookup_cache` (Tabla de Optimización/Seguridad)

El **"checkpoint"** de seguridad. Almacena resultados de validación por **24 horas** para habilitar el flujo "Fast Pass" (Caso 1).

```sql
CREATE TABLE public.ip_lookup_cache (
    ip_address VARCHAR(45) PRIMARY KEY,
    country_code VARCHAR(10),
    region VARCHAR(100),
    city VARCHAR(100),
    is_suspicious BOOLEAN DEFAULT FALSE,
    is_bot_possible INT DEFAULT 0,
    last_checked_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_is_bot_possible 
        CHECK (is_bot_possible >= 0 AND is_bot_possible <= 10)
);

CREATE INDEX idx_last_checked ON public.ip_lookup_cache(last_checked_timestamp);
```

| Columna | Tipo | Descripción | Ejemplo |
|:---|:---|:---|:---|
| `ip_address` | VARCHAR(45) | IP única (PK) | 186.78.20.109 |
| `country_code` | VARCHAR(10) | Código país ISO-3166-1 | CL, US, DE |
| `region` | VARCHAR(100) | Región/Estado (GeoIP) | Región de Valparaíso |
| `city` | VARCHAR(100) | Ciudad (GeoIP) | Valparaíso |
| `is_suspicious` | BOOLEAN | True = VPN/Proxy/Tor/etc | False, True |
| `is_bot_possible` | INT | Contador de Turnstile fallidos | 0, 1, 2, 3... |
| `last_checked_timestamp` | TIMESTAMPTZ | Última validación (para expiración 24h) | 2025-10-28 00:06:55 |

**Propósito:** Optimización + Seguridad. Responde preguntas como:
- "¿Esta IP ya fue validada en las últimas 24h?" → Fast Pass
- "¿Cuántos IPs de VPN hemos bloqueado?" → SELECT COUNT(*) WHERE is_suspicious=True
- "¿Cuántos IPs necesitan re-validación?" → SELECT COUNT(*) WHERE last_checked_timestamp < NOW() - INTERVAL '24h'

**Limpieza Automática:**
```sql
-- Ejecutar diariamente (Azure Automation o cron)
DELETE FROM public.ip_lookup_cache 
WHERE last_checked_timestamp < NOW() - INTERVAL '24 hours' 
  AND is_suspicious = FALSE;
```

---

## 💡 Desafíos Técnicos y Decisiones Clave

### 1. **Optimización de Costos en Azure**

**Problema:** Azure PostgreSQL por defecto (B2s) consumiría rápidamente los créditos de Azure for Students.

**Solución:** Investigación exhaustiva de opciones de tier. Se seleccionó **B1ms** (1 vCPU, 2GB RAM) confirmando:
- Costo: ~$80/mes (caber dentro del budget inicial)
- Capacidad: Suficiente para 100k+ queries/día
- Gratuidad 12 meses: Incluido en Azure for Students

**Aprendizaje:** No siempre la opción por defecto es la más rentable. Requiere investigación.

---

### 2. **Pivote en Detección de Fraude (API)**

**Problema:** Pruebas iniciales con IPs reales conectadas a VPNs (Kaspersky, NordVPN, Proton) revelaron que APIs gratuitas (`IP-API.com`, `IP2Location.io`) tienen tasas de falsos positivos **>40%**.

**Solución:** Adopción de **`ipapi.is`**, una API de pago robusta ($0.002 por validación) que valida 6 flags independientes.

**Decisión Estratégica:** Sacrificar "costo cero" por seguridad real en producción. El costo extra (~$5-10/mes) es justificable contra riesgo de falsos negativos.

**Aprendizaje:** En seguridad, la confiabilidad > costo zero.

---

### 3. **Evolución de Caché (Memory → Database)**

**Problema:** Caché inicial en memoria Python (diccionario) era volátil. Se perdía con cada reinicio de Azure Function.

**Solución:** Implementación de caché **persistente en PostgreSQL** (`ip_lookup_cache`), permitiendo:
- Retención de decisiones entre reiniciamientos
- Flujo "Fast Pass" confiable por 24 horas
- Datos históricos para análisis

**Trade-off:** +10ms latencia por query a DB vs. +24h retención de decisiones. **Decisión: Retención > Latencia** (UX mejora después de primer acceso).

---

### 4. **Refactorización y Modularidad**

**Problema:** `function_app.py` creció a >400 líneas. Mezcla de lógica de DB, seguridad, y orquestación hacía difícil mantener.

**Solución:** Refactorización completa en estructura modular:

```
shared_code/
├── __init__.py
├── db_utils.py          (← Todas las queries a DB)
├── security_utils.py    (← Validaciones, APIs externas)
└── __init__.py

function_app.py          (← Orquestador limpio)
```

**Beneficio:** 
- `function_app.py` ahora es legible (flujo principal visible)
- `security_utils.py` reutilizable en otros proyectos
- `db_utils.py` centraliza todas las queries

---

### 5. **Resolución de Problemas de Entorno Local**

**Problemas Enfrentados:**

| Problema | Causa | Solución |
|:---|:---|:---|
| `MODULE_NOT_FOUND` | Conflicto Anaconda ↔ Node.js en PATH | Desinstalar Anaconda, usar venv limpio |
| `ImportError` en `db_utils` | Refactorización: importes circulares | Reestructurar imports, usar `from X import Y` no `import X` |
| SSL Error `psycopg2` | Certificado DB no confiable | Agregar `sslmode='require'` en connection string |
| `func host start` falla | Azure Functions Core Tools no encontrado | Reinstalar con `npm install -g azure-functions-core-tools@4` |

**Aprendizaje:** Entornos locales requieren setup cuidadoso. Documentar pasos exactos.

---

Espacio para seguir complementando la pagina web

---

## 🎓 Lecciones Aprendidas

### Técnicas

- ✅ Caché persisten + condicionales complejas = UX + Seguridad
- ✅ "Defensa en Profundidad" funciona en web también (no solo redes)
- ✅ Modularidad temprana ahorra refactorización futura
- ✅ Debugging local difícil → Logs abundantes en producción

### Arquitectónicas

- ✅ Serverless = escalabilidad automática pero requiere pensamiento stateless
- ✅ Free tier APIs tienen límites reales → Plan B necesario
- ✅ Seguridad no es "un checkbox" sino evolución continua

### De Negocio

- ✅ Portafolio + Demostración técnica = mejor impressión
- ✅ Mercado laboral CL aprecia seguridad + performance
- ✅ Pequeñas optimizaciones = grandes impactos (caché 24h = 90% menos API calls)

---

## 📄 Licencia

MIT License - Libre para uso académico y profesional.

---

## 🔗 Enlaces Importantes

- **Sitio:** [https://franciscomora.dev](https://franciscomora.dev)
- **GitHub (Privado):** Disponible bajo demanda
- **Documentación Técnica:** `/docs/TECHNICAL.md`
- **API Docs:** `/docs/API.md`

---

## 👤 Autor

**Francisco Mora**
- Ingeniero Civil Industrial UTFSM + Informático
- Especialidad: Data Science, Data Engineering, Arquitectura en Nube
- Contact: [LinkedIn](https://linkedin.com) | [GitHub](https://github.com)

---

**Última Actualización:** Octubre 28, 2025

**Estado:** Production ✅ | Monitoreado 24/7 | Seguridad Actualizada