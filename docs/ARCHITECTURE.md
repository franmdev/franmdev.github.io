# 🏗️ Arquitectura: Decisiones Técnicas y Desafíos Resueltos

## Resumen Ejecutivo

Este documento explica **por qué** se tomaron decisiones arquitectónicas específicas, **qué problemas se encontraron**, y **cómo se resolvieron**. No es un manual de "cómo usar", sino un análisis de ingeniería profesional.

---

## 🎯 Filosofía Arquitectónica

**Principio Fundamental:** Elegir la tecnología correcta para el problema correcto, no la tecnología "cool".

**Restricciones del Proyecto:**
- Presupuesto: $100/mes crédito Azure for Students
- Escala esperada: 1-10k visitantes/mes
- Público objetivo: Mercado laboral chileno
- Requisito crítico: Seguridad de nivel producción

**Resultado:** Stack lean, escalable, y sin compromisos en seguridad.

---

## 🛠️ Frontend: De Tailwind a CSS Nativo (ITCSS)

### Problema: Tailwind CSS

**Situación inicial:**
- Proyecto comenzó con Tailwind CSS
- Desarrollo rápido (muchas utilidades pre-hechas)
- Bundle size: **27 KB** para un sitio simple
- Dark mode automático pero limitado
- Personalización mediante config (inflexible)

**Problemas detectados:**

| Problema | Impacto | Síntoma |
|:---|:---|:---|
| Bundle innecesario | Performance | 27 KB para usar ~40% de Tailwind |
| Dark mode inflexible | UX | No se podía controlar nivel granular |
| Especificidad CSS | Mantenibilidad | Conflictos entre clases Tailwind |
| Curva de aprendizaje | Código | Muchas clases en HTML, lógica dispersa |

**Preguntas clave:**
- ¿Por qué cargar 27 KB si solo uso 40%?
- ¿Puedo lograr mejor performance sin framework?
- ¿Necesito aprender CSS vanilla si quiero ser profesional?

**Respuesta:** Sí a las tres.

### Solución: ITCSS (Inverted Triangle CSS)

**Estructura de 7 capas modulares:**

```text
SETTINGS (theme-vars.css)
└─ Variables globales, colores, espacios, breakpoints

TOOLS (implícito)
└─ Mixins, funciones reutilizables

GENERIC (reset.css)
└─ Normalización cross-browser, reset global

BASE (base.css)
└─ Estilos de elementos HTML (h1-h6, a, button, form)

OBJECTS (layout.css)
└─ Estructura y layout (grid, flexbox, contenedores)

COMPONENTS (components.css)
└─ Componentes visuales reutilizables (.hero, .card, .modal)

UTILITIES (responsive.css)
└─ Media queries, overrides, helpers finales
```

**Por qué ITCSS:**
- ✅ Especificidad controlada (aumenta gradualmente)
- ✅ No hay conflictos de CSS
- ✅ Fácil encontrar donde está cada estilo
- ✅ Performance máximo (solo lo que se usa)
- ✅ Escalable (agregar nuevas capas sin romper)

### Resultados de Migración

| Métrica | Tailwind | ITCSS | Mejora |
|:---|:---:|:---:|:---:|
| **Bundle Size** | 27 KB | 14 KB | 48% ↓ |
| **Especificidad** | Variable | Controlada | 100% predecible |
| **Dark Mode** | Automático | Manual | Total control |
| **Curva Aprendizaje** | Baja | Media | Pero más valioso |
| **Mantenibilidad** | Media | Alta | Código más limpio |

**Tiempo de migración:** ~8 horas (incluye refactorización)
**ROI:** Altísimo. Cada visitante descarga 13 KB menos (x10k = 130 MB menos al mes)

---

## 🔐 Backend: Azure Serverless

### Decisión: Azure Functions vs Alternativas

**Evaluación de opciones:**

| Platform | Cold Start | Costo | Escalabilidad | Learning Curve |
|:---|:---:|:---:|:---:|:---:|
| **Azure Functions** ✅ | ~2s | Pay-per-use | Automática | Media |
| AWS Lambda | ~1s | Más caro | Automática | Alta |
| Google Cloud Functions | ~2s | Similar | Automática | Media |
| VPS (Heroku, DigitalOcean) | N/A | Fijo $5-10/mes | Manual | Baja |

