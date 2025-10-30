/* ========================================
   TAILWIND-CONFIG.JS
   Configuración centralizada de Tailwind
======================================== */

window.tailwindConfig = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'pm-bg': '#1d1e20',
                'pm-entry': '#2e2e33',
                'pm-primary': '#dadadb',
                'pm-secondary': '#9b9c9d',
                'pm-tertiary': '#414244',
                'pm-accent': '#ffffff',
                'pm-border': '#333333',
                'pm-light-bg': '#f8f4f4',
                'pm-light-entry': '#f8f4f4',
                'pm-light-primary': '#1e1e1e',
                'pm-light-secondary': '#6c6c6c',
                'pm-light-tertiary': '#f8f4f4',
                'pm-light-accent': '#ffffff',
                'pm-light-border': '#eeeeee',
            },
            fontFamily: {
                'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'sans-serif'],
            },
        }
    }
};

// Aplicar configuración a Tailwind
if (window.tailwind) {
    tailwind.config = window.tailwindConfig;
}
