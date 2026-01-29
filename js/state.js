// ========================================
// GESTION D'ÉTAT LOCAL - state.js
// Optimistic UI : mise à jour instantanée, synchronisation en arrière-plan
// ========================================

const NutriState = {
    items: [],
    stats: null,
    initialized: false,
    _reconcileTimer: null,

    // Charger les données depuis la réponse API (réconciliation)
    loadFromAPI(data) {
        if (data && data.items) {
            this.items = Array.isArray(data.items) ? data.items : [];
        } else {
            this.items = [];
        }
        this.stats = (data && data.stats) ? JSON.parse(JSON.stringify(data.stats)) : null;
        this.initialized = true;
    },

    // Ajouter des items (après réponse dictée AI)
    addItems(newItems) {
        if (!Array.isArray(newItems)) return;
        this.items = [...newItems, ...this.items];
        this._recalcMacros();
    },

    // Supprimer un item par row_number
    removeItem(rowNumber) {
        const rn = parseInt(rowNumber, 10);
        this.items = this.items.filter(item => (item.row_number || 0) !== rn);
        this._recalcMacros();
    },

    // Modifier un item par row_number
    updateItem(rowNumber, updates) {
        const rn = parseInt(rowNumber, 10);
        this.items = this.items.map(item => {
            if ((item.row_number || 0) === rn) {
                return { ...item, ...updates };
            }
            return item;
        });
        this._recalcMacros();
    },

    // Ajuster l'eau (delta positif = ajout, négatif = retrait)
    adjustWater(delta) {
        if (!this.stats || !this.stats.eau) return;
        const eau = this.stats.eau;
        eau.consomme = Math.max(0, parseFloat((eau.consomme + delta).toFixed(2)));
        eau.restant = Math.max(0, parseFloat((eau.objectif - eau.consomme).toFixed(2)));
        eau.pourcentage = eau.objectif > 0
            ? Math.min(100, Math.round((eau.consomme / eau.objectif) * 100))
            : 0;
    },

    // Vider tous les items (clear history)
    clearItems() {
        this.items = [];
        if (this.stats) {
            this.stats.consomme = { kcal: 0, proteines: 0, glucides: 0, lipides: 0 };
            this.stats.pourcentages = { kcal: 0, proteines: 0, glucides: 0, lipides: 0 };
            this.stats.restant = this.stats.objectifs
                ? { ...this.stats.objectifs }
                : { kcal: 0, proteines: 0, glucides: 0, lipides: 0 };
            if (this.stats.eau) {
                this.stats.eau.consomme = 0;
                this.stats.eau.restant = this.stats.eau.objectif || 2;
                this.stats.eau.pourcentage = 0;
            }
            this.stats.totalEntrees = 0;
        }
    },

    // Recalculer les macros à partir des items locaux
    _recalcMacros() {
        if (!this.stats || !this.stats.objectifs) return;

        let totalKcal = 0, totalProt = 0, totalGluc = 0, totalLip = 0;

        this.items.forEach(item => {
            const type = (item['Type (REPAS / SPORT)'] || item.Type || '').toUpperCase();
            if (type !== 'SPORT' && type !== 'EAU') {
                totalKcal += parseFloat(item.Kcal) || 0;
                totalProt += parseFloat(item.Proteines_g) || 0;
                totalGluc += parseFloat(item.Glucides_g) || 0;
                totalLip += parseFloat(item.Lipides_g) || 0;
            }
        });

        const obj = this.stats.objectifs;

        this.stats.consomme = {
            kcal: Math.round(totalKcal),
            proteines: Math.round(totalProt),
            glucides: Math.round(totalGluc),
            lipides: Math.round(totalLip)
        };

        this.stats.pourcentages = {
            kcal: obj.kcal > 0 ? Math.min(100, Math.round((totalKcal / obj.kcal) * 100)) : 0,
            proteines: obj.proteines > 0 ? Math.min(100, Math.round((totalProt / obj.proteines) * 100)) : 0,
            glucides: obj.glucides > 0 ? Math.min(100, Math.round((totalGluc / obj.glucides) * 100)) : 0,
            lipides: obj.lipides > 0 ? Math.min(100, Math.round((totalLip / obj.lipides) * 100)) : 0
        };

        this.stats.restant = {
            kcal: Math.round(Math.max(0, obj.kcal - totalKcal)),
            proteines: Math.round(Math.max(0, obj.proteines - totalProt)),
            glucides: Math.round(Math.max(0, obj.glucides - totalGluc)),
            lipides: Math.round(Math.max(0, obj.lipides - totalLip))
        };

        this.stats.totalEntrees = this.items.length;
    },

    // Lancer la réconciliation périodique (5 min par défaut)
    startReconciliation(intervalMs) {
        this.stopReconciliation();
        const interval = intervalMs || 300000;
        this._reconcileTimer = setInterval(() => {
            if (typeof loadHistory === 'function') {
                console.log('🔄 Réconciliation périodique');
                loadHistory(true);
            }
        }, interval);
    },

    stopReconciliation() {
        if (this._reconcileTimer) {
            clearInterval(this._reconcileTimer);
            this._reconcileTimer = null;
        }
    }
};
