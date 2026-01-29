// ========================================
// GESTION DE L'EAU - water.js
// ========================================

// Variable pour éviter les clics multiples rapides
let isUpdatingWater = false;

// Initialise les boutons d'eau
function initWaterControls() {
    const btnPlus = document.getElementById('btn-eau-plus');
    const btnMinus = document.getElementById('btn-eau-minus');

    if (btnPlus) {
        btnPlus.addEventListener('click', () => updateWater('add', 0.25));
    }
    if (btnMinus) {
        btnMinus.addEventListener('click', () => updateWater('remove', 0.25));
    }
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

    // Feedback visuel immédiat
    const btnPlus = document.getElementById('btn-eau-plus');
    const btnMinus = document.getElementById('btn-eau-minus');
    if (action === 'add' && btnPlus) btnPlus.classList.add('loading');
    if (action === 'remove' && btnMinus) btnMinus.classList.add('loading');

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

        // Réconciliation en arrière-plan
        loadHistory(true);

    } catch (error) {
        console.error('Erreur update eau:', error);
        // Rollback optimistic update
        NutriState.adjustWater(-delta);
        updateEauSection(NutriState.stats);
        const isTimeout = error.message.includes('Délai');
        showNotification(isTimeout ? 'Délai dépassé, réessayez' : 'Erreur lors de la mise à jour');
    } finally {
        isUpdatingWater = false;
        if (btnPlus) btnPlus.classList.remove('loading');
        if (btnMinus) btnMinus.classList.remove('loading');
    }
}

// Appeler l'initialisation au chargement
document.addEventListener('DOMContentLoaded', initWaterControls);
