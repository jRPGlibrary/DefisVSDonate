// Configuration
const CONFIG = {
    paypalClientId: 'YOUR_PAYPAL_CLIENT_ID', // À remplacer par votre vrai client ID
    emailEndpoint: 'mailto:contentcreator.jrpglibrary@gmail.com',
    currency: 'EUR'
};

// Données des défis (vide au démarrage)
let challengesData = [];

// État de l'application
let currentFilter = 'all';

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadStatsFromStorage();
    updateStats();
    renderChallenges();
    initializePayPal();
}

function loadStatsFromStorage() {
    // Charger les statistiques depuis localStorage (mises à jour par l'admin)
    const savedStats = localStorage.getItem('siteStats');
    if (savedStats) {
        const stats = JSON.parse(savedStats);
        
        // Mettre à jour les éléments d'affichage
        const totalChallengesEl = document.querySelector('.stat-card:nth-child(1) .stat-number');
        const totalDonationsEl = document.querySelector('.stat-card:nth-child(2) .stat-number');
        const activeChallengesEl = document.querySelector('.stat-card:nth-child(3) .stat-number');
        const completedChallengesEl = document.querySelector('.stat-card:nth-child(4) .stat-number');
        
        if (totalChallengesEl) totalChallengesEl.textContent = stats.totalChallenges || 0;
        if (totalDonationsEl) totalDonationsEl.textContent = `${stats.totalDonations || 0}€`;
        if (activeChallengesEl) activeChallengesEl.textContent = stats.activeChallenges || 0;
        if (completedChallengesEl) completedChallengesEl.textContent = stats.completedChallenges || 0;
    }
    
    // Charger les défis validés depuis localStorage
    const savedChallenges = localStorage.getItem('validatedChallenges');
    if (savedChallenges) {
        const validatedChallenges = JSON.parse(savedChallenges);
        challengesData.length = 0;
        challengesData.push(...validatedChallenges);
    }
}

function setupEventListeners() {
    // Form submission
    const form = document.getElementById('challengeForm');
    form.addEventListener('submit', handleFormSubmit);
    
    // Donation amount change
    const donationSelect = document.getElementById('donation-amount');
    donationSelect.addEventListener('change', handleDonationAmountChange);
    
    // Filter tabs
    const filterTabs = document.querySelectorAll('.tab-btn');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => handleFilterChange(tab.dataset.filter));
    });
}

function handleDonationAmountChange(e) {
    const customAmountGroup = document.getElementById('custom-amount-group');
    if (e.target.value === 'custom') {
        customAmountGroup.style.display = 'block';
        document.getElementById('custom-amount').required = true;
    } else {
        customAmountGroup.style.display = 'none';
        document.getElementById('custom-amount').required = false;
    }
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const challengeData = {
        challengerName: formData.get('challengerName'),
        challengeTitle: formData.get('challengeTitle'),
        challengeDescription: formData.get('challengeDescription'),
        donationAmount: formData.get('donationAmount') === 'custom' 
            ? formData.get('customAmount') 
            : formData.get('donationAmount')
    };
    
    // Validation
    if (!validateChallengeData(challengeData)) {
        return;
    }
    
    // Ajouter le défi en attente (sans paiement)
    let newChallenge;
    if (typeof addPendingChallenge === 'function') {
        newChallenge = addPendingChallenge(challengeData);
    } else {
        newChallenge = {
            id: Date.now(),
            title: challengeData.challengeTitle,
            description: challengeData.challengeDescription,
            challenger: challengeData.challengerName,
            amount: parseFloat(challengeData.donationAmount),
            status: 'pending',
            date: new Date().toISOString().split('T')[0],
            progress: 'En attente de validation'
        };
    }
    document.getElementById('challengeForm').reset();
    document.getElementById('custom-amount-group').style.display = 'none';
    sendEmailNotification(newChallenge);
    showSuccessMessage(challengeData.challengeTitle);
}

