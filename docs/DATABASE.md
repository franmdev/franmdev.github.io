# 💾 Base de Datos: Schema, Queries y Optimización

## Resumen Ejecutivo

Este documento detalla la estructura de la base de datos PostgreSQL, incluyendo schema SQL, índices, y estrategias de optimización.

---

## 🏗️ Arquitectura de la Base de Datos

**Dos tablas principales:**

```text
┌─────────────────────────────────────────┐
│        ip_lookup_cache (Caché)          │
│ ┌─────────────────────────────────────┐ │
│ │ PK: ip_address                      │ │
│ │ TTL: 24 horas                       │ │
│ │ Propósito: Optimización + Seguridad │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                   ↑
                   │ (Foreign Key)
                   │
┌─────────────────────────────────────────┐
│         visitors (Analítica Real)       │
│ ┌─────────────────────────────────────┐ │
│ │ PK: id (auto-increment)             │ │
│ │ FK: ip_address                      │ │
│ │ Propósito: Histórico de accesos     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🔐 Tabla 1: `ip_lookup_cache`

### Propósito
Almacena **resultados de validación** de IPs por 24 horas. Es el "checkpoint" de seguridad que habilita el flujo "Fast Pass".

### Schema SQL

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
```

### Índices

```sql
-- Índice para limpieza automática (TTL 24h)
CREATE INDEX idx_last_checked ON public.ip_lookup_cache(last_checked_timestamp);

-- Índice para búsquedas por país (análisis geográfico)
CREATE INDEX idx_country_code ON public.ip_lookup_cache(country_code);

-- Índice para búsquedas de sospechosas
CREATE INDEX idx_is_suspicious ON public.ip_lookup_cache(is_suspicious);
```

### Columnas Detalladas

| Columna | Tipo | Descripción | Ejemplo | Notas |
|:---|:---|:---|:---|:---|
| `ip_address` | VARCHAR(45) | IP única (PK) | `186.78.20.109` | IPv4 (15 chars) + IPv6 (45 chars) |
| `country_code` | VARCHAR(10) | Código ISO-3166-1 | `CL`, `US`, `DE` | De ip-api.com |
| `region` | VARCHAR(100) | Región/Estado | `Región de Valparaíso` | GeoIP data |
| `city` | VARCHAR(100) | Ciudad | `Valparaíso` | GeoIP data |
| `is_suspicious` | BOOLEAN | VPN/Proxy/Tor detectado | `False`, `True` | De ipapi.is (6 flags) |
| `is_bot_possible` | INT | Contador de Turnstile fallidos | `0`, `1`, `2`, `3+` | Rango 0-10 (constraint) |
| `last_checked_timestamp` | TIMESTAMPTZ | Última validación | `2025-11-19 10:05...` | UTC, precisión milisegundos |

### Datos de Ejemplo

```sql
INSERT INTO ip_lookup_cache VALUES
(
    '186.78.20.109', -- IP chilena, confiable, sin intentos fallidos
    'CL',
    'Región de Valparaíso',
    'Valparaíso',
    FALSE, -- No es sospechosa
    0,     -- Sin intentos fallidos
    NOW()
),
(
    '34.89.23.45',   -- IP con VPN detectada, bloqueada
    'CL',
    'Región Metropolitana',
    'Santiago',
    TRUE,  -- Sospechosa (VPN)
    0,
    NOW()
),
(
    '203.45.67.89',  -- IP con 1 intento fallido
    'CL',
    'Región del Bío-Bío',
    'Concepción',
    FALSE,
    1,     -- 1 intento fallido (puede reintentar)
    NOW()
);
```

### Operaciones CRUD

#### CREATE (Insertar o Actualizar)

```python
def set_ip_in_cache(ip: str, geo_data: dict, is_suspicious: bool, is_bot_possible: int):
    """
    Guarda o actualiza IP en caché.
    Usa UPSERT (INSERT ... ON CONFLICT DO UPDATE)
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

#### READ (Obtener del Caché)

```python
def get_ip_from_cache(ip: str) -> dict | None:
    """
    Obtiene IP si existe y está dentro del TTL de 24h.
    Retorna None si no existe o está expirado.
    """
    query = """
    SELECT 
        ip_address, country_code, region, city, 
        is_suspicious, is_bot_possible, last_checked_timestamp
    FROM ip_lookup_cache
    WHERE ip_address = %s
    AND last_checked_timestamp > NOW() - INTERVAL '24 hours'
    """
    
    cursor.execute(query, (ip,))
    result = cursor.fetchone()
    
    if result:
        logging.info(f"Cache HIT for {ip}")
        return {
            'ip_address': result[0],
            'country_code': result[1],
            'region': result[2],
            'city': result[3],
            'is_suspicious': result[4],
            'is_bot_possible': result[5],
            'last_checked_timestamp': result[6],
            'cached': True,
        }
        
    logging.info(f"Cache MISS for {ip}")
    return None
