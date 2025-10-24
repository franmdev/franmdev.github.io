// assets/js/main.js

// --- Sistema 2: Ingeniería de Datos (Tu Pipeline Personal) ---
function registerVisitor() {
    // URL de funcion desplegada en Azure
    const API_URL = "https://franmora-portfolio-api.azurewebsites.net/api/register_visitor";

    // NOTA: No necesitamos enviar la IP; el servidor (Azure) la detecta automáticamente.

    fetch(API_URL, {
        method: 'POST', // Usamos POST para enviar datos
        headers: {
            // No necesitamos enviar JSON, pero sí nos gusta que sea robusto
            'Content-Type': 'application/json'
        },
        // Enviamos el path para saber qué página visitó
        body: JSON.stringify({
            // Esto es solo para que el código de Azure reciba algo en el body
            path: window.location.pathname
        })
    })
        .then(response => {
            // La conexión fue exitosa (código HTTP 200-299)
            if (response.ok) {
                console.log("Analytics registrado en Azure DB con éxito.");
            } else {
                // La conexión llegó, pero el código Python falló (ej. error 500)
                console.error("Error al registrar analytics en Azure DB.");
            }
        })
        .catch(error => {
            // La conexión falló por completo (ej. API caída o CORS)
            console.error("No se pudo conectar al servicio de Azure Functions.", error);
        });
}

// Ejecutar la función cuando el DOM (la página) esté completamente cargado
document.addEventListener('DOMContentLoaded', registerVisitor);