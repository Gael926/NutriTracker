// Configuration des endpoints n8n
const CONFIG = {
  endpoints: {
    inscription: 'https://n8n.srv957891.hstgr.cloud/webhook/inscription-client',
    dictee: 'https://n8n.srv957891.hstgr.cloud/webhook/dictee-nutrition-v3',
    historique: 'https://n8n.srv957891.hstgr.cloud/webhook/historique',
    updateItem: 'https://n8n.srv957891.hstgr.cloud/webhook/update-item',
    deleteItem: 'https://n8n.srv957891.hstgr.cloud/webhook/delete-item',
    clearHistory: 'https://n8n.srv957891.hstgr.cloud/webhook/clear_historique'
  }
};

// UTILITAIRES

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

// GESTION DU LOGIN (index.html)

// Initialise la page de login
function initLoginPage() {
  const form = document.getElementById('login-form');
  if (!form) return;

  // Vérifier si l'utilisateur est déjà connecté
  const existingUser = localStorage.getItem('user');
  if (existingUser) {
    window.location.href = 'app.html';
    return;
  }

  form.addEventListener('submit', handleLoginSubmit);
}

// Gère la soumission du formulaire de login
async function handleLoginSubmit(event) {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const phone_number = document.getElementById('phone_number').value.trim();
  const objectif = parseInt(document.getElementById('objectif').value, 10);

  // Validation
  if (!validateLoginForm(email, phone_number, objectif)) {
    return;
  }

  // Désactiver le bouton et afficher le loader
  const btnSubmit = document.getElementById('btn-submit');
  const btnText = document.getElementById('btn-text');
  const btnLoader = document.getElementById('btn-loader');

  btnSubmit.disabled = true;
  btnText.textContent = 'Connexion...';
  btnLoader.classList.remove('hidden');

  try {
    await handleLogin(email, phone_number, objectif);
  } catch (error) {
    // Réactiver le bouton en cas d'erreur
    btnSubmit.disabled = false;
    btnText.textContent = 'Commencer';
    btnLoader.classList.add('hidden');
  }
}

// VALIDATION POUR SMS
function validateLoginForm(email, phone_number, objectif) {
  let isValid = true;

  // Validation email
  const emailError = document.getElementById('email-error');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    emailError.textContent = 'Veuillez entrer un email valide';
    document.getElementById('email').classList.add('animate-shake');
    isValid = false;
  } else {
    emailError.textContent = '';
  }

  //  VALIDATION NUMÉRO DE TÉLÉPHONE
  const phoneError = document.getElementById('phone-error');

  // Le numéro doit être au format international
  if (!validatePhoneNumber(phone_number)) {
    phoneError.textContent = 'Format invalide. Utilisez le format international (+33612345678)';
    phoneError.style.color = '#ef4444';
    document.getElementById('phone_number').classList.add('animate-shake');
    isValid = false;
  } else {
    phoneError.textContent = '';
  }

  // Validation objectif
  const objError = document.getElementById('objectif-error');
  if (objectif < 1000 || objectif > 5000) {
    objError.textContent = 'L\'objectif doit être entre 1000 et 5000 kcal';
    document.getElementById('objectif').classList.add('animate-shake');
    isValid = false;
  } else {
    objError.textContent = '';
  }

  // Retirer l'animation après un délai
  setTimeout(() => {
    document.querySelectorAll('.animate-shake').forEach(el => {
      el.classList.remove('animate-shake');
    });
  }, 300);

  return isValid;
}

/**
 * Gère la connexion et la vérification du client
 */