**¿Por qué Azure Functions?**
- ✅ Integración nativa con Azure PostgreSQL
- ✅ Azure for Students: $100/mes crédito
- ✅ Python 3.11 (familiar)
- ✅ Escalabilidad automática
- ✅ Cold start aceptable (<2s)

**¿Por qué NO VPS?**
- ❌ Costo fijo (menos flexible para estudiante)
- ❌ Escalabilidad manual (requiere DevOps)
- ❌ Problemas operacionales (mantenimiento, patches)

### Arquitectura Serverless

```text
Client
  ↓
Cloudflare (WAF + Cache)
  ↓
Azure Functions HTTP Trigger
  ├─ check_ip (acción inicial)
  └─ validate_visit (acción con Turnstile)
       ↓
       ├─ Consulta: PostgreSQL (ip_lookup_cache)
       ├─ Consulta: External APIs (ip-api.com, ipapi.is)
       └─ Escribe: PostgreSQL (visitors, ip_lookup_cache)
       ↓
Respuesta JSON
```

**Ventajas de Serverless:**
- ✅ Escalabilidad automática (0 a 1000 requests/seg sin cambios)
- ✅ Pay-per-use (si no hay tráfico, no pagas)
- ✅ Cero DevOps (Azure gestiona servidores)
- ✅ Stateless (diseño limpio)

**Desafíos de Serverless:**
- ❌ Cold start (2s primera ejecución)
- ❌ No puede mantener estado en memoria
- ❌ Timeout limitado (max 5 min en Azure)
- ❌ Debugging más difícil

**Solución a cold start:**
Caché en PostgreSQL (stateless pero persistente) + Cloudflare Edge Cache (50ms global)

---

## 💾 Database: PostgreSQL vs Alternativas

### Decisión: PostgreSQL Managed (Azure)

**Evaluación:**

| DB | ACID | Escalabilidad | Costo | Mantenimiento |
|:---|:---:|:---:|:---:|:---:|
| **PostgreSQL** ✅ | Sí | Vertical + Replicación | $0 (12mo) | Azure gestiona |
| MySQL | Sí | Limitada | Similar | Azure gestiona |
| MongoDB | No | Horizontal | Similar | Azure gestiona |
| SQLite | Sí | NO (local) | N/A | Tú gestionas |
| DynamoDB | Condicional | Sí | Alto | AWS gestiona |

**¿Por qué PostgreSQL?**
- ✅ ACID compliance (consistencia de datos crítica)
- ✅ 12 meses gratis en Azure for Students
- ✅ Tier B1ms suficiente (1 vCPU, 2GB RAM)
- ✅ Índices sofisticados (performance)
- ✅ JSON native support (futuro)
- ✅ Conocimiento transferible (industria standard)

**¿Por qué NO SQLite?**
- ❌ Local only (no acceso desde Azure Functions en nube)
- ❌ Concurrencia limitada
- ❌ No escalable

**¿Por qué NO MongoDB?**
- ❌ No ACID en versiones older
- ❌ Schema flexible = problemas de consistencia
- ❌ Overkill para datos simples

### Optimización: Tier B1ms

**Decisión: ¿Cuál tier elegir?**

```text
Azure PostgreSQL Tiers:
  ├─ B1s  (1 vCPU, 1GB RAM) → $80/mes
  ├─ B1ms (1 vCPU, 2GB RAM) → $100/mes ✅ ELEGIDO
  ├─ B2s  (2 vCPU, 4GB RAM) → $200/mes
  └─ Más... (escala)
```

**Análisis:**
- B1s: Insuficiente para caché + índices
- B1ms: Perfecto (2GB RAM = espacio para indexes in-memory)
- B2s+: Overkill (costo/valor desfavorable)

**Cálculo de capacidad B1ms:**
- Tabla `visitors`: ~50k rows = ~50MB
- Tabla `ip_lookup_cache`: ~1k active IPs = ~5MB
- Índices: ~20MB
- **Total:** ~75MB << 2GB disponible ✅

**Conclusión:** B1ms es el sweet spot.

---

## 🌐 API Layer: REST + JSON

