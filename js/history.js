// GESTION DE L'HISTORIQUE

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

      // 💧 AFFICHER LA SECTION EAU MÊME SI VIDE
      updateEauSection(stats);

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
      const isEau = typeValue.toUpperCase() === 'EAU'; // 💧 NOUVEAU
      const aliment = r['Aliment (texte)'] || r.Aliment || 'Élément';
      const heure = r.Heure || '';
      const quantite = r.Quantite || '';
      const unite = r['Unite (g, portion, etc.)'] || '';
      const kcal = parseInt(r.Kcal || 0, 10);
      const momentText = r['Moment (Petit-déj / Déjeuner / Dîner / Sport)'] || r.Moment || (isSport ? 'Sport' : 'Repas');

      // 💧 NE PAS AFFICHER L'EAU DANS L'HISTORIQUE
      if (isEau) {
        return ''; // On skip l'eau, elle sera affichée dans la section dédiée
      }

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

      // Récupérer les macronutriments
      const proteines = Math.round(parseFloat(r.Proteines_g || 0));
      const glucides = Math.round(parseFloat(r.Glucides_g || 0));
      const lipides = Math.round(parseFloat(r.Lipides_g || 0));

      // Afficher les macros seulement si ce n'est pas du sport
      const macrosHTML = !isSport ? `
  <div class="macros-info">
    <span class="macro macro-proteines" title="Protéines">🥩 ${proteines}g</span>
    <span class="macro macro-glucides" title="Glucides">🍚 ${glucides}g</span>
    <span class="macro macro-lipides" title="Lipides">🥑 ${lipides}g</span>
  </div>
` : '';

      return `
  <div class="${itemClass}" data-row="${rowNumber}">
    <span class="icon">${icon}</span>
    <div class="info">
      <span class="nom">${aliment}</span>
      <span class="details">${momentText}${details ? ' · ' + details : ''}</span>
    </div>
    <div class="item-right">
      <span class="kcal">${isSport ? 'Objectif +' + Math.abs(kcal) : Math.abs(kcal) + ' kcal'}</span>
      ${macrosHTML}
      <button class="btn-edit" onclick="openEditModal(${rowNumber}, '${aliment.replace(/'/g, "\\'")}', ${quantite || 0}, '${unite}', ${kcal})" title="Modifier">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
    </div>
  </div>
`;
    }).join('');

    // ========================================
    // 💧 AFFICHER LA SECTION EAU
    // ========================================
    updateEauSection(stats);

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
    updateEauSection(null);
    updateTotalFromData([], null);
  }
}

// ========================================
// 💧 FONCTION POUR METTRE À JOUR LA BARRE D'EAU
// ========================================
function updateEauSection(stats) {
  // Récupérer les éléments de la barre d'eau intégrée
  const totalEau = document.getElementById('total-eau');
  const barreEau = document.getElementById('barre-eau');
  const pourcentageEau = document.getElementById('pourcentage-eau');
  const eauStatus = document.getElementById('eau-status');

  if (!totalEau || !barreEau || !pourcentageEau) return;

  if (stats && stats.eau) {
    const eau = stats.eau;
    const pourcentage = Math.min(eau.pourcentage, 100);

    // Mettre à jour l'affichage
    totalEau.textContent = `${eau.consomme}L / ${eau.objectif}L`;
    barreEau.style.width = `${pourcentage}%`;
    pourcentageEau.textContent = `${Math.round(pourcentage)}%`;

    // Mettre à jour le statut
    if (eauStatus) {
      if (eau.restant <= 0) {
        eauStatus.textContent = '✅ Objectif atteint !';
        eauStatus.className = 'eau-status objectif-atteint';
      } else {
        eauStatus.textContent = `Encore ${eau.restant}L à boire`;
        eauStatus.className = 'eau-status';
      }
    }
  } else {
    // Valeurs par défaut si pas de données
    totalEau.textContent = '0 / 2L';
    barreEau.style.width = '0%';
    pourcentageEau.textContent = '0%';
    if (eauStatus) {
      eauStatus.textContent = '';
      eauStatus.className = 'eau-status';
    }
  }
}