```

#### UPDATE (Incrementar contador de fallos)

```python
def increment_bot_counter(ip: str):
    """
    Incrementa is_bot_possible cuando Turnstile falla.
    Máximo 10 (constraint).
    """
    query = """
    UPDATE ip_lookup_cache
    SET is_bot_possible = LEAST(is_bot_possible + 1, 10),
        last_checked_timestamp = NOW()
    WHERE ip_address = %s
    """
    
    cursor.execute(query, (ip,))
    db_connection.commit()
```

#### DELETE (Limpieza de Caché Expirado)

```python
def cleanup_expired_cache():
    """
    Elimina IPs no validadas en más de 24 horas.
    Solo elimina las que no son sospechosas (mantener registro de amenazas).
    Ejecutar: 1x/día (Azure Functions Timer Trigger)
    """
    query = """
    DELETE FROM ip_lookup_cache
    WHERE last_checked_timestamp < NOW() - INTERVAL '24 hours'
    AND is_suspicious = FALSE
    """
    
    cursor.execute(query)
    rows_deleted = cursor.rowcount
    db_connection.commit()
    logging.info(f"Cache cleanup: {rows_deleted} rows deleted")
```

---

## 📊 Tabla 2: `visitors`

### Propósito
Almacena **histórico de visitas validadas**. Fuente de truth para analítica y trends.

### Schema SQL

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
    
    -- Foreign key a caché (opcional, para referencial integrity)
    CONSTRAINT fk_ip_cache 
        FOREIGN KEY (ip_address) 
        REFERENCES ip_lookup_cache(ip_address)
        ON DELETE SET NULL
);
```

### Índices

```sql
-- Índice en timestamp (para queries de últimos N días)
CREATE INDEX idx_visit_timestamp ON public.visitors(visit_timestamp DESC);

-- Índice en IP (para agrupar por visitante)
CREATE INDEX idx_ip_address ON public.visitors(ip_address);

-- Índice en país (para análisis geográfico)
CREATE INDEX idx_country ON public.visitors(country);

-- Índice compuesto (visits por país, últimos 30 días)
CREATE INDEX idx_country_timestamp 
ON public.visitors(country, visit_timestamp DESC);
```

### Columnas Detalladas

| Columna | Tipo | Descripción | Ejemplo | Fuente |
|:---|:---|:---|:---|:---|
| `id` | SERIAL | Auto-incremento (PK) | `1`, `2`, `3` | PostgreSQL |
| `visit_timestamp` | TIMESTAMPTZ | Fecha/hora exacta | `2025-11-19...` | NOW() |
| `ip_address` | VARCHAR(45) | IP del visitante | `186.78.20.109` | request.remote_addr |
| `user_agent` | TEXT | String crudo del navegador | `Mozilla/5.0...` | request.headers['User-Agent'] |
| `browser` | VARCHAR(50) | Navegador parseado | `Chrome`, `Firefox` | user_agent parser |
| `country` | VARCHAR(100) | País (GeoIP) | `Chile` | ip-api.com |
| `region` | VARCHAR(100) | Región/Estado | `Región Metropolitana` | ip-api.com |
| `city` | VARCHAR(100) | Ciudad (GeoIP) | `Santiago` | ip-api.com |
| `page_visited` | VARCHAR(255) | URL referer | `/projects` | request.referrer |

### Datos de Ejemplo

```sql
INSERT INTO visitors
(visit_timestamp, ip_address, user_agent, browser, country, region, city, page_visited)
VALUES
(
    '2025-11-19 10:05:55.123+00',
    '186.78.20.109',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Chrome',
    'Chile',
    'Región Metropolitana',
    'Santiago',
    '/'
),
(
    '2025-11-19 10:15:42.456+00',
    '203.0.113.45',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'Safari',
    'Chile',
    'Región de Valparaíso',
    'Valparaíso',
    '/projects'
);
```

### Operaciones CRUD

#### CREATE (Registrar Visita)

