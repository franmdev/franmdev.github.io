# 🚀 Setup & Deployment: Guía Completa

## Resumen Ejecutivo

Este documento detalla cómo configurar el proyecto localmente y deployarlo a producción en Azure.

---

## 📋 Requisitos Previos

### Sistema Operativo
- Windows 10+, macOS 10.15+, o Linux (Ubuntu 20.04+)

### Software Requerido

* **Node.js:** 18+ (para tools)
* **Python:** 3.11+
* **PostgreSQL:** 14+ (local o cloud)
* **Git:** 2.30+
* **Visual Studio Code:** Recomendado
* **Azure CLI:** 2.50+

---

## 🏠 Setup Local

### Paso 1: Clonar el Repositorio

```bash
git clone [https://github.com/yourusername/portafolio.git](https://github.com/yourusername/portafolio.git)
cd portafolio
```

### Paso 2: Configurar Virtual Environment (Python)

**Windows:**
```powershell
python -m venv venv
.\venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Verificar activación:**
```bash
which python      # macOS/Linux: debe mostrar venv path
python --version  # Debe ser 3.11+
```

### Paso 3: Instalar Dependencias Python

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Contenido de `requirements.txt`:**
```text
azure-functions==1.18.0
azure-identity==1.15.0
psycopg2-binary==2.9.9
requests==2.31.0
python-dotenv==1.0.0
```

### Paso 4: Configurar Variables de Entorno

**Crear archivo `.env` en la raíz:**

```ini
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=portafolio_dev

# Turnstile (Cloudflare)
TURNSTILE_SITE_KEY=0x4AAvC_K_...
TURNSTILE_SECRET_KEY=0x4AAvC_K_...

# ipapi.is (VPN Detection)
IPAPI_SECRET_KEY=your_secret_key

