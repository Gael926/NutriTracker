# 🎯 PROJET : PWA NutriTracker - Vanilla JavaScript

## 📋 CONTEXTE DU PROJET

Tu dois créer une Progressive Web App (PWA) appelée **NutriTracker** qui permet aux utilisateurs de suivre leur nutrition quotidienne en dictant vocalement leurs repas. L'app envoie les données à un backend n8n existant et affiche un historique des repas avec le total calorique.

**Stack technique imposée :**
- Vanilla JavaScript (HTML + CSS + JS pur, AUCUN framework)
- Tailwind CSS (via CDN, pas d'installation npm)
- PWA (manifest.json + service-worker optionnel)
- Compatible iOS + Android + Desktop

---

## 🎨 DESIGN ET MOCKUPS

**Référence :** J'ai fourni 2 mockups détaillés :
1. **Page Login (index.html)** : Design de la page d'onboarding
2. **Page Dictée (app.html)** : Design de la page principale

**Palette de couleurs (respecte ces codes) :**
```css
--primary: #10b981     /* Vert émeraude */
--secondary: #1f2937   /* Gris foncé */
--background: #111827  /* Noir/gris très foncé */
--text: #f9fafb        /* Blanc cassé */
--border: #374151      /* Gris moyen */
--accent: #fbbf24      /* Jaune/or pour les accents */
```

**Typographie :**
- Font : Inter (Google Fonts via CDN)
- Titres : font-weight 700
- Corps : font-weight 400

**Icônes :**
Utilise les emojis natifs : 🍽️ (logo), 🎙️ (micro), 🍳 (petit-déj), 🍽️ (déjeuner), 🍎 (snack), ⚙️ (settings)

---

## 🏗️ ARCHITECTURE DES FICHIERS

**Structure exacte à créer :**

```
nutritracker/
├── index.html              # Page de login (onboarding)
├── app.html                # Page principale (dictée + historique)
├── style.css               # Styles globaux + custom
├── app.js                  # Logique métier complète
├── manifest.json           # Configuration PWA
├── service-worker.js       # Cache offline (optionnel mais recommandé)
└── icons/
    ├── icon-192.png        # Icône PWA 192x192
    └── icon-512.png        # Icône PWA 512x512
```

---

## 📄 SPÉCIFICATIONS DÉTAILLÉES PAR FICHIER

### **1. index.html (Page Login)**

**Objectif :** Capturer les informations de l'utilisateur lors de la première utilisation.

**Champs requis :**
1. Email (type="email", required)
2. Téléphone (type="tel", required, pattern="[0-9]{10}")
3. Objectif calorique (type="number", required, min="1000", max="5000", default="2500")

**Comportement :**
- Validation des champs côté client (HTML5 + JS)
- Au submit :
  1. Enregistrer les données dans `localStorage` sous la clé `user` (format JSON)
  2. POST vers `https://n8n.srv957891.hstgr.cloud/webhook/inscription-client` avec body :
     ```json
     {
       "email": "user@example.com",
       "telephone": "0612345678",
       "objectif": 2500
     }
     ```
  3. Rediriger vers `app.html`

**Layout (respecte le mockup) :**
```
┌────────────────────────────────┐
│                                │
│      🍽️ NutriTracker           │
│                                │
│   Suivez vos calories          │
│   avec l'IA                    │
│                                │
│  [Input Email]                 │
│  [Input Téléphone]             │
│  [Input Objectif kcal]         │
│                                │
│      [Commencer →]             │
│                                │
└────────────────────────────────┘
```

**Code HTML structure :**
```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NutriTracker - Onboarding</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
  <link rel="manifest" href="manifest.json">
</head>
<body class="bg-gray-900 text-white">
  <div class="container">
    <!-- Ton contenu ici -->
  </div>
  <script src="app.js"></script>
</body>
</html>
```

---

### **2. app.html (Page Principale)**

**Objectif :** Permettre la dictée vocale des repas et afficher l'historique du jour.

**Sections obligatoires :**
1. **Header** :
   - Flèche retour (← vers index.html avec confirmation)
   - Titre "NutriTracker 🍽️"
   - Icône settings (⚙️) pour voir les infos user

2. **Date du jour** :
   - Format : "Aujourd'hui : DD/MM/YYYY"

3. **Compteur kcal** :
   - Affichage : "1850 / 2500 kcal"
   - Barre de progression visuelle (avec pourcentage)
   - Couleur :
     - Vert si < 80% objectif
     - Jaune si 80-100%
     - Rouge si > 100%

4. **Bouton Dicter** :
   - Gros bouton centré avec icône 🎙️
   - Au clic : Lance la Web Speech API
   - États visuels :
     - Idle : Bouton vert "Dicter"
     - Listening : Bouton rouge pulsant "Écoute en cours..."
     - Processing : Bouton gris "Envoi..."

5. **Historique du jour** :
   - Liste des repas du jour (depuis localStorage)
   - Format : Icône + Moment + Nom + Kcal
   - Exemple : "🍳 Petit-déj : Oeufs brouillés (250 kcal)"
   - Si vide : Message "Aucun repas enregistré aujourd'hui"

**Layout (respecte le mockup) :**
```
┌────────────────────────────────┐
│ ← NutriTracker 🍽️         ⚙️  │
├────────────────────────────────┤
│                                │
│   Aujourd'hui : 08/01/2026     │
│                                │
│  ┌──────────────────────────┐ │
│  │   1850 / 2500 kcal       │ │
│  │   [████████░░] 74%       │ │
│  └──────────────────────────┘ │
│                                │
│        ┌──────────┐            │
│        │   🎙️     │            │
│        │  Dicter  │            │
│        └──────────┘            │
│                                │
│  Historique du jour :          │
│  🍳 Petit-déj (450 kcal)       │
│  🍽️ Déjeuner (800 kcal)        │
│  🍎 Snack (200 kcal)           │
│                                │
└────────────────────────────────┘
```

**Comportement :**
- Au chargement :
  1. Vérifier si `localStorage.user` existe, sinon redirect vers index.html
  2. Charger l'historique du jour depuis `localStorage.historique`
  3. Calculer et afficher le total kcal
  4. Mettre à jour la barre de progression

- Au clic "Dicter" :
  1. Lancer Web Speech API (langue : fr-FR)
  2. Afficher l'état "Écoute..."
  3. Quand la dictée est terminée :
     - POST vers `https://n8n.srv957891.hstgr.cloud/webhook/dictee-nutrition-v3`
     - Body :
       ```json
       {
         "texte": "ce soir j'ai mangé 200g de poulet",
         "user": "user@example.com"
       }
       ```
  4. Attendre la réponse n8n (contient les repas parsés avec kcal)
  5. Ajouter les nouveaux repas au localStorage
  6. Rafraîchir l'affichage (historique + total)

---

### **3. app.js (Logique Métier)**

**Fonctions obligatoires à implémenter :**

#### **a) handleLogin() - Gestion du login**
```javascript
async function handleLogin(email, telephone, objectif) {
  // 1. Valider les inputs
  // 2. Sauvegarder dans localStorage
  const user = { email, telephone, objectif };
  localStorage.setItem('user', JSON.stringify(user));
  
  // 3. POST vers n8n
  const response = await fetch('https://n8n.srv957891.hstgr.cloud/webhook/inscription-client', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, telephone, objectif })
  });
  
  // 4. Rediriger vers app.html
  if (response.ok) {
    window.location.href = 'app.html';
  }
}
```

#### **b) handleDictation() - Gestion de la dictée vocale**
```javascript
function handleDictation() {
  // 1. Vérifier si Web Speech API est disponible
  if (!('webkitSpeechRecognition' in window)) {
    alert('Votre navigateur ne supporte pas la dictée vocale');
    return;
  }
  
  // 2. Créer l'instance
  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'fr-FR';
  recognition.continuous = false;
  recognition.interimResults = false;
  
  // 3. Événements
  recognition.onstart = () => {
    // Changer UI en "Écoute..."
  };
  
  recognition.onresult = async (event) => {
    const texte = event.results[0][0].transcript;
    await sendToN8n(texte);
  };
  
  recognition.onerror = (event) => {
    console.error('Erreur dictée:', event.error);
    alert('Erreur lors de la dictée');
  };
  
  recognition.onend = () => {
    // Remettre UI en état normal
  };
  
  // 4. Démarrer
  recognition.start();
}
```

#### **c) sendToN8n(texte) - Envoi à n8n**
```javascript
async function sendToN8n(texte) {
  const user = JSON.parse(localStorage.getItem('user'));
  
  try {
    const response = await fetch('https://n8n.srv957891.hstgr.cloud/webhook/dictee-nutrition-v3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texte: texte,
        user: user.email
      })
    });
    
    const data = await response.json();
    
    // data.data contient un tableau de repas :
    // [
    //   { aliment: "Blanc poulet", quantite: 200, unite: "g", kcal: 212 },
    //   { aliment: "Pâtes", quantite: 150, unite: "g", kcal: 260 }
    // ]
    
    // Sauvegarder dans l'historique
    saveToHistory(data.data);
    
    // Rafraîchir l'affichage
    loadHistory();
    updateTotal();
    
    // Notification
    showNotification('✅ Repas enregistré !');
    
  } catch (error) {
    console.error('Erreur n8n:', error);
    alert('Erreur lors de l\'envoi');
  }
}
```

#### **d) saveToHistory(repas) - Sauvegarde locale**
```javascript
function saveToHistory(repas) {
  // Récupérer l'historique existant
  let historique = JSON.parse(localStorage.getItem('historique') || '[]');
  
  // Ajouter la date/heure à chaque repas
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = now.toTimeString().slice(0, 5); // HH:MM
  
  repas.forEach(r => {
    historique.push({
      date: today,
      heure: time,
      aliment: r.aliment,
      quantite: r.quantite,
      unite: r.unite,
      kcal: r.kcal
    });
  });
  
  localStorage.setItem('historique', JSON.stringify(historique));
}
```

#### **e) loadHistory() - Affichage de l'historique**
```javascript
function loadHistory() {
  const historique = JSON.parse(localStorage.getItem('historique') || '[]');
  const today = new Date().toISOString().split('T')[0];
  
  // Filtrer uniquement les repas du jour
  const repasAujourdhui = historique.filter(r => r.date === today);
  
  // Afficher dans la liste
  const liste = document.getElementById('historique-liste');
  
  if (repasAujourdhui.length === 0) {
    liste.innerHTML = '<p class="text-gray-500">Aucun repas enregistré aujourd\'hui</p>';
    return;
  }
  
  liste.innerHTML = repasAujourdhui.map(r => `
    <div class="repas-item">
      <span class="icon">🍽️</span>
      <span class="nom">${r.aliment}</span>
      <span class="kcal">${r.kcal} kcal</span>
    </div>
  `).join('');
}
```

#### **f) updateTotal() - Mise à jour du total kcal**
```javascript
function updateTotal() {
  const user = JSON.parse(localStorage.getItem('user'));
  const historique = JSON.parse(localStorage.getItem('historique') || '[]');
  const today = new Date().toISOString().split('T')[0];
  
  // Filtrer et calculer
  const repasAujourdhui = historique.filter(r => r.date === today);
  const totalKcal = repasAujourdhui.reduce((sum, r) => sum + (r.kcal || 0), 0);
  const objectif = user.objectif || 2500;
  const pourcentage = Math.round((totalKcal / objectif) * 100);
  
  // Mettre à jour le DOM
  document.getElementById('total-kcal').textContent = `${totalKcal} / ${objectif} kcal`;
  document.getElementById('pourcentage').textContent = `${pourcentage}%`;
  
  // Mettre à jour la barre de progression
  const barre = document.getElementById('barre-progres');
  barre.style.width = `${Math.min(pourcentage, 100)}%`;
  
  // Couleur selon pourcentage
  if (pourcentage < 80) {
    barre.className = 'bg-green-500';
  } else if (pourcentage <= 100) {
    barre.className = 'bg-yellow-500';
  } else {
    barre.className = 'bg-red-500';
  }
}
```

#### **g) Initialisation au chargement**
```javascript
// Au chargement de app.html
document.addEventListener('DOMContentLoaded', () => {
  // Vérifier si user existe
  const user = localStorage.getItem('user');
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  
  // Charger et afficher
  loadHistory();
  updateTotal();
  
  // Attacher les événements
  document.getElementById('btn-dicter').addEventListener('click', handleDictation);
});
```

---

### **4. style.css (Styles personnalisés)**

**À ajouter en plus de Tailwind :**

```css
/* Variables CSS */
:root {
  --primary: #10b981;
  --secondary: #1f2937;
  --background: #111827;
  --text: #f9fafb;
  --border: #374151;
  --accent: #fbbf24;
}

/* Body global */
body {
  font-family: 'Inter', sans-serif;
  background: var(--background);
  color: var(--text);
}

/* Conteneur principal */
.container {
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
}

/* Bouton dicter (état normal) */
.btn-dicter {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: var(--primary);
  font-size: 3rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-dicter:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
}

/* Bouton dicter (état listening) */
.btn-dicter.listening {
  background: #ef4444;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Barre de progression */
.progress-bar {
  height: 12px;
  background: var(--border);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  transition: width 0.5s ease, background 0.3s ease;
}

/* Items historique */
.repas-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--secondary);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}

.repas-item .icon {
  font-size: 1.5rem;
}

.repas-item .nom {
  flex: 1;
  font-weight: 500;
}

.repas-item .kcal {
  color: var(--accent);
  font-weight: 700;
}

/* Responsive */
@media (max-width: 640px) {
  .container {
    padding: 1rem;
  }
  
  .btn-dicter {
    width: 100px;
    height: 100px;
    font-size: 2.5rem;
  }
}
```

---

### **5. manifest.json (Configuration PWA)**

```json
{
  "name": "NutriTracker",
  "short_name": "NutriTracker",
  "description": "Suivez vos calories avec l'IA",
  "start_url": "/index.html",
  "display": "standalone",
  "background_color": "#111827",
  "theme_color": "#10b981",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

---

### **6. service-worker.js (Cache offline - Optionnel)**

```javascript
const CACHE_NAME = 'nutritracker-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

---

## 🔗 INTÉGRATION N8N

### **Endpoints disponibles :**

#### **1. Inscription client**
```
URL: https://n8n.srv957891.hstgr.cloud/webhook/inscription-client
Méthode: POST
Headers: Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "telephone": "0612345678",
  "objectif": 2500
}

Réponse attendue:
{
  "success": true,
  "message": "Nouveau client créé",
  "user_id": "user@example.com"
}
```

#### **2. Dictée nutrition**
```
URL: https://n8n.srv957891.hstgr.cloud/webhook/dictee-nutrition-v3
Méthode: POST
Headers: Content-Type: application/json

Body:
{
  "texte": "ce soir j'ai mangé 200g de poulet et 150g de pâtes",
  "user": "user@example.com"
}

Réponse attendue:
{
  "success": true,
  "message": "✅ 2 entrée(s) enregistrée(s)",
  "data": [
    {
      "aliment": "Blanc poulet",
      "quantite": 200,
      "unite": "g",
      "kcal": 212
    },
    {
      "aliment": "Pâtes complètes  cuites",
      "quantite": 150,
      "unite": "g",
      "kcal": 260
    }
  ]
}
```

---

## ✅ CHECKLIST DE VALIDATION

### **Fonctionnalités obligatoires :**

**Page Login :**
- [ ] Formulaire avec 3 champs (email, tel, objectif)
- [ ] Validation HTML5 + JS
- [ ] POST vers n8n inscription
- [ ] Sauvegarde localStorage
- [ ] Redirection vers app.html

**Page App :**
- [ ] Vérification user au chargement (sinon redirect)
- [ ] Affichage date du jour
- [ ] Compteur kcal avec objectif
- [ ] Barre de progression colorée
- [ ] Bouton dicter avec Web Speech API
- [ ] États visuels du bouton (idle/listening/processing)
- [ ] POST vers n8n dictée
- [ ] Historique des repas du jour
- [ ] Calcul automatique du total

**PWA :**
- [ ] manifest.json configuré
- [ ] Installable sur iOS/Android
- [ ] Icône 192x192 et 512x512
- [ ] Mode standalone

**Design :**
- [ ] Respecte les mockups fournis
- [ ] Palette de couleurs correcte
- [ ] Responsive mobile/desktop
- [ ] Animations fluides

---

## 🐛 GESTION DES ERREURS

**Cas à gérer :**

1. **Web Speech API non disponible** :
   ```javascript
   if (!('webkitSpeechRecognition' in window)) {
     alert('Votre navigateur ne supporte pas la dictée vocale. Utilisez Chrome ou Safari.');
   }
   ```

2. **Erreur réseau n8n** :
   ```javascript
   try {
     const response = await fetch(url, options);
     if (!response.ok) {
       throw new Error('Erreur serveur');
     }
   } catch (error) {
     alert('Impossible de contacter le serveur. Vérifiez votre connexion.');
   }
   ```

3. **User non connecté** :
   ```javascript
   const user = localStorage.getItem('user');
   if (!user && window.location.pathname !== '/index.html') {
     window.location.href = 'index.html';
   }
   ```

4. **Microphone refusé** :
   ```javascript
   recognition.onerror = (event) => {
     if (event.error === 'not-allowed') {
       alert('Veuillez autoriser l\'accès au microphone dans les paramètres de votre navigateur.');
     }
   };
   ```

---

## 📝 NOTES IMPORTANTES

1. **Web Speech API** :
   - Utilise `webkitSpeechRecognition` (préfixe webkit obligatoire)
   - Fonctionne sur Chrome, Safari, Edge
   - Ne fonctionne PAS sur Firefox

2. **localStorage** :
   - Clé `user` : Objet { email, telephone, objectif }
   - Clé `historique` : Array de repas avec dates

3. **Dates** :
   - Format stockage : YYYY-MM-DD (ISO)
   - Format affichage : DD/MM/YYYY

4. **Performance** :
   - Pas de librairies lourdes
   - Tailwind via CDN (pas de build)
   - Fichiers totaux < 100 KB

5. **Compatibilité** :
   - iOS 14+ (Safari)
   - Android 8+ (Chrome)
   - Desktop (Chrome, Edge, Safari)

---

## 🎯 LIVRABLES ATTENDUS

**Fichiers à créer :**
1. index.html (page login complète)
2. app.html (page dictée complète)
3. style.css (styles custom)
4. app.js (toutes les fonctions JS)
5. manifest.json (config PWA)
6. service-worker.js (cache offline)
7. README.md (guide d'installation)

**Qualité du code :**
- Code propre et commenté
- Nommage en français pour les variables métier
- Indentation cohérente (2 espaces)
- Pas de console.log en production

---

## 🚀 COMMANDE FINALE

**Crée une PWA NutriTracker complète en Vanilla JavaScript selon les spécifications ci-dessus. Respecte exactement les mockups fournis pour le design. Le code doit être production-ready, sans bugs, et compatible iOS + Android.**

**Génère tous les fichiers mentionnés dans la section Livrables, avec le code complet et fonctionnel.**