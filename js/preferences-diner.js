// ========================================
// PRÉFÉRENCES DÎNER - preferences-diner.js
// ========================================

// Gère la dictée des préférences dîner
function handlePreferencesDiner() {
    // Vérifier si Web Speech API est disponible
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert('Votre navigateur ne supporte pas la dictée vocale. Utilisez Chrome ou Safari.');
        return;
    }

    const btnPreferences = document.getElementById('btn-preferences-diner');
    const preferencesText = document.getElementById('preferences-text');
    const preferencesStatus = document.getElementById('preferences-status');

    // Créer l'instance
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // Événement: démarrage
    recognition.onstart = () => {
        btnPreferences.classList.add('listening');
        btnPreferences.classList.remove('processing');
        preferencesText.textContent = 'Écoute...';
        preferencesStatus.textContent = 'Dites ce que vous avez dans votre frigo...';
    };

    // Événement: résultat
    recognition.onresult = async (event) => {
        const texte = event.results[0][0].transcript;

        // Passer en mode processing
        btnPreferences.classList.remove('listening');
        btnPreferences.classList.add('processing');
        preferencesText.textContent = 'Envoi...';
        preferencesStatus.textContent = `"${texte}"`;

        // Envoyer à n8n
        await sendPreferencesToN8n(texte);
    };

    // Événement: erreur
    recognition.onerror = (event) => {
        console.error('Erreur dictée préférences:', event.error);

        btnPreferences.classList.remove('listening', 'processing');
        preferencesText.textContent = 'Préférences';

        if (event.error === 'not-allowed') {
            alert('Veuillez autoriser l\'accès au microphone dans les paramètres de votre navigateur.');
            preferencesStatus.textContent = 'Microphone non autorisé';
        } else if (event.error === 'no-speech') {
            preferencesStatus.textContent = 'Aucune parole détectée, réessayez';
        } else if (event.error === 'network') {
            preferencesStatus.textContent = 'Erreur réseau, vérifiez votre connexion';
        } else {
            preferencesStatus.textContent = 'Erreur, réessayez';
        }
    };

    // Événement: fin
    recognition.onend = () => {
        // Remettre l'UI en état normal après un délai si pas en processing
        setTimeout(() => {
            if (!btnPreferences.classList.contains('processing')) {
                btnPreferences.classList.remove('listening');
                preferencesText.textContent = 'Préférences';
                preferencesStatus.textContent = 'Définissez vos aliments préférés pour le dîner';
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

// Envoie les préférences à n8n
async function sendPreferencesToN8n(texte) {
    const btnPreferences = document.getElementById('btn-preferences-diner');
    const preferencesText = document.getElementById('preferences-text');
    const preferencesStatus = document.getElementById('preferences-status');
    const user = JSON.parse(localStorage.getItem('user'));

    try {
        const response = await fetch(CONFIG.endpoints.preferencesDiner, {
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
        if (data.success) {
            // Notification de succès
            const count = data.aliments_count || 0;
            showNotification(`✅ Préférences enregistrées ! (${count} aliment${count > 1 ? 's' : ''})`);
            preferencesStatus.textContent = `Enregistré : "${data.texte_original}"`;

            // Afficher un message encourageant
            setTimeout(() => {
                preferencesStatus.textContent = '🍽️ Vous recevrez un SMS à 18H avec ces aliments';
            }, 3000);
        } else {
            throw new Error('Échec de l\'enregistrement');
        }

    } catch (error) {
        console.error('Erreur n8n préférences:', error);
        preferencesStatus.textContent = 'Erreur de connexion au serveur';
        showNotification('❌ Erreur lors de l\'envoi');
    } finally {
        // Remettre l'UI en état normal
        btnPreferences.classList.remove('listening', 'processing');
        preferencesText.textContent = 'Préférences';

        // Remettre le texte par défaut après 6 secondes
        setTimeout(() => {
            if (!preferencesStatus.textContent.includes('🍽️')) {
                preferencesStatus.textContent = 'Définissez vos aliments préférés pour le dîner';
            }
        }, 6000);
    }
}