// ============================================================
// SNAPSHOTS JOURNALIERS - SOURCE DE VÉRITÉ
// ⚠️ Les objectifs sont maintenant centralisés dans Google Sheets (onglet Journaliers)
// ⚠️ Ce module utilise EXCLUSIVEMENT les données de l'API n8n
// ============================================================

// ============================================================
// GESTION DES STATS NUTRITIONNELLES
// ============================================================

// Met à jour les stats nutritionnelles à partir des données fournies
function updateTotalFromData(data, stats = null) {
    // ✅ SOURCE DE VÉRITÉ = API n8n (onglet Journaliers via snapshots)
    // Si l'API ne renvoie pas de stats, c'est une erreur critique
    if (!stats || !stats.objectifs || !stats.consomme) {
        console.error('❌ ERREUR CRITIQUE: L\'API n8n n\'a pas renvoyé les stats complètes');
        showNotification('Erreur de chargement des données', 'error');
        return;
    }

    // Utiliser EXCLUSIVEMENT les données de l'API
    const objectifs = {
        kcal: stats.objectifs.kcal,
        proteines: stats.objectifs.proteines,
        glucides: stats.objectifs.glucides,
        lipides: stats.objectifs.lipides
    };

    const consommations = {
        kcal: stats.consomme.kcal,
        proteines: stats.consomme.proteines,
        glucides: stats.consomme.glucides,
        lipides: stats.consomme.lipides
    };

    // Calculer les pourcentages (l'API ne les recalcule pas toujours correctement)
    const pourcentages = {
        kcal: Math.round((consommations.kcal / objectifs.kcal) * 100) || 0,
        proteines: Math.round((consommations.proteines / objectifs.proteines) * 100) || 0,
        glucides: Math.round((consommations.glucides / objectifs.glucides) * 100) || 0,
        lipides: Math.round((consommations.lipides / objectifs.lipides) * 100) || 0
    };

    // Utiliser les ratios de l'API (calculés côté backend)
    const ratios = stats.ratios || {
        proteines: 0,
        glucides: 0,
        lipides: 0
    };

    // Construire l'objet stats final
    const finalStats = {
        objectifs: objectifs,
        consomme: consommations,
        pourcentages: pourcentages,
        ratios: ratios
    };

    console.log('📊 Stats chargées depuis l\'API:', {
        snapshotUsed: stats.snapshotUsed || false,
        objectifs: objectifs
    });

    updateNutritionDisplay(finalStats);
}

// Met à jour l'affichage de toutes les barres de nutrition
function updateNutritionDisplay(stats) {
    const { objectifs, consomme, pourcentages, ratios } = stats;

    // === CALORIES ===
    const totalElement = document.getElementById('total-kcal');
    const pourcentageElement = document.getElementById('pourcentage');
    const barreElement = document.getElementById('barre-progres');

    if (totalElement) {
        totalElement.textContent = `${consomme.kcal} / ${objectifs.kcal} kcal`;
    }

    if (pourcentageElement) {
        pourcentageElement.textContent = `${pourcentages.kcal}%`;
    }

    if (barreElement) {
        barreElement.style.width = `${Math.min(Math.max(pourcentages.kcal, 0), 100)}%`;
        barreElement.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-red-500');

        if (pourcentages.kcal < 80) {
            barreElement.classList.add('bg-green-500');
        } else if (pourcentages.kcal <= 100) {
            barreElement.classList.add('bg-yellow-500');
        } else {
            barreElement.classList.add('bg-red-500');
        }
    }

    // === PROTÉINES ===
    updateMacroBar('proteines', consomme.proteines, objectifs.proteines, pourcentages.proteines, ratios.proteines);

    // === GLUCIDES ===
    updateMacroBar('glucides', consomme.glucides, objectifs.glucides, pourcentages.glucides, ratios.glucides);

    // === LIPIDES ===
    updateMacroBar('lipides', consomme.lipides, objectifs.lipides, pourcentages.lipides, ratios.lipides);
}

// Met à jour une barre de macro spécifique
function updateMacroBar(macro, consomme, objectif, pourcentage, ratio) {
    const totalEl = document.getElementById(`total-${macro}`);
    const barreEl = document.getElementById(`barre-${macro}`);
    const pourcentageEl = document.getElementById(`pourcentage-${macro}`);
    const ratioEl = document.getElementById(`ratio-${macro}`);

    if (totalEl) {
        totalEl.textContent = `${consomme || 0}g / ${objectif || 0}g`;
    }

    if (barreEl) {
        barreEl.style.width = `${Math.min(Math.max(pourcentage || 0, 0), 100)}%`;
    }

    if (pourcentageEl) {
        pourcentageEl.textContent = `${pourcentage || 0}%`;
    }

    if (ratioEl) {
        ratioEl.textContent = ratio ? `(${ratio}%)` : '';
    }
}