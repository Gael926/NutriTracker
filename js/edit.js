// GESTION DE L'ÉDITION ET SUPPRESSION

// Ouvre la modale d'édition avec les données de l'élément
function openEditModal(rowNumber, nom, quantite, unite, kcal) {
    const modal = document.getElementById('modal-edit');
    if (!modal) return;

    // Remplir les champs
    document.getElementById('edit-row-number').value = rowNumber;
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
    const rowNumber = document.getElementById('edit-row-number').value;
    const nom = document.getElementById('edit-nom').value.trim();
    const quantite = parseFloat(document.getElementById('edit-quantite').value) || 0;
    const unite = document.getElementById('edit-unite').value.trim();

    // Récupérer les valeurs initiales
    const quantiteInitiale = parseFloat(document.getElementById('edit-quantite-initiale').value) || 0;
    const kcalInitial = parseInt(document.getElementById('edit-kcal-initial').value, 10) || 0;

    // Recalculer les kcal proportionnellement si la quantité a changé
    let kcal;
    if (quantiteInitiale > 0 && quantite !== quantiteInitiale) {
        // Calcul proportionnel : (nouvelle quantité / ancienne quantité) * anciennes kcal
        kcal = Math.round((quantite / quantiteInitiale) * kcalInitial);
        console.log(`📊 Recalcul kcal: ${quantiteInitiale} → ${quantite} = ${kcalInitial} → ${kcal} kcal`);
    } else {
        // Pas de changement de quantité, utiliser la valeur saisie
        kcal = parseInt(document.getElementById('edit-kcal').value, 10) || 0;
    }

    if (!nom) {
        showNotification('❌ Le nom est requis');
        return;
    }

    try {
        showNotification('⏳ Mise à jour en cours...');

        const response = await fetch(CONFIG.endpoints.updateItem, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                row_number: parseInt(rowNumber, 10),
                aliment: nom,
                quantite: quantite,
                unite: unite,
                kcal: kcal
            })
        });

        if (!response.ok) {
            throw new Error('Erreur serveur');
        }

        showNotification('✅ Élément modifié !');
        closeEditModal();

        // Rafraîchir l'historique
        setTimeout(() => {
            loadHistory();
        }, 300);

    } catch (error) {
        console.error('Erreur modification:', error);
        showNotification('❌ Erreur lors de la modification');
    }
}

// Supprime un élément de l'historique
async function deleteItem(rowNumber) {
    if (!confirm('Supprimer cet élément ?')) {
        return;
    }

    try {
        showNotification('⏳ Suppression en cours...');

        const response = await fetch(CONFIG.endpoints.deleteItem, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                row_number: parseInt(rowNumber, 10)
            })
        });

        if (!response.ok) {
            throw new Error('Erreur serveur');
        }

        showNotification('✅ Élément supprimé !');

        // Rafraîchir l'historique
        setTimeout(() => {
            loadHistory();
        }, 300);

    } catch (error) {
        console.error('Erreur suppression:', error);
        showNotification('❌ Erreur lors de la suppression');
    }
}

// Supprime un élément depuis la modale d'édition
async function deleteItemFromModal() {
    const rowNumber = document.getElementById('edit-row-number').value;

    if (!rowNumber) {
        showNotification('❌ Erreur: élément non identifié');
        return;
    }

    // Fermer la modale d'abord
    closeEditModal();

    // Appeler la fonction de suppression existante
    await deleteItem(parseInt(rowNumber, 10));
}
