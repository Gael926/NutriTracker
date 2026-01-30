// GESTION DE L'ÉDITION ET SUPPRESSION

// Ouvre la modale d'édition avec les données de l'élément
function openEditModal(itemId, nom, quantite, unite, kcal) {
    const modal = document.getElementById('modal-edit');
    if (!modal) return;

    // Remplir les champs
    document.getElementById('edit-item-id').value = itemId;
    document.getElementById('edit-nom').value = nom;
    document.getElementById('edit-quantite').value = quantite;
    document.getElementById('edit-unite').value = unite;
    document.getElementById('edit-kcal').value = kcal;

    // Stocker les valeurs initiales pour le recalcul proportionnel
    document.getElementById('edit-quantite-initiale').value = quantite;
    document.getElementById('edit-kcal-initial').value = kcal;

    // Afficher la modale
    modal.classList.remove('hidden');
}

// Ferme la modale d'édition
function closeEditModal() {
    const modal = document.getElementById('modal-edit');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Sauvegarde les modifications de l'élément
async function saveEditItem() {
    const btnSave = document.querySelector('#modal-edit .action-btn-primary');

    // Protection double-clic
    if (btnSave && btnSave.disabled) return;
    if (btnSave) btnSave.disabled = true;

    const itemId = document.getElementById('edit-item-id').value;
    const nom = document.getElementById('edit-nom').value.trim();
    const quantite = parseFloat(document.getElementById('edit-quantite').value) || 0;
    const unite = document.getElementById('edit-unite').value.trim();

    // Récupérer les valeurs initiales
    const quantiteInitiale = parseFloat(document.getElementById('edit-quantite-initiale').value) || 0;
    const kcalInitial = parseInt(document.getElementById('edit-kcal-initial').value, 10) || 0;

    // Recalculer les kcal proportionnellement si la quantité a changé
    let kcal;
    if (quantiteInitiale > 0 && quantite !== quantiteInitiale) {
        kcal = Math.round((quantite / quantiteInitiale) * kcalInitial);
    } else {
        kcal = parseInt(document.getElementById('edit-kcal').value, 10) || 0;
    }

    if (!nom) {
        showNotification('Le nom est requis');
        if (btnSave) btnSave.disabled = false;
        return;
    }

    try {
        showNotification('Mise à jour en cours...');

        const response = await fetchWithTimeout(CONFIG.endpoints.updateItem, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: itemId, // Backend détectera si UUID ou row_number
                aliment: nom,
                quantite: quantite,
                unite: unite,
                kcal: kcal
            })
        });

        if (!response.ok) {
            throw new Error('Erreur serveur');
        }

        showNotification('Élément modifié !');
        closeEditModal();

        // Optimistic UI : mise à jour locale immédiate
        NutriState.updateItem(itemId, {
            'Aliment (texte)': nom,
            Quantite: quantite,
            'Unite (g, portion, etc.)': unite,
            Kcal: kcal
        });
        renderHistory(NutriState.items, NutriState.stats);

        // Réconciliation en arrière-plan
        loadHistory(true);

    } catch (error) {
        console.error('Erreur modification:', error);
        const isTimeout = error.message.includes('Délai');
        showNotification(isTimeout ? 'Délai dépassé, réessayez' : 'Erreur lors de la modification');
    } finally {
        if (btnSave) btnSave.disabled = false;
    }
}

// Supprime un élément de l'historique
async function deleteItem(itemId) {
    if (!confirm('Supprimer cet élément ?')) {
        return;
    }

    try {
        showNotification('Suppression en cours...');

        const response = await fetchWithTimeout(CONFIG.endpoints.deleteItem, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: itemId
            })
        });

        if (!response.ok) {
            throw new Error('Erreur serveur');
        }

        showNotification('Élément supprimé !');

        // Optimistic UI : suppression locale immédiate
        NutriState.removeItem(itemId);
        renderHistory(NutriState.items, NutriState.stats);

        // Réconciliation en arrière-plan
        loadHistory(true);

    } catch (error) {
        console.error('Erreur suppression:', error);
        const isTimeout = error.message.includes('Délai');
        showNotification(isTimeout ? 'Délai dépassé, réessayez' : 'Erreur lors de la suppression');
    }
}

// Supprime un élément depuis la modale d'édition
async function deleteItemFromModal() {
    const itemId = document.getElementById('edit-item-id').value;

    if (!itemId) {
        showNotification('Erreur: élément non identifié');
        return;
    }

    closeEditModal();
    await deleteItem(itemId);
}
