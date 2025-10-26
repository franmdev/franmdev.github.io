// assets/js/main.js

const API_URL = "https://franmora-portfolio-api.azurewebsites.net/api/register_visitor"; // URL de producción
const TURNSTILE_SITE_KEY = "0x4AAAAAAB8sMLnvQf8wAXSD";

// --- Elementos del DOM ---
let loaderWrapper, blockedMessage, mainContent, turnstileWidgetDiv, socialLinksPlaceholder;

// --- Función para renderizar los links (si se reciben) ---
function renderSensitiveLinks(links) {
    if (!socialLinksPlaceholder) {
        socialLinksPlaceholder = document.getElementById('social-links-placeholder');
        if (!socialLinksPlaceholder) return; // Salir si no existe
    }

    if (links && links.linkedin && links.github) {
        console.log("País permitido. Mostrando links de LinkedIn y GitHub.");
        linksPlaceholder.innerHTML = ''; // Limpiar

        const linkedinLink = document.createElement('a');
        linkedinLink.href = links.linkedin;
        linkedinLink.textContent = 'LinkedIn';
        linkedinLink.target = '_blank';
        linkedinLink.rel = 'noopener noreferrer';
        // (Añadir clases de estilo si es necesario)
        linksPlaceholder.appendChild(linkedinLink);

        linksPlaceholder.appendChild(document.createTextNode(' | '));

        const githubLink = document.createElement('a');
        githubLink.href = links.github;
        githubLink.textContent = 'GitHub';
        githubLink.target = '_blank';
        githubLink.rel = 'noopener noreferrer';
        linksPlaceholder.appendChild(githubLink);
    } else {
        console.log("País no permitido o links no recibidos. Links ocultos.");
        linksPlaceholder.innerHTML = ''; // Asegurar que esté vacío
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

// --- CASO 2: Callback de Turnstile cuando la IP es nueva ---
function onTurnstileSuccess(token) {
    console.log("Turnstile verificado (IP nueva). Llamando a API para validación completa...");

    // Ahora llamamos a la API con el token para la validación completa
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: "validate_visit", // <- Acción de validación
            "cf-turnstile-response": token
        })
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.error || `Error API: ${response.status}`); });
            }
            return response.json();
        })
        .then(data => {
            console.log("Respuesta de validación completa recibida:", data);
            if (data.status === "known_good" && data.sensitiveLinks.linkedin) {
                // Éxito: IP nueva validada, es de Chile y limpia
                showMainContent();
                renderSensitiveLinks(data.sensitiveLinks);
            } else {
                // Fracaso: IP nueva validada, pero es sospechosa o no de Chile
                showBlockedMessage();
            }
        })
        .catch(error => {
            console.error("Error en el flujo de validación (Turnstile):", error);
            showBlockedMessage(); // Bloquear si la validación falla
        });
}

// --- CASO 1: Chequeo inicial de IP al cargar la página ---
function checkIpStatus() {
    console.log("Realizando chequeo inicial de IP (Caché DB)...");

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "check_ip" }) // <- Acción de chequeo
    })
        .then(response => {
            if (!response.ok) {
                // Si la API falla en el chequeo, procedemos al flujo de validación completo
                return { status: "needs_validation" };
            }
            return response.json();
        })
        .then(data => {
            console.log("Respuesta de chequeo inicial recibida:", data.status);

            switch (data.status) {
                case "known_good":
                    // CASO 1 (Éxito): IP conocida y limpia. Mostrar contenido, omitir Turnstile.
                    console.log("Acceso rápido (Caché HIT - Limpio).");
                    showMainContent();
                    renderSensitiveLinks(data.sensitiveLinks);
                    break;

                case "known_bad":
                    // CASO 1 (Fallo): IP conocida y sospechosa. Bloquear.
                    console.warn("Acceso denegado (Caché HIT - Sospechoso).");
                    showBlockedMessage();
                    break;

                case "needs_validation":
                    // CASO 2: IP nueva. Mostrar y ejecutar Turnstile.
                    console.log("IP desconocida. Renderizando Turnstile para validación...");
                    // Mostramos el contenido principal (que incluye el div de Turnstile)
                    showMainContent();
                    // Renderizamos el widget manualmente
                    // (Asegúrate de que el div en index.html NO tenga data-callback)
                    if (window.turnstile) {
                        window.turnstile.render('#cf-turnstile-widget', { // Asegúrate de que el ID sea correcto
                            sitekey: TURNSTILE_SITE_KEY,
                            callback: onTurnstileSuccess,
                        });
                    } else {
                        console.error("No se pudo cargar el script de Turnstile.");
                        showBlockedMessage();
                    }
                    break;

                default:
                    // Error inesperado
                    console.error("Respuesta inesperada de la API:", data);
                    showBlockedMessage();
            }
        })
        .catch(error => {
            // Error de red en el chequeo inicial.
            console.error("Error fatal en el chequeo inicial de IP:", error);
            // Decidimos fallar de forma segura (bloquear) si no podemos verificar
            showBlockedMessage();
        });
}

// --- Punto de Entrada ---
document.addEventListener('DOMContentLoaded', () => {
    // Obtenemos los elementos del DOM una vez
    loaderWrapper = document.getElementById('loader-wrapper');
    blockedMessage = document.getElementById('blocked-message');
    mainContent = document.getElementById('main-content');
    // IMPORTANTE: Asegúrate de que tu div de Turnstile tenga este ID
    turnstileWidgetDiv = document.getElementById('cf-turnstile-widget');
    socialLinksPlaceholder = document.getElementById('social-links-placeholder');

    // Ocultamos todo menos el loader
    showLoader();

    // Iniciamos el flujo de validación
    checkIpStatus();
});