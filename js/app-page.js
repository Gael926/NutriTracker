// GESTION DE LA PAGE PRINCIPALE (app.html)

// Synchronise les données utilisateur (objectif, poids) depuis la DB GSheet
async function syncUserFromDB() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.email) return;

    try {
        const response = await fetch(CONFIG.endpoints.inscription, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: user.email,
                phone_number: '',
                check_only: true
            })
        });

        if (!response.ok) return;

        const data = await response.json();

        // Mettre à jour localStorage avec les valeurs de la DB
        let updated = false;

        if (data.Objectif_Kcal && data.Objectif_Kcal !== 0) {
            const dbObjectif = parseInt(data.Objectif_Kcal, 10);
            if (dbObjectif !== user.objectif) {
                console.log(`🔄 Sync objectif: ${user.objectif} → ${dbObjectif}`);
                user.objectif = dbObjectif;
                updated = true;
            }
        }

        if (data.Poids && data.Poids !== 0) {
            const dbPoids = parseFloat(data.Poids);
            if (dbPoids !== user.poids) {
                console.log(`🔄 Sync poids: ${user.poids} → ${dbPoids}`);
                user.poids = dbPoids;
                updated = true;
            }
        }

        if (updated) {
            localStorage.setItem('user', JSON.stringify(user));
            console.log('✅ localStorage synchronisé avec la DB');
        }
    } catch (error) {
        console.warn('Sync DB ignorée (réseau indisponible):', error);
    }
}

// Initialise la page principale
async function initAppPage() {
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

    // Synchroniser les données utilisateur depuis la DB avant de charger l'historique
    await syncUserFromDB();

    // Charger et afficher les données (utilise les valeurs à jour de localStorage)
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
