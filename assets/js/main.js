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
        linkedinLink.target = '_blank'; // Abrir en nueva pestaña
        linkedinLink.rel = 'noopener noreferrer'; // Buenas prácticas de seguridad
        // (Añadir clases de estilo aquí si es necesario, ej. Tailwind)
        // linkedinLink.classList.add('text-blue-500', 'hover:underline', 'mx-2'); 
        linksPlaceholder.appendChild(linkedinLink);

        linksPlaceholder.appendChild(document.createTextNode(' | '));

        const githubLink = document.createElement('a');
        githubLink.href = links.github;
        githubLink.textContent = 'GitHub';
        githubLink.target = '_blank';
        githubLink.rel = 'noopener noreferrer';
        // (Añadir clases de estilo aquí)
        // githubLink.classList.add('text-gray-400', 'hover:underline', 'mx-2'); 
        linksPlaceholder.appendChild(githubLink);
    } else {
        console.log("Acceso permitido, pero no se recibieron links (país no permitido o error). Links ocultos.");
        linksPlaceholder.innerHTML = ''; // Asegurarse de que esté vacío
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

    // Ahora llamamos a la API con el token para la validación completa
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: "validate_visit", // <- Acción de validación completa
            "cf-turnstile-response": token // El token de Turnstile
        })
    })
        .then(response => {
            // Manejar errores de red o HTTP (ej. 500, 403)
            if (!response.ok) {
                // Intentar leer el error JSON que envía el backend
                return response.json().then(err => {
                    // Lanzar un error para ser capturado por .catch()
                    throw new Error(err.error || `Error API: ${response.status}`);
                }).catch(() => {
                    // Si la respuesta de error no es JSON
                    throw new Error(`Error API: ${response.status} ${response.statusText}`);
                });
            }
            return response.json(); // Convertir la respuesta OK a JSON
        })
        .then(data => {
            console.log("Respuesta de validación completa recibida:", data);

            // El backend responde "known_good" si la validación completa fue exitosa
            // Y "known_bad" si falló (ej. VPN detectado en Chile)
            if (data.status === "known_good") {
                // Éxito: IP nueva validada, es de Chile y limpia
                // El contenido principal ya está visible, solo renderizamos los links
                renderSensitiveLinks(data.sensitiveLinks);
            } else {
                // Fracaso: IP nueva validada, pero es sospechosa o no de Chile
                showBlockedMessage();
            }
        })
        .catch(error => {
            // Captura errores de red o errores lanzados desde .then()
            console.error("Error en el flujo de validación (Turnstile):", error);
            showBlockedMessage(); // Bloquear si la validación falla
        });
}

/**
 * CASO 1: Chequeo inicial de IP. Se llama al cargar la página.
 * Pregunta al backend si ya conoce esta IP.
 */
function initialIpCheck() {
    console.log("Realizando chequeo inicial de IP (Caché DB)...");

    // Llamada inicial a la API solo con la acción "check_ip"
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "check_ip" }) // <- Acción de solo chequeo
    })
        .then(response => {
            if (!response.ok) {
                // Si la API falla en el chequeo (ej. 500), no podemos confiar en el caché.
                // Forzamos el flujo de validación completo como fallback.
                console.warn("Chequeo inicial de IP falló. Forzando validación completa.");
                // Devolvemos un objeto que simula la respuesta de "needs_validation"
                return { status: "needs_validation" };
            }
            return response.json();
        })
        .then(data => {
            console.log("Respuesta de chequeo inicial recibida:", data.status);

            switch (data.status) {
                case "known_good":
                    // CASO 1 (Éxito): IP conocida y limpia. 
                    // Mostrar contenido, OMITIR Turnstile.
                    console.log("Acceso rápido (Caché HIT - Limpio).");
                    showMainContent();
                    renderSensitiveLinks(data.sensitiveLinks); // Renderizar links (si los hay)
                    break;

                case "known_bad":
                    // CASO 1 (Fallo): IP conocida y sospechosa (o no-CL). Bloquear.
                    console.warn("Acceso denegado (Caché HIT - Sospechoso o País Bloqueado).");
                    showBlockedMessage();
                    break;

                case "needs_validation":
                    // CASO 2: IP nueva. Mostrar contenido y ejecutar Turnstile.
                    console.log("IP desconocida. Renderizando Turnstile para validación...");
                    // Mostramos el contenido principal (que incluye el div de Turnstile)
                    showMainContent();

                    // Renderizamos el widget manualmente
                    try {
                        // Esperamos que el script api.js de Turnstile ya esté cargado
                        if (window.turnstile) {
                            window.turnstile.render('#cf-turnstile-widget', {
                                sitekey: TURNSTILE_SITE_KEY,
                                callback: onTurnstileValidation, // Llamar a esta función cuando se complete
                            });
                        } else {
                            // Esto puede pasar si el script de Turnstile aún no se carga
                            console.error("Error: Objeto 'turnstile' no encontrado. Verifique que el script api.js esté cargado.");
                            // Intentar de nuevo tras un breve retraso
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
                            }, 1000); // Esperar 1 segundo
                        }
                    } catch (e) {
                        console.error("Error al renderizar Turnstile:", e);
                        showBlockedMessage();
                    }
                    break;

                default:
                    // Error inesperado en la respuesta JSON
                    console.error("Respuesta inesperada de la API:", data);
                    showBlockedMessage();
            }
        })
        .catch(error => {
            // Error de red en el chequeo inicial (ej. API caída, sin internet)
            console.error("Error fatal en el chequeo inicial de IP (fetch fallido):", error);
            // Fallamos de forma segura (bloquear) si no podemos verificar
            showBlockedMessage();
        });
}

// --- Punto de Entrada ---
// Se ejecuta cuando la estructura HTML de la página está lista.
document.addEventListener('DOMContentLoaded', () => {
    // Obtenemos las referencias a los elementos del DOM una sola vez
    loaderWrapper = document.getElementById('loader-wrapper');
    blockedMessage = document.getElementById('blocked-message');
    mainContent = document.getElementById('main-content');
    turnstileWidgetDiv = document.getElementById('cf-turnstile-widget');
    socialLinksPlaceholder = document.getElementById('social-links-placeholder');

    // Ocultamos todo menos el loader al inicio
    showLoader();

    // Iniciamos el flujo de validación
    checkIpStatus();
});