```python
def insert_visitor_data(ip: str, geo_data: dict, user_agent: str, browser: str, page: str = '/'):
    """
    Registra una visita en la tabla visitors.
    SOLO se llama en Caso 2.1 (validación exitosa).
    """
    query = """
    INSERT INTO visitors
    (visit_timestamp, ip_address, user_agent, browser, country, region, city, page_visited)
    VALUES (NOW(), %s, %s, %s, %s, %s, %s, %s)
    """
    
    cursor.execute(query, (
        ip,
        user_agent,
        browser,
        geo_data.get('country'),
        geo_data.get('region'),
        geo_data.get('city'),
        page,
    ))
    db_connection.commit()
    logging.info(f"Visitor registered: {ip} from {geo_data.get('city')}, {geo_data.get('country')}")
```

#### READ (Analítica)

**Query 1: Total visitas últimas 24h**
```sql
SELECT COUNT(*) as total_visits 
FROM visitors 
WHERE visit_timestamp > NOW() - INTERVAL '24 hours'
```

**Query 2: Visitas por país**
```sql
SELECT country, COUNT(*) as count
FROM visitors
WHERE visit_timestamp > NOW() - INTERVAL '30 days'
GROUP BY country
ORDER BY count DESC
```

**Query 3: Navegadores más usados**
```sql
SELECT browser, COUNT(*) as count
FROM visitors
WHERE visit_timestamp > NOW() - INTERVAL '30 days'
GROUP BY browser
ORDER BY count DESC
```

**Query 4: Ciudades con más accesos**
```sql
SELECT city, region, country, COUNT(*) as count
FROM visitors
WHERE visit_timestamp > NOW() - INTERVAL '30 days'
AND country = 'Chile'
GROUP BY city, region, country
ORDER BY count DESC
LIMIT 10
```

---

## 🔄 Relación entre Tablas

### Foreign Key Relationship

```sql
-- ip_lookup_cache es INDEPENDIENTE (no necesita visitors)
-- visitors DEPENDE de ip_lookup_cache (opcional)

CONSTRAINT fk_ip_cache 
FOREIGN KEY (ip_address) 
REFERENCES ip_lookup_cache(ip_address)
ON DELETE SET NULL
```

**¿Por qué ON DELETE SET NULL?**
- Si una IP se borra del caché, sus visitas siguen registradas.
- Permite análisis histórico incluso si caché expira.
- Flexibilidad vs Integridad.

---

## 📈 Estadísticas y Monitoreo

### Size Estimation

Asumiendo 10k visitas/mes, 30 días:

* **ip_lookup_cache:**
    * ~1000 active IPs = ~50 KB
* **visitors:**
    * 10,000 rows × ~0.5 KB/row = ~5 MB
* **Índices:**
    * ~20 MB total
* **TOTAL:** ~25 MB << 2 GB PostgreSQL B1ms ✅

### Query Performance

```sql
-- Verificar plan de ejecución
EXPLAIN ANALYZE 
SELECT * FROM visitors 
WHERE visit_timestamp > NOW() - INTERVAL '24 hours'
AND country = 'Chile'
ORDER BY visit_timestamp DESC
LIMIT 100
```

**Resultado esperado:**
- Index Scan (rápido)
- Rows: ~50
- Time: ~5ms

---

## 🧹 Mantenimiento Automático

### Limpieza de Caché (24h TTL)

**Azure Function Timer Trigger (ejecutar 1x/día)**

```python
import azure.functions as func
from datetime import datetime

def cleanup_cache_timer(mytimer: func.TimerRequest):
    """
    Elimina IPs del caché que no han sido validadas en 24h.
    Agenda: Daily a las 02:00 UTC
    """
    query = """
    DELETE FROM ip_lookup_cache
    WHERE last_checked_timestamp < NOW() - INTERVAL '24 hours'
    AND is_suspicious = FALSE
    """
    
    try:
        cursor.execute(query)
        deleted_count = cursor.rowcount
        db_connection.commit()
        
        logging.info(f"[{datetime.now()}] Cache cleanup: {deleted_count} expired IPs deleted")
    except Exception as e:
        logging.error(f"Cache cleanup failed: {e}")
```

### Vacuuming y Análisis

```sql
-- Ejecutar 1x/semana
VACUUM ANALYZE public.visitors;
VACUUM ANALYZE public.ip_lookup_cache;
```

---

## 🔐 Seguridad de la Base de Datos

### Connection Security

**SSL requerido (Azure PostgreSQL default)**

```python
connection_string = f"""
postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}
?sslmode=require
"""
```

**Firewall:** Solo permitir Azure Functions
(Azure Network Security configurado)

### Data Sanitization

✅ **CORRECTO:** Parameterized queries (previene SQL injection)
```python
query = "SELECT * FROM visitors WHERE ip_address = %s"
cursor.execute(query, (ip,))
```