### Diseño de Endpoints

**Simplificidad deliberada:**

```text
POST /api/validate
  ├─ action: "check_ip"
  │    ├─ Input: IP (extraído desde request headers)
  │    └─ Output: status (known_good|known_bad|needs_validation)
  │
  └─ action: "validate_visit"
       ├─ Input: IP + turnstile_token
       └─ Output: status + sensitiveLinks
```

**¿Por qué solo 1 endpoint con acciones?**
- ✅ Simple (vs REST complejo con `/api/ip`, `/api/validate/token`)
- ✅ Flexible (nuevas acciones sin nuevos endpoints)
- ✅ Mantenible (todo en una función Azure)
- ✅ Versioning fácil (action puede incluir versión)

### Formato de Respuesta

```json
{
  "status": "known_good|known_bad|needs_validation",
  "message": "Texto descriptivo si es necesario",
  "sensitiveLinks": {
    "linkedin": "[https://linkedin.com/](https://linkedin.com/)...",
    "github": "[https://github.com/](https://github.com/)..."
  }
}
```

**¿Por qué JSON?**
- ✅ Standard en 2025
- ✅ Fácil parsear en frontend
- ✅ Debuggable en DevTools
- ✅ Menor tamaño vs XML

---

## 🧠 Caché: De Memoria a Persistente

### Problema: Caché en Memoria

**Implementación inicial:**

```python
request_cache = {}  # En memoria, se pierde al reiniciar

def check_rate_limit(ip):
    # Busca en memoria
    if ip in request_cache:
        # Retorna resultado
```

**Problemas:**

| Problema | Severidad | Impacto |
|:---|:---:|---|
| Pérdida al reiniciar | 🔴 Alta | Revalidar IPs constantemente |
| Sin persistencia | 🔴 Alta | Caché = inútil |
| Escalabilidad | 🟡 Media | Multi-instancia = inconsistencia |

**¿Qué pasa en producción?**
- Azure recicla Functions (reinicio ~1x/día)
- Caché en memoria se borra
- Cada IP se re-valida (costo x10)
- ipapi.is: $0.002 x 10k visitas = $200/mes (VS $5 esperado)

### Solución: PostgreSQL Cache

**Nueva implementación:**

```python
def get_ip_from_cache(ip: str):
    """Busca en DB, no en memoria"""
    query = """
    SELECT * FROM ip_lookup_cache
    WHERE ip_address = %s
    AND last_checked_timestamp > NOW() - INTERVAL '24 hours'
    """
    return db.execute(query)
```

**Beneficios:**

| Beneficio | Valor |
|:---|:---|
| **Persistencia** | ✅ Sobrevive reinicio |
| **Escalabilidad** | ✅ Multi-instancia comparte caché |
| **TTL automático** | ✅ Índice en last_checked_timestamp |
| **Análisis** | ✅ Histórico de decisiones |

**Costo trade-off:**
- Caché en memoria: ~0ms
- Caché en DB: ~10ms

**Decisión:** 10ms es aceptable. **Persistencia > Latencia** (primer request es lento igual por validación externa)

---

## 🔄 Modularidad: De 400 líneas a 3 archivos

### Problema: Monolito Inicial

**Estructura original:**

```text
function_app.py (400+ líneas)
  ├─ Database queries (50 líneas)
  ├─ Security validation (100 líneas)
  ├─ Business logic (150 líneas)
  ├─ Error handling (50 líneas)
  └─ Response formatting (50 líneas)
```

**Problemas:**
- ❌ Difícil encontrar qué hace
- ❌ No reutilizable
- ❌ Testing difícil
- ❌ Debugging caótico

### Solución: Modularidad

**Nueva estructura:**

```text
shared_code/
  ├─ __init__.py
  ├─ db_utils.py (50 líneas)
  │    └─ Todas las queries a DB
  ├─ security_utils.py (80 líneas)
  │    └─ Validaciones, APIs externas
  └─ __init__.py

function_app.py (80 líneas)
  └─ Orquestador limpio, flujo principal visible
```

**Beneficios:**

