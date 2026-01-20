// GESTION DU LOGIN (index.html)
// ========================================
// VÉRIFICATION DIRECTE VIA API (SANS LOCALSTORAGE)
// ========================================

/**
 * Vérifie le profil d'un utilisateur directement via l'API n8n
 * Utilise le mode check_only qui retourne juste le statut du profil
 */
async function checkUserProfile(email) {
    try {
        const response = await fetch(CONFIG.endpoints.inscription, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                phone_number: '', // Vide en mode check_only
                check_only: true   // 🔑 MODE VÉRIFICATION UNIQUEMENT
            })
        });

        if (!response.ok) {
            return { exists: false, hasCompleteProfile: false };
        }

        const data = await response.json();

        // L'API retourne has_complete_profile directement
        return {
            exists: data.email_found || false,
            hasCompleteProfile: data.has_complete_profile || false
        };
    } catch (error) {
        console.log('Erreur vérification profil:', error);
        return { exists: false, hasCompleteProfile: false };
    }
}

/**
 * Adapte le formulaire selon le profil utilisateur
 * Interroge directement l'API n8n au lieu d'utiliser localStorage
 */
async function adaptFormForUser(email) {
    const objectifField = document.getElementById('objectif');
    const objectifFieldGroup = objectifField?.closest('.form-field');
    const poidsField = document.getElementById('poids');
    const poidsFieldGroup = poidsField?.closest('.form-field');

    // Vérifier le profil via l'API
    const profile = await checkUserProfile(email);

    if (profile.exists && profile.hasCompleteProfile) {
        // PROFIL COMPLET dans le GSheet : Masquer objectif et poids
        console.log('🔄 Profil complet détecté - Formulaire simplifié');
        if (objectifFieldGroup) objectifFieldGroup.style.display = 'none';
        if (poidsFieldGroup) poidsFieldGroup.style.display = 'none';
        if (objectifField) objectifField.removeAttribute('required');
        if (poidsField) poidsField.removeAttribute('required');
    } else {
        // PROFIL INCOMPLET ou NOUVEAU : Afficher tous les champs
        console.log('✨ Profil incomplet ou nouvel utilisateur - Formulaire complet');
        if (objectifFieldGroup) objectifFieldGroup.style.display = 'block';
        if (poidsFieldGroup) poidsFieldGroup.style.display = 'block';
        if (objectifField) objectifField.setAttribute('required', 'required');
        if (poidsField) poidsField.setAttribute('required', 'required');
    }
}

// Initialise la page de login
function initLoginPage() {
    const form = document.getElementById('login-form');
    if (!form) return;

    // Vérifier si l'utilisateur est déjà connecté
    const existingUser = localStorage.getItem('user');
    if (existingUser) {
        window.location.href = 'app.html';
        return;
    }

    // Écouter les changements d'email pour adapter le formulaire
    const emailInput = document.getElementById('email');
    if (emailInput) {
        // Debounce pour éviter trop d'appels API
        let emailCheckTimeout;

        emailInput.addEventListener('input', (e) => {
            const email = e.target.value.trim();

            // Vider le timeout précédent
            clearTimeout(emailCheckTimeout);

            // Si l'email semble valide, vérifier après 800ms
            if (email && email.includes('@') && email.includes('.')) {
                emailCheckTimeout = setTimeout(() => {
                    adaptFormForUser(email);
                }, 800);
            }
        });

        // Vérifier aussi au blur (quand on quitte le champ)
        emailInput.addEventListener('blur', (e) => {
            const email = e.target.value.trim();
            if (email && email.includes('@')) {
                clearTimeout(emailCheckTimeout);
                adaptFormForUser(email);
            }
        });
    }

    form.addEventListener('submit', handleLoginSubmit);

    // Validation en temps réel du téléphone
    const phoneInput = document.getElementById('phone_number');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            const phone = e.target.value;
            const phoneError = document.getElementById('phone-error');

            if (phone.length > 0) {
                if (validatePhoneNumber(phone)) {
                    e.target.style.borderColor = '#10b981';
                    phoneError.textContent = '';
                } else {
                    e.target.style.borderColor = '#ef4444';
                    phoneError.textContent = 'Format attendu : +33612345678';
                    phoneError.style.color = '#ef4444';
                }
            } else {
                e.target.style.borderColor = '';
                phoneError.textContent = '';
            }
        });
    }
}

