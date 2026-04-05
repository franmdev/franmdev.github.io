// Mobile menu toggle
function bindMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!menuBtn || !mobileMenu) return;
    if (menuBtn.dataset.bound) return;
    menuBtn.dataset.bound = 'true';

    menuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        menuBtn.classList.toggle('active');
    });

    // Cierra el menú cuando haces click en un link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('hidden');
            menuBtn.classList.remove('active');
        });
    });
}

// Intento 1: nav hardcodeado (por si acaso)
document.addEventListener('DOMContentLoaded', bindMobileMenu);

// Intento 2: después de que load-components.js inyecte el navbar
document.addEventListener('componentLoaded', bindMobileMenu);