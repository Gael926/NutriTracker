// GESTION DES STATS NUTRITIONNELLES

// Met à jour les stats nutritionnelles à partir des données fournies
function updateTotalFromData(data, stats = null) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Si on a des stats de l'API, les utiliser directement
    if (stats && stats.consomme && stats.objectifs) {
        console.log('📊 Mise à jour avec stats API:', stats);
        updateNutritionDisplay(stats);
        return;
    }

    // Fallback: calculer les calories à partir des items (ancien comportement)
    // Note: Le sport n'est PAS compté ici car il modifie l'objectif, pas le consommé
    const totalKcal = data.reduce((sum, r) => {
        const typeValue = r['Type (REPAS / SPORT)'] || r.Type || '';
        const isSport = typeValue.toUpperCase() === 'SPORT';
        const isEau = typeValue.toUpperCase() === 'EAU';
        const kcal = parseInt(r.Kcal || 0, 10);

        // Sport et eau ne comptent pas dans les calories consommées
        if (isSport || isEau) {
            return sum;
        }
        return sum + kcal;
    }, 0);

    const objectif = user.objectif || 2500;
    const poids = user.poids || 70;  // Poids en kg, défaut 70kg
    const pourcentage = Math.round((totalKcal / objectif) * 100);

    // Calcul des objectifs macros basés sur le poids (même logique que n8n)
    const objProteines = Math.round(poids * 1.8);
    const kcalProteines = objProteines * 4;
    const kcalRestantes = objectif - kcalProteines;
    const objGlucides = Math.round((kcalRestantes * 0.70) / 4);
    const objLipides = Math.round((kcalRestantes * 0.30) / 9);

    // Calculer les ratios dynamiquement basés sur les objectifs réels
    const ratioProteines = Math.round((kcalProteines / objectif) * 100);
    const ratioGlucides = Math.round(((objGlucides * 4) / objectif) * 100);
    const ratioLipides = Math.round(((objLipides * 9) / objectif) * 100);

    // Construire un objet stats simulé pour le fallback
    const fallbackStats = {
        objectifs: { kcal: objectif, proteines: objProteines, glucides: objGlucides, lipides: objLipides },
        consomme: { kcal: totalKcal, proteines: 0, glucides: 0, lipides: 0 },
        pourcentages: { kcal: pourcentage, proteines: 0, glucides: 0, lipides: 0 },
        ratios: { proteines: ratioProteines, glucides: ratioGlucides, lipides: ratioLipides }
    };

    updateNutritionDisplay(fallbackStats);
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
