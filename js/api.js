// COMMUNICATION N8N

// Envoie le texte dicté à n8n
async function sendToN8n(texte) {
    const btnDicter = document.getElementById('btn-dicter');
    const dicterText = document.getElementById('dicter-text');
    const dicterStatus = document.getElementById('dicter-status');
    const user = getUser();

    // Protection double-clic
    if (btnDicter.disabled) return;
    btnDicter.disabled = true;

    try {
        const response = await fetchWithTimeout(CONFIG.endpoints.dictee, {
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
            const count = data.data.length;
            showNotification(`${count} aliment${count > 1 ? 's' : ''} enregistré${count > 1 ? 's' : ''} !`);

            // Upsert snapshot puis rafraîchir l'historique
            setTimeout(async () => {
                await upsertSnapshot(user.email, getTodayISO());
                loadHistory();
            }, 1000);
        } else {
            throw new Error('Format de réponse invalide');
        }

    } catch (error) {
        console.error('Erreur n8n:', error);
        const isTimeout = error.message.includes('Délai');
        dicterStatus.textContent = isTimeout ? 'Le serveur met trop de temps' : 'Erreur de connexion au serveur';
        showNotification(isTimeout ? 'Délai dépassé, réessayez' : 'Erreur lors de l\'envoi');
    } finally {
        // Remettre l'UI en état normal
        btnDicter.classList.remove('listening', 'processing');
        btnDicter.disabled = false;
        dicterText.textContent = 'Enregistrer';

        setTimeout(() => {
            dicterStatus.textContent = 'Dictez un repas ou une activité';
        }, 2000);
    }
}
