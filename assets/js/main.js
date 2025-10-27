// assets/js/main.js

// --- CONFIGURACIÓN ---
const API_URL = "https://franmora-portfolio-api.azurewebsites.net/api/register_visitor";
const TURNSTILE_SITE_KEY = "0x4AAAAAAB8sMLnvQf8wAXSD";
const SESSION_VALIDITY_MINUTES = 30; // ¿Cuánto tiempo dura la sesión sin revalidar?
// --- FIN CONFIGURACIÓN ---

// --- Variables Globales del DOM ---
let loaderWrapper, blockedMessage, mainContent, turnstileWidgetDiv, socialLinksPlaceholder;

// --- Funciones para cambiar estado UI ---
function showLoader(message = "Validando conexión segura...") {
    if (loaderWrapper) {
        loaderWrapper.style.display = 'flex'; // Usar flex para centrar
        const p = loaderWrapper.querySelector('p');
        if (p) p.textContent = message;
    }
    if (blockedMessage) blockedMessage.style.display = 'none';
    if (mainContent) mainContent.style.display = 'none';
    // Ocultar Turnstile si está visible
    if (turnstileWidgetDiv) turnstileWidgetDiv.style.display = 'none';
}

function showBlockedMessage() {
    if (loaderWrapper) loaderWrapper.style.display = 'none';
    if (blockedMessage) blockedMessage.style.display = 'flex'; // Usar flex
    if (mainContent) mainContent.style.display = 'none';
    if (turnstileWidgetDiv) turnstileWidgetDiv.style.display = 'none';
}

function showMainContent() {
    if (loaderWrapper) loaderWrapper.style.display = 'none';
    if (blockedMessage) blockedMessage.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block'; // O 'flex' si usas flexbox
    // No necesitamos mostrar Turnstile aquí necesariamente
}

// --- Funciones de Lógica ---

/**
 * Renderiza los links sociales si existen.
 */
function renderSensitiveLinks(links) {
    socialLinksPlaceholder = socialLinksPlaceholder || document.getElementById('social-links-placeholder'); // Asegurarse de tener la referencia
    if (!socialLinksPlaceholder) {
        console.error("Error: Placeholder 'social-links-placeholder' no encontrado.");
        return;
    }
    socialLinksPlaceholder.innerHTML = ''; // Limpiar

    if (links && links.linkedin && links.github) {
        console.log("Acceso permitido. Mostrando links.");
        // Crear y añadir links (ejemplo con clases Tailwind básicas)
        const linkedIn = `<a href="${links.linkedin}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-coder-accent hover:underline mx-2">LinkedIn</a>`;
        const github = `<a href="${links.github}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-coder-accent hover:underline mx-2">GitHub</a>`;
        socialLinksPlaceholder.innerHTML = `${linkedIn} | ${github}`;
    } else {
        console.log("Acceso permitido, pero no se recibieron links (país no permitido o caché). Links ocultos.");
    }
}

/**
 * Verifica si hay una sesión Turnstile válida en sessionStorage.
 */
function checkSessionValidity() {
    const timestampStr = sessionStorage.getItem('turnstilePassed');
    if (!timestampStr) return false;

    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    const minutesPassed = (now - timestamp) / (1000 * 60);

    if (minutesPassed < SESSION_VALIDITY_MINUTES) {
        console.log("Sesión Turnstile válida encontrada en sessionStorage.");
        return true;
    } else {
        console.log("Sesión Turnstile expirada. Revalidando...");
        sessionStorage.removeItem('turnstilePassed'); // Limpiar sesión expirada
        return false;
    }
}

/**
 * Callback de Turnstile. Se llama DESPUÉS de que el usuario pasa el desafío.
 */
function onTurnstileValidation(token) {
    console.log("Turnstile verificado (IP nueva/sesión expirada). Llamando a API para validación completa...");
    showLoader("Verificación completada. Finalizando..."); // Mensaje mientras llama a API

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
            console.log("Respuesta de validación completa recibida:", data);
            if (data.status === "known_good") {
                console.log("Validación completa exitosa. Guardando sesión.");
                sessionStorage.setItem('turnstilePassed', Date.now()); // Guardar sesión VÁLIDA
                showMainContent();
                renderSensitiveLinks(data.sensitiveLinks);
            } else { // known_bad u otro estado de error del backend
                console.warn("Validación completa fallida o acceso denegado por backend.");
                showBlockedMessage();
            }
        })
        .catch(error => {
            console.error("Error en el fetch de validación completa (Turnstile):", error);
            showBlockedMessage();
        });
}

