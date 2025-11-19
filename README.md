# 👨‍💻 Francisco Mora — Full Stack Data Professional

> **Portafolio profesional** que demuestra ingeniería en nivel producción: arquitectura cloud segura, validaciones en 5 capas, optimización de performance y análisis de datos en tiempo real.

[![Status](https://img.shields.io/badge/Status-Production-brightgreen)]()
[![License](https://img.shields.io/badge/License-MIT-blue)]()
[![Stack](https://img.shields.io/badge/Stack-Full%20Stack%20Data-orange)]()

🌐 **Live:** [https://franciscomora.dev](https://franciscomora.dev)

---

## ⚡ Highlights

Este **no es un portafolio convencional**. Es una demostración de ingeniería profesional:

| 🎯 | Aspecto | Detalles |
|:---:|---|---|
| 🛡️ | **Seguridad** | 5 capas de validación (defensa proactiva, no reactiva) |
| ⚡ | **Performance** | 90% reducción en validaciones redundantes (caché 24h) |
| 🎨 | **Frontend** | CSS nativo (ITCSS) + Dark mode + Responsive |
| ☁️ | **Infraestructura** | Azure Serverless + PostgreSQL (escala automática) |
| 📊 | **Analytics** | Captura de datos de visitantes en tiempo real |
| 🔄 | **UX Inteligente** | Fast Pass ⚡ para conocidos vs Full Validation 🛡️ para nuevos |

---

## 🛠️ Tech Stack

**Frontend:** HTML5 · CSS3 (ITCSS) · JavaScript ES6  
**Backend:** Azure Functions · Python 3.11  
**Database:** PostgreSQL (B1ms tier Azure)  
**Security:** Cloudflare WAF · ipapi.is (VPN detection)  
**Anti-Bot:** Cloudflare Turnstile  
**Analytics:** Google Analytics 4  

### Stack Justificado

| Capa | Tech | Por Qué | Costo |
|:---:|---|---|:---:|
| **Frontend** | HTML5/CSS3/JS | Control total + performance | Gratis |
| **Backend** | Azure Functions | Escalabilidad automática, pay-per-use | <$1/mes |
| **Database** | PostgreSQL B1ms | ACID compliance + 12 meses free | Gratis |
| **WAF** | Cloudflare Free | Geobloqueo + DDoS + SSL (reduce carga 80%) | Gratis |
| **VPN Detection** | ipapi.is | 6 flags de riesgo (VPN, Proxy, Tor, etc.) | ~$5/mes |
| **Anti-Bot** | Turnstile | Mejor privacidad que reCAPTCHA | Gratis |

**Total:** ~$5/mes (solo ipapi.is). Presupuesto Azure for Students: $100/mes crédito.

---

## 🎯 ¿Por Qué Este Proyecto Diferencia?

| Junior Portfolio | Este Proyecto |
|---|---|
| "Hice un sitio bonito" | "Hice arquitectura de defensa en profundidad" |
| CSS por apariencia | CSS modular (ITCSS) por mantenibilidad |
| Sin validación | 5 capas de seguridad en producción |
| Caché = No entender | Caché inteligente: 90% menos queries |
| UX estática | UX diferenciada por geolocalización + riesgo |

---

## 🚀 Quick Start

### Para Reclutadores / Hiring Managers
1. **Explorar demo:** [https://franciscomora.dev](https://franciscomora.dev)
2. **Entender arquitectura:** [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) (5 min)
3. **Leer decisiones técnicas:** [docs/SECURITY.md](./docs/SECURITY.md) (10 min)

### Para Developers
1. **Clonar:** `git clone <repo>`
2. **Setup local:** [docs/SETUP.md](./docs/SETUP.md)
3. **Entender flujo:** [docs/API.md](./docs/API.md)

---

## 📚 Documentación Completa

Cada documento está optimizado para su audiencia:

| Doc | Público | ⏱️ | Contenido |
|:---:|---|:---:|---|
| **[SECURITY.md](./docs/SECURITY.md)** | Security Eng / Tech Lead | 15 min | 5 capas, casos 0→2.2, lógica de validación |
| **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | Tech Lead / Senior | 12 min | Desafíos técnicos, decisiones clave, refactorización |
| **[DATABASE.md](./docs/DATABASE.md)** | Backend Dev | 10 min | Schema SQL, tablas, índices, caché strategy |
| **[FEATURES.md](./docs/FEATURES.md)** | Product Manager | 8 min | UX/Modal, Responsive, Accesibilidad |
| **[CSS-MIGRATION.md](./docs/CSS-MIGRATION.md)** | Frontend Dev | 10 min | Tailwind→CSS nativo, ITCSS, justificación |
| **[API.md](./docs/API.md)** | API Consumer | 8 min | Endpoints, Request/Response, Error handling |
| **[SETUP.md](./docs/SETUP.md)** | DevOps / Local Dev | 10 min | Instalación, entorno, deploy |

---

## 🔒 Arquitectura de Seguridad (Resumen)

![Security Layers](./assets/images/security-layers.svg)

**Sistema de embudo de filtración en 5 capas:**

1. **Cloudflare WAF** → Geobloqueo inicial (~80% tráfico no-CL)
2. **Rate Limiting** → 15 req/min por IP (previene brute force)
3. **Turnstile** → Valida humanidad con Cloudflare
4. **ipapi.is** → Detecta VPN/Proxy/Tor (6 flags)
5. **Database Cache** → Reutiliza decisiones por 24h (Fast Pass)

**Resultado:** Seguridad + Performance sin sacrificar UX. Visitantes confiables: 50ms. Nuevos: 200-300ms.

### Lógica de Validación (Casos 0→2.2)

**Filosofía:** Evitar 5 validaciones + 2 queries DB en cada visita.

**Casos principales:**
- **Caso 0:** IP no-chilena → Bloquear inmediato
- **Caso 1.1a:** IP caché + confiable → Fast Pass ⚡ (50ms)
- **Caso 1.1b:** IP caché + intentos fallidos → Turnstile
- **Caso 2.1:** IP chilena nueva + limpia → Turnstile + Registro
- **Caso 2.2:** IP chilena + VPN detectada → Bloquear

**Ver análisis completo:** [docs/SECURITY.md](./docs/SECURITY.md)

---

## 💾 Base de Datos

**Dos tablas principales:**

### `visitors` (Analítica)
- Visitas validadas (solo CL, no-VPN)
- 7 columnas: timestamp, IP, user-agent, browser, geo, página

### `ip_lookup_cache` (Optimización)
- Resultados de validación (24h TTL)
- 6 columnas: IP (PK), country, is_suspicious, is_bot_possible, timestamp

**Beneficio:** 90% reducción en queries por visitante recurrente.

**Schema completo:** [docs/DATABASE.md](./docs/DATABASE.md)

---

## 📊 Resultados Medibles

| Métrica | Valor | Impacto |
|---|:---:|---|
| **CSS Bundle** | 14 KB | 48% ↓ vs Tailwind |
| **Cache Hit Rate** | ~90% | 90% menos validaciones |
| **Latencia Promedio** | 50-200ms | Caché (50ms) vs validación (200ms) |
| **API Calls Reducidos** | 90% | Caché 24h evita re-validaciones |
| **Costo Mensual** | ~$5 | Solo ipapi.is (resto free tier) |
| **Capas Seguridad** | 5 | WAF + Rate Limit + Anti-Bot + VPN + Cache |

---

## 🎨 Frontend Moderno

**CSS Nativo (ITCSS):** 7 capas modulares sin conflictos de especificidad.

**UX Inteligente:**
- Modal centrado profesional (Turnstile)
- Transiciones suaves (SPA-like, sin refresh)
- Responsive mobile-first
- Dark mode nativo

**Ver detalles:** [docs/FEATURES.md](./docs/FEATURES.md)

---

## 🧠 Lecciones Aprendidas

### Técnicas
- ✅ Caché persistente + condicionales complejas = UX + Seguridad
- ✅ "Defensa en Profundidad" funciona en web también
- ✅ Modularidad temprana ahorra refactorización futura

### Arquitectónicas
- ✅ Serverless = escalabilidad pero requiere pensamiento stateless
- ✅ Free tier APIs tienen límites reales → Plan B necesario
- ✅ Seguridad es evolución continua, no un checkbox

### De Negocio
- ✅ Portafolio + Demostración técnica = mejor impresión
- ✅ Pequeñas optimizaciones = grandes impactos

---

## 🚀 Roadmap & Mejoras Futuras

### Fase Actual (Q4 2025) ✅
- Seguridad en 5 capas
- Dark mode + Responsive
- Analytics básico
- Documentación modular

### Próximas Mejoras
- 🔄 Mobile menu refinement
- 📊 Dashboard de analytics personalizado
- 🤖 ML scoring para optimizar threshold Turnstile
- 🌐 Whitelist dinámico de "VPN corporativas"
- 📈 A/B testing de UX flows

---

## 🎓 Resumen de Skills Demostrados

✅ **Full Stack Development** (Frontend + Backend + Database)  
✅ **Arquitectura en Nube** (Azure, Serverless, PostgreSQL Managed)  
✅ **Seguridad Aplicada** (Defensa en profundidad, validación en capas)  
✅ **Performance Optimization** (Caché, indexing, API optimization)  
✅ **Software Engineering** (Modularidad, decisiones arquitectónicas, documentación)  
✅ **Frontend Moderno** (CSS nativo ITCSS, dark mode, responsive)  
✅ **Data Analysis** (Captura, procesamiento, visualización de métricas)  

---

## 📧 Contacto

- **Email:** pendiente
- **LinkedIn:** pendiente
- **GitHub:** pendiente
- **Portfolio:** [https://franciscomora.dev](https://franciscomora.dev)

---

## 📄 Licencia

MIT License - Libre para uso académico y profesional.

---

**Última actualización:** Noviembre 19, 2025  
**Estado:** Production ✅ | Monitoreado 24/7 | Seguridad Actualizada