async function handleLogin(email, phone_number, objectif) {
  // 1. POST vers n8n pour vérifier si le client existe
  try {
    const response = await fetch(CONFIG.endpoints.inscription, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        phone_number
      })
    });

    if (!response.ok) {
      throw new Error('Erreur serveur');
    }

    const data = await response.json();
    console.log('📊 Réponse authentification:', data);

    // 2. Vérifier si le client est autorisé
    if (data.authorized) {
      // ✅ Client autorisé - Sauvegarder et rediriger
      const user = {
        email: data.User_ID || email,
        phone_number: data.Phone_Number || phone_number,
        objectif: data.Objectif_Kcal || objectif
      };
      localStorage.setItem('user', JSON.stringify(user));

      showNotification('✅ Connexion réussie !');

      // Petit délai pour afficher la notification
      setTimeout(() => {
        window.location.href = 'app.html';
      }, 500);
    } else {
      // ❌ Client non autorisé
      throw new Error(data.message || 'Accès refusé');
    }

  } catch (error) {
    console.error('Erreur connexion:', error);

    const errorMessage = error.message || 'Email ou numéro de téléphone incorrect';

    // Afficher dans la zone d'erreur dédiée
    const authError = document.getElementById('auth-error');
    const authErrorMessage = document.getElementById('auth-error-message');
    if (authError && authErrorMessage) {
      authErrorMessage.textContent = '🚫 ' + errorMessage;
      authError.classList.remove('hidden');
    }

    // Aussi afficher en toast
    showNotification('❌ ' + errorMessage);

    // Réactiver le bouton
    const btnSubmit = document.getElementById('btn-submit');
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');

    if (btnSubmit) btnSubmit.disabled = false;
    if (btnText) btnText.textContent = 'Commencer';
    if (btnLoader) btnLoader.classList.add('hidden');
  }
}

// GESTION DE LA PAGE PRINCIPALE (app.html)

// Initialise la page principale
function initAppPage() {
  // Vérifier si on est sur app.html
  const btnDicter = document.getElementById('btn-dicter');
  if (!btnDicter) return;

  // Vérifier si l'utilisateur est connecté
  const user = localStorage.getItem('user');
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  // Afficher la date du jour
  const dateElement = document.getElementById('date-today');
  if (dateElement) {
    dateElement.textContent = formatDate(new Date());
  }

  // Charger et afficher les données
  loadHistory();
  updateTotal();

  // Attacher les événements
  btnDicter.addEventListener('click', handleDictation);

  // Bouton retour
  const btnBack = document.getElementById('btn-back');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      if (confirm('Voulez-vous retourner à la page d\'inscription ?')) {
        window.location.href = 'index.html';
      }
    });
  }

  // Modal settings
  initSettingsModal();
}

// Initialise le modal des paramètres
function initSettingsModal() {
  const btnSettings = document.getElementById('btn-settings');
  const modal = document.getElementById('modal-settings');
  const modalClose = document.getElementById('modal-close');
  const btnLogout = document.getElementById('btn-logout');
  const btnClearHistory = document.getElementById('btn-clear-history');

  console.log('🔧 initSettingsModal - modal:', modal, 'btnSettings:', btnSettings);

  if (!modal) {
    console.error('❌ Modal settings non trouvé');
    return;
  }

  // Récupérer l'overlay spécifique à ce modal
  const modalOverlay = modal.querySelector('.modal-overlay');

  // Ouvrir le modal
  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
      console.log('🔧 Bouton settings cliqué');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      document.getElementById('setting-email').textContent = user.email || '-';
      // ⭐ Afficher le numéro de téléphone formaté
      document.getElementById('setting-phone').textContent = formatPhoneDisplay(user.phone_number);
      document.getElementById('setting-objectif').textContent = user.objectif ? `${user.objectif} kcal` : '-';

      modal.classList.remove('hidden');
    });
  }

  // Fermer le modal
  modalClose?.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modalOverlay?.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Déconnexion
  btnLogout?.addEventListener('click', () => {
    if (confirm('Voulez-vous vraiment vous déconnecter ? Cela supprimera toutes vos données locales.')) {
      localStorage.removeItem('user');
      localStorage.removeItem('historique');
      window.location.href = 'index.html';
    }
  });

  // Effacer l'historique du jour
  btnClearHistory?.addEventListener('click', async () => {
    if (confirm('Voulez-vous effacer l\'historique du jour ?')) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const today = getTodayISO();

      showNotification('⏳ Suppression en cours...');

      try {
        const response = await fetch(CONFIG.endpoints.clearHistory, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            date: today
          })
        });

        if (!response.ok) {
          throw new Error('Erreur serveur');
        }

        // Rafraîchir l'historique depuis le serveur
        await loadHistory();
        modal.classList.add('hidden');
        showNotification('✅ Historique du jour effacé !');

      } catch (error) {
        console.error('Erreur suppression historique:', error);
        showNotification('❌ Erreur lors de la suppression');
      }
    }
  });
}

