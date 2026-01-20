// GESTION DU MODAL DES PARAMÈTRES

// Initialise le modal des paramètres
function initSettingsModal() {
    const btnSettings = document.getElementById('btn-settings');
    const modal = document.getElementById('modal-settings');
    const modalClose = document.getElementById('modal-close');
    const btnLogout = document.getElementById('btn-logout');
    const btnClearHistory = document.getElementById('btn-clear-history');

    console.log('🔧 initSettingsModal - modal:', modal, 'btnSettings:', btnSettings);

    if (!modal) {
        console.error('❌ Modal settings non trouvé');
        return;
    }

    // Récupérer l'overlay spécifique à ce modal
    const modalOverlay = modal.querySelector('.modal-overlay');

    // Ouvrir le modal
    if (btnSettings) {
        btnSettings.addEventListener('click', () => {
            console.log('🔧 Bouton settings cliqué');
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            document.getElementById('setting-email').textContent = user.email || '-';
            // ⭐ Afficher le numéro de téléphone formaté
            document.getElementById('setting-phone').textContent = formatPhoneDisplay(user.phone_number);

            // 🆕 Pré-remplir les inputs modifiables
            const inputObjectif = document.getElementById('input-objectif');
            const inputPoids = document.getElementById('input-poids');

            if (inputObjectif) inputObjectif.value = user.objectif || 2500;
            if (inputPoids) inputPoids.value = user.poids || 70;

            modal.classList.remove('hidden');
        });
    }

    // 🆕 Sauvegarder les modifications
    const btnSave = document.getElementById('btn-save-settings');
    if (btnSave) {
        btnSave.addEventListener('click', async () => {
            const newObjectif = parseInt(document.getElementById('input-objectif').value, 10);
            const newPoids = parseFloat(document.getElementById('input-poids').value);

            // Validation simple
            if (isNaN(newObjectif) || newObjectif < 1000 || newObjectif > 5000) {
                showNotification('❌ L\'objectif doit être entre 1000 et 5000 kcal');
                return;
            }

            if (isNaN(newPoids) || newPoids < 30 || newPoids > 300) {
                showNotification('❌ Le poids doit être entre 30 et 300 kg');
                return;
            }

            // Récupérer l'utilisateur actuel
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            showNotification('⏳ Mise à jour en cours...');

            try {
                // Appeler le workflow n8n pour synchroniser avec le GSheet
                const response = await fetch(CONFIG.endpoints.updateUserSettings, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: user.email,
                        phone_number: user.phone_number,
                        objectif: newObjectif,
                        poids: newPoids
                    })
                });

                if (!response.ok) {
                    throw new Error('Erreur serveur');
                }

                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.message || 'Erreur lors de la mise à jour');
                }

                // Mettre à jour le localStorage après confirmation du serveur
                user.objectif = newObjectif;
                user.poids = newPoids;
                localStorage.setItem('user', JSON.stringify(user));

                showNotification('✅ Paramètres enregistrés !');

                // Rafraîchir l'affichage des calories
                if (typeof loadHistory === 'function') {
                    await loadHistory();
                }

                modal.classList.add('hidden');

            } catch (error) {
                console.error('Erreur mise à jour paramètres:', error);
                showNotification('❌ Erreur lors de la synchronisation');
            }
        });
    }

    // Fermer le modal
    modalClose?.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    modalOverlay?.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // Déconnexion
    btnLogout?.addEventListener('click', () => {
        if (confirm('Voulez-vous vraiment vous déconnecter ? Cela supprimera toutes vos données locales.')) {
            localStorage.removeItem('user');
            localStorage.removeItem('historique');
            window.location.href = 'index.html';
        }
    });

    // Effacer l'historique du jour
    btnClearHistory?.addEventListener('click', async () => {
        if (confirm('Voulez-vous effacer l\'historique du jour ?')) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const today = getTodayISO();

            showNotification('⏳ Suppression en cours...');

            try {
                const response = await fetch(CONFIG.endpoints.clearHistory, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: user.email,
                        date: today
                    })
                });

                if (!response.ok) {
                    throw new Error('Erreur serveur');
                }

                // Rafraîchir l'historique depuis le serveur
                await loadHistory();
                modal.classList.add('hidden');
                showNotification('✅ Historique du jour effacé !');

            } catch (error) {
                console.error('Erreur suppression historique:', error);
                showNotification('❌ Erreur lors de la suppression');
            }
        }
    });
}
