// assets/js/main.js - Flujo de Validación Profesional SIN REFRESH


// --- CONFIGURACIÓN ---
const API_URL = "https://franmora-portfolio-api.azurewebsites.net/api/register_visitor";
const TURNSTILE_SITE_KEY = "0x4AAAAAAB8sMLnvQf8wAXSD";
const SESSION_VALIDITY_MINUTES = 30;
const MAX_TURNSTILE_RETRIES = 15;
// --- FIN CONFIGURACIÓN ---


// --- Variables Globales del DOM ---
let loaderWrapper, blockedMessage, mainContent, validationModal;
let turnstileRetryCount = 0;


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
 * Renderiza los links sociales si existen hidratando elementos [data-sensitive-link].
 */
function renderSensitiveLinks(links) {
    if (!links) return;
    console.log("Habilitando enlaces sensibles...");
    const sensitiveElements = document.querySelectorAll('[data-sensitive-link]');
    sensitiveElements.forEach(el => {
        const key = el.getAttribute('data-sensitive-link');
        if (links[key]) {
            el.href = links[key];
            el.classList.remove('disabled');
        }
    });
}


/**
 * Verifica si hay una sesión Turnstile válida en localStorage.
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
 * Renderiza el widget de Turnstile en modal centrado con detección de tema y reintentos.
 */
function renderTurnstileWidget() {
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
            const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            console.log(`📍 Renderizando widget Turnstile (Tema: ${currentTheme})...`);
            window.turnstile.render('#cf-turnstile-widget', {
                sitekey: TURNSTILE_SITE_KEY,
                callback: onTurnstileValidation,
                theme: currentTheme,
                size: 'normal',
            });
        } else {
            if (turnstileRetryCount < MAX_TURNSTILE_RETRIES) {
                turnstileRetryCount++;
                console.warn(`⚠️ Turnstile no disponible. Reintento ${turnstileRetryCount}/${MAX_TURNSTILE_RETRIES}...`);
                setTimeout(renderTurnstileWidget, 500);
            } else {
                console.error("❌ Fallo crítico: Turnstile no cargó tras múltiples reintentos.");
                showBlockedMessage();
            }
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


    const spinner = document.getElementById('validation-spinner');
    const turnstileWidget = document.getElementById('cf-turnstile-widget');


    if (spinner) spinner.style.display = 'flex';
    if (turnstileWidget) turnstileWidget.style.display = 'none';


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
            if (data.status === "known_good") {
                localStorage.setItem('turnstilePassed', Date.now());
                hideValidationModalSmooth(data);
            } else {
                showFailedValidation();
            }
        })
        .catch(error => {
            console.error("❌ Error en validación completa:", error);
            showFailedValidation();
        });
}


/**
 * Oculta modal de forma PROFESIONAL con animación suave
 */
function hideValidationModalSmooth(data) {
    const modal = document.getElementById('validation-modal');
    modal.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    modal.style.opacity = '0';
    modal.style.transform = 'translateY(20px)';


    setTimeout(() => {
        const widget = document.getElementById('cf-turnstile-widget');
        if (widget) widget.innerHTML = '';
        document.querySelectorAll('iframe[src*="challenges.cloudflare"]').forEach(el => el.remove());
        modal.style.display = 'none';
        showMainContent();
        renderSensitiveLinks(data.sensitiveLinks);
    }, 400);
}


function showFailedValidation() {
    if (validationModal) validationModal.style.display = 'none';
    showBlockedMessage();
}


/**
 * Chequeo inicial de IP con reintento ante cold start de Azure
 */
function initialIpCheck(isRetry = false) {
    if (!isRetry) showLoader();


    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "check_ip" })
    })
        .then(response => {
            if (!response.ok && !isRetry) throw new Error("Cold Start");
            return response.ok ? response.json() : Promise.reject(`Error API: ${response.status}`);
        })
        .then(data => {
            switch (data.status) {
                case "known_good":
                    localStorage.setItem('turnstilePassed', Date.now());
                    showMainContent();
                    renderSensitiveLinks(data.sensitiveLinks);
                    break;
                case "known_bad":
                    showBlockedMessage();
                    break;
                case "needs_validation":
                    renderTurnstileWidget();
                    break;
                default:
                    showBlockedMessage();
            }
        })
        .catch(error => {
            if (!isRetry) {
                console.warn("⚠️ Posible Cold Start detectado. Reintentando en 1.5s...");
                setTimeout(() => initialIpCheck(true), 1500);
            } else {
                console.error("❌ Error fatal en chequeo inicial:", error);
                showBlockedMessage();
            }
        });
}


/**
 * Punto de entrada - DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    loaderWrapper = document.getElementById('loader-wrapper');
    blockedMessage = document.getElementById('blocked-message');
    mainContent = document.getElementById('main-content');
    validationModal = document.getElementById('validation-modal');


    if (checkSessionValidity()) {
        showMainContent();
    } else {
        initialIpCheck();
    }
});