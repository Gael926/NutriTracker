// POINT D'ENTRÉE - INITIALISATION
// Ce fichier charge tous les modules et initialise l'application

// INITIALISATION
document.addEventListener('DOMContentLoaded', () => {
    // Déterminer quelle page initialiser
    const isLoginPage = document.getElementById('login-form');
    const isAppPage = document.getElementById('btn-dicter');

    if (isLoginPage) {
        initLoginPage();
    } else if (isAppPage) {
        initAppPage();
    }

    // Enregistrer le Service Worker si disponible
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker enregistré:', registration.scope);
            })
            .catch(error => {
                console.log('Erreur Service Worker:', error);
            });
    }
});