# URLs
LINKEDIN_URL=[https://linkedin.com/in/yourusername](https://linkedin.com/in/yourusername)
GITHUB_URL=[https://github.com/yourusername](https://github.com/yourusername)

# Azure
AZURE_FUNCTION_URL=http://localhost:7071
```

**⚠️ IMPORTANTE:** Agregar `.env` a `.gitignore`
```bash
echo ".env" >> .gitignore
```

### Paso 5: Setup de PostgreSQL Local

**Opción A: Docker (Recomendado)**
```bash
docker run --name portafolio-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=portafolio_dev \
  -p 5432:5432 \
  -d postgres:15
```

**Opción B: Instalación Manual**
* **macOS:** `brew install postgresql` && `brew services start postgresql`
* **Ubuntu:** `sudo apt-get install postgresql postgresql-contrib` && `sudo systemctl start postgresql`
* **Windows:** Descargar de [postgresql.org](https://www.postgresql.org/download/windows/)

### Paso 6: Crear Esquema de Base de Datos

```bash
psql -U postgres -h localhost -d portafolio_dev < db/schema.sql
```

**Contenido de `db/schema.sql`:**

```sql
-- Crear tablas
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

-- Crear índices
CREATE INDEX idx_last_checked ON public.ip_lookup_cache(last_checked_timestamp);
CREATE INDEX idx_visit_timestamp ON public.visitors(visit_timestamp DESC);
CREATE INDEX idx_ip_address ON public.visitors(ip_address);
```

**Verificar:**
```bash
psql -U postgres -h localhost -d portafolio_dev -c "\dt"
# Debe listar: ip_lookup_cache, visitors
```

---

## 🧪 Testing Local

### Paso 1: Instalar Azure Functions Core Tools

* **macOS:**
  ```bash
  brew tap azure/azure
  brew install azure-functions-core-tools@4
  ```
* **Ubuntu:**
  ```bash
  curl [https://packages.microsoft.com/keys/microsoft.asc](https://packages.microsoft.com/keys/microsoft.asc) | gpg --dearmor > microsoft.gpg
  sudo mv microsoft.gpg /etc/apt/trusted.gpg.d/microsoft.gpg
  sudo apt-get update
  sudo apt-get install azure-functions-core-tools-4
  ```
* **Windows:**
  ```powershell
  npm install -g azure-functions-core-tools@4 --unsafe-perm
  ```

**Verificar:**
```bash
func --version
# Debe mostrar: 4.x.x
```

### Paso 2: Iniciar el Backend Local

```bash
func host start
```

**Output esperado:**
```text
Azure Functions Core Tools
Worker process started and initialized.
Now listening on: [http://0.0.0.0:7071](http://0.0.0.0:7071)
Application started. Press Ctrl+C to quit.
HttpTrigger: [POST] http://localhost:7071/api/validate
```

### Paso 3: Probar Endpoint con cURL

```bash
curl -X POST http://localhost:7071/api/validate \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 186.78.20.109" \
  -d '{"action": "check_ip"}'
```

**Respuesta esperada:**
```json
{
  "status": "needs_validation",
  "turnstileRequired": true
}
```

### Paso 4: Testing Frontend Local

En otra terminal:
```bash
cd frontend
python -m http.server 8000
```
Abrir: `http://localhost:8000`

---

## 🔧 Estructura del Proyecto

```text
portafolio/
├── README.md            # Este archivo
├── LICENSE              # MIT License
├── requirements.txt     # Dependencias Python
├── .gitignore           # Git config
├── .env.example         # Variables de ejemplo
│
├── docs/                # Documentación
│   ├── SECURITY.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── FEATURES.md
│   ├── CSS-MIGRATION.md
│   ├── API.md
│   └── SETUP.md         # (este archivo)
│
├── frontend/            # Frontend (HTML/CSS/JS)
│   ├── index.html
│   ├── css/
│   │   ├── 1-settings/
│   │   │   └── variables.css
│   │   ├── 3-generic/
│   │   │   └── reset.css
│   │   ├── 4-base/
│   │   │   └── base.css
│   │   ├── 5-objects/
│   │   │   └── layout.css
│   │   ├── 6-components/
│   │   │   └── components.css
│   │   ├── 7-utilities/
│   │   │   └── responsive.css
│   │   └── main.css     # Import ordenado
│   └── js/
│       ├── main.js      # Lógica principal
│       ├── dark-mode.js
│       ├── mobile-menu.js
│       └── loader.js
│
├── backend/             # Azure Functions (Python)
│   ├── function_app.py  # Función principal
│   └── shared_code/
│       ├── __init__.py
│       ├── db_utils.py      # Queries SQL
│       ├── security_utils.py # Validaciones
│       └── __init__.py
│
├── db/                  # Base de datos
│   ├── schema.sql       # Estructura tablas
│   └── migrations/      # Futuro
│
├── .github/
│   └── workflows/
│       └── deploy.yml   # CI/CD (GitHub Actions)
│
└── .vscode/
    └── settings.json    # Recomendaciones VS Code
```

---

## 🚀 Deployment a Azure



[Image of Azure Serverless Deployment Architecture]


### Paso 1: Crear Recursos en Azure
**Prerequisito:** Tener cuenta Azure con créditos para estudiantes.

```bash
# Login a Azure
az login

# Crear resource group
az group create --name portafolio-rg --location eastus

# Crear storage account (para Azure Functions)
az storage account create \
  --name portafoliostorage \
  --resource-group portafolio-rg \
  --location eastus \
  --sku Standard_LRS

# Crear Azure Functions
az functionapp create \
  --resource-group portafolio-rg \
  --consumption-plan-location eastus \
  --runtime python \
  --runtime-version 3.11 \
  --functions-version 4 \
  --name franciscomora-api \
  --storage-account portafoliostorage
```

### Paso 2: Crear PostgreSQL Managed

```bash
az postgres flexible-server create \
  --resource-group portafolio-rg \
  --name portafolio-db \
  --admin-user postgres \
  --admin-password $PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --public-access Enabled \
  --high-availability Disabled
```

### Paso 3: Configurar Variables de Entorno en Azure

```bash
az functionapp config appsettings set \
  --name franciscomora-api \
  --resource-group portafolio-rg \
  --settings \
  "DB_HOST=portafolio-db.postgres.database.azure.com" \
  "DB_USER=postgres" \
  "DB_PASSWORD=$PASSWORD" \
  "DB_NAME=portafolio" \
  "TURNSTILE_SITE_KEY=$TURNSTILE_SITE_KEY" \
  "TURNSTILE_SECRET_KEY=$TURNSTILE_SECRET_KEY" \
  "IPAPI_SECRET_KEY=$IPAPI_SECRET_KEY"
```

### Paso 4: Deploy con Azure CLI

Desde carpeta del proyecto:
```bash
func azure functionapp publish franciscomora-api --build remote
```

**Output:**
```text
Getting site publishing info...
Creating archive for current directory
Uploading 123.45 KB
Upload completed successfully.
Deployment successful.
Syncing triggers...
Done.
```

### Paso 5: Deployar Frontend (GitHub Pages)

```bash
# Crear rama gh-pages
git checkout --orphan gh-pages
git rm -rf .

# Copiar frontend
cp -r frontend/* .
git add .
git commit -m "Deploy frontend to GitHub Pages"
git push origin gh-pages

# Habilitar GitHub Pages en settings del repo
```

---

## 🔄 CI/CD con GitHub Actions

### Archivo: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          
      - name: Install dependencies
        run: |
          pip install --upgrade pip
          pip install -r requirements.txt
          
      - name: Lint
        run: |
          pip install flake8
          flake8 backend/ --count --exit-zero
          
      - name: Deploy to Azure Functions
        uses: Azure/functions-action@v1
        with:
          app-name: franciscomora-api
          package: './'
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

**Configurar secret en GitHub:**
1. Settings → Secrets → New repository secret
2. Name: `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
3. Value: Contenido del archivo de publish profile (descargar de Azure Portal)

---

## 🔍 Debugging

### Logs en Azure

**Ver últimos 50 líneas:**
```bash
az webapp log tail --name franciscomora-api --resource-group portafolio-rg
```

**Descargar logs completos:**
```bash
az webapp log download --name franciscomora-api --resource-group portafolio-rg
```

### Logs Local
Terminal donde corre `func host start`. Los logs aparecen en tiempo real.

### Remote Debugging
Adjuntar VS Code a Azure Functions:
```bash
func azure functionapp fetch-app-settings franciscomora-api
```
Luego Debug → Attach to Function

---

## 📊 Monitoreo en Producción

### Application Insights (Azure)

```bash
az monitor app-insights component create \
  --app portafolio-insights \
  --location eastus \
  --resource-group portafolio-rg
```

**Conectar a Azure Functions:**
```bash
az functionapp config appsettings set \
  --name franciscomora-api \
  --resource-group portafolio-rg \
  --settings "APPINSIGHTS_INSTRUMENTATIONKEY=$KEY"
```

### Alertas Recomendadas

| Condición | Threshold | Acción |
|---|:---:|---|
| Error Rate | > 5% | Email al dev |
| Response Time | > 2s | Alert |
| Memory Usage | > 80% | Alert |
| Request Count | > 10k/min | Check scaling |

---

## 🧹 Limpieza y Mantenimiento

### Backup de Base de Datos

**Local:**
```bash
pg_dump -U postgres portafolio_dev > backup.sql
```

**Restaurar:**
```bash
psql -U postgres portafolio_dev < backup.sql
```

**Azure:**
```bash
az postgres flexible-server backup create \
  --resource-group portafolio-rg \
  --server-name portafolio-db \
  --backup-name "backup-$(date +%Y%m%d)"
```

### Limpieza de Caché (Cron Job)

**Azure Function Timer Trigger:**
```python
import azure.functions as func

def cleanup_cache_timer(mytimer: func.TimerRequest):
    query = """
    DELETE FROM ip_lookup_cache
    WHERE last_checked_timestamp < NOW() - INTERVAL '24 hours'
    """
    # Ejecutar query
```
**Agendar en Azure Portal:**
- Timer trigger: `0 2 * * *` (2 AM diariamente)

---

## 🆘 Troubleshooting

### Problema: "psycopg2: could not connect to server"
**Solución:** Verificar que PostgreSQL está corriendo.
```bash
pg_isready -h localhost -p 5432

# Si no está, iniciar:
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS
```

### Problema: "ImportError: cannot import name 'shared_code'"
**Solución:**
Verificar que `__init__.py` existe en `shared_code/`.
```bash
touch shared_code/__init__.py
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Problema: "Turnstile token invalid"
**Solución:**
Verificar que `TURNSTILE_SECRET_KEY` es correcto.
En Azure Portal: Function App → Configuration → Application Settings.
Copiar exactamente desde Cloudflare Dashboard.

### Problema: "Cold start demasiado lento (>2s)"
**Solución:**
- Usar Premium plan (costo mayor pero sin cold start).
- Agregar "Always On" (solo App Service).
- Optimizar imports Python.

---

## 📚 Recursos Útiles

- [Azure Functions Python Developer Guide](https://learn.microsoft.com/azure/azure-functions/functions-reference-python)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [VS Code Azure Tools Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-node-azure-pack)
- [Azure CLI Reference](https://learn.microsoft.com/cli/azure/)

---

## ✅ Checklist de Deployment

- [ ] `.env` creado con variables correctas
- [ ] PostgreSQL local corriendo
- [ ] Tablas creadas (`db/schema.sql`)
- [ ] `func host start` funcionando
- [ ] Frontend en `http://localhost:8000` cargando
- [ ] API respondiendo en `http://localhost:7071/api/validate`
- [ ] Credenciales Azure configuradas
- [ ] Resource Group creado en Azure
- [ ] PostgreSQL Managed creado
- [ ] Azure Functions creada
- [ ] Variables de entorno en Azure configuradas
- [ ] GitHub secrets configurados
- [ ] Deploy completado y en vivo
- [ ] Monitoring activado (Application Insights)

---

## 🎯 Próximos Pasos

1. **Agregar logging exhaustivo** → Facilita debugging
2. **Implementar tests** → pytest para backend
3. **Agregar secciones de proyectos** → ML, Data, BI
4. **Integrar PowerBI/Tableau** → iframes + APIs
5. **Auto-scaling testing** → Load testing con 10k requests/min

---

**Última actualización:** Noviembre 19, 2025
**Audiencia objetivo:** DevOps, Backend Engineers, Site Reliability Engineers
**Tiempo de lectura:** 15-20 minutos
**Complejidad técnica:** ⭐⭐⭐⭐ (Alta)