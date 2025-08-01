// Configuration Admin
const ADMIN_CONFIG = {
    password: 'defis2024', // À changer pour un mot de passe sécurisé
    isLoggedIn: false
};

// Fonction utilitaire pour formater les dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

// Données des défis en attente (simulées - en production, ça viendrait d'une base de données)
let pendingChallenges = [];

// Initialisation de l'admin
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si nous sommes sur la page admin
    if (document.getElementById('loginSection') && document.getElementById('adminPanel')) {
        checkLoginStatus();
        if (ADMIN_CONFIG.isLoggedIn) {
            loadAdminData();
        }
    }
});

function login() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === ADMIN_CONFIG.password) {
        ADMIN_CONFIG.isLoggedIn = true;
        localStorage.setItem('adminLoggedIn', 'true');
        showAdminPanel();
        loadAdminData();
    } else {
        alert('❌ Mot de passe incorrect !');
    }
}

function logout() {
    ADMIN_CONFIG.isLoggedIn = false;
    localStorage.removeItem('adminLoggedIn');
    showLoginForm();
}

function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
        ADMIN_CONFIG.isLoggedIn = true;
        showAdminPanel();
    } else {
        showLoginForm();
    }
}

function showLoginForm() {
    const loginSection = document.getElementById('loginSection');
    const adminPanel = document.getElementById('adminPanel');
    
    if (loginSection) loginSection.style.display = 'block';
    if (adminPanel) adminPanel.style.display = 'none';
}

function showAdminPanel() {
    const loginSection = document.getElementById('loginSection');
    const adminPanel = document.getElementById('adminPanel');
    
    if (loginSection) loginSection.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
    loadAdminData();
}

function loadAdminData() {
    // Charger les défis en attente depuis localStorage
    const stored = localStorage.getItem('pendingChallenges');
    if (stored) {
        pendingChallenges = JSON.parse(stored);
    }
    
    renderPendingChallenges();
    renderAllChallenges();
    setupAdminEventListeners();
}

function setupAdminEventListeners() {
    // Filter tabs pour l'admin
    const filterTabs = document.querySelectorAll('.tab-btn');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => handleAdminFilterChange(tab.dataset.filter));
    });
}

function handleAdminFilterChange(filter) {
    // Mettre à jour les tabs
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    // Re-render les défis
    renderAllChallenges(filter);
}

