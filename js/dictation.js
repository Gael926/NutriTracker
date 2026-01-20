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
