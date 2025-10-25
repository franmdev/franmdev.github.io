// assets/js/main.js

// Variable global para guardar el token de Turnstile
let turnstileToken = null;

// --- Función llamada por Cloudflare Turnstile al validar ---
function onTurnstileSuccess(token) {
    console.log("Cloudflare Turnstile verificado con éxito. Token:", token);
    turnstileToken = token; // Guardamos el token
    // Ahora que tenemos el token, llamamos a nuestra API
    registerVisitorAndLoadLinks();
}

// --- Función que llama a nuestra API de Azure ---
function registerVisitorAndLoadLinks() {
    const API_URL = "https://franmora-portfolio-api.azurewebsites.net/api/register_visitor"; // URL de producción
    const linksPlaceholder = document.getElementById('social-links-placeholder');

    if (!linksPlaceholder) {
        console.error("Error: Placeholder 'social-links-placeholder' no encontrado.");
        return;
    }

    // Asegurarnos de que tenemos un token antes de llamar a la API
    if (!turnstileToken) {
        console.error("Error: No se recibió el token de Turnstile. No se puede llamar a la API.");
        // Opcional: Mostrar un mensaje al usuario
        linksPlaceholder.textContent = "Error de verificación. Intente recargar la página.";
        return;
    }

    console.log("Llamando a la API de Azure con el token de Turnstile...");

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Enviamos el token de Turnstile y el path en el cuerpo
        body: JSON.stringify({
            path: window.location.pathname,
            "cf-turnstile-response": turnstileToken // Nombre estándar esperado por Cloudflare
        })
    })
        .then(response => {
            // Revisamos primero si la API devolvió error (ej. 403 por Turnstile inválido, 500 por error interno)
            if (!response.ok) {
                // Intentamos leer el mensaje de error si la API lo envió en JSON
                return response.json().then(errorData => {
                    throw new Error(`Error ${response.status} de la API: ${errorData.error || response.statusText}`);
                }).catch(() => {
                    // Si la respuesta no es JSON o hay otro error, lanzamos error genérico
                    throw new Error(`Error ${response.status} de la API: ${response.statusText}`);
                });
            }
            // Si la respuesta es OK (200), la procesamos como JSON
            return response.json();
        })
        .then(data => {
            console.log("Respuesta de la API recibida:", data);

            // Verificamos si la respuesta contiene los links sensibles
            if (data.sensitiveLinks && data.sensitiveLinks.linkedin && data.sensitiveLinks.github) {
                console.log("API confirmó acceso permitido. Mostrando links.");
                linksPlaceholder.innerHTML = ''; // Limpiar

                // Crear y añadir links (código igual que antes)
                const linkedinLink = document.createElement('a');
                linkedinLink.href = data.sensitiveLinks.linkedin;
                linkedinLink.textContent = 'LinkedIn';
                linkedinLink.target = '_blank';
                linkedinLink.rel = 'noopener noreferrer';
                linksPlaceholder.appendChild(linkedinLink);
                linksPlaceholder.appendChild(document.createTextNode(' | '));
                const githubLink = document.createElement('a');
                githubLink.href = data.sensitiveLinks.github;
                githubLink.textContent = 'GitHub';
                githubLink.target = '_blank';
                githubLink.rel = 'noopener noreferrer';
                linksPlaceholder.appendChild(githubLink);

            } else {
                console.log("API indicó país no permitido o links no recibidos. Links ocultos.");
                linksPlaceholder.innerHTML = ''; // Asegurar que esté vacío
            }
        })
        .catch(error => {
            console.error("Error al conectar o procesar respuesta de Azure Functions:", error);
            linksPlaceholder.innerHTML = 'No se pudo cargar el contenido.'; // Mensaje de error genérico
        });

    // Limpiamos el token después de usarlo (opcional, por seguridad)
    turnstileToken = null;
}

