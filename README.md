# Portafolio Profesional de Proyectos - Francisco Mora

Este repositorio contiene el código fuente de mi portafolio web personal, alojado en [https://franciscomora.dev](https://franciscomora.dev).

El objetivo de este proyecto no es solo servir como una "vitrina" para mis proyectos de Data Science, Data Engineering y RPA, sino también demostrar la implementación de una arquitectura web moderna, segura y orientada a datos.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología Utilizada | Propósito |
| :--- | :--- | :--- |
| **Hosting** | GitHub Pages | Servicio de hosting estático, rápido y gratuito. |
| **DNS y Seguridad** | Cloudflare (Plan Gratuito) | Proxy de seguridad, protección DDoS y gestión de DNS. |
| **Dominios** | Porkbun (`.dev`) / NIC.cl (`.cl`) | Gestión de registros de dominio. |
| **Analítica** | Google Analytics (GA4) | Seguimiento y análisis de métricas de visitantes. |
| **Frontend** | HTML5 / CSS3 / JavaScript | Estructura, diseño e interactividad del sitio. |

---

## 🛡️ Arquitectura de Seguridad (Implementada)

Para asegurar la disponibilidad e integridad del sitio, se implementó una estrategia de seguridad basada en Cloudflare como proxy inverso:

* **Protección DDoS:** Todo el tráfico (incluyendo el dominio principal `franciscomora.dev`) es enrutado a través de la red de Cloudflare, la cual mitiga automáticamente los ataques de denegación de servicio (DDoS).
* **Ocultamiento de IP (Proxy):** La dirección IP real del servidor de hosting (GitHub Pages) no es pública. Los visitantes solo ven las IPs de Cloudflare, previniendo ataques directos.
* **Certificado SSL/TLS:** Cloudflare gestiona el cifrado `httpsS` de extremo a extremo (Modo "Full"), asegurando que la conexión entre el visitante y el sitio esté siempre cifrada.
* **Gestión de Reglas (Rules):** Se centralizó la lógica de redireccionamiento. Todos los dominios secundarios (`.cl` y otros `.dev`) ejecutan una redirección `301 (Permanent)` hacia el dominio canónico `franciscomora.dev`, consolidando la marca y el SEO.

---

## 📊 Arquitectura de Datos (Implementada)

Para entender el rendimiento del portafolio y quiénes lo visitan (reclutadores, colegas, etc.), se implementó una capa de analítica web:

* **Servicio:** Google Analytics 4 (GA4).
* **Propósito:** Recolección y análisis de métricas clave, tales como:
    * **KPIs de Tráfico:** Usuarios, sesiones, tasa de rebote.
    * **Geolocalización:** País, región y ciudad de los visitantes.
    * **Comportamiento:** Páginas más vistas (proyectos más populares) y tiempo de permanencia.
* **Implementación:** El *snippet* de GA4 (etiqueta G-) está insertado en el `<head>` del `index.html` para rastrear todas las vistas de página.

### Próximos Pasos (Pipeline de Datos)

*(En desarrollo)*: Se está diseñando un pipeline de datos personalizado como un proyecto de ingeniería de datos en sí mismo. El objetivo es capturar los logs de visitas mediante una **Cloud Function (GCP)** que se active en cada visita, procese la IP para extraer geolocalización, y almacene los datos crudos en una base de datos **PostgreSQL (Neon/Supabase)** para análisis y visualización avanzada con Power BI.