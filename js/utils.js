// UTILITAIRES

// Fetch avec timeout (30s par défaut) via AbortController
function fetchWithTimeout(url, options = {}, timeout = 30000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { ...options, signal: controller.signal })
        .catch((error) => {
            if (error.name === 'AbortError') {
                throw new Error('Délai d\'attente dépassé. Réessayez.');
            }
            throw error;
        })
        .finally(() => clearTimeout(id));
}

// Récupère l'utilisateur depuis localStorage de manière sécurisée
function getUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (e) {
        return {};
    }
}

//Formate une date en DD/MM/YYYY
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// Retourne la date du jour au format YYYY-MM-DD
function getTodayISO() {
    return new Date().toISOString().split('T')[0];
}

// Retourne l'heure actuelle au format HH:MM
function getCurrentTime() {
    return new Date().toTimeString().slice(0, 5);
}

// Affiche une notification toast
function showNotification(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, duration);
    }
}

// Détermine l'icône en fonction de l'heure du repas
function getMealIcon(heure) {
    const hour = parseInt(heure.split(':')[0], 10);

    if (hour >= 6 && hour < 11) return '🍳'; // Petit-déjeuner
    if (hour >= 11 && hour < 15) return '🍽️'; // Déjeuner
    if (hour >= 15 && hour < 18) return '🍎'; // Goûter/Snack
    if (hour >= 18 && hour < 22) return '🍝'; // Dîner
    return '🌙'; // Repas nocturne
}

// Détermine le moment de la journée
function getMealMoment(heure) {
    const hour = parseInt(heure.split(':')[0], 10);

    if (hour >= 6 && hour < 11) return 'Petit-déj';
    if (hour >= 11 && hour < 15) return 'Déjeuner';
    if (hour >= 15 && hour < 18) return 'Goûter';
    if (hour >= 18 && hour < 22) return 'Dîner';
    return 'En-cas';
}

/**
 * Valider le format du numéro de téléphone
 * @param {string} phone - Numéro de téléphone à valider
 * @returns {boolean} - True si valide, false sinon
 */
function validatePhoneNumber(phone) {
    // Format international : commence par + suivi de 10 à 15 chiffres
    const regex = /^\+[1-9]\d{9,14}$/;
    return regex.test(phone);
}

/**
 * Formater le numéro pour l'affichage
 * @param {string} phone - Numéro de téléphone brut
 * @returns {string} - Numéro formaté
 */
function formatPhoneDisplay(phone) {
    if (!phone) return '-';

    // S'assurer que phone est une chaîne
    const phoneStr = String(phone);

    // Exemple : +33612345678 → +33 6 12 34 56 78
    if (phoneStr.startsWith('+33') && phoneStr.length === 12) {
        return phoneStr.replace(/(\+33)(\d)(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5 $6');
    }

    return phoneStr;
}