/**
 * Renderiza el widget de Turnstile (ahora se hace ANTES de mostrar main-content).
 */
/**
 * Renderiza el widget de Turnstile.
 */
function renderTurnstileWidget() {
    console.log("IP desconocida/sesión expirada. Renderizando Turnstile...");

    // Ocultar loader
    if (loaderWrapper) loaderWrapper.style.display = 'none';
    if (blockedMessage) blockedMessage.style.display = 'none';
    if (mainContent) mainContent.style.display = 'none';

    // Mostrar Turnstile container
    const turnstileContainer = document.getElementById('cf-turnstile-container');
    if (turnstileContainer) {
        turnstileContainer.style.display = 'flex';
    }

    try {
        if (window.turnstile) {
            console.log("Renderizando widget Turnstile...");
            window.turnstile.render('#cf-turnstile-widget', {
                sitekey: TURNSTILE_SITE_KEY,
                callback: onTurnstileValidation,
            });
            console.log("✅ Turnstile renderizado exitosamente");
        } else {
            console.error("Objeto 'turnstile' no disponible. Reintentando...");
            setTimeout(renderTurnstileWidget, 500);
        }
    } catch (e) {
        console.error("Error al renderizar Turnstile:", e);
        showBlockedMessage();
    }
}



/**
 * Chequeo inicial de IP (llamado si no hay sesión válida).
 */
function initialIpCheck() {
    console.log("Realizando chequeo inicial de IP (API check_ip)...");
    showLoader(); // Asegurarse de mostrar loader

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "check_ip" })
    })
        .then(response => response.ok ? response.json() : Promise.reject(`Error API: ${response.status}`))
        .then(data => {
            console.log("Respuesta de chequeo inicial recibida:", data.status);
            switch (data.status) {
                case "known_good":
                    console.log("Acceso rápido (Caché DB - Limpio).");
                    // Opcional: Podríamos guardar sesión aquí también para futuras cargas de página
                    // sessionStorage.setItem('turnstilePassed', Date.now());
                    showMainContent();
                    renderSensitiveLinks(data.sensitiveLinks);
                    break;
                case "known_bad":
                    console.warn("Acceso denegado (Caché DB - Sospechoso o País Bloqueado).");
                    showBlockedMessage();
                    break;
                case "needs_validation":
                    // ¡AQUÍ ejecutamos Turnstile ANTES de mostrar main-content!
                    renderTurnstileWidget();
                    break;
                default:
                    console.error("Respuesta inesperada de la API (check_ip):", data);
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
    // Referencias al DOM (mejor obtenerlas una vez)
    loaderWrapper = document.getElementById('loader-wrapper');
    blockedMessage = document.getElementById('blocked-message');
    mainContent = document.getElementById('main-content');
    // Turnstile y Social Links se buscarán cuando se necesiten

    // NUEVA LÓGICA: ¿Hay sesión válida?
    if (checkSessionValidity()) {
        // ¡Sí! Saltar validación y mostrar contenido directamente
        showMainContent();
        // AÚN necesitamos llamar a la API para obtener los links (pero SIN validación)
        // Podríamos crear un nuevo endpoint 'get_links' o reutilizar 'check_ip'
        // Por simplicidad, reusaremos check_ip sabiendo que el backend responderá rápido (cache hit)
        console.log("Sesión válida, obteniendo links sociales...");
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: "check_ip" }) // Asume que backend responderá rápido
        })
            .then(response => response.ok ? response.json() : Promise.reject('Error obteniendo links'))
            .then(data => {
                if (data.sensitiveLinks) {
                    renderSensitiveLinks(data.sensitiveLinks);
                }
            })
            .catch(error => console.error("Error obteniendo links sociales en sesión válida:", error));

    } else {
        // No hay sesión válida, iniciar flujo completo
        initialIpCheck();
    }
});