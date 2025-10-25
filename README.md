# Portafolio Profesional de Proyectos - Francisco Mora

Este repositorio contiene el código fuente de mi portafolio web personal, alojado en [https://franciscomora.dev](https://franciscomora.dev).

El objetivo de este proyecto no es solo servir como una "vitrina" para mis proyectos de Data Science, Data Engineering y RPA, sino también demostrar, paso a paso, la **construcción de una infraestructura web moderna, segura y orientada a la recolección de datos en tiempo real**, aplicando buenas prácticas de desarrollo en la nube.

---

## 🚀 Filosofía del Proyecto: Seguridad y Datos Primero

Antes de desplegar cualquier funcionalidad, se priorizó la creación de un **entorno seguro y robusto**. Esto incluyó la configuración de DNS, protección DDoS y certificados SSL mediante Cloudflare, sentando las bases para un desarrollo seguro y una alta disponibilidad. Posteriormente, se implementaron dos sistemas de analítica para demostrar capacidades tanto en el uso de herramientas estándar (GA4) como en la **ingeniería de un pipeline de datos personalizado**.

---

## 🛠️ Stack Tecnológico Implementado

Se seleccionó un stack tecnológico moderno, eficiente y, en gran medida, basado en servicios gratuitos o con generosos *tiers* gratuitos, demostrando la optimización de recursos en la nube.

| Componente                    | Tecnología Utilizada                            | Propósito                                                                      |
| :---------------------------- | :---------------------------------------------- | :----------------------------------------------------------------------------- |
| **Hosting Frontend** | GitHub Pages                                    | Servicio de hosting estático, rápido y gratuito para el sitio web (HTML/CSS/JS). |
| **DNS y Seguridad Perimetral** | Cloudflare (Plan Gratuito)                    | Proxy inverso, protección DDoS, gestión DNS centralizada y redireccionamientos 301. |
| **Dominios** | Porkbun (`.dev`) / NIC.cl (`.cl`)               | Registradores de dominio.                                                      |
| **Analítica Estándar** | Google Analytics (GA4)                          | Seguimiento y análisis de métricas agregadas estándar (fuentes, comportamiento). |
| **API Backend (Serverless)** | Azure Functions (Python 3.x, Plan Consumo)      | API *serverless* para la ingesta de datos de visitas, ejecutada en Python.        |
| **Base de Datos** | Azure Database for PostgreSQL (Flexible Server, B1ms) | Almacenamiento SQL seguro y escalable (cubierto por nivel gratuito Azure).     |
| **Conectividad DB (Python)** | `psycopg2-binary`                               | Librería estándar para conectar Python con PostgreSQL.                         |
| **Geolocalización IP** | `requests` + IP-API.com (API Externa Gratuita) | Librería para llamadas HTTP a la API `IP-API.com` para obtener País/Región/Ciudad. |
| **Parseo User Agent** | `user-agents` (Librería Python)                 | Extracción del nombre del navegador desde el string User-Agent.                |
| **Frontend** | HTML5 / CSS3 / JavaScript                       | Estructura, diseño e interactividad (incluye llamada `fetch` a la API de Azure). |
| **Entorno Python (Local)** | `.venv` (Entorno Virtual Estándar)              | Gestión limpia de dependencias para desarrollo y despliegue de la API.       |
| **Gestión de Secretos (Cloud)** | Azure App Settings (Variables de Entorno)       | Almacenamiento seguro de credenciales de DB y API Keys en Azure.             |
| **Control de Versiones** | Git / GitHub                                    | Gestión del código fuente del sitio web y documentación.                     |
| **Diagramación** | `diagrams.net` (draw.io)                          | Creación de diagramas de arquitectura.                                         |

---

## 🛡️ Arquitectura de Seguridad (Implementada)

La seguridad fue un pilar fundamental desde el inicio, implementando una estrategia de defensa en capas:

* **Proxy Inverso (Cloudflare):** Todo el tráfico hacia `franciscomora.dev` (y los dominios redirigidos) pasa primero por Cloudflare.
* **Protección DDoS:** Cloudflare mitiga automáticamente ataques volumétricos.
* **Ocultamiento de IP:** La IP real de GitHub Pages no se expone públicamente.
* **SSL/TLS End-to-End:** Cloudflare gestiona los certificados y asegura el cifrado (`https` Modo "Full").
* **Redireccionamiento Seguro:** Las redirecciones 301 de dominios secundarios se gestionan en Cloudflare, asegurando consistencia.
* **Seguridad API (CORS):** La Azure Function (`franmora-portfolio-api`) está configurada con **CORS** para aceptar llamadas **únicamente** desde `https://franciscomora.dev`, bloqueando intentos de *scripts* maliciosos desde otros orígenes.
* **Gestión de Secretos:** Las credenciales sensibles (contraseña de DB) **no** están en el código fuente; se gestionan de forma segura como **Variables de Entorno** en Azure App Settings.

<img src="assets/images/arquitectura-seguridad.svg" width="700" alt="Diagrama de Arquitectura de Seguridad y Hosting">
*Diagrama 1: Flujo de tráfico seguro a través de Cloudflare hacia GitHub Pages.*

---

## 📊 Arquitectura de Datos (Implementada)

Se implementaron dos sistemas complementarios para la analítica de visitas:

### Sistema 1: Analítica Estándar con Google Analytics (GA4)

* **Propósito:** Aprovechar la plataforma estándar de la industria para obtener métricas agregadas sobre adquisición, comportamiento y demografía general de los visitantes. Útil para análisis de tendencias a alto nivel.
* **Implementación:** El *snippet* de seguimiento G-Tag está integrado en el `<head>` del `index.html`. Los datos se envían directamente a Google.

### Sistema 2: Pipeline de Datos Personalizado con Azure (Ingeniería de Datos)

* **Propósito:** Demostrar la capacidad de diseñar y construir un pipeline de datos completo en la nube, desde la ingesta hasta el almacenamiento, utilizando servicios PaaS y *serverless* de Azure. Permite un control total sobre los datos recolectados.
* **Flujo Detallado:**
    1.  **Ingesta (Frontend JS):** Al cargarse la página (`DOMContentLoaded`), el script `assets/js/main.js` ejecuta una llamada asíncrona (`fetch` POST) a la URL de producción de la Azure Function.
    2.  **Procesamiento (Azure Function - Python):**
        * La función `register_visitor` recibe la solicitud HTTP.
        * Extrae la IP del visitante del header `x-forwarded-for` (inyectado por Cloudflare/Azure) y la limpia para quitar el puerto.
        * Extrae el `user-agent` del header.
        * Utiliza la librería `user-agents` para parsear el `user-agent` y obtener el nombre del navegador (`browser.family`).
        * Realiza una llamada HTTP GET a la API gratuita `http://ip-api.com/json/{ip_limpia}?fields=...` usando la librería `requests`. Se eligió esta API por ser gratuita, no requerir registro y proveer los datos deseados (país, región, ciudad). Se manejan posibles errores de la API (ej. timeouts, status != 'success').
        * Lee las credenciales de la base de datos (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`) de forma segura desde las **Variables de Entorno** de Azure.
    3.  **Almacenamiento (Azure PostgreSQL):**
        * Se conecta a la base de datos PostgreSQL (`portfolio_analytics_db` en el servidor `B1ms`) usando `psycopg2` con `sslmode='require'`.
        * Ejecuta una sentencia `INSERT` parametrizada (para prevenir inyección SQL) en la tabla `public.visitors`, guardando: `ip_address` (limpia), `user_agent` (original), `browser` (parseado), `page_visited` (referer), `country`, `region`, `city` (obtenidos de IP-API), y `visit_timestamp` (automático en UTC).
        * Realiza `conn.commit()` para guardar la transacción.
        * Cierra la conexión a la base de datos.
    4.  **Respuesta:** La función retorna un `HTTP 200 OK` al navegador si todo fue exitoso, o un `HTTP 500` con el mensaje de error si algo falló.
* **Implementación:** El código Python reside en un repositorio Git separado (`mi-api-portafolio`) y se desplegó a Azure Functions usando la extensión oficial de VS Code.

<img src="assets/images/pipeline-datos.svg" width="700" alt="Diagrama de Pipeline de Datos Personalizado con Azure">
*Diagrama 2: Flujo del pipeline de datos desde el navegador hasta la base de datos PostgreSQL, pasando por Azure Functions.*

### Estructura de la Base de Datos (`portfolio_analytics_db`)

Se diseñó una tabla simple pero efectiva para almacenar los datos de las visitas:

**Tabla: `public.visitors`**

| Columna           | Tipo                          | Descripción                                                     | PK/FK | Permite NULL | Por Defecto |
| :---------------- | :---------------------------- | :-------------------------------------------------------------- | :---- | :----------- | :---------- |
| `id`              | `SERIAL`                      | Identificador único autoincremental de la visita.               | PK    | No           | (Auto)      |
| `visit_timestamp` | `TIMESTAMPTZ`                 | Fecha y hora exacta de la visita (con zona horaria, en UTC).      |       | No           | `NOW()`     |
| `ip_address`      | `VARCHAR(45)`                 | Dirección IP limpia del visitante (sin puerto).                 |       | Sí           |             |
| `user_agent`      | `TEXT`                        | String User-Agent original enviado por el navegador.            |       | Sí           |             |
| `browser`         | `VARCHAR(50)`                 | Nombre del navegador extraído del User Agent (ej. 'Chrome').    |       | Sí           |             |
| `country`         | `VARCHAR(100)`                | País obtenido de la geolocalización IP (ej. 'Chile').         |       | Sí           |             |
| `region`          | `VARCHAR(100)`                | Región/Estado obtenido de la geolocalización IP (ej. 'Valparaíso').|       | Sí           |             |
| `city`            | `VARCHAR(100)`                | Ciudad obtenida de la geolocalización IP (ej. 'Valparaíso').     |       | Sí           |             |
| `page_visited`    | `VARCHAR(255)`                | URL de la página desde la que se hizo la llamada (Referer).     |       | Sí           |             |

*(Diagrama base de datos)*
`<img src="assets/images/diagrama-erd-visitors.svg" width="500" alt="Diagrama Entidad-Relación de la tabla Visitors">`
*(pie diagrama base de datos pendiente)*

---

## 🚀 Próximos Pasos y Mejoras Potenciales

* **Desarrollo Frontend:** Implementar un diseño visual más atractivo para `index.html` (posiblemente usando una plantilla o framework CSS como Tailwind).
* **Visualización de Datos:** Conectar una herramienta de BI (como Power BI o Looker Studio) a la base de datos `portfolio_analytics_db` para crear un dashboard interactivo con las analíticas recolectadas.
* **Enriquecimiento de Datos:** Añadir más lógica a la Azure Function para extraer información adicional del User Agent (Sistema Operativo, Dispositivo) o de la IP (ISP).
* **Optimización:** Implementar caché en Cloudflare para mejorar tiempos de carga del sitio estático.
* **Monitoreo:** Configurar alertas en Azure Monitor si la API o la base de datos presentan errores.