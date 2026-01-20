// GESTION DE LA PAGE PRINCIPALE (app.html)

// Initialise la page principale
function initAppPage() {
    // Vérifier si on est sur app.html
    const btnDicter = document.getElementById('btn-dicter');
    if (!btnDicter) return;

    // Vérifier si l'utilisateur est connecté
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Afficher la date du jour
    const dateElement = document.getElementById('date-today');
    if (dateElement) {
        dateElement.textContent = formatDate(new Date());
    }

    // Charger et afficher les données
    loadHistory();

    // Attacher les événements
    btnDicter.addEventListener('click', handleDictation);

    // Bouton retour
    const btnBack = document.getElementById('btn-back');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            if (confirm('Voulez-vous retourner à la page d\'inscription ?')) {
                window.location.href = 'index.html';
            }
        });
    }

    // Modal settings
    initSettingsModal();
}
