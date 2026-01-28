// GESTION DU MODAL DES PARAMÈTRES

// Initialise le modal des paramètres
function initSettingsModal() {
    const btnSettings = document.getElementById('btn-settings');
    const modal = document.getElementById('modal-settings');
    const modalClose = document.getElementById('modal-close');
    const btnLogout = document.getElementById('btn-logout');
    const btnClearHistory = document.getElementById('btn-clear-history');

    if (!modal) return;

    // Récupérer l'overlay spécifique à ce modal
    const modalOverlay = modal.querySelector('.modal-overlay');

    // Ouvrir le modal
    if (btnSettings) {
        btnSettings.addEventListener('click', () => {
            const user = getUser();

            document.getElementById('setting-email').textContent = user.email || '-';
            document.getElementById('setting-phone').textContent = formatPhoneDisplay(user.phone_number);

            const inputObjectif = document.getElementById('input-objectif');
            const inputPoids = document.getElementById('input-poids');

            if (inputObjectif) inputObjectif.value = user.objectif || 2500;
            if (inputPoids) inputPoids.value = user.poids || 70;

            modal.classList.remove('hidden');
        });
    }

    // Initialiser les boutons +/- personnalisés
    document.querySelectorAll('.spin-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const step = parseFloat(btn.dataset.step);
            const input = document.getElementById(targetId);

            if (input) {
                const currentValue = parseFloat(input.value) || 0;
                const min = parseFloat(input.min) || -Infinity;
                const max = parseFloat(input.max) || Infinity;
                const newValue = Math.min(max, Math.max(min, currentValue + step));

                input.value = Math.round(newValue * 10) / 10;
            }
        });
    });

    // Sauvegarder les modifications
    const btnSave = document.getElementById('btn-save-settings');
    if (btnSave) {
        btnSave.addEventListener('click', async () => {
            // Protection double-clic
            if (btnSave.disabled) return;

            const newObjectif = parseInt(document.getElementById('input-objectif').value, 10);
            const newPoids = parseFloat(document.getElementById('input-poids').value);

            if (isNaN(newObjectif) || newObjectif < 1000 || newObjectif > 5000) {
                showNotification('L\'objectif doit être entre 1000 et 5000 kcal');
                return;
            }

            if (isNaN(newPoids) || newPoids < 30 || newPoids > 300) {
                showNotification('Le poids doit être entre 30 et 300 kg');
                return;
            }

            const user = getUser();

            btnSave.disabled = true;
            showNotification('Mise à jour en cours...');

            try {
                const response = await fetchWithTimeout(CONFIG.endpoints.updateUserSettings, {
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

                showNotification('Paramètres enregistrés !');

                // Upsert snapshot avec nouveaux objectifs puis rafraîchir
                await upsertSnapshot(user.email, getTodayISO());

                if (typeof loadHistory === 'function') {
                    await loadHistory();
                }

                modal.classList.add('hidden');

            } catch (error) {
                console.error('Erreur mise à jour paramètres:', error);
                const isTimeout = error.message.includes('Délai');
                showNotification(isTimeout ? 'Délai dépassé, réessayez' : 'Erreur lors de la synchronisation');
            } finally {
                btnSave.disabled = false;
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
            const user = getUser();
            const today = getTodayISO();

            // Protection double-clic
            btnClearHistory.disabled = true;
            showNotification('Suppression en cours...');

            try {
                const response = await fetchWithTimeout(CONFIG.endpoints.clearHistory, {
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

                // Upsert snapshot après suppression puis rafraîchir
                await upsertSnapshot(user.email, today);
                await loadHistory();
                modal.classList.add('hidden');
                showNotification('Historique du jour effacé !');

            } catch (error) {
                console.error('Erreur suppression historique:', error);
                const isTimeout = error.message.includes('Délai');
                showNotification(isTimeout ? 'Délai dépassé, réessayez' : 'Erreur lors de la suppression');
            } finally {
                btnClearHistory.disabled = false;
            }
        }
    });
}
