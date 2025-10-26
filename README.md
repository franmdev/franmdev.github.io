# Portafolio Profesional de Proyectos - Francisco Mora

Este repositorio contiene el código fuente de mi portafolio web personal, alojado en [https://franciscomora.dev](https://franciscomora.dev).

El objetivo de este proyecto no es solo servir como una "vitrina" para mis proyectos de Data Science, Data Engineering y RPA, sino también demostrar la **construcción de una infraestructura web full stack, segura y orientada a la recolección de datos en tiempo real**, aplicando buenas prácticas de arquitectura en la nube y medidas de seguridad avanzadas.

---

## 🚀 Objetivo y Filosofía del Proyecto

El objetivo inicial fue establecer un portafolio profesional que sirviera como una **demostración práctica de habilidades en ingeniería de datos y arquitectura en la nube**.

La filosofía del proyecto priorizó la creación de un **entorno seguro, robusto y eficiente** antes de implementar la lógica de la aplicación. Esto evolucionó hacia un **sistema de defensa en capas (Hito 5)**, que ahora incluye detección Anti-Bot (`Cloudflare Turnstile`), chequeo de VPNs/Proxies (`ipapi.is`) y un **flujo de validación dinámico** que optimiza la experiencia de usuario (UX) para visitantes de confianza mientras bloquea proactivamente amenazas, creando un equilibrio entre seguridad, rendimiento y enfoque en la audiencia objetivo (mercado laboral chileno).

---

## 🛠️ Stack Tecnológico Implementado

Se seleccionó un stack tecnológico moderno, eficiente y basado en servicios con generosos *tiers* gratuitos.

| Componente | Tecnología Utilizada | Propósito |
| :--- | :--- | :--- |
| **Hosting Frontend** | GitHub Pages | Servicio de hosting estático para el sitio web (HTML/CSS/JS). |
| **DNS y Seguridad Perimetral** | Cloudflare (Plan Gratuito) | Proxy inverso, protección DDoS, WAF, gestión DNS, SSL/HTTPS. |
| **API Backend (Serverless)** | Azure Functions (Python, Plan Consumo) | API *serverless* para ingesta de datos y orquestación de la lógica de seguridad. |
| **Base de Datos** | Azure Database for PostgreSQL (Flexible Server, B1ms) | Almacenamiento SQL. Tabla `visitors` para analítica y tabla `ip_lookup_cache` para optimización de UX. |
| **Defensa Anti-Bot** | Cloudflare Turnstile | Servicio de desafío Anti-Bot (invisible) para verificar visitantes humanos. |
| **Geolocalización (País)** | `IP-API.com` | API gratuita para obtener datos geográficos básicos (País, Región, Ciudad). |
| **Detección VPN/Proxy** | `ipapi.is` | API de seguridad para identificar IPs fraudulentas (VPN, Proxy, Tor, Datacenter). |
| **Analítica Estándar** | Google Analytics (GA4) | Seguimiento de métricas agregadas estándar (fuentes, comportamiento). |
| **Conectividad DB (Python)** | `psycopg2-binary` | Librería para conectar Python con PostgreSQL. |
| **Parseo User Agent** | `user-agents` (Librería Python) | Extracción del nombre del navegador desde el string User-Agent. |
| **Frontend** | HTML5 / CSS3 / JavaScript | Estructura, diseño e interactividad (`fetch` a API y renderizado condicional). |
| **Gestión de Secretos** | Azure App Settings (Variables de Entorno) | Almacenamiento seguro de credenciales de DB y API Keys fuera del código fuente. |
| **Control de Versiones** | Git / GitHub (Monorepo Privado) | Gestión del código fuente (Frontend público, Backend privado). |
| **Diagramación** | `diagrams.net` (draw.io) | Creación de diagramas de arquitectura. |

---

## 🛡️ Arquitectura de Seguridad en Capas (Defensa en Profundidad)

La seguridad evolucionó de un simple filtro geográfico a una estrategia de "Defensa en Profundidad" de 5 capas que filtra el tráfico como un embudo, desde el borde de red hasta la base de datos.

1.  **Capa 1: Borde de Red (Cloudflare WAF):** El primer filtro. Se configuró un **Geobloqueo Nivel 1** (`NOT (CL OR ZZ)`) que bloquea el ~80% del tráfico "basura" antes de que toque la API, ahorrando costos de ejecución en Azure.
2.  **Capa 2: Control de Abuso (Azure Function):** Se implementó un **Rate Limiting** en memoria (`security_utils.check_rate_limit()`) que previene ataques de F5 o bucles de un solo actor (15 peticiones/minuto).
3.  **Capa 3: Detección Anti-Bot (Cloudflare Turnstile):** `security_utils.validate_turnstile()` valida un token de desafío. Si un bot falla, es bloqueado inmediatamente sin gastar en más llamadas a APIs de pago.
4.  **Capa 4: Detección de Fraude/VPN (ipapi.is):** El chequeo más profundo. `security_utils.check_suspicious_ip()` consulta `ipapi.is` (un **pivote técnico** desde IP-API/IP2Location, que fallaron las pruebas) para 6 flags de riesgo (`is_vpn`, `is_proxy`, `is_tor`, etc.). Si alguno es `true`, el acceso es denegado.
5.  **Capa 5: Optimización Persistente (Caché de DB):** El resultado de estas validaciones (bueno o malo) se guarda por 24h en la tabla `ip_lookup_cache`. Esto crea un **"Fast Pass"** para visitantes de confianza (mejora la UX) y un "bloqueo rápido" para los malos conocidos (mejora la seguridad y ahorra costos).

### Diagrama de Arquitectura de Seguridad

<img src="https://i.imgur.com/83p9sA6.png" width="700" alt="Diagrama de Arquitectura de Seguridad en Capas (Defensa en Profundidad)">

*(Diagrama creado con diagrams.net)*

---

## 📊 Flujo de Datos Dinámico (CASO 1 vs. CASO 2)

Este es el núcleo de la inteligencia del proyecto. Se descartó un flujo simple de "validar y registrar" por un sistema avanzado de dos pasos que **optimiza la experiencia del usuario (UX)** para visitantes de confianza y **maximiza la seguridad** para los desconocidos.

* **Objetivo:** Evitar ejecutar 5 validaciones de seguridad y 2 llamadas a la DB en *cada* visita.
* **Solución:** Usar la tabla `ip_lookup_cache` como un "check-point" de seguridad.

### Flujo Detallado

1.  **Paso 1: Chequeo Inicial (Caché Check)**
    * `main.js` (`DOMContentLoaded`) llama a la API con `action: "check_ip"`.
    * El Backend (`function_app.py`) consulta `db_utils.get_ip_from_cache()`.

2.  **Paso 2A: CASO 1 (Caché HIT - Fast Pass ⚡)**
    * Se encuentra una IP en caché (< 24h).
    * **Si es `known_good` (CL, no-VPN):** La API responde `status: "known_good"` y los links. El frontend **omite Turnstile** y muestra todo al instante (UX Óptima).
    * **Si es `known_bad` (No-CL o VPN):** La API responde `status: "known_bad"`. El frontend muestra "Acceso Denegado" (Seguridad Óptima).

3.  **Paso 2B: CASO 2 (Caché MISS - Validación Completa 🛡️)**
    * No se encuentra la IP en caché.
    * La API responde `status: "needs_validation"`.
    * El frontend (`main.js`) recibe esto, muestra el contenido principal y ejecuta `window.turnstile.render()` para activar el desafío Anti-Bot.

4.  **Paso 3: Validación del Desafío**
    * El usuario (humano) pasa el desafío Turnstile.
    * `main.js` llama a la API por **segunda vez**, ahora con `action: "validate_visit"` y el `token` de Turnstile.

5.  **Paso 4: Orquestación de Seguridad (El Flujo Completo)**
    * El backend ejecuta la "Defensa en Profundidad" completa:
        1.  Valida Turnstile (`validate_turnstile()`).
        2.  Obtiene Geo-datos (`get_geo_info_from_api()`).
        3.  Chequea Fraude/VPN (`check_suspicious_ip()`).
    * El resultado (bueno o malo) se guarda en `ip_lookup_cache` usando `db_utils.set_ip_in_cache()`.
    * **Solo si es `known_good`**, se registra la visita en la tabla `public.visitors` (`db_utils.insert_visitor_data()`).

6.  **Paso 5: Respuesta Final**
    * La API responde `known_good` o `known_bad` según el resultado de la validación.
    * El frontend muestra los links sensibles o el mensaje de bloqueo final.

### Diagrama de Flujo Dinámico

<img src="https://i.imgur.com/g0tX8fG.png" width="700" alt="Diagrama de Flujo Dinámico CASO 1 vs CASO 2">

*(Diagrama creado con diagrams.net)*

---

## 💾 Estructura de la Base de Datos (`portfolio_analytics_db`)

La base de datos se compone de dos tablas clave que trabajan juntas para balancear la analítica y el rendimiento:

**Tabla: `public.visitors`** (Almacén de Analítica)
* Registra las visitas ***únicas y validadas*** (solo de Chile, no-VPN) para analítica posterior.

| Columna          | Tipo          | Descripción                                     | PK/FK |
| :--------------- | :------------ | :---------------------------------------------- | :---- |
| `id`             | `SERIAL`      | ID único de visita.                             | PK    |
| `visit_timestamp`| `TIMESTAMPTZ` | Fecha/Hora exacta (UTC) (Default: `NOW()`).     |       |
| `ip_address`     | `VARCHAR(45)` | IP limpia del visitante.                        |       |
| `user_agent`     | `TEXT`        | User-Agent original.                            |       |
| `browser`        | `VARCHAR(50)` | Navegador parseado (ej. 'Chrome').              |       |
| `country`        | `VARCHAR(100)`| País (GeoIP).                                   |       |
| `region`         | `VARCHAR(100)`| Región/Estado (GeoIP).                          |       |
| `city`           | `VARCHAR(100)`| Ciudad (GeoIP).                                 |       |
| `page_visited`   | `VARCHAR(255)`| URL Referer.                                    |       |

**Tabla: `public.ip_lookup_cache`** (Tabla de Optimización/Seguridad)
* Actúa como el **"checkpoint"** de seguridad. Almacena el resultado de la validación de una IP por **24 horas** para habilitar el flujo "Fast Pass" (Caso 1).

| Columna                  | Tipo          | Descripción                                                      | PK/FK |
| :----------------------- | :------------ | :--------------------------------------------------------------- | :---- |
| `ip_address`             | `VARCHAR(45)` | IP única del visitante.                                          | PK    |
| `country_code`           | `VARCHAR(10)` | Código de país (ej. 'CL').                                       |       |
| `region`                 | `VARCHAR(100)`| Región/Estado (GeoIP).                                           |       |
| `city`                   | `VARCHAR(100)`| Ciudad (GeoIP).                                                  |       |
| `is_suspicious`          | `BOOLEAN`     | `true` si falló Turnstile o `ipapi.is` (VPN, Proxy, etc.)        |       |
| `last_checked_timestamp` | `TIMESTAMPTZ` | Fecha/Hora de la última validación (Default: `NOW()`).           |       |

### Diagrama Entidad-Relación (ERD)

*(Diagrama ERD mostrando la relación (o falta de ella) entre `visitors` y `ip_lookup_cache` creado con diagrams.net)*

---

## 💡 Desafíos Técnicos y Decisiones Clave

El desarrollo de este proyecto implicó superar varios desafíos técnicos y tomar decisiones estratégicas importantes:

* **Optimización de Costos en Azure:** Se detectó que el tamaño por defecto de Azure PostgreSQL (B2s) consumiría rápidamente los créditos de Azure for Students. Se investigó y **se seleccionó el tamaño B1ms**, confirmando que era el adecuado dentro del tier gratuito de 12 meses, preservando los créditos.
* **Pivote en Detección de Fraude (API):** Las pruebas iniciales (usando VPNs como Kaspersky) revelaron que las APIs gratuitas (`IP-API.com`, `IP2Location.io`) **no eran fiables para detectar VPNs/Proxies**. Se tomó la decisión estratégica de **adoptar `ipapi.is`**, una API de pago más robusta, configurando la lógica para bloquear basado en sus 6 flags de riesgo, priorizando la seguridad sobre el costo cero.
* **Evolución de la Estrategia de Caché:** El caché inicial en memoria (Python `dict`) era volátil y se perdía con cada reinicio de la Azure Function. Para mejorar la persistencia y eficiencia, se implementó un **caché persistente en la base de datos** (`ip_lookup_cache`), permitiendo el flujo "Fast Pass" (Caso 1) de manera fiable por 24 horas.
* **Refactorización y Modularidad:** A medida que la lógica en `function_app.py` crecía, se volvió difícil de mantener. Se realizó una **refactorización completa**, moviendo toda la lógica de base de datos (`db_utils.py`) y seguridad/validaciones (`security_utils.py`) a módulos reutilizables dentro de `shared_code/`, dejando `function_app.py` como un orquestador limpio.
* **Resolución de Problemas de Entorno Local:** Se enfrentaron y solucionaron diversos problemas durante el desarrollo local (`func host start`), incluyendo conflictos de rutas (`MODULE_NOT_FOUND`) entre Anaconda y Node.js, errores de importación (`ImportError`) en Python tras la refactorización, y errores de conexión SSL con `psycopg2` (solucionados con `sslmode='require'`).

---

## 📈 Próximos Pasos y Mejoras Potenciales (Roadmap)

Este proyecto sienta una base sólida, pero existen varias oportunidades para futuras mejoras y expansiones:

* **Desarrollo Frontend:**
    * Mejorar el diseño visual de `index.html` utilizando un framework CSS (como Tailwind) o una plantilla predefinida.
    * Crear páginas individuales para detallar proyectos específicos del portafolio.
* **Visualización de Datos:**
    * Conectar una herramienta de BI (como Power BI o Looker Studio) a la base de datos `portfolio_analytics_db`.
    * Crear un **dashboard interactivo** para visualizar las métricas de visitas (mapa geográfico, tendencias temporales, distribución de navegadores/países).
* **Enriquecimiento de Datos:**
    * Ampliar la lógica de `security_utils.py` para extraer también el **Sistema Operativo (OS)** y el **Tipo de Dispositivo** (móvil/escritorio) desde el User Agent.
    * Agregar estas nuevas columnas a la tabla `public.visitors`.
* **Refinamiento de Configuración y Seguridad:**
    * Mover las configuraciones actualmente hardcodeadas (como `ALLOWED_COUNTRIES` y las URLs de `LINKEDIN`/`GITHUB`) desde `function_app.py` a **Azure App Settings**. Esto permitiría modificarlas sin necesidad de re-desplegar el código de la API.
* **Monitoreo y Alertas:**
    * Configurar **Azure Monitor** para supervisar el rendimiento y la salud de la Azure Function y la base de datos PostgreSQL.
    * Establecer **alertas automáticas** para notificar sobre posibles errores, picos de tráfico inusuales o fallos en las llamadas a APIs externas.