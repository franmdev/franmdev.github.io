# Portafolio Profesional de Proyectos - Francisco Mora

Este repositorio contiene el código fuente de mi portafolio web personal, alojado en [https://franciscomora.dev](https://franciscomora.dev).

El objetivo de este proyecto no es solo servir como una "vitrina" para mis proyectos de Data Science, Data Engineering y RPA, sino también demostrar, paso a paso, la **construcción de una infraestructura web moderna, segura y orientada a la recolección de datos en tiempo real**, aplicando buenas prácticas de desarrollo en la nube y **medidas de seguridad avanzadas para proteger información sensible y enfocar el contenido al público objetivo.**

---

## 🚀 Filosofía del Proyecto: Seguridad, Datos y Audiencia Objetivo Primero

Antes de desplegar cualquier funcionalidad, se priorizó la creación de un **entorno seguro y robusto**. Esto incluyó la configuración de DNS, protección DDoS y certificados SSL mediante Cloudflare. Posteriormente, se implementaron dos sistemas de analítica: uno estándar (GA4) y un **pipeline de datos personalizado**. Este último no solo recolecta métricas detalladas, sino que también implementa una **regla de negocio clave: el control de acceso geográfico**, garantizando que cierta información sensible (como enlaces a perfiles profesionales) solo sea visible para el mercado laboral chileno, protegiendo la privacidad y enfocando la exposición del perfil al nicho de interés definido.

---

## 🛠️ Stack Tecnológico Implementado

Se seleccionó un stack tecnológico moderno, eficiente y basado en servicios gratuitos o con generosos *tiers* gratuitos.

| Componente                    | Tecnología Utilizada                            | Propósito                                                                      |
| :---------------------------- | :---------------------------------------------- | :----------------------------------------------------------------------------- |
| **Hosting Frontend** | GitHub Pages                                    | Servicio de hosting estático para el sitio web (HTML/CSS/JS).                  |
| **DNS y Seguridad Perimetral** | Cloudflare (Plan Gratuito)                    | Proxy inverso, protección DDoS, gestión DNS, redireccionamientos 301.         |
| **Dominios** | Porkbun (`.dev`) / NIC.cl (`.cl`)               | Registradores de dominio.                                                      |
| **Analítica Estándar** | Google Analytics (GA4)                          | Seguimiento de métricas agregadas estándar (fuentes, comportamiento).            |
| **API Backend (Serverless)** | Azure Functions (Python 3.x, Plan Consumo)      | API *serverless* para ingesta de datos y **control de acceso basado en geoIP**. |
| **Base de Datos** | Azure Database for PostgreSQL (Flexible Server, B1ms) | Almacenamiento SQL seguro y escalable (cubierto por nivel gratuito Azure).     |
| **Conectividad DB (Python)** | `psycopg2-binary`                               | Librería para conectar Python con PostgreSQL.                                  |
| **Geolocalización IP** | `requests` + IP-API.com (API Externa Gratuita) | Llamada a API para obtener País/Región/Ciudad para analítica y **seguridad**.    |
| **Parseo User Agent** | `user-agents` (Librería Python)                 | Extracción del nombre del navegador desde el string User-Agent.                |
| **Frontend** | HTML5 / CSS3 / JavaScript                       | Estructura, diseño e interactividad (incluye `fetch` a API y **renderizado condicional**). |
| **Entorno Python (Local)** | `.venv`                                         | Gestión limpia de dependencias para desarrollo de la API.                    |
| **Gestión de Secretos (Cloud)** | Azure App Settings (Variables de Entorno)       | Almacenamiento seguro de credenciales de DB en Azure.                        |
| **Control de Versiones** | Git / GitHub                                    | Gestión del código fuente y documentación.                                     |
| **Diagramación** | `diagrams.net` (draw.io)                          | Creación de diagramas de arquitectura.                                         |

---

## 🛡️ Arquitectura de Seguridad (Implementada)

La seguridad fue un pilar fundamental desde el inicio, implementando una estrategia de defensa en capas que ademas incorpora un control de acceso geográfico:

* **Proxy Inverso (Cloudflare):** Todo el tráfico pasa primero por Cloudflare, mitigando ataques y ocultando la IP de GitHub Pages.
* **Protección DDoS:** Cloudflare mitiga automáticamente ataques volumétricos.
* **Ocultamiento de IP:** La IP real de GitHub Pages no se expone públicamente.
* **SSL/TLS End-to-End:** Cifrado gestionado por Cloudflare (`https` Modo "Full").
* **Redireccionamiento Seguro:** Redirecciones 301 de dominios secundarios gestionadas en Cloudflare.
* **Seguridad API (CORS):** La Azure Function (`franmora-portfolio-api`) solo acepta llamadas desde `https://franciscomora.dev`.
* **Gestión de Secretos:** Credenciales de DB almacenadas de forma segura en Azure App Settings, fuera del código fuente.
* **Control de Acceso Geográfico (NUEVO):** Se implementó una lógica en la API Backend (Azure Function) que utiliza la geolocalización IP (`IP-API.com`) para verificar el país del visitante. **Información sensible (URLs de LinkedIn/GitHub) solo se devuelve al frontend si el visitante proviene de Chile ('CL')**. Para visitantes de otros países, la API omite esta información, previniendo su exposición innecesaria y enfocando el perfil profesional al mercado objetivo definido. Esta validación ocurre en el *backend*, asegurando que las URLs no sean accesibles ni siquiera inspeccionando el código fuente o el tráfico de red desde geografías no permitidas.

<img src="assets/images/arquitectura-seguridad.svg" width="700" alt="Diagrama de Arquitectura de Seguridad y Hosting">
*Diagrama 1: Flujo de tráfico seguro y control de acceso implementado.*

---

## 📊 Arquitectura de Datos (Implementada)

Se implementaron dos sistemas complementarios para la analítica y funcionalidad, destacando el pipeline personalizado con lógica de negocio:

### Sistema 1: Analítica Estándar con Google Analytics (GA4)

* **Propósito:** Métricas agregadas estándar (fuentes, comportamiento, demografía general) vía dashboard de GA4.
* **Implementación:** Snippet G-Tag en el `<head>` del HTML. Datos en servidores de Google.

### Sistema 2: Pipeline de Datos Personalizado con Azure y Control de Acceso GeoIP

* **Propósito:** Demostrar ingeniería de datos *full stack* y aplicar una **regla de negocio** para proteger información sensible, mostrando contenido dinámicamente según la ubicación del visitante. Esto garantiza una experiencia adaptada al público objetivo (mercado laboral chileno) y protege la privacidad fuera de ese contexto.
* **Flujo Detallado:**
    1.  **Ingesta y Solicitud (Frontend JS):** Al cargar la página (`DOMContentLoaded`), `assets/js/main.js` llama (`fetch` POST) a la API de Azure (`franmora-portfolio-api`).
    2.  **Procesamiento, Verificación y Decisión (Azure Function - Python):**
        * Recibe la solicitud. Extrae y limpia la IP (`x-forwarded-for`). Parsea el User Agent (`user-agents` para obtener `browser.family`).
        * Llama a `IP-API.com` para obtener `countryCode`, `country`, `regionName`, `city`.
        * **Verificación GeoIP (Regla de Negocio):** Comprueba si el `countryCode` obtenido está en la lista `ALLOWED_COUNTRIES` (actualmente `['CL']`).
        * Lee credenciales de DB desde Azure App Settings.
        * Se conecta a PostgreSQL (`sslmode='require'`).
        * Inserta los datos de la visita (IP, UA, Navegador, Página, País, Región, Ciudad) en `public.visitors`.
    3.  **Respuesta Condicional (JSON):**
        * **Si `countryCode` está en `ALLOWED_COUNTRIES`:** La API devuelve un JSON incluyendo un objeto `sensitiveLinks` con las URLs de LinkedIn y GitHub.
        * **Si `countryCode` NO está permitido:** La API devuelve un JSON con el objeto `sensitiveLinks` vacío o ausente.
    4.  **Renderizado Condicional (Frontend JS):**
        * El script `main.js` recibe y parsea la respuesta JSON.
        * **Si `data.sensitiveLinks` contiene las URLs:** El script crea dinámicamente los elementos `<a>` (enlaces a LinkedIn/GitHub) y los inyecta en el `div` con `id="social-links-placeholder"` del `index.html`.
        * **Si `data.sensitiveLinks` está vacío o ausente:** El script no inserta nada, manteniendo los enlaces ocultos y protegiendo la información del propietario fuera del mercado objetivo.
* **Implementación:** Código Python en monorepo privado (`azure-projects/webpage/portfolio-api/`), desplegado a Azure Functions. La decisión de mostrar/ocultar se toma en el *backend*, asegurando que las URLs sensibles nunca lleguen a navegadores de visitantes no autorizados.

<img src="assets/images/pipeline-datos.svg" width="700" alt="Diagrama de Pipeline de Datos Personalizado con Azure y Control de Acceso GeoIP">
*Diagrama 2: Flujo del pipeline, destacando la verificación GeoIP en Azure Functions y la respuesta condicional al frontend.*

### Estructura de la Base de Datos (`portfolio_analytics_db`)

**Tabla: `public.visitors`** (Estructura final, optimizada para la recolección)

| Columna           | Tipo                          | Descripción                                                     | PK/FK | Permite NULL | Por Defecto |
| :---------------- | :---------------------------- | :-------------------------------------------------------------- | :---- | :----------- | :---------- |
| `id`              | `SERIAL`                      | ID único de visita.                                             | PK    | No           | (Auto)      |
| `visit_timestamp` | `TIMESTAMPTZ`                 | Fecha/Hora exacta (UTC).                                        |       | No           | `NOW()`     |
| `ip_address`      | `VARCHAR(45)`                 | IP limpia del visitante.                                        |       | Sí           |             |
| `user_agent`      | `TEXT`                        | User-Agent original.                                            |       | Sí           |             |
| `browser`         | `VARCHAR(50)`                 | Navegador parseado (ej. 'Chrome').                               |       | Sí           |             |
| `country`         | `VARCHAR(100)`                | País (GeoIP).                                                   |       | Sí           |             |
| `region`          | `VARCHAR(100)`                | Región/Estado (GeoIP).                                          |       | Sí           |             |
| `city`            | `VARCHAR(100)`                | Ciudad (GeoIP).                                                 |       | Sí           |             |
| `page_visited`    | `VARCHAR(255)`                | URL Referer.                                                    |       | Sí           |             |

*(Diagrama ERD)*
`<img src="assets/images/diagrama-erd-visitors.svg" width="500" alt="Diagrama Entidad-Relación de la tabla Visitors">`
*(Pendiente: Crear diagrama ERD con dbdiagram.io y exportar a `assets/images/`)*

---

## 🚀 Próximos Pasos y Mejoras Potenciales

Este proyecto establece una base sólida para futuras expansiones:

* **Desarrollo Frontend:** Mejorar diseño de `index.html` (Tailwind/Plantilla) y añadir páginas de proyectos detalladas.
* **Visualización de Datos:** Conectar Power BI/Looker Studio a `portfolio_analytics_db` para dashboard de visitas (mapa, tendencias).
* **Enriquecimiento Adicional:** Extraer OS y Dispositivo del User Agent en la Azure Function.
* **Optimización:** Caché en Cloudflare para assets estáticos.
* **Monitoreo:** Alertas en Azure Monitor para la API y DB.
* **Refinar Seguridad GeoIP:** Mover `ALLOWED_COUNTRIES` y `LINKEDIN/GITHUB_URL` a Azure App Settings para gestionarlos sin re-desplegar código.