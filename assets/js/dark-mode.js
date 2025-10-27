// Dark mode toggle - Funciona perfectamente
document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement;
    const toggleBtn = document.getElementById('dark-toggle');

    if (!toggleBtn) return;

    // Lee preferencia guardada o usa 'dark' por defecto
    const savedTheme = localStorage.getItem('theme') || 'dark';

    // Aplica el tema inicial
    if (savedTheme === 'dark') {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }

    // Actualiza el icono inicial
    updateIcon(savedTheme);

    // Toggle al hacer click
    toggleBtn.addEventListener('click', () => {
        const isDark = html.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';

        if (newTheme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }

        localStorage.setItem('theme', newTheme);
        updateIcon(newTheme);
    });

    function updateIcon(theme) {
        const darkIcon = toggleBtn.querySelector('.dark-icon');
        const lightIcon = toggleBtn.querySelector('.light-icon');

        if (!darkIcon || !lightIcon) return;

        if (theme === 'dark') {
            // Dark mode activo: muestra sol (para cambiar a light)
            darkIcon.classList.remove('hidden');
            lightIcon.classList.add('hidden');
        } else {
            // Light mode activo: muestra luna (para cambiar a dark)
            darkIcon.classList.add('hidden');
            lightIcon.classList.remove('hidden');
        }
    }
});
