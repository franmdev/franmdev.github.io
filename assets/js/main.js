// assets/js/main.js - Flujo de Validación Profesional SIN REFRESH


// --- CONFIGURACIÓN ---
const API_URL = "https://franmora-portfolio-api.azurewebsites.net/api/register_visitor";
const TURNSTILE_SITE_KEY = "0x4AAAAAAB8sMLnvQf8wAXSD";
const SESSION_VALIDITY_MINUTES = 30;
// --- FIN CONFIGURACIÓN ---


// --- Variables Globales del DOM ---
let loaderWrapper, blockedMessage, mainContent, validationModal;


// --- Funciones para cambiar estado UI ---
function showLoader(message = "Validando conexión segura...") {
    if (loaderWrapper) {
        loaderWrapper.style.display = 'flex';
        const p = loaderWrapper.querySelector('p');
        if (p) p.textContent = message;
    }
    if (blockedMessage) blockedMessage.style.display = 'none';
    if (mainContent) mainContent.style.display = 'none';
    if (validationModal) validationModal.style.display = 'none';
}


function showBlockedMessage() {
    if (loaderWrapper) loaderWrapper.style.display = 'none';
    if (blockedMessage) blockedMessage.style.display = 'flex';
    if (mainContent) mainContent.style.display = 'none';
    if (validationModal) validationModal.style.display = 'none';
}


function showMainContent() {
    if (loaderWrapper) loaderWrapper.style.display = 'none';
    if (blockedMessage) blockedMessage.style.display = 'none';
    if (validationModal) validationModal.style.display = 'none';


    if (mainContent) {
        mainContent.style.opacity = '0';
        mainContent.style.display = 'block';
        mainContent.style.transition = 'opacity 0.4s ease';


        // Trigger reflow para activar transición
        mainContent.offsetHeight;
        mainContent.style.opacity = '1';
    }
}


/**
 * Renderiza los links sociales si existen.
 */
function renderSensitiveLinks(links) {
    if (!links || (!links.linkedin && !links.github)) {
        console.log("No hay links sensibles para mostrar.");
        return;
    }
    console.log("Links sensibles habilitados:", links);
}


/**
 * Verifica si hay una sesión Turnstile válida en localStorage.
 * localStorage persiste entre pestañas y reinicios del navegador,
 * evitando llamadas a la API al abrir el portfolio en una nueva pestaña.
 */
function checkSessionValidity() {
    const timestampStr = localStorage.getItem('turnstilePassed');
    if (!timestampStr) return false;


    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    const minutesPassed = (now - timestamp) / (1000 * 60);


    if (minutesPassed < SESSION_VALIDITY_MINUTES) {
        console.log("✅ Sesión Turnstile válida encontrada en localStorage.");
        return true;
    } else {
        console.log("⏰ Sesión Turnstile expirada. Revalidando...");
        localStorage.removeItem('turnstilePassed');
        return false;
    }
}


/**
 * Renderiza el widget de Turnstile en modal centrado (PROFESIONAL)
 */
function renderTurnstileWidget() {
    console.log("🔒 IP desconocida/sesión expirada. Renderizando Turnstile en modal...");


    // Ocultar todo lo demás
    if (loaderWrapper) loaderWrapper.style.display = 'none';
    if (blockedMessage) blockedMessage.style.display = 'none';
    if (mainContent) mainContent.style.display = 'none';


    // Mostrar modal de validación
    if (validationModal) {
        validationModal.style.display = 'flex';
        validationModal.style.opacity = '1';
    }


    // Mostrar Turnstile, ocultar spinner
    const turnstileWidget = document.getElementById('cf-turnstile-widget');
    const spinner = document.getElementById('validation-spinner');


    if (spinner) spinner.style.display = 'none';
    if (turnstileWidget) turnstileWidget.style.display = 'flex';


    // Renderizar Turnstile dentro del modal
    try {
        if (window.turnstile) {
            console.log("📍 Renderizando widget Turnstile en modal centrado...");
            window.turnstile.render('#cf-turnstile-widget', {
                sitekey: TURNSTILE_SITE_KEY,
                callback: onTurnstileValidation,
                theme: 'dark',
                size: 'normal',
            });
            console.log("✅ Turnstile renderizado exitosamente en modal");
        } else {
            console.error("❌ Objeto 'turnstile' no disponible. Reintentando...");
            setTimeout(renderTurnstileWidget, 500);
        }
    } catch (e) {
        console.error("❌ Error al renderizar Turnstile:", e);
        showBlockedMessage();
    }
}


/**
 * Callback de Turnstile - Se llama DESPUÉS de que el usuario pasa el desafío
 */