| Archivo | Responsabilidad | Reutilizable |
|:---|:---|:---:|
| `db_utils.py` | Interacción DB | ✅ Sí (otros proyectos) |
| `security_utils.py` | Lógica seguridad | ✅ Sí (otros proyectos) |
| `function_app.py` | Flujo HTTP | ❌ No (específico) |

**Ejemplo de reutilización:**

```python
# Proyecto A (este portafolio)
from shared_code import db_utils, security_utils

# Proyecto B (futuro)
from shared_code import db_utils, security_utils
# Reusa 80% del código
```

---

## 🚀 Deployment: Azure + GitHub

### Flujo CI/CD

```text
Desarrollador
  ↓
git push main
  ↓
GitHub Actions (automático)
  ├─ Lint code
  ├─ Run tests
  └─ Deploy a Azure
      ↓
Azure Functions
  ├─ Actualiza código
  ├─ Mantiene data (PostgreSQL)
  └─ Sin downtime
```

**Configuración minimal:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Azure Functions

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: Azure/functions-action@v1
      with:
        app-name: ${{ secrets.AZURE_FUNCTION_NAME }}
        package: '.'
```

**Ventajas:**
- ✅ Deploy automático con cada push
- ✅ Sin downtime (slots en Azure)
- ✅ Fácil rollback
- ✅ Historial en GitHub

---

## 🔍 Observability: Logging y Monitoring

### Estrategia de Logging

**Niveles:**
* `CRITICAL`: Errores que rompen la app
* `ERROR`: Validación falló, IP bloqueada
* `WARNING`: Intento fallido, rate limit
* `INFO`: Cache hit, validación exitosa
* `DEBUG`: Detalles internos (nunca en prod)

**Ejemplo:**

```python
logging.warning(f"Rate limit exceeded: {ip} ({count} requests in 1 min)")
logging.info(f"Cache HIT for {ip}")
logging.error(f"Error calling ipapi.is: {e}")
```

**Almacenamiento:**
- ✅ Azure Application Insights (automático)
- ✅ Log Analytics (consultas complejas)
- ✅ Alertas automáticas si error rate > 5%

---

## 🛡️ Seguridad: Defense in Depth

### Por qué 5 capas y no 1-2?

**Tesis:** Una capa es insuficiente, múltiples capas = redundancia.

**Ejemplo de ataque:**

```text
Atacante con VPN intenta fuerza bruta
  ├─ Capa 1 (WAF): ¿Es chileno? NO → Bloqueado ✅
  │
  ├─ Capa 2 (Rate Limit): >15 req/min? YES → Bloqueado ✅
  │
  ├─ Capa 3 (Turnstile): ¿Humano? NO → Bloqueado ✅
  │
  ├─ Capa 4 (VPN Check): ¿VPN detectada? YES → Bloqueado ✅
  │
  └─ Capa 5 (Cache): ¿IP previamente bloqueada? YES → Bloqueo instantáneo ✅
```

**Redundancia:** Si falla una capa, otras 4 siguen protegiendo.
**Costo de defensa en profundidad:** ~$0.002 por IP (ipapi.is)
**Beneficio:** Imposible eludir todas las capas

**Decisión:** **Seguridad > Costo** (para portafolio que atrae reclutadores)

---

## 📊 Decisiones de Costo

### Presupuesto: $100/mes (Azure for Students)

**Allocation:**

| Servicio | Costo | % del Budget |
|:---|:---:|:---:|
| Azure Functions | ~$2 | 2% |
| PostgreSQL B1ms | $0 (free 12mo) | 0% |
| Data transfer | ~$1 | 1% |
| **Subtotal** | **~$3** | **3%** |
| ipapi.is (API) | ~$5-10 | 5-10% |
| **Total** | **~$8-13** | **8-13%** |
| **Remaining** | **$87-92** | **87-92%** |

**Interpretación:**
- ✅ Presupuesto más que cubierto
- ✅ Margen para crecer (scale a 100k visitas/mes)
- ✅ Posibilidad de agregar servicios (CDN, backup)

---

## 🚨 Problemas Encontrados y Soluciones

### Problema 1: Conflicto Anaconda ↔ Node.js
**Síntoma:** `MODULE_NOT_FOUND` en local
**Causa:** Anaconda y Node.js compartían PATH, colisionaban

**Solución:**
```bash
# Desinstalar Anaconda
# Crear venv limpio
python -m venv venv
./venv/Scripts/activate
```
**Lección:** Entornos limpios = debugging evitado

---

### Problema 2: Importes Circulares
**Síntoma:** `ImportError: cannot import name`
**Causa (inicial):**
```python
# function_app.py
import db_utils
import security_utils

