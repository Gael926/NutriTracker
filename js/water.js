// ========================================
// GESTION DE L'EAU - water.js
// ========================================

// Variable pour éviter les clics multiples rapides
let isUpdatingWater = false;

// Variables pour le modal d'édition
let modalWaterValue = 0;
let originalWaterValue = 0;

// Ouvre le modal d'édition de l'eau
function openWaterEditModal() {
    const currentWater = NutriState.stats?.eau?.consomme || 0;
    originalWaterValue = currentWater;
    modalWaterValue = currentWater;

    updateWaterModalDisplay();

    const modal = document.getElementById('modal-edit-water');
    modal.classList.remove('hidden');
}

// Ferme le modal d'édition de l'eau
function closeWaterEditModal() {
    const modal = document.getElementById('modal-edit-water');
    modal.classList.add('hidden');
}

// Ajuste la quantité d'eau dans le modal (local, pas d'appel API)
function adjustWaterInModal(delta) {
    modalWaterValue = Math.max(0, modalWaterValue + delta);
    updateWaterModalDisplay();
}

// Met à jour l'affichage dans le modal
function updateWaterModalDisplay() {
    const display = document.getElementById('water-edit-value');
    if (display) {
        display.textContent = modalWaterValue.toFixed(2) + 'L';
    }
}

// Sauvegarde les modifications d'eau (UN SEUL appel API)
async function saveWaterEdit() {
    const delta = modalWaterValue - originalWaterValue;

    // Si aucun changement, fermer le modal
    if (delta === 0) {
        closeWaterEditModal();
        return;
    }

    closeWaterEditModal();

    // Un seul appel avec la différence totale
    const action = delta > 0 ? 'add' : 'remove';
    const amount = Math.abs(delta);

    await updateWater(action, amount);
}

// Met à jour la quantité d'eau (ajout ou retrait)
async function updateWater(action, amount) {
    if (isUpdatingWater) return;
    isUpdatingWater = true;

    const user = getUser();
    if (!user?.email) {
        showNotification('Utilisateur non connecté');
        isUpdatingWater = false;
        return;
    }

    // Optimistic UI : mise à jour locale immédiate
    const delta = action === 'add' ? amount : -amount;
    NutriState.adjustWater(delta);
    updateEauSection(NutriState.stats);

    const sign = action === 'add' ? '+' : '-';
    showNotification(`${sign}${amount}L d'eau enregistré !`);

    try {
        const response = await fetchWithTimeout(CONFIG.endpoints.updateEau, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: user.email,
                action: action,
                amount: amount,
                date: getTodayISO()
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur n8n (HTTP ' + response.status + '):', errorText);
            throw new Error('Erreur serveur');
        }

        // Réconciliation en arrière-plan avec délai (Google Sheets a besoin de temps pour indexer)
        setTimeout(() => {
            loadHistory(true);
        }, 3000);

    } catch (error) {
        console.error('Erreur update eau:', error);
        // Rollback optimistic update
        NutriState.adjustWater(-delta);
        updateEauSection(NutriState.stats);
        const isTimeout = error.message.includes('Délai');
        showNotification(isTimeout ? 'Délai dépassé, réessayez' : 'Erreur lors de la mise à jour');
    } finally {
        isUpdatingWater = false;
    }
}
