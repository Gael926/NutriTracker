// ============================================================
// MODULE PARTAGÉ : CALCUL DES MACROS 
// ⚠️ IMPORTANT: Si vous modifiez cette logique, synchronisez avec le workflow n8n "SMS Dîner Quotidien Twilio"
// ============================================================

function calculerObjectifsMacros(objectifKcal, poids) {
    const RATIO_PROTEINES_PAR_KG = 1.8;
    const RATIO_GLUCIDES = 0.65;
    const RATIO_LIPIDES = 0.35;
    const KCAL_PAR_G_PROTEINES = 4;
    const KCAL_PAR_G_GLUCIDES = 4;
    const KCAL_PAR_G_LIPIDES = 9;

    const objProteines = Math.round(poids * RATIO_PROTEINES_PAR_KG);
    const kcalProteines = objProteines * KCAL_PAR_G_PROTEINES;
    const kcalRestantes = objectifKcal - kcalProteines;
    const objGlucides = Math.round((kcalRestantes * RATIO_GLUCIDES) / KCAL_PAR_G_GLUCIDES);
    const objLipides = Math.round((kcalRestantes * RATIO_LIPIDES) / KCAL_PAR_G_LIPIDES);

    const ratioProteines = Math.round((kcalProteines / objectifKcal) * 100);
    const ratioGlucides = Math.round(((objGlucides * KCAL_PAR_G_GLUCIDES) / objectifKcal) * 100);
    const ratioLipides = Math.round(((objLipides * KCAL_PAR_G_LIPIDES) / objectifKcal) * 100);

    return {
        proteines: objProteines,
        glucides: objGlucides,
        lipides: objLipides,
        ratios: {
            proteines: ratioProteines,
            glucides: ratioGlucides,
            lipides: ratioLipides
        }
    };
}

// ============================================================
// GESTION DES STATS NUTRITIONNELLES
// ============================================================

// Met à jour les stats nutritionnelles à partir des données fournies
function updateTotalFromData(data, stats = null) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Récupérer les données utilisateur pour les calculs
    const objectif = user.objectif || 2500;
    const poids = user.poids || 70;  // Poids en kg, défaut 70kg

    // Si on a des données de consommation de l'API, les utiliser
    let totalKcal = 0;
    let consommations = { kcal: 0, proteines: 0, glucides: 0, lipides: 0 };

    if (stats && stats.consomme) {
        consommations = stats.consomme;
        totalKcal = stats.consomme.kcal;
    } else {
        // Fallback: calculer les calories à partir des items localement
        totalKcal = data.reduce((sum, r) => {
            const typeValue = r['Type (REPAS / SPORT)'] || r.Type || '';
            const isSport = typeValue.toUpperCase() === 'SPORT';
            const isEau = typeValue.toUpperCase() === 'EAU';
            const kcal = parseInt(r.Kcal || 0, 10);

            if (isSport || isEau) return sum;
            return sum + kcal;
        }, 0);
        consommations.kcal = totalKcal;
    }

    const pourcentage = Math.round((totalKcal / objectif) * 100);

    // ✅ CALCUL "INTELLIGENT" DES OBJECTIFS (Source de vérité = Module Partagé)
    const objectifs = calculerObjectifsMacros(objectif, poids);

    // Construire l'objet stats final
    const finalStats = {
        objectifs: {
            kcal: objectif,
            proteines: objectifs.proteines,
            glucides: objectifs.glucides,
            lipides: objectifs.lipides
        },
        consomme: consommations,
        pourcentages: {
            kcal: pourcentage,
            proteines: Math.round((consommations.proteines / objectifs.proteines) * 100) || 0,
            glucides: Math.round((consommations.glucides / objectifs.glucides) * 100) || 0,
            lipides: Math.round((consommations.lipides / objectifs.lipides) * 100) || 0
        },
        ratios: objectifs.ratios
    };

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