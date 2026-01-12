// Configuration des endpoints n8n
const CONFIG = {
  endpoints: {
    inscription: 'https://n8n.srv957891.hstgr.cloud/webhook/inscription-client',
    dictee: 'https://n8n.srv957891.hstgr.cloud/webhook/dictee-nutrition-v3',
    historique: 'https://n8n.srv957891.hstgr.cloud/webhook/historique',
    updateItem: 'https://n8n.srv957891.hstgr.cloud/webhook/update-item',
    deleteItem: 'https://n8n.srv957891.hstgr.cloud/webhook/delete-item'
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
  const telephone = document.getElementById('telephone').value.trim();
  const objectif = parseInt(document.getElementById('objectif').value, 10);

  // Validation
  if (!validateLoginForm(email, telephone, objectif)) {
    return;
  }

  // Désactiver le bouton et afficher le loader
  const btnSubmit = document.getElementById('btn-submit');
  const btnText = document.getElementById('btn-text');
  const btnLoader = document.getElementById('btn-loader');
  const btnArrow = document.querySelector('.btn-arrow');

  btnSubmit.disabled = true;
  btnText.textContent = 'Connexion...';
  btnArrow.classList.add('hidden');
  btnLoader.classList.remove('hidden');

  try {
    await handleLogin(email, telephone, objectif);
  } catch (error) {
    // Réactiver le bouton en cas d'erreur
    btnSubmit.disabled = false;
    btnText.textContent = 'Commencer';
    btnArrow.classList.remove('hidden');
    btnLoader.classList.add('hidden');
  }
}

//Valide le formulaire de login
function validateLoginForm(email, telephone, objectif) {
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

  // Validation téléphone
  const telError = document.getElementById('telephone-error');
  const telRegex = /^[0-9]{10}$/;
  if (!telRegex.test(telephone)) {
    telError.textContent = 'Le numéro doit contenir 10 chiffres';
    document.getElementById('telephone').classList.add('animate-shake');
    isValid = false;
  } else {
    telError.textContent = '';
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
 * Gère l'inscription et la redirection
 */
async function handleLogin(email, telephone, objectif) {
  // 1. Sauvegarder dans localStorage
  const user = { email, telephone, objectif };
  localStorage.setItem('user', JSON.stringify(user));

  // 2. POST vers n8n
  try {
    const response = await fetch(CONFIG.endpoints.inscription, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, telephone, objectif })
    });

    if (!response.ok) {
      throw new Error('Erreur serveur');
    }

    // 3. Rediriger vers app.html
    window.location.href = 'app.html';

  } catch (error) {
    console.error('Erreur inscription:', error);
    // On redirige quand même car les données sont en local
    window.location.href = 'app.html';
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
  const modalOverlay = document.querySelector('.modal-overlay');
  const btnLogout = document.getElementById('btn-logout');
  const btnClearHistory = document.getElementById('btn-clear-history');

  if (!modal) return;

  // Ouvrir le modal
  btnSettings?.addEventListener('click', () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    document.getElementById('setting-email').textContent = user.email || '-';
    document.getElementById('setting-telephone').textContent = user.telephone || '-';
    document.getElementById('setting-objectif').textContent = user.objectif ? `${user.objectif} kcal` : '-';

    modal.classList.remove('hidden');
  });

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
  btnClearHistory?.addEventListener('click', () => {
    if (confirm('Voulez-vous effacer l\'historique du jour ?')) {
      const historique = JSON.parse(localStorage.getItem('historique') || '[]');
      const today = getTodayISO();
      const historiqueFiltre = historique.filter(r => r.date !== today);
      localStorage.setItem('historique', JSON.stringify(historiqueFiltre));

      loadHistory();
      updateTotal();
      modal.classList.add('hidden');
      showNotification('Historique effacé');
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

    const data = await response.json();
    console.log('📊 Données reçues:', data);

    // Normaliser en tableau (n8n peut retourner un objet unique ou un tableau)
    let items = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      // Si c'est un objet unique avec des données, le mettre dans un tableau
      items = [data];
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
      updateTotalFromData([]);
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
          <div class="item-actions">
            <button class="btn-edit" onclick="openEditModal(${rowNumber}, '${aliment.replace(/'/g, "\\'")}', ${quantite || 0}, '${unite}', ${kcal})" title="Modifier">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn-delete" onclick="deleteItem(${rowNumber})" title="Supprimer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Mettre à jour le total avec les données reçues
    updateTotalFromData(items);

  } catch (error) {
    console.error('Erreur chargement historique:', error);
    liste.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p class="empty-text">Erreur de connexion</p>
        <p class="empty-subtext">Vérifiez votre connexion internet</p>
      </div>
    `;
    updateTotalFromData([]);
  }
}

// Met à jour le total kcal à partir des données fournies
function updateTotalFromData(data) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const totalKcal = data.reduce((sum, r) => {
    const typeValue = r['Type (REPAS / SPORT)'] || r.Type || '';
    const isSport = typeValue.toUpperCase() === 'SPORT';
    const kcal = parseInt(r.Kcal || 0, 10);

    if (isSport) {
      return sum - Math.abs(kcal); // Déduire les calories brûlées
    }
    return sum + kcal;
  }, 0);

  const objectif = user.objectif || 2500;
  const pourcentage = Math.round((totalKcal / objectif) * 100);

  const totalElement = document.getElementById('total-kcal');
  const pourcentageElement = document.getElementById('pourcentage');
  const barreElement = document.getElementById('barre-progres');

  if (totalElement) {
    totalElement.textContent = `${totalKcal} / ${objectif}`;
  }

  if (pourcentageElement) {
    pourcentageElement.textContent = `${pourcentage}%`;
  }

  if (barreElement) {
    barreElement.style.width = `${Math.min(Math.max(pourcentage, 0), 100)}%`;
    barreElement.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-red-500');

    if (pourcentage < 80) {
      barreElement.classList.add('bg-green-500');
    } else if (pourcentage <= 100) {
      barreElement.classList.add('bg-yellow-500');
    } else {
      barreElement.classList.add('bg-red-500');
    }
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
  const kcal = parseInt(document.getElementById('edit-kcal').value, 10) || 0;

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

// INITIALISATION
document.addEventListener('DOMContentLoaded', () => {
  // Déterminer quelle page initialiser
  const isLoginPage = document.getElementById('login-form');
  const isAppPage = document.getElementById('btn-dicter');

  if (isLoginPage) {
    initLoginPage();
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
