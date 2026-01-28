// GESTION DE L'HISTORIQUE

// Flag anti-concurrence pour loadHistory
let _isLoadingHistory = false;

// Charge et affiche l'historique du jour depuis le serveur
async function loadHistory() {
  // Empêcher les appels concurrents
  if (_isLoadingHistory) return;
  _isLoadingHistory = true;

  const user = getUser();
  const today = getTodayISO();
  const liste = document.getElementById('historique-liste');

  if (!liste || !user.email) {
    _isLoadingHistory = false;
    return;
  }

  // Afficher un état de chargement
  liste.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⏳</div>
      <p class="empty-text">Chargement...</p>
    </div>
  `;

  try {
    const url = `${CONFIG.endpoints.historique}?email=${encodeURIComponent(user.email)}&date=${today}`;

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error('Erreur serveur');
    }

    // Récupérer le texte brut d'abord pour gérer les réponses vides
    const responseText = await response.text();

    // Si la réponse est vide, c'est juste qu'il n'y a pas de données
    let data = null;
    if (responseText && responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.warn('Réponse non-JSON, considérée comme vide');
        data = null;
      }
    }

    // Normaliser en tableau (n8n peut retourner différents formats)
    let items = [];
    let stats = null;

    // n8n retourne souvent un tableau avec un seul objet: [{ items, stats }]
    let responseData = data;
    if (Array.isArray(data) && data.length > 0 && data[0].items) {
      responseData = data[0];
    }

    // Nouveau format avec items et stats
    if (responseData && responseData.items && Array.isArray(responseData.items)) {
      items = responseData.items.filter(item => item && typeof item === 'object' && Object.keys(item).length > 0);
      stats = responseData.stats || null;
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

      updateEauSection(stats);
      updateTotalFromData([], stats);
      return;
    }

    // Trier par numéro de ligne décroissant (plus récents en haut)
    items.sort((a, b) => (b.row_number || 0) - (a.row_number || 0));

    // Afficher l'historique (sans onclick inline pour éviter XSS)
    liste.innerHTML = items.map(r => {
      const typeValue = r['Type (REPAS / SPORT)'] || r.Type || '';
      const isSport = typeValue.toUpperCase() === 'SPORT';
      const isEau = typeValue.toUpperCase() === 'EAU';
      const aliment = r['Aliment (texte)'] || r.Aliment || 'Élément';
      const heure = r.Heure || '';
      const quantite = r.Quantite || '';
      const unite = r['Unite (g, portion, etc.)'] || '';
      const kcal = parseInt(r.Kcal || 0, 10);
      const momentText = r['Moment (Petit-déj / Déjeuner / Dîner / Sport)'] || r.Moment || (isSport ? 'Sport' : 'Repas');

      if (isEau) {
        return '';
      }

      let icon = '🍽️';
      if (isSport) {
        icon = '🏃‍♂️';
      }

      let detailsParts = [];
      if (heure) detailsParts.push(heure);

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

      const proteines = Math.round(parseFloat(r.Proteines_g || 0));
      const glucides = Math.round(parseFloat(r.Glucides_g || 0));
      const lipides = Math.round(parseFloat(r.Lipides_g || 0));

      const macrosHTML = !isSport ? `
  <div class="macros-info">
    <span class="macro macro-proteines" title="Protéines">🥩 ${proteines}g</span>
    <span class="macro macro-glucides" title="Glucides">🍚 ${glucides}g</span>
    <span class="macro macro-lipides" title="Lipides">🥑 ${lipides}g</span>
  </div>
` : '';

      // Échapper le nom pour l'attribut data (évite injection HTML)
      const safeAliment = aliment.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      return `
  <div class="${itemClass}" data-row="${rowNumber}">
    <span class="icon">${icon}</span>
    <div class="info">
      <span class="nom">${aliment.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
      <span class="details">${momentText}${details ? ' · ' + details : ''}</span>
    </div>
    <div class="item-right">
      <span class="kcal">${isSport ? 'Objectif +' + Math.abs(kcal) : Math.abs(kcal) + ' kcal'}</span>
      ${macrosHTML}
      <button class="btn-edit" data-row="${rowNumber}" data-aliment="${safeAliment}" data-quantite="${quantite || 0}" data-unite="${unite.replace(/"/g, '&quot;')}" data-kcal="${kcal}" title="Modifier">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
    </div>
  </div>
`;
    }).join('');

    // Attacher les événements click sur les boutons edit (pas de onclick inline)
    liste.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        openEditModal(
          parseInt(btn.dataset.row, 10),
          btn.dataset.aliment,
          parseFloat(btn.dataset.quantite),
          btn.dataset.unite,
          parseInt(btn.dataset.kcal, 10)
        );
      });
    });

    // 💧 AFFICHER LA SECTION EAU
    updateEauSection(stats);

    // Mettre à jour le total avec les données reçues et les stats
    updateTotalFromData(items, stats);

  } catch (error) {
    console.error('Erreur chargement historique:', error);
    const isTimeout = error.message.includes('Délai');
    liste.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p class="empty-text">${isTimeout ? 'Délai dépassé' : 'Erreur de connexion'}</p>
        <p class="empty-subtext">${isTimeout ? 'Le serveur met trop de temps à répondre' : 'Vérifiez votre connexion internet'}</p>
      </div>
    `;
    updateEauSection(null);
    updateTotalFromData([], null);
  } finally {
    _isLoadingHistory = false;
  }
}

// ========================================
// 💧 FONCTION POUR METTRE À JOUR LA BARRE D'EAU
// ========================================
function updateEauSection(stats) {
  const totalEau = document.getElementById('total-eau');
  const barreEau = document.getElementById('barre-eau');
  const pourcentageEau = document.getElementById('pourcentage-eau');
  const eauStatus = document.getElementById('eau-status');

  if (!totalEau || !barreEau || !pourcentageEau) return;

  if (stats && stats.eau) {
    const eau = stats.eau;
    const pourcentage = Math.min(eau.pourcentage, 100);

    // Formater l'eau avec 2 décimales pour éviter l'arrondi au dixième
    const eauConsommeFormatted = Number(eau.consomme).toFixed(2).replace(/\.?0+$/, '');
    const eauRestantFormatted = Number(eau.restant).toFixed(2).replace(/\.?0+$/, '');

    totalEau.textContent = `${eauConsommeFormatted}L / ${eau.objectif}L`;
    barreEau.style.width = `${pourcentage}%`;
    pourcentageEau.textContent = `${Math.round(pourcentage)}%`;

    if (eauStatus) {
      if (eau.restant <= 0) {
        eauStatus.textContent = 'Objectif atteint !';
        eauStatus.className = 'eau-status objectif-atteint';
      } else {
        eauStatus.textContent = `Encore ${eauRestantFormatted}L à boire`;
        eauStatus.className = 'eau-status';
      }
    }
  } else {
    totalEau.textContent = '0 / 2L';
    barreEau.style.width = '0%';
    pourcentageEau.textContent = '0%';
    if (eauStatus) {
      eauStatus.textContent = '';
      eauStatus.className = 'eau-status';
    }
  }
}
