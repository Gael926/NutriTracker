# 🍽️ NutriTracker PWA

Application Progressive Web App (PWA) de suivi nutritionnel avec dictée vocale.

## 📋 Fonctionnalités

- **Dictée vocale** : Dictez vos repas avec la Web Speech API
- **Suivi calorique** : Visualisez votre consommation quotidienne
- **Historique** : Consultez tous vos repas du jour
- **PWA** : Installable sur mobile et desktop, fonctionne hors ligne
- **Intégration n8n** : Backend IA pour l'analyse nutritionnelle

## 🚀 Installation

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

## 📱 Installation sur mobile

1. Ouvrez l'application dans Chrome (Android) ou Safari (iOS)
2. Appuyez sur "Ajouter à l'écran d'accueil"
3. L'application sera installée comme une app native

## 🏗️ Structure du projet

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

## 🎨 Technologies

- **HTML5** + **CSS3** + **JavaScript** (Vanilla)
- **Tailwind CSS** (CDN)
- **Web Speech API** pour la dictée vocale
- **localStorage** pour la persistance des données
- **Service Worker** pour le mode offline

## 🔗 Endpoints API (n8n)

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/webhook/inscription-client` | POST | Inscription utilisateur |
| `/webhook/dictee-nutrition-v3` | POST | Analyse nutritionnelle |

## 📝 Utilisation

1. **Page Login** : Entrez votre email, téléphone et objectif calorique
2. **Page App** : Appuyez sur le bouton 🎙️ pour dicter vos repas
3. L'IA analyse automatiquement les calories et les ajoute à l'historique

## 🌐 Compatibilité

- ✅ Chrome (Android/Desktop)
- ✅ Safari (iOS/macOS)
- ✅ Edge
- ❌ Firefox (Web Speech API non supportée)

## 📄 Licence

MIT License - Libre d'utilisation
