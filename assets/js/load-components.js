/* ========================================
   LOAD-COMPONENTS.JS
   Carga componentes HTML reutilizables
======================================== */

async function loadComponent(selector, filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const html = await response.text();
        document.querySelector(selector).innerHTML = html;
    } catch (error) {
        console.error(`Error loading component ${filePath}:`, error);
    }
}

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Cargar footer (la ruta depende de dónde esté el HTML)
    // Detectar automáticamente la profundidad
    const isInPages = window.location.pathname.includes('/pages/');
    const isInProjectsSubfolder = window.location.pathname.includes('/pages/projects/');

    let basePath = '';
    if (isInProjectsSubfolder) {
        basePath = '../../';
    } else if (isInPages) {
        basePath = '../';
    }

    // Cargar nav y footer
    loadComponent('footer', `${basePath}components/footer.html`);
    //loadComponent('nav', `${basePath}components/navbar.html`);

});
