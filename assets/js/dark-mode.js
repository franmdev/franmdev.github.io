// Dark mode toggle - Sincronizado con SVG Icons PaperMod
const html = document.documentElement;


// Aplica el tema guardado al <html> inmediatamente (antes de que el nav cargue)
// Así no hay flash de tema incorrecto mientras load-components inyecta el navbar
(function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    // Modo light por defecto
    //const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
})();


// Vincula el botón toggle — se llama en DOMContentLoaded Y en componentLoaded
// dataset.bound evita que se registre el evento click más de una vez
function bindToggle() {
    const toggleBtn = document.querySelector('.theme-toggle');
    const moon = document.getElementById('moon');
    const sun = document.getElementById('sun');


    if (!toggleBtn || !moon || !sun) return;
    if (toggleBtn.dataset.bound) return;
    toggleBtn.dataset.bound = 'true';


    // Aplica el estado visual de los iconos al bindear
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
        moon.style.display = 'none';
        sun.style.display = 'block';
    } else {
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
}


// Intento 1: nav hardcodeado (por si acaso)
document.addEventListener('DOMContentLoaded', bindToggle);

// Intento 2: después de que load-components.js inyecte el navbar
document.addEventListener('componentLoaded', bindToggle);