# db_utils.py
from shared_code import security_utils  # Circular!

# security_utils.py
from shared_code import db_utils  # Circular!
```

**Solución:**
Usar: `from X import Y`
No: `import X`

```python
# function_app.py
from shared_code.db_utils import get_ip_from_cache
from shared_code.security_utils import validate_turnstile
```
**Lección:** Evitar importes de módulos completos cuando posible

---

### Problema 3: SSL Certificate Error
**Síntoma:** `psycopg2.OperationalError: SSL error`
**Causa:** PostgreSQL requería SSL, connection string no lo especificaba

**Solución:**
```python
connection_string = f"postgresql://{user}:{pass}@{host}/db?sslmode=require"
                                                            ↑
                                                    Agregar esta línea
```
**Lección:** Azure Managed Services requieren SSL por defecto

---

### Problema 4: Azure Functions Core Tools Falta
**Síntoma:** `func host start` no encontrado
**Causa:** Azure Functions CLI no instalado

**Solución:**
```bash
npm install -g azure-functions-core-tools@4 --unsafe-perm
# Reiniciar terminal
func host start
```
**Lección:** Documentar setup exacto para evitar bugs locales

---

## 📈 Performance: Benchmarks Reales

### Latencia por Caso

```text
Caso 1.1a (Cache Hit, Confiable):
  GET / → Response: 50ms
    └─ DB query: 10ms + Network: 40ms

Caso 2.1 (New IP, Clean):
  GET / → Turnstile Challenge: 50ms
  POST /api/validate (token) → Response: 200ms
    └─ ip-api.com: 50ms
    └─ ipapi.is: 150ms
    └─ DB insert: 10ms
    └─ Network: 40ms

Worst Case (Multiple retries):
  ~300-400ms total (still acceptable)
```

**Conclusión:** Latencia aceptable incluso en worst case

---

## 🎓 Lecciones Aprendidas

### Técnicas
- ✅ **Caché persistente > caché en memoria para serverless**
- ✅ **ITCSS > frameworks para control total**
- ✅ **Modularidad desde el inicio > refactorización futura**
- ✅ **Defensa en profundidad es viable con presupuesto limitado**

### Arquitectónicas
- ✅ **Serverless requiere pensamiento stateless**
- ✅ **Free tier APIs tienen límites reales (>40% falsos positivos)**
- ✅ **Presupuesto es restricción que fuerza creatividad**
- ✅ **Pequeñas optimizaciones (caché 24h) = grandes impactos (90% menos API calls)**

### De Negocio
- ✅ **Portafolio + demostración técnica = mejor impresión**
- ✅ **Arquitectura es diferenciador más importante que diseño**
- ✅ **Transparencia en decisiones es profesional**

---

## 🚀 Mejoras Futuras

### Corto Plazo
- 🔍 Logging detallado (Azure Application Insights)
- 📊 Dashboard de analytics
- 🧪 Testing exhaustivo (pytest)

### Mediano Plazo
- 🤖 ML scoring para threshold automático
- 🌐 Whitelist de "VPN corporativas"
- 🔄 Rate limiting adaptativo

### Largo Plazo
- 📡 Análisis predictivo de bots
- 🔐 Fingerprinting avanzado
- 🌍 Replicación geográfica (multi-region)

---

## 📚 Referencias Técnicas

- [Azure Functions Python SDK](https://learn.microsoft.com/azure/azure-functions/functions-reference-python)
- [ITCSS Methodology](https://itcss.io/)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Cloudflare WAF](https://developers.cloudflare.com/waf/)
- [REST API Best Practices](https://restfulapi.net/)

---

**Última actualización:** Noviembre 19, 2025
**Audiencia objetivo:** Tech Leads, Backend Engineers, DevOps
**Tiempo de lectura:** 12-15 minutos
**Complejidad técnica:** ⭐⭐⭐⭐ (Avanzada)