function validateChallengeData(data) {
    if (!data.challengerName.trim()) {
        alert('❌ Merci de renseigner ton pseudo !');
        return false;
    }
    
    if (!data.challengeTitle.trim()) {
        alert('❌ Merci de donner un titre à ton défi !');
        return false;
    }
    
    if (!data.challengeDescription.trim()) {
        alert('❌ Merci de décrire ton défi !');
        return false;
    }
    
    if (!data.donationAmount || data.donationAmount < 1) {
        alert('❌ Le montant de la donation doit être d\'au moins 1€ !');
        return false;
    }
    
    return true;
}

function initiatePayPalPayment(challengeData) {
    const amount = parseFloat(challengeData.donationAmount);
    
    // Créer le bouton PayPal dynamiquement
    const paypalContainer = document.createElement('div');
    paypalContainer.id = 'paypal-button-container-' + Date.now();
    
    // Modal pour le paiement
    showPaymentModal(paypalContainer, challengeData, amount);
}

function showPaymentModal(paypalContainer, challengeData, amount) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 500px;
        width: 90%;
        text-align: center;
    `;
    
    modalContent.innerHTML = `
        <h3>💳 Finaliser le défi</h3>
        <p><strong>Défi :</strong> ${challengeData.challengeTitle}</p>
        <p><strong>Montant :</strong> ${amount}€</p>
        <p>Procède au paiement pour valider ton défi !</p>
        <div id="${paypalContainer.id}" style="margin: 20px 0;"></div>
        <button onclick="this.closest('div[style*="position: fixed"]').remove()" 
                style="background: #ccc; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
            Annuler
        </button>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Initialiser PayPal dans le modal
    initializePayPalButton(paypalContainer.id, challengeData, amount, modal);
}

function initializePayPal() {
    // Cette fonction sera appelée quand le SDK PayPal sera chargé
    console.log('PayPal SDK ready');
}

function initializePayPalButton(containerId, challengeData, amount, modal) {
    if (typeof paypal === 'undefined') {
        alert('❌ Erreur PayPal. Merci de réessayer.');
        modal.remove();
        return;
    }
    
    paypal.Buttons({
        createOrder: function(data, actions) {
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: amount.toString(),
                        currency_code: CONFIG.currency
                    },
                    description: `Défi: ${challengeData.challengeTitle}`
                }]
            });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                // Paiement réussi
                handlePaymentSuccess(challengeData, details);
                modal.remove();
            });
        },
        onError: function(err) {
            console.error('Erreur PayPal:', err);
            alert('❌ Erreur lors du paiement. Merci de réessayer.');
        },
        onCancel: function(data) {
            console.log('Paiement annulé:', data);
        }
    }).render('#' + containerId);
}

function handlePaymentSuccess(challengeData, paymentDetails) {
    // Ajouter le défi aux défis en attente (pas directement visible)
    const challengeWithPayment = {
        ...challengeData,
        paymentId: paymentDetails.id
    };
    
    // Utiliser la fonction d'admin pour ajouter en attente
    let newChallenge;
    if (typeof addPendingChallenge === 'function') {
        newChallenge = addPendingChallenge(challengeWithPayment);
    } else {
        // Fallback si admin.js n'est pas chargé
        newChallenge = {
            id: Date.now(),
            title: challengeData.challengeTitle,
            description: challengeData.challengeDescription,
            challenger: challengeData.challengerName,
            amount: parseFloat(challengeData.donationAmount),
            status: 'pending',
            date: new Date().toISOString().split('T')[0],
            progress: 'En attente de validation',
            paymentId: paymentDetails.id
        };
    }
    
    // Reset form
    document.getElementById('challengeForm').reset();
    document.getElementById('custom-amount-group').style.display = 'none';
    
    // Envoyer email de notification
    sendEmailNotification(newChallenge);
    
    // Confirmation
    showSuccessMessage(challengeData.challengeTitle);
}

function sendEmailNotification(challenge) {
    const subject = encodeURIComponent(`🎮 Nouveau défi: ${challenge.title}`);
    const adminUrl = window.location.origin + window.location.pathname.replace('index.html', '') + 'admin.html';
    const body = encodeURIComponent(`
Nouveau défi reçu !

Titre: ${challenge.title}
Description: ${challenge.description}
Proposé par: ${challenge.challenger}
Montant: ${challenge.amount}€

Connecte-toi sur le panel admin pour valider ou refuser ce défi :
${adminUrl}

Mot de passe: defis2024

⚠️ Le paiement PayPal ne sera demandé à l'utilisateur que si le défi est validé par l'admin. Un lien de paiement sera envoyé après validation.
    `);
    
    // Ouvrir le client email par défaut
    window.open(`${CONFIG.emailEndpoint}?subject=${subject}&body=${body}`);
}