function onTurnstileValidation(token) {
    console.log("✅ Turnstile verificado por usuario. Validando con backend...");


    // Mostrar spinner de "Validando..."
    const spinner = document.getElementById('validation-spinner');
    const turnstileWidget = document.getElementById('cf-turnstile-widget');


    if (spinner) spinner.style.display = 'flex';
    if (turnstileWidget) turnstileWidget.style.display = 'none'; // Ocultar Turnstile mientras valida


    // Llamar a API para validación completa
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: "validate_visit",
            "cf-turnstile-response": token
        })
    })
        .then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)))
        .then(data => {
            console.log("📦 Respuesta de validación completa recibida:", data.status);
            if (data.status === "known_good") {
                console.log("✅ Backend validó exitosamente. Guardando sesión en localStorage...");
                localStorage.setItem('turnstilePassed', Date.now());


                // ✅ SOLUCIÓN PROFESIONAL: Transición suave SIN REFRESH
                hideValidationModalSmooth(data);
            } else {
                console.warn("❌ Validación fallida o acceso denegado por backend.");
                showFailedValidation();
            }
        })
        .catch(error => {
            console.error("❌ Error en validación completa (Turnstile):", error);
            showFailedValidation();
        });
}


/**
 * Oculta modal de forma PROFESIONAL con animación suave (SIN REFRESH)
 */
function hideValidationModalSmooth(data) {
    const modal = document.getElementById('validation-modal');


    console.log("🎬 Iniciando transición suave del modal...");


    // Fade out suave
    modal.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    modal.style.opacity = '0';
    modal.style.transform = 'translateY(20px)';


    setTimeout(() => {
        console.log("🧹 Limpiando Turnstile del DOM...");


        // Limpiar Turnstile completamente
        const widget = document.getElementById('cf-turnstile-widget');
        if (widget) {
            widget.innerHTML = '';
            console.log("✓ Widget HTML limpiado");
        }


        // Extra: Eliminar iframes residuales de Cloudflare
        document.querySelectorAll('iframe[src*="challenges.cloudflare"]').forEach(el => {
            el.remove();
            console.log("✓ iframe de Cloudflare eliminado");
        });


        // Ocultar modal
        modal.style.display = 'none';


        // Mostrar contenido principal con fade in
        console.log("🎨 Mostrando contenido principal...");
        showMainContent();


        // Renderizar links sensibles
        renderSensitiveLinks(data.sensitiveLinks);


        console.log("✨ Modal oculto. Contenido mostrado. (SIN REFRESH - PROFESIONAL)");
    }, 400);
}


/**
 * Muestra mensaje de fallo de validación
 */
function showFailedValidation() {
    if (validationModal) validationModal.style.display = 'none';
    showBlockedMessage();
}


/**
 * Chequeo inicial de IP (API check_ip)
 */
function initialIpCheck() {
    console.log("🔍 Realizando chequeo inicial de IP (API check_ip)...");
    showLoader();


    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "check_ip" })
    })
        .then(response => response.ok ? response.json() : Promise.reject(`Error API: ${response.status}`))
        .then(data => {
            console.log("📊 Respuesta de chequeo inicial recibida:", data.status);


            switch (data.status) {
                case "known_good":
                    console.log("⚡ Acceso rápido (Caché DB - Limpio). Mostrando contenido...");
                    localStorage.setItem('turnstilePassed', Date.now());
                    showMainContent();
                    renderSensitiveLinks(data.sensitiveLinks);
                    break;


                case "known_bad":
                    console.warn("🚫 Acceso denegado (Caché DB - Sospechoso o País Bloqueado).");
                    showBlockedMessage();
                    break;


                case "needs_validation":
                    console.log("🛡️ IP nueva detectada. Requiere validación con Turnstile.");
                    renderTurnstileWidget();
                    break;


                default:
                    console.error("❓ Respuesta inesperada de la API (check_ip):", data);
                    showBlockedMessage();
            }
        })
        .catch(error => {
            console.error("❌ Error fatal en chequeo inicial de IP (fetch fallido):", error);
            showBlockedMessage();
        });
}


/**
 * Punto de entrada - DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("=== INICIANDO VALIDACIÓN DE SEGURIDAD ===");


    // Referencias al DOM (obtenerlas una vez)
    loaderWrapper = document.getElementById('loader-wrapper');
    blockedMessage = document.getElementById('blocked-message');
    mainContent = document.getElementById('main-content');
    validationModal = document.getElementById('validation-modal');


    console.log("✓ Referencias del DOM obtenidas");


    // NUEVA LÓGICA: ¿Hay sesión válida?
    if (checkSessionValidity()) {
        // ✅ SÍ! Sesión válida en localStorage — cero llamadas a la API.
        // sensitiveLinks no renderiza nada actualmente, se activará cuando
        // about.html se dinamice.
        console.log("✨ Sesión válida encontrada. Mostrando contenido sin validación...");
        showMainContent();


    } else {
        // ❌ NO hay sesión válida, iniciar flujo completo
        console.log("🔄 No hay sesión válida. Iniciando flujo de validación completo...");
        initialIpCheck();
    }


    console.log("=== VALIDACIÓN LISTA ===");
});