// DICTÉE VOCALE

// Gère la dictée vocale
function handleDictation() {
  // Vérifier si Web Speech API est disponible
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert('Votre navigateur ne supporte pas la dictée vocale. Utilisez Chrome ou Safari.');
    return;
  }

  const btnDicter = document.getElementById('btn-dicter');
  const dicterText = document.getElementById('dicter-text');
  const dicterStatus = document.getElementById('dicter-status');

  // Créer l'instance
  const recognition = new SpeechRecognition();
  recognition.lang = 'fr-FR';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  // Événement: démarrage
  recognition.onstart = () => {
    btnDicter.classList.add('listening');
    btnDicter.classList.remove('processing');
    dicterText.textContent = 'Écoute...';
    dicterStatus.textContent = 'Parlez maintenant...';
  };

  // Événement: résultat
  recognition.onresult = async (event) => {
    const texte = event.results[0][0].transcript;

    // Passer en mode processing
    btnDicter.classList.remove('listening');
    btnDicter.classList.add('processing');
    dicterText.textContent = 'Envoi...';
    dicterStatus.textContent = `"${texte}"`;

    // Envoyer à n8n
    await sendToN8n(texte);
  };

  // Événement: erreur
  recognition.onerror = (event) => {
    console.error('Erreur dictée:', event.error);

    btnDicter.classList.remove('listening', 'processing');
    dicterText.textContent = 'Dicter';

    if (event.error === 'not-allowed') {
      alert('Veuillez autoriser l\'accès au microphone dans les paramètres de votre navigateur.');
      dicterStatus.textContent = 'Microphone non autorisé';
    } else if (event.error === 'no-speech') {
      dicterStatus.textContent = 'Aucune parole détectée, réessayez';
    } else if (event.error === 'network') {
      dicterStatus.textContent = 'Erreur réseau, vérifiez votre connexion';
    } else {
      dicterStatus.textContent = 'Erreur, réessayez';
    }
  };

  // Événement: fin
  recognition.onend = () => {
    // Remettre l'UI en état normal après un délai si pas en processing
    setTimeout(() => {
      if (!btnDicter.classList.contains('processing')) {
        btnDicter.classList.remove('listening');
        dicterText.textContent = 'Enregistrer';
        dicterStatus.textContent = 'Dictez un repas ou une activité';
      }
    }, 500);
  };

  // Démarrer la reconnaissance
  try {
    recognition.start();
  } catch (error) {
    console.error('Erreur démarrage reconnaissance:', error);
    alert('Impossible de démarrer la dictée vocale');
  }
}

// COMMUNICATION N8N

// Envoie le texte dicté à n8n
async function sendToN8n(texte) {
  const btnDicter = document.getElementById('btn-dicter');
  const dicterText = document.getElementById('dicter-text');
  const dicterStatus = document.getElementById('dicter-status');
  const user = JSON.parse(localStorage.getItem('user'));

  try {
    const response = await fetch(CONFIG.endpoints.dictee, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texte: texte,
        user: user.email
      })
    });

    if (!response.ok) {
      throw new Error('Erreur serveur');
    }

    const data = await response.json();

    // Vérifier la structure de la réponse
    if (data.data && Array.isArray(data.data)) {
      // Notification de succès
      const count = data.data.length;
      showNotification(`✅ ${count} aliment${count > 1 ? 's' : ''} enregistré${count > 1 ? 's' : ''} !`);

      // Rafraîchir l'historique depuis le serveur (GSheet)
      // Petit délai pour laisser n8n écrire dans le GSheet
      setTimeout(() => {
        loadHistory();
      }, 500);
    } else {
      throw new Error('Format de réponse invalide');
    }

  } catch (error) {
    console.error('Erreur n8n:', error);
    dicterStatus.textContent = 'Erreur de connexion au serveur';
    showNotification('❌ Erreur lors de l\'envoi');
  } finally {
    // Remettre l'UI en état normal
    btnDicter.classList.remove('listening', 'processing');
    dicterText.textContent = 'Enregistrer';

    setTimeout(() => {
      dicterStatus.textContent = 'Dictez un repas ou une activité';
    }, 2000);
  }
}

