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
