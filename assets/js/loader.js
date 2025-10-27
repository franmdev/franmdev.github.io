// assets/js/loader.js
document.addEventListener('DOMContentLoaded', () => {
    const loadComponent = (selector, url) => {
        const element = document.querySelector(selector);
        if (element) {
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status} loading ${url}`);
                    }
                    return response.text();
                })
                .then(html => {
                    element.innerHTML = html;
                    // Dispara un evento custom después de cargar el componente (útil para otros scripts)
                    const event = new CustomEvent('componentLoaded', { detail: { selector: selector } });
                    document.dispatchEvent(event);
                })
                .catch(error => console.error(`Error loading component ${url}:`, error));
        } else {
            // console.warn(`Placeholder element not found for selector: ${selector}`);
        }
    };

    // Cargar Navbar y Footer en sus placeholders
    loadComponent('#navbar-placeholder', '/components/navbar.html');
    loadComponent('#footer-placeholder', '/components/footer.html');

    // Puedes agregar más componentes aquí si los necesitas
    // loadComponent('#algun-otro-placeholder', '/components/otro-componente.html');
});