// GESTION DE L'HISTORIQUE

// Sauvegarde les repas dans l'historique local
function saveToHistory(repas) {
  // Récupérer l'historique existant
  let historique = JSON.parse(localStorage.getItem('historique') || '[]');

  // Ajouter la date/heure à chaque repas
  const today = getTodayISO();
  const time = getCurrentTime();

  repas.forEach(r => {
    historique.push({
      date: today,
      heure: time,
      aliment: r.aliment || r.activite, // Supporte les deux noms de champs
      quantite: r.quantite,
      unite: r.unite,
      kcal: r.kcal || 0,
      type: r.type || (r.kcal < 0 || r.activite ? 'sport' : 'repas') // Détection auto si non spécifié
    });
  });

  localStorage.setItem('historique', JSON.stringify(historique));
}

// Charge et affiche l'historique du jour depuis le serveur
async function loadHistory() {
  const user = JSON.parse(localStorage.getItem('user'));
  const today = getTodayISO();
  const liste = document.getElementById('historique-liste');

  if (!liste || !user) return;

  // Afficher un état de chargement
  liste.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⏳</div>
      <p class="empty-text">Chargement...</p>
    </div>
  `;

  try {
    const url = `${CONFIG.endpoints.historique}?email=${encodeURIComponent(user.email)}&date=${today}`;
    console.log('📡 Appel historique:', url);

    const response = await fetch(url);
    console.log('📥 Réponse status:', response.status);

    if (!response.ok) {
      throw new Error('Erreur serveur');
    }

    // Récupérer le texte brut d'abord pour gérer les réponses vides
    const responseText = await response.text();
    console.log('📊 Réponse brute:', responseText);

    // Si la réponse est vide, c'est juste qu'il n'y a pas de données
    let data = null;
    if (responseText && responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.log('⚠️ Réponse non-JSON, considérée comme vide');
        data = null;
      }
    }

    console.log('📊 Données parsées:', data);

    // Normaliser en tableau (n8n peut retourner différents formats)
    let items = [];
    let stats = null;

    // n8n retourne souvent un tableau avec un seul objet: [{ items, stats }]
    // On doit d'abord extraire cet objet
    let responseData = data;
    if (Array.isArray(data) && data.length > 0 && data[0].items) {
      responseData = data[0];
      console.log('📊 Format tableau[objet] détecté, extraction du premier élément');
    }

    // Nouveau format avec items et stats
    if (responseData && responseData.items && Array.isArray(responseData.items)) {
      items = responseData.items.filter(item => item && typeof item === 'object' && Object.keys(item).length > 0);
      stats = responseData.stats || null;
      console.log('📊 Nouveau format API - items:', items.length, 'stats:', stats ? 'présent' : 'absent');
    }
    // Ancien format - tableau direct d'items
    else if (Array.isArray(data)) {
      items = data.filter(item => item && typeof item === 'object' && Object.keys(item).length > 0 && !item.items);
    }
    // Ancien format - objet unique
    else if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      if (data.row_number || data['User_ID'] || data['Aliment (texte)'] || data.Kcal) {
        items = [data];
      }
    }

    // Vérifier si on a des données
    if (items.length === 0) {
      liste.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <p class="empty-text">Aucune entrée aujourd'hui</p>
          <p class="empty-subtext">Dictez un repas ou une activité sportive</p>
        </div>
      `;
      updateTotalFromData([], stats);
      return;
    }

    // Trier par numéro de ligne décroissant (plus récents en haut)
    items.sort((a, b) => (b.row_number || 0) - (a.row_number || 0));

    // Afficher l'historique
    liste.innerHTML = items.map(r => {
      // Mapping des colonnes GSheet (noms exacts)
      const typeValue = r['Type (REPAS / SPORT)'] || r.Type || '';
      const isSport = typeValue.toUpperCase() === 'SPORT';
      const aliment = r['Aliment (texte)'] || r.Aliment || 'Élément';
      const heure = r.Heure || '';
      const quantite = r.Quantite || '';
      const unite = r['Unite (g, portion, etc.)'] || '';
      const kcal = parseInt(r.Kcal || 0, 10);
      const momentText = r['Moment (Petit-déj / Déjeuner / Dîner / Sport)'] || r.Moment || (isSport ? 'Sport' : 'Repas');

      // Icône selon le moment ou le type
      let icon = '🍽️';
      if (isSport) {
        icon = '🏃‍♂️';
      }

      // Construire les détails avec l'heure
      let detailsParts = [];
      if (heure) detailsParts.push(heure);

      // Pour le sport, convertir en minutes si l'unité est en heures
      if (quantite && unite) {
        if (isSport && unite.toLowerCase() === 'h') {
          const minutes = Math.round(parseFloat(quantite) * 60);
          detailsParts.push(`${minutes} min`);
        } else {
          detailsParts.push(`${quantite} ${unite}`);
        }
      }
      const details = detailsParts.join(' · ');

      const itemClass = isSport ? 'repas-item sport-item' : 'repas-item';
      const rowNumber = r.row_number || 0;

      return `
        <div class="${itemClass}" data-row="${rowNumber}">
          <span class="icon">${icon}</span>
          <div class="info">
            <span class="nom">${aliment}</span>
            <span class="details">${momentText}${details ? ' · ' + details : ''}</span>
          </div>
          <span class="kcal">${kcal} kcal</span>
          <button class="btn-edit" onclick="openEditModal(${rowNumber}, '${aliment.replace(/'/g, "\\'")}', ${quantite || 0}, '${unite}', ${kcal})" title="Modifier">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
      `;
    }).join('');

    // Mettre à jour le total avec les données reçues et les stats
    updateTotalFromData(items, stats);

  } catch (error) {
    console.error('Erreur chargement historique:', error);
    liste.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p class="empty-text">Erreur de connexion</p>
        <p class="empty-subtext">Vérifiez votre connexion internet</p>
      </div>
    `;
    updateTotalFromData([], null);
  }
}

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
  const totalKcal = data.reduce((sum, r) => {
    const typeValue = r['Type (REPAS / SPORT)'] || r.Type || '';
    const isSport = typeValue.toUpperCase() === 'SPORT';
    const kcal = parseInt(r.Kcal || 0, 10);

    if (isSport) {
      return sum - Math.abs(kcal);
    }
    return sum + kcal;
  }, 0);

  const objectif = user.objectif || 2500;
  const pourcentage = Math.round((totalKcal / objectif) * 100);

  // Construire un objet stats simulé pour le fallback
  const fallbackStats = {
    objectifs: { kcal: objectif, proteines: 0, glucides: 0, lipides: 0 },
    consomme: { kcal: totalKcal, proteines: 0, glucides: 0, lipides: 0 },
    pourcentages: { kcal: pourcentage, proteines: 0, glucides: 0, lipides: 0 },
    ratios: { proteines: 0, glucides: 0, lipides: 0 }
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

// Fonction legacy pour compatibilité (appelle la nouvelle version)
function updateTotal() {
  // Cette fonction est maintenant appelée via updateTotalFromData
  // On ne fait rien ici car loadHistory s'en charge
}

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

// INITIALISATION
document.addEventListener('DOMContentLoaded', () => {
  // Déterminer quelle page initialiser
  const isLoginPage = document.getElementById('login-form');
  const isAppPage = document.getElementById('btn-dicter');

  if (isLoginPage) {
    initLoginPage();

    // ⭐ Validation en temps réel du numéro de téléphone
    const phoneInput = document.getElementById('phone_number');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        const phone = e.target.value;
        const phoneError = document.getElementById('phone-error');

        if (phone.length > 0) {
          if (validatePhoneNumber(phone)) {
            e.target.style.borderColor = '#10b981';  // Vert si valide
            phoneError.textContent = '';
          } else {
            e.target.style.borderColor = '#ef4444';  // Rouge si invalide
            phoneError.textContent = 'Format attendu : +33612345678';
            phoneError.style.color = '#ef4444';
          }
        } else {
          e.target.style.borderColor = '';  // Reset
          phoneError.textContent = '';
        }
      });
    }
  } else if (isAppPage) {
    initAppPage();
  }

  // Enregistrer le Service Worker si disponible
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        console.log('Service Worker enregistré:', registration.scope);
      })
      .catch(error => {
        console.log('Erreur Service Worker:', error);
      });
  }
});