function renderPendingChallenges() {
    const container = document.getElementById('pendingChallengesGrid');
    
    if (pendingChallenges.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #b0b0b0;">
                <h3>✅ Aucun défi en attente</h3>
                <p>Tous les défis ont été traités !</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pendingChallenges.map(challenge => createAdminChallengeCard(challenge, true)).join('');
}

function renderAllChallenges(filter = 'all') {
    const container = document.getElementById('allChallengesGrid');
    // Vérifier si challengesData existe
    const existingChallenges = (typeof challengesData !== 'undefined') ? challengesData : getAllChallenges();
    let allChallenges = [...existingChallenges, ...pendingChallenges];
    
    if (filter !== 'all') {
        allChallenges = allChallenges.filter(challenge => challenge.status === filter);
    }
    
    if (allChallenges.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #b0b0b0;">
                <h3>🤷‍♂️ Aucun défi trouvé</h3>
                <p>Aucun défi ne correspond à ce filtre.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = allChallenges.map(challenge => createAdminChallengeCard(challenge, false)).join('');
}

function createAdminChallengeCard(challenge, showActions = false) {
    const statusClass = `status-${challenge.status}`;
    const statusText = {
        pending: 'En Attente',
        active: 'Validé',
        completed: 'Terminé',
        rejected: 'Refusé'
    }[challenge.status];
    
    const actionsHtml = showActions ? `
        <div class="admin-actions">
            <button class="btn-validate" onclick="validateChallenge(${challenge.id})">
                <i class="fas fa-check"></i> Valider
            </button>
            <button class="btn-reject" onclick="rejectChallenge(${challenge.id})">
                <i class="fas fa-times"></i> Refuser
            </button>
        </div>
    ` : '';
    
    return `
        <div class="challenge-card">
            <div class="challenge-header">
                <div>
                    <div class="challenge-title">${challenge.title}</div>
                    <div class="challenge-meta">
                        <span>👤 ${challenge.challenger}</span>
                        <span>📧 ${challenge.email || 'Non spécifié'}</span>
                        <span class="challenge-status ${statusClass}">${statusText}</span>
                    </div>
                </div>
            </div>
            <div class="challenge-description">${challenge.description}</div>
            <div class="challenge-footer">
                <div class="donation-amount">💰 ${challenge.amount}€</div>
                <div class="challenge-date">${formatDate(challenge.date)}</div>
            </div>
            ${challenge.paymentId ? `<div style="margin-top: 10px; padding: 8px; background: rgba(100, 255, 218, 0.1); border-radius: 6px; font-size: 0.8rem; color: #64ffda;">💳 ID: ${challenge.paymentId}</div>` : ''}
            ${actionsHtml}
        </div>
    `;
}

function sendPayPalLinkEmail(challenge) {
    // Préparer le mailto avec le lien PayPal
    const subject = encodeURIComponent("Votre défi a été validé ! Paiement requis");
    const body = encodeURIComponent(
        `Bonjour ${challenge.challenger},\n\nVotre défi intitulé "${challenge.title}" a été validé par l'administrateur !\n\nMerci de procéder au paiement de ${challenge.amount}€ via le lien PayPal suivant :\n\nhttps://www.paypal.com/paypalme/VSDonate/${challenge.amount}\n\nAprès réception du paiement, votre défi sera affiché publiquement.\n\nMerci pour votre participation !\n\nL'équipe VSDonate`
    );
    // Ouvre le client mail par défaut (mailto) avec l'email du challenger
    window.open(`mailto:${encodeURIComponent(challenge.email)}?subject=${subject}&body=${body}`);
}

function validateChallenge(challengeId) {
    const challenge = pendingChallenges.find(c => c.id === challengeId);
    if (!challenge) return;
    // Confirmer la validation
    if (!confirm(`Valider le défi "${challenge.title}" ?`)) return;
    // Changer le statut
    challenge.status = 'active';
    challenge.progress = 'Validé - En cours';
    // Déplacer vers les défis validés
    const existingChallenges = getAllChallenges();
    existingChallenges.unshift(challenge);
    localStorage.setItem('challengesData', JSON.stringify(existingChallenges));
    pendingChallenges = pendingChallenges.filter(c => c.id !== challengeId);
    // Sauvegarder
    saveChallengesData();
    // Re-render
    renderPendingChallenges();
    renderAllChallenges();
    // Mettre à jour les stats sur la page principale
    updateMainPageStats();
    showNotification(`✅ Défi "${challenge.title}" validé !`, 'success');
    // Envoyer le lien PayPal à l'utilisateur
    sendPayPalLinkEmail(challenge);
}

function rejectChallenge(challengeId) {
    const challenge = pendingChallenges.find(c => c.id === challengeId);
    if (!challenge) return;
    
    // Demander la raison du refus
    const reason = prompt(`Pourquoi refuser le défi "${challenge.title}" ?\n\nExemples:\n- Trop dangereux\n- Inapproprié\n- Impossible à réaliser`);
    if (!reason) return;
    
    // Changer le statut
    challenge.status = 'rejected';
    challenge.progress = `Refusé - ${reason}`;
    
    // Déplacer vers les défis refusés
    const existingChallenges = getAllChallenges();
    existingChallenges.unshift(challenge);
    localStorage.setItem('challengesData', JSON.stringify(existingChallenges));
    pendingChallenges = pendingChallenges.filter(c => c.id !== challengeId);
    
    // Sauvegarder
    saveChallengesData();
    
    // Re-render
    renderPendingChallenges();
    renderAllChallenges();
    
    showNotification(`❌ Défi "${challenge.title}" refusé`, 'error');
}

function saveChallengesData() {
    // Sauvegarder les défis en attente
    localStorage.setItem('pendingChallenges', JSON.stringify(pendingChallenges));
}

function getAllChallenges() {
    // Récupérer tous les défis depuis localStorage
    const stored = localStorage.getItem('challengesData');
    return stored ? JSON.parse(stored) : [];
}

function updateMainPageStats() {
    // Mettre à jour les statistiques sur la page principale
    const allChallenges = getAllChallenges();
    const validatedChallenges = allChallenges.filter(c => c.status === 'active' || c.status === 'completed');
    const totalDonations = validatedChallenges.reduce((sum, c) => sum + c.amount, 0);
    const activeChallenges = validatedChallenges.filter(c => c.progress !== 'Terminé').length;
    const completedChallenges = validatedChallenges.filter(c => c.progress === 'Terminé').length;
    
    // Mettre à jour les éléments de la page principale si ils existent
    const totalChallengesEl = document.querySelector('.stat-card:nth-child(1) .stat-number');
    const totalDonationsEl = document.querySelector('.stat-card:nth-child(2) .stat-number');
    const activeChallengesEl = document.querySelector('.stat-card:nth-child(3) .stat-number');
    const completedChallengesEl = document.querySelector('.stat-card:nth-child(4) .stat-number');
    
    if (totalChallengesEl) totalChallengesEl.textContent = validatedChallenges.length;
    if (totalDonationsEl) totalDonationsEl.textContent = `${totalDonations}€`;
    if (activeChallengesEl) activeChallengesEl.textContent = activeChallenges;
    if (completedChallengesEl) completedChallengesEl.textContent = completedChallenges;
    
    // Mettre à jour aussi challengesData pour la page principale
    if (typeof challengesData !== 'undefined') {
        challengesData.length = 0;
        challengesData.push(...validatedChallenges);
        
        // Mettre à jour l'affichage si les fonctions existent
        if (typeof renderChallenges === 'function') {
            renderChallenges();
        }
    }
    
    // Mettre à jour localStorage pour que la page principale puisse lire les nouvelles stats
    const stats = {
        totalChallenges: validatedChallenges.length,
        totalDonations: totalDonations,
        activeChallenges: activeChallenges,
        completedChallenges: completedChallenges
    };
    localStorage.setItem('siteStats', JSON.stringify(stats));
    localStorage.setItem('validatedChallenges', JSON.stringify(validatedChallenges));
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#00b894' : type === 'error' ? '#fd79a8' : '#64ffda';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        max-width: 300px;
        font-weight: 600;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// Fonction pour ajouter un défi en attente (appelée depuis la page principale)
function addPendingChallenge(challengeData) {
    const newChallenge = {
        id: Date.now(), // ID unique basé sur le timestamp
        title: challengeData.challengeTitle,
        description: challengeData.challengeDescription,
        challenger: challengeData.challengerName,
        email: challengeData.challengerEmail, // Ajout de l'email du challenger
        amount: parseFloat(challengeData.donationAmount),
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        progress: 'En attente de validation',
        paymentId: challengeData.paymentId
    };
    
    // Charger les défis en attente existants
    const stored = localStorage.getItem('pendingChallenges');
    let pending = stored ? JSON.parse(stored) : [];
    
    // Ajouter le nouveau défi
    pending.unshift(newChallenge);
    
    // Sauvegarder
    localStorage.setItem('pendingChallenges', JSON.stringify(pending));
    
    return newChallenge;
}

// Export pour utilisation dans script.js
if (typeof window !== 'undefined') {
    window.addPendingChallenge = addPendingChallenge;
}