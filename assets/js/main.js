// assets/js/main.js

function registerVisitorAndLoadLinks() {
    const API_URL = "https://franmora-portfolio-api.azurewebsites.net/api/register_visitor"; // URL de producción
    const linksPlaceholder = document.getElementById('social-links-placeholder'); // El div donde irán los links

    if (!linksPlaceholder) {
        console.error("Error: No se encontró el elemento con ID 'social-links-placeholder' en el HTML.");
        return; // Salir si el placeholder no existe
    }

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Enviamos el path para el registro, aunque podríamos quitarlo si no lo usamos
        body: JSON.stringify({ path: window.location.pathname })
    })
        .then(response => {
            if (!response.ok) {
                // Si la API devuelve error (ej. 500), lanzamos un error para ir al .catch
                throw new Error(`Error ${response.status} de la API: ${response.statusText}`);
            }
            return response.json(); // Convertimos la respuesta exitosa a JSON
        })
        .then(data => {
            console.log("Respuesta de la API recibida:", data); // Log para depurar

            // Verificamos si la respuesta contiene los links sensibles
            if (data.sensitiveLinks && data.sensitiveLinks.linkedin && data.sensitiveLinks.github) {
                console.log("País permitido. Mostrando links de LinkedIn y GitHub.");

                // Limpiamos el placeholder por si acaso
                linksPlaceholder.innerHTML = '';

                // Creamos el enlace de LinkedIn
                const linkedinLink = document.createElement('a');
                linkedinLink.href = data.sensitiveLinks.linkedin;
                linkedinLink.textContent = 'LinkedIn';
                linkedinLink.target = '_blank'; // Abrir en nueva pestaña
                linkedinLink.rel = 'noopener noreferrer'; // Buenas prácticas de seguridad
                // Añadir clases CSS si quieres darle estilo (ej. con Tailwind)
                // linkedinLink.classList.add('text-blue-500', 'hover:underline', 'mx-2'); 
                linksPlaceholder.appendChild(linkedinLink);

                // Añadimos un separador simple (opcional)
                linksPlaceholder.appendChild(document.createTextNode(' | '));

                // Creamos el enlace de GitHub
                const githubLink = document.createElement('a');
                githubLink.href = data.sensitiveLinks.github;
                githubLink.textContent = 'GitHub';
                githubLink.target = '_blank';
                githubLink.rel = 'noopener noreferrer';
                // Añadir clases CSS
                // githubLink.classList.add('text-gray-400', 'hover:underline', 'mx-2'); 
                linksPlaceholder.appendChild(githubLink);

            } else {
                console.log("País no permitido o links no recibidos. Links sensibles ocultos.");
                // Opcional: Podrías mostrar un mensaje genérico o nada
                linksPlaceholder.innerHTML = ''; // Asegurarse de que esté vacío
            }
        })
        .catch(error => {
            // Captura errores de red (fetch fallido) o errores lanzados desde .then()
            console.error("No se pudo conectar o procesar la respuesta del servicio de Azure Functions.", error);
            // Ocultar links o mostrar mensaje de error en el placeholder si falla la conexión
            linksPlaceholder.innerHTML = '';
        });
}

// Ejecutar la función cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', registerVisitorAndLoadLinks);