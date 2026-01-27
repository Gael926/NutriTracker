// ========================================
// PRÉFÉRENCES DÎNER - preferences-diner.js
// ========================================

// Gère la dictée des préférences dîner
function handlePreferencesDiner() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert('Votre navigateur ne supporte pas la dictée vocale. Utilisez Chrome ou Safari.');
        return;
    }

    const btnPreferences = document.getElementById('btn-preferences-diner');
    const preferencesText = document.getElementById('preferences-text');
    const preferencesStatus = document.getElementById('preferences-status');

    // Protection double-clic
    if (btnPreferences.disabled) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        btnPreferences.classList.add('listening');
        btnPreferences.classList.remove('processing');
        preferencesText.textContent = 'Écoute...';
        preferencesStatus.textContent = 'Dites ce que vous avez dans votre frigo...';
    };

    recognition.onresult = async (event) => {
        const texte = event.results[0][0].transcript;

        btnPreferences.classList.remove('listening');
        btnPreferences.classList.add('processing');
        preferencesText.textContent = 'Envoi...';
        preferencesStatus.textContent = `"${texte}"`;

        await sendPreferencesToN8n(texte);
    };

    recognition.onerror = (event) => {
        console.error('Erreur dictée préférences:', event.error);

        btnPreferences.classList.remove('listening', 'processing');
        btnPreferences.disabled = false;
        preferencesText.textContent = 'Mon Frigo';

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

    recognition.onend = () => {
        setTimeout(() => {
            if (!btnPreferences.classList.contains('processing')) {
                btnPreferences.classList.remove('listening');
                btnPreferences.disabled = false;
                preferencesText.textContent = 'Mon Frigo';
                preferencesStatus.textContent = 'Préférences Dîner';
            }
        }, 500);
    };

    try {
        btnPreferences.disabled = true;
        recognition.start();
    } catch (error) {
        console.error('Erreur démarrage reconnaissance:', error);
        btnPreferences.disabled = false;
        alert('Impossible de démarrer la dictée vocale');
    }
}

// Envoie les préférences à n8n
async function sendPreferencesToN8n(texte) {
    const btnPreferences = document.getElementById('btn-preferences-diner');
    const preferencesText = document.getElementById('preferences-text');
    const preferencesStatus = document.getElementById('preferences-status');
    const user = getUser();

    try {
        const response = await fetchWithTimeout(CONFIG.endpoints.preferencesDiner, {
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

        // Lire la réponse en texte brut d'abord (comme history.js)
        const responseText = await response.text();

        let data = null;
        if (responseText && responseText.trim()) {
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.warn('Réponse non-JSON du workflow:', parseError);
            }
        }

        // Normaliser : le workflow n8n renvoie parfois un tableau
        if (Array.isArray(data)) {
            data = data[0] || {};
        }

        // Extraire le nombre d'aliments si disponible
        let count = 0;
        let originalText = texte;

        if (data) {
            count = data.aliments_count || 0;
            originalText = data.texte_original || texte;

            if (data.Preferences_Diner) {
                try {
                    const prefs = typeof data.Preferences_Diner === 'string'
                        ? JSON.parse(data.Preferences_Diner)
                        : data.Preferences_Diner;
                    count = prefs.aliments?.length || count;
                    originalText = prefs.texte_original || originalText;
                } catch (e) {
                    console.warn('Impossible de parser Preferences_Diner:', e);
                }
            }
        }

        // HTTP 200 = l'enregistrement a fonctionné côté n8n
        showNotification(`Préférences enregistrées !${count > 0 ? ` (${count} aliment${count > 1 ? 's' : ''})` : ''}`);
        preferencesStatus.textContent = `Enregistré : "${originalText}"`;

        setTimeout(() => {
            preferencesStatus.textContent = 'Vous recevrez un SMS à 18H avec ces aliments';
        }, 3000);

    } catch (error) {
        console.error('Erreur n8n préférences:', error);
        const isTimeout = error.message.includes('Délai');
        preferencesStatus.textContent = isTimeout ? 'Le serveur met trop de temps' : 'Erreur de connexion au serveur';
        showNotification(isTimeout ? 'Délai dépassé, réessayez' : 'Erreur lors de l\'envoi');
    } finally {
        btnPreferences.classList.remove('listening', 'processing');
        btnPreferences.disabled = false;
        preferencesText.textContent = 'Mon Frigo';

        setTimeout(() => {
            preferencesStatus.textContent = 'Préférences Dîner';
        }, 6000);
    }
}