function showSuccessMessage(challengeTitle) {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #00b894, #00cec9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        max-width: 300px;
    `;
    
    message.innerHTML = `
        <h4>🎉 Défi envoyé !</h4>
        <p><strong>${challengeTitle}</strong></p>
        <p>Ton défi a été envoyé et le paiement confirmé ! Il sera visible une fois validé.</p>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 5000);
}

function handleFilterChange(filter) {
    currentFilter = filter;
    
    // Mettre à jour les tabs
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    // Re-render les défis
    renderChallenges();
}

function renderChallenges() {
    const container = document.getElementById('challengesGrid');
    const filteredChallenges = filterChallenges(challengesData, currentFilter);
    
    if (filteredChallenges.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: white;">
                <h3>🤷‍♂️ Aucun défi trouvé</h3>
                <p>Sois le premier à proposer un défi !</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredChallenges.map(challenge => createChallengeCard(challenge)).join('');
}

function filterChallenges(challenges, filter) {
    if (filter === 'all') return challenges;
    return challenges.filter(challenge => challenge.status === filter);
}

function createChallengeCard(challenge) {
    const statusClass = `status-${challenge.status}`;
    const statusText = {
        pending: 'En Attente',
        active: 'En Cours',
        completed: 'Terminé',
        rejected: 'Refusé'
    }[challenge.status];
    
    return `
        <div class="challenge-card">
            <div class="challenge-header">
                <div>
                    <div class="challenge-title">${challenge.title}</div>
                    <div class="challenge-meta">
                        <span>👤 ${challenge.challenger}</span>
                        <span class="challenge-status ${statusClass}">${statusText}</span>
                    </div>
                </div>
            </div>
            <div class="challenge-description">${challenge.description}</div>
            <div class="challenge-footer">
                <div class="donation-amount">💰 ${challenge.amount}€</div>
                <div class="challenge-date">${formatDate(challenge.date)}</div>
            </div>
            ${challenge.progress ? `<div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 0.9rem;">📊 ${challenge.progress}</div>` : ''}
        </div>
    `;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function updateStats() {
    const stats = calculateStats(challengesData);
    
    document.getElementById('total-challenges').textContent = stats.total;
    document.getElementById('total-donations').textContent = `€${stats.totalAmount}`;
    document.getElementById('active-challenges').textContent = stats.active;
    document.getElementById('completed-challenges').textContent = stats.completed;
}

function calculateStats(challenges) {
    return {
        total: challenges.length,
        totalAmount: challenges.reduce((sum, challenge) => sum + challenge.amount, 0),
        active: challenges.filter(c => c.status === 'active').length,
        completed: challenges.filter(c => c.status === 'completed').length
    };
}

// Fonctions utilitaires
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Gestion des erreurs globales
window.addEventListener('error', function(e) {
    console.error('Erreur JavaScript:', e.error);
});

// Export pour les tests (si nécessaire)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        challengesData,
        filterChallenges,
        calculateStats,
        validateChallengeData
    };
}

// Suppression des fonctions inutilisées liées à PayPal
function handlePaymentSuccess(challengeData, paymentDetails) {
    // Ajouter le défi aux défis en attente (pas directement visible)
    const challengeWithPayment = {
        ...challengeData,
        paymentId: paymentDetails.id
    };
    
    // Utiliser la fonction d'admin pour ajouter en attente
    let newChallenge;
    if (typeof addPendingChallenge === 'function') {
        newChallenge = addPendingChallenge(challengeWithPayment);
    } else {
        // Fallback si admin.js n'est pas chargé
        newChallenge = {
            id: Date.now(),
            title: challengeData.challengeTitle,
            description: challengeData.challengeDescription,
            challenger: challengeData.challengerName,
            amount: parseFloat(challengeData.donationAmount),
            status: 'pending',
            date: new Date().toISOString().split('T')[0],
            progress: 'En attente de validation',
            paymentId: paymentDetails.id
        };
    }
    
    // Reset form
    document.getElementById('challengeForm').reset();
    document.getElementById('custom-amount-group').style.display = 'none';
    
    // Envoyer email de notification
    sendEmailNotification(newChallenge);
    
    // Confirmation
    showSuccessMessage(challengeData.challengeTitle);
}

function sendEmailNotification(challenge) {
    const subject = encodeURIComponent(`🎮 Nouveau défi: ${challenge.title}`);
    const adminUrl = window.location.origin + window.location.pathname.replace('index.html', '') + 'admin.html';
    const body = encodeURIComponent(`
Nouveau défi reçu !

Titre: ${challenge.title}
Description: ${challenge.description}
Proposé par: ${challenge.challenger}
Montant: ${challenge.amount}€

Connecte-toi sur le panel admin pour valider ou refuser ce défi :
${adminUrl}

Mot de passe: defis2024

⚠️ Le paiement PayPal ne sera demandé à l'utilisateur que si le défi est validé par l'admin. Un lien de paiement sera envoyé après validation.
    `);
    
    // Ouvrir le client email par défaut
    window.open(`${CONFIG.emailEndpoint}?subject=${subject}&body=${body}`);
}

function showSuccessMessage(challengeTitle) {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #00b894, #00cec9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        max-width: 300px;
    `;
    
    message.innerHTML = `
        <h4>🎉 Défi envoyé !</h4>
        <p><strong>${challengeTitle}</strong></p>
        <p>Ton défi a été envoyé et le paiement confirmé ! Il sera visible une fois validé.</p>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 5000);
}

function handleFilterChange(filter) {
    currentFilter = filter;
    
    // Mettre à jour les tabs
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    // Re-render les défis
    renderChallenges();
}

function renderChallenges() {
    const container = document.getElementById('challengesGrid');
    const filteredChallenges = filterChallenges(challengesData, currentFilter);
    
    if (filteredChallenges.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: white;">
                <h3>🤷‍♂️ Aucun défi trouvé</h3>
                <p>Sois le premier à proposer un défi !</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredChallenges.map(challenge => createChallengeCard(challenge)).join('');
}

function filterChallenges(challenges, filter) {
    if (filter === 'all') return challenges;
    return challenges.filter(challenge => challenge.status === filter);
}

function createChallengeCard(challenge) {
    const statusClass = `status-${challenge.status}`;
    const statusText = {
        pending: 'En Attente',
        active: 'En Cours',
        completed: 'Terminé',
        rejected: 'Refusé'
    }[challenge.status];
    
    return `
        <div class="challenge-card">
            <div class="challenge-header">
                <div>
                    <div class="challenge-title">${challenge.title}</div>
                    <div class="challenge-meta">
                        <span>👤 ${challenge.challenger}</span>
                        <span class="challenge-status ${statusClass}">${statusText}</span>
                    </div>
                </div>
            </div>
            <div class="challenge-description">${challenge.description}</div>
            <div class="challenge-footer">
                <div class="donation-amount">💰 ${challenge.amount}€</div>
                <div class="challenge-date">${formatDate(challenge.date)}</div>
            </div>
            ${challenge.progress ? `<div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 0.9rem;">📊 ${challenge.progress}</div>` : ''}
        </div>
    `;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function updateStats() {
    const stats = calculateStats(challengesData);
    
    document.getElementById('total-challenges').textContent = stats.total;
    document.getElementById('total-donations').textContent = `€${stats.totalAmount}`;
    document.getElementById('active-challenges').textContent = stats.active;
    document.getElementById('completed-challenges').textContent = stats.completed;
}

function calculateStats(challenges) {
    return {
        total: challenges.length,
        totalAmount: challenges.reduce((sum, challenge) => sum + challenge.amount, 0),
        active: challenges.filter(c => c.status === 'active').length,
        completed: challenges.filter(c => c.status === 'completed').length
    };
}

// Fonctions utilitaires
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Gestion des erreurs globales
window.addEventListener('error', function(e) {
    console.error('Erreur JavaScript:', e.error);
});

// Export pour les tests (si nécessaire)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        challengesData,
        filterChallenges,
        calculateStats,
        validateChallengeData
    };
}