❌ **INCORRECTO:** String concatenation
```python
query = f"SELECT * FROM visitors WHERE ip_address = '{ip}'"
# ↑ Vulnerable a SQL injection
```

### Backups

**Configuración Azure:**
- Backup automático: Diariamente
- Retención: 7 días
- Geo-redundancy: Activado
- Encriptación: En tránsito + en reposo

---

## 📊 Queries Útiles para Análisis

### Dashboard Queries

```sql
-- 1. Total visitas hoy
SELECT COUNT(*) as today_visits
FROM visitors
WHERE DATE(visit_timestamp AT TIME ZONE 'America/Santiago') = CURRENT_DATE;

-- 2. Visitantes únicos (por IP)
SELECT COUNT(DISTINCT ip_address) as unique_visitors
FROM visitors
WHERE visit_timestamp > NOW() - INTERVAL '30 days';

-- 3. Promedio visitas por IP
SELECT 
    ROUND(AVG(visit_count), 2) as avg_visits_per_ip
FROM (
    SELECT COUNT(*) as visit_count
    FROM visitors
    GROUP BY ip_address
) subquery;

-- 4. Páginas más visitadas
SELECT page_visited, COUNT(*) as views
FROM visitors
WHERE visit_timestamp > NOW() - INTERVAL '30 days'
GROUP BY page_visited
ORDER BY views DESC;

-- 5. Tendencia últimos 7 días
SELECT 
    DATE(visit_timestamp AT TIME ZONE 'America/Santiago') as date,
    COUNT(*) as visits
FROM visitors
WHERE visit_timestamp > NOW() - INTERVAL '7 days'
GROUP BY DATE(visit_timestamp AT TIME ZONE 'America/Santiago')
ORDER BY date ASC;
```

---

## 🚀 Optimizaciones Aplicadas

### Índice Composite para Queries Frecuentes

```sql
-- Query frecuente: "Visitas de Chile en últimos 30 días"
CREATE INDEX idx_country_timestamp 
ON public.visitors(country, visit_timestamp DESC)
WHERE country = 'Chile';
```

### Particionamiento (Futuro)
Si la tabla crece a >100M rows:

```sql
-- Particionar por mes
CREATE TABLE visitors_2025_11 PARTITION OF visitors
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
```

### Connection Pooling
Usar connection pooling (no abrir conexión per request)

```python
from psycopg2.pool import SimpleConnectionPool

min_conn = 2
max_conn = 20
pool = SimpleConnectionPool(min_conn, max_conn, 
                            host=DB_HOST, 
                            user=DB_USER, 
                            password=DB_PASSWORD, 
                            database=DB_NAME,
                            sslmode='require')

# Get connection
conn = pool.getconn()
try:
    # Use connection
    pass
finally:
    pool.putconn(conn) # Return to pool
```

---

## 🎓 Lecciones Aprendidas

### Decisiones Tomadas
- ✅ **Foreign Key ON DELETE SET NULL** → Permite análisis histórico
- ✅ **TTL 24h en caché** → Balance entre performance y freshness
- ✅ **Índices compuestos** → Queries analíticas rápidas
- ✅ **TIMESTAMPTZ con UTC** → Zona horaria consistente

### Trade-offs

| Decisión | Beneficio | Costo |
|:---|:---|:---|
| Índices múltiples | Queries rápidas | ~20MB storage |
| Caché persistente | Performance | +1 tabla |
| ON DELETE SET NULL | Histórico | Datos huérfanos |

---

## 📚 Consultas Útiles

### Debugging

```sql
-- Ver todas las columnas de una IP
SELECT * FROM ip_lookup_cache WHERE ip_address = '186.78.20.109';

-- Ver todas las visitas de una IP
SELECT * FROM visitors WHERE ip_address = '186.78.20.109' ORDER BY visit_timestamp DESC;

-- Ver índices de una tabla
SELECT * FROM pg_indexes WHERE tablename = 'visitors';

-- Ver tamaño de tabla
SELECT pg_size_pretty(pg_total_relation_size('visitors')) as size;
```

---

## 🔍 Monitoreo en Producción

### Alertas Recomendadas
- Cache hit rate < 80% → Investigar TTL
- Query time > 100ms → Revisar índices
- Connection pool exhausted → Aumentar max_conn
- Disk usage > 80% → Limpiar datos antiguos

---

**Última actualización:** Noviembre 19, 2025
**Audiencia objetivo:** Backend Engineers, DBAs, DevOps
**Tiempo de lectura:** 10-12 minutos
**Complejidad técnica:** ⭐⭐⭐⭐ (Avanzada)