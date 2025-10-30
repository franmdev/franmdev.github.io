// Dark mode toggle - Sincronizado con SVG Icons PaperMod
document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement;
    const toggleBtn = document.querySelector('.theme-toggle');
    const moon = document.getElementById('moon');
    const sun = document.getElementById('sun');

    if (!toggleBtn || !moon || !sun) return;

    // Lee preferencia guardada o usa 'dark' por defecto
    const savedTheme = localStorage.getItem('theme') || 'dark';
    // Modo light por defecto
    //const savedTheme = localStorage.getItem('theme') || 'light';

    // Aplica el tema inicial
    if (savedTheme === 'dark') {
        html.classList.add('dark');
        moon.style.display = 'none';
        sun.style.display = 'block';
    } else {
        html.classList.remove('dark');
        moon.style.display = 'block';
        sun.style.display = 'none';
    }

    // Toggle al hacer click
    toggleBtn.addEventListener('click', () => {
        const isDark = html.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';

        if (newTheme === 'dark') {
            html.classList.add('dark');
            moon.style.display = 'none';
            sun.style.display = 'block';
        } else {
            html.classList.remove('dark');
            moon.style.display = 'block';
            sun.style.display = 'none';
        }

        localStorage.setItem('theme', newTheme);
    });
});
