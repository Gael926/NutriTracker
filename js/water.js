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
            console.error('❌ Erreur n8n (HTTP ' + response.status + '):', errorText);
            throw new Error('Erreur serveur');
        }

        // Rafraîchir l'historique pour mettre à jour l'affichage
        // On attend un peu plus longtemps (1s) pour que GSheet traite l'écriture
        setTimeout(() => {
            if (typeof loadHistory === 'function') {
                loadHistory();
            } else {
                console.warn('⚠️ loadHistory() n\'est pas disponible');
                window.location.reload();
            }
        }, 1000);

        const sign = action === 'add' ? '+' : '-';
        showNotification(`${sign}${amount}L d'eau enregistré !`);

    } catch (error) {
        console.error('❌ Erreur update eau:', error);
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
