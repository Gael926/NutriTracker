# NutriTracker PWA

Application Progressive Web App (PWA) de suivi nutritionnel avec dictée vocale.

## Fonctionnalités

- **Dictée vocale** : Dictez vos repas avec la Web Speech API
- **Suivi calorique** : Visualisez votre consommation quotidienne
- **Historique** : Consultez tous vos repas du jour
- **PWA** : Installable sur mobile et desktop, fonctionne hors ligne
- **Intégration n8n** : Backend IA pour l'analyse nutritionnelle

## Installation

### Option 1 : Serveur local simple

```bash
# Avec Python (recommandé)
python -m http.server 8080

# Ou avec Node.js
npx serve .
```

Puis ouvrez `http://localhost:8080` dans votre navigateur.

### Option 2 : Live Server (VS Code)

1. Installez l'extension "Live Server" dans VS Code
2. Clic droit sur `index.html` → "Open with Live Server"

## Installation PWA

### 📱 Sur iPhone / iPad (Safari)

1. Ouvrez **Safari** et allez sur l'URL de l'application
2. Appuyez sur l'icône **Partager** (carré avec flèche ⬆️)
3. Faites défiler et appuyez sur **"Sur l'écran d'accueil"**
4. Donnez un nom à l'app → Appuyez sur **Ajouter**

> ⚠️ **Important** : Sur iOS, seul Safari permet d'installer des PWA. Chrome/Firefox ne fonctionnent pas pour l'installation.

### 📱 Sur Android (Chrome)

1. Ouvrez **Chrome** et allez sur l'URL de l'application
2. Appuyez sur les **3 points** (⋮) en haut à droite
3. Appuyez sur **"Installer l'application"** ou **"Ajouter à l'écran d'accueil"**
4. Confirmez → **Installer**

### 💻 Sur Desktop (Chrome / Edge)

1. Ouvrez **Chrome** ou **Edge** et allez sur l'URL de l'application
2. Cliquez sur l'icône **Installer** (⊕) dans la barre d'adresse (à droite)
3. Ou cliquez sur les **3 points** → **Installer NutriTracker...**
4. Confirmez → **Installer**

### 💻 Sur macOS (Safari)

1. Ouvrez **Safari** et allez sur l'URL de l'application
2. Cliquez sur **Fichier** → **Ajouter au Dock**
3. L'app apparaîtra dans votre Dock

> 💡 Une fois installée, l'application se lance en plein écran sans barre d'URL, comme une app native !

## Structure du projet

```
nutritracker/
├── index.html          # Page de login/onboarding
├── app.html            # Page principale (dictée + historique)
├── style.css           # Styles personnalisés
├── app.js              # Logique JavaScript
├── manifest.json       # Configuration PWA
├── service-worker.js   # Cache offline
├── icons/
│   ├── icon-192.png    # Icône 192x192
│   └── icon-512.png    # Icône 512x512
└── README.md
```

## Technologies

- **HTML5** + **CSS3** + **JavaScript** (Vanilla)
- **Tailwind CSS** (CDN)
- **Web Speech API** pour la dictée vocale
- **localStorage** pour la persistance des données
- **Service Worker** pour le mode offline

## Utilisation

1. **Page Login** : Entrez votre email, téléphone et objectif calorique
2. **Page App** : Appuyez sur le bouton 🎙️ pour dicter vos repas
3. L'IA analyse automatiquement les calories et les ajoute à l'historique

## Compatibilité

- ✅ Chrome (Android/Desktop)
- ✅ Safari (iOS/macOS)
- ✅ Edge
- ❌ Firefox (Web Speech API non supportée)