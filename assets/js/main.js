// assets/js/main.js

// --- CONFIGURACIÓN ---
// URL de producción de tu API
const API_URL = "https://franmora-portfolio-api.azurewebsites.net/api/register_visitor";
// Clave PÚBLICA (Site Key) de Cloudflare Turnstile
const TURNSTILE_SITE_KEY = "0x4AAAAAAB8sMLnvQf8wAXSD"; // ¡Asegúrate de que esta sea tu Site Key!
// --- FIN CONFIGURACIÓN ---

// --- Variables Globales del DOM ---
let loaderWrapper, blockedMessage, mainContent, turnstileWidgetDiv, socialLinksPlaceholder;

/**
 * Inserta dinámicamente los enlaces de LinkedIn y GitHub en el placeholder.
 * @param {object} links - Objeto con las URLs { linkedin: "...", github: "..." }
 */
function renderSensitiveLinks(links) {
    if (!socialLinksPlaceholder) {
        console.error("Error: Placeholder 'social-links-placeholder' no encontrado al renderizar.");
        return;
    }

    if (links && links.linkedin && links.github) {
        console.log("Acceso permitido. Mostrando links de LinkedIn y GitHub.");
        linksPlaceholder.innerHTML = ''; // Limpiar por si acaso

        const linkedinLink = document.createElement('a');
        linkedinLink.href = links.linkedin;
        linkedinLink.textContent = 'LinkedIn';
        linkedinLink.target = '_blank';
        linkedinLink.rel = 'noopener noreferrer';
        linksPlaceholder.appendChild(linkedinLink);

        linksPlaceholder.appendChild(document.createTextNode(' | '));

        const githubLink = document.createElement('a');
        githubLink.href = links.github;
        githubLink.textContent = 'GitHub';
        githubLink.target = '_blank';
        githubLink.rel = 'noopener noreferrer';
        linksPlaceholder.appendChild(githubLink);
    } else {
        console.log("Acceso permitido, pero no se recibieron links (país no permitido o error). Links ocultos.");
        linksPlaceholder.innerHTML = '';
    }
}

// --- Funciones para cambiar el estado de la página ---
function showLoader() {
    if (loaderWrapper) loaderWrapper.style.display = 'block';
    if (blockedMessage) blockedMessage.style.display = 'none';
    if (mainContent) mainContent.style.display = 'none';
}

function showBlockedMessage() {
    if (loaderWrapper) loaderWrapper.style.display = 'none';
    if (blockedMessage) blockedMessage.style.display = 'block';
    if (mainContent) mainContent.style.display = 'none';
}

function showMainContent() {
    if (loaderWrapper) loaderWrapper.style.display = 'none';
    if (blockedMessage) blockedMessage.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';
}

/**
 * CASO 2: Callback de Turnstile. Se llama cuando el widget
 * invisible de Turnstile se completa (solo para IPs nuevas).
 * @param {string} token - El token generado por Cloudflare Turnstile.
 */
function onTurnstileValidation(token) {
    console.log("Turnstile verificado (IP nueva). Llamando a API para validación completa...");

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: "validate_visit", // <- Acción de validación completa
            "cf-turnstile-response": token // El token de Turnstile
        })
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || `Error API: ${response.status}`);
                }).catch(() => {
                    throw new Error(`Error API: ${response.status} ${response.statusText}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("Respuesta de validación completa recibida:", data);

            if (data.status === "known_good") {
                renderSensitiveLinks(data.sensitiveLinks);
            } else {
                showBlockedMessage();
            }
        })
        .catch(error => {
            console.error("Error en el flujo de validación (Turnstile):", error);
            showBlockedMessage();
        });
}

/**
 * CASO 1: Chequeo inicial de IP. Se llama al cargar la página.
 * Pregunta al backend si ya conoce esta IP.
 */
function initialIpCheck() { // <-- EL NOMBRE DE LA FUNCIÓN ES 'initialIpCheck'
    console.log("Realizando chequeo inicial de IP (Caché DB)...");

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "check_ip" })
    })
        .then(response => {
            if (!response.ok) {
                console.warn("Chequeo inicial de IP falló. Forzando validación completa.");
                return { status: "needs_validation" };
            }
            return response.json();
        })
        .then(data => {
            console.log("Respuesta de chequeo inicial recibida:", data.status);

            switch (data.status) {
                case "known_good":
                    // CASO 1 (Éxito): IP conocida y limpia. Mostrar contenido, OMITIR Turnstile.
                    console.log("Acceso rápido (Caché HIT - Limpio).");
                    showMainContent();
                    renderSensitiveLinks(data.sensitiveLinks);
                    break;

                case "known_bad":
                    // CASO 1 (Fallo): IP conocida y sospechosa (o no-CL). Bloquear.
                    console.warn("Acceso denegado (Caché HIT - Sospechoso o País Bloqueado).");
                    showBlockedMessage();
                    break;

                case "needs_validation":
                    // CASO 2: IP nueva. Mostrar contenido y ejecutar Turnstile.
                    console.log("IP desconocida. Renderizando Turnstile para validación...");
                    showMainContent();

                    try {
                        if (window.turnstile) {
                            // Usamos el ID 'cf-turnstile-widget' que definiste en el HTML
                            window.turnstile.render('#cf-turnstile-widget', {
                                sitekey: TURNSTILE_SITE_KEY,
                                callback: onTurnstileValidation,
                            });
                        } else {
                            console.error("Error: Objeto 'turnstile' no encontrado.");
                            setTimeout(() => {
                                if (window.turnstile) {
                                    window.turnstile.render('#cf-turnstile-widget', {
                                        sitekey: TURNSTILE_SITE_KEY,
                                        callback: onTurnstileValidation,
                                    });
                                } else {
                                    console.error("Fallo definitivo al cargar Turnstile.");
                                    showBlockedMessage();
                                }
                            }, 1000);
                        }
                    } catch (e) {
                        console.error("Error al renderizar Turnstile:", e);
                        showBlockedMessage();
                    }
                    break;

                default:
                    console.error("Respuesta inesperada de la API:", data);
                    showBlockedMessage();
            }
        })
        .catch(error => {
            console.error("Error fatal en el chequeo inicial de IP (fetch fallido):", error);
            showBlockedMessage();
        });
}

// --- Punto de Entrada ---
document.addEventListener('DOMContentLoaded', () => {
    // Obtenemos las referencias a los elementos del DOM
    loaderWrapper = document.getElementById('loader-wrapper');
    blockedMessage = document.getElementById('blocked-message');
    mainContent = document.getElementById('main-content');
    turnstileWidgetDiv = document.getElementById('cf-turnstile-widget');
    socialLinksPlaceholder = document.getElementById('social-links-placeholder');

    // Mostramos el loader
    showLoader();

    // --- CORRECCIÓN ---
    // Llamamos a la función con el nombre correcto: 'initialIpCheck'
    initialIpCheck();
});