// Gère la soumission du formulaire de login
async function handleLoginSubmit(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const phone_number = document.getElementById('phone_number').value.trim();

    // Récupérer objectif et poids (peuvent être vides pour reconnexion)
    const objectifInput = document.getElementById('objectif');
    const poidsInput = document.getElementById('poids');

    const objectif = objectifInput?.value ? parseInt(objectifInput.value, 10) : null;
    const poids = poidsInput?.value ? parseFloat(poidsInput.value) : null;

    // Validation adaptée
    if (!validateLoginForm(email, phone_number, objectif, poids)) {
        return;
    }

    // Désactiver le bouton et afficher le loader
    const btnSubmit = document.getElementById('btn-submit');
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');

    btnSubmit.disabled = true;
    btnText.textContent = 'Connexion...';
    btnLoader.classList.remove('hidden');

    try {
        await handleLogin(email, phone_number, objectif, poids);
    } catch (error) {
        btnSubmit.disabled = false;
        btnText.textContent = 'Commencer';
        btnLoader.classList.add('hidden');
    }
}

// VALIDATION POUR SMS
function validateLoginForm(email, phone_number, objectif, poids) {
    let isValid = true;

    // Validation email
    const emailError = document.getElementById('email-error');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailError.textContent = 'Veuillez entrer un email valide';
        document.getElementById('email').classList.add('animate-shake');
        isValid = false;
    } else {
        emailError.textContent = '';
    }

    // Validation téléphone
    const phoneError = document.getElementById('phone-error');
    if (!validatePhoneNumber(phone_number)) {
        phoneError.textContent = 'Format invalide. Utilisez le format international (+33612345678)';
        phoneError.style.color = '#ef4444';
        document.getElementById('phone_number').classList.add('animate-shake');
        isValid = false;
    } else {
        phoneError.textContent = '';
    }

    // Validation objectif (seulement si champ visible)
    const objectifField = document.getElementById('objectif');
    const objError = document.getElementById('objectif-error');
    if (objectifField && objectifField.offsetParent !== null) { // Champ visible
        if (!objectif || objectif < 1000 || objectif > 5000) {
            objError.textContent = 'L\'objectif doit être entre 1000 et 5000 kcal';
            objectifField.classList.add('animate-shake');
            isValid = false;
        } else {
            objError.textContent = '';
        }
    }

    // Validation poids (seulement si champ visible)
    const poidsField = document.getElementById('poids');
    const poidsError = document.getElementById('poids-error');
    if (poidsField && poidsField.offsetParent !== null) { // Champ visible
        if (!poids || poids < 30 || poids > 300) {
            poidsError.textContent = 'Le poids doit être entre 30 et 300 kg';
            poidsField.classList.add('animate-shake');
            isValid = false;
        } else {
            poidsError.textContent = '';
        }
    }

    // Retirer l'animation
    setTimeout(() => {
        document.querySelectorAll('.animate-shake').forEach(el => {
            el.classList.remove('animate-shake');
        });
    }, 300);

    return isValid;
}

/**
 * Gère la connexion et la vérification du client
 */
async function handleLogin(email, phone_number, objectif, poids) {
    try {
        // 🆕 Construire le body selon les données disponibles
        const body = {
            email,
            phone_number
        };

        // Ajouter objectif et poids seulement s'ils sont fournis
        if (objectif !== null) body.objectif = objectif;
        if (poids !== null) body.poids = poids;

        const response = await fetch(CONFIG.endpoints.inscription, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Erreur serveur');
        }

        const data = await response.json();
        console.log('📊 Réponse authentification:', data);

        if (data.authorized) {
            const user = {
                email: data.User_ID || email,
                phone_number: data.Phone_Number || phone_number,
                objectif: data.Objectif_Kcal || objectif,
                poids: data.Poids || poids
            };
            localStorage.setItem('user', JSON.stringify(user));

            if (data.first_login) {
                showNotification('✨ Bienvenue ! Votre profil a été créé.');
            } else {
                showNotification('✅ Connexion réussie !');
            }

            setTimeout(() => {
                window.location.href = 'app.html';
            }, 500);
        } else {
            throw new Error(data.message || 'Accès refusé');
        }

    } catch (error) {
        console.error('Erreur connexion:', error);
        const errorMessage = error.message || 'Email ou numéro de téléphone incorrect';

        const authError = document.getElementById('auth-error');
        const authErrorMessage = document.getElementById('auth-error-message');
        if (authError && authErrorMessage) {
            authErrorMessage.textContent = '🚫 ' + errorMessage;
            authError.classList.remove('hidden');
        }

        throw error;
    }
}
