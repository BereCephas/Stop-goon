// Importer le script de blocage d'url
import HttpBlocker from './http_blocker.js';

// element du DOM       
        const successMessage = document.getElementById('successMessage');
        const showBlockedBtn = document.getElementById('showBlockedBtn');
        const blockedSitesContainer = document.getElementById('blockedSitesContainer');
        const blockedSitesGrid = document.getElementById('blockedSitesGrid');

/**
 * PARTIE BLOCAGE DE SITES ET AJOUT DE SITES A BLOQUER
 */


// Auto-initialisation au démarrage
chrome.runtime.onStartup.addListener(async () => {
    const result = await HttpBlocker.initialize();
    console.log('Extension initialisée:', result);
});

// Ajouter un site
document.getElementById('addBtn').onclick = async () => {
    const domain = document.getElementById('domainInput').value;
    const result = await HttpBlocker.addSite(domain);
    console.log("add");
    if (result.success) {
        alert(result.message);
        loadSites(); // Recharger la liste
    } else {
        alert('Erreur: ' + result.error);
    }
};

// Supprimer un site utilisateur
async function removeSite(ruleId) {
    const result = await HttpBlocker.removeSite(ruleId);
    if (result.success) {
        alert(result.message);
        loadSites();
    }
}

/**
 * PARTIE UI/UX
 */

let isBlockedSitesVisible = false;
        
// Fonction pour afficher le message de succès
     function showSuccessMessage() {
            successMessage.classList.add('show');
            setTimeout(() => {
                successMessage.classList.remove('show');
            }, 3000);
        }

// Charger tous les sites
async function loadSites() {
    const result = await HttpBlocker.getSites();
    return result.rules
}

let blockedSites=[];

function createSiteCard(site) {
    const card = document.createElement('div');
    const site_id = `${site.id}`;
    card.className = 'site-card';
    card.innerHTML = `
        <div class="site-info">
            <div class="site-name">${site.domain}</div>
        </div>
        <button class="delete-btn" data-site-id="${site_id}">
            🗑️ Supprimer
        </button>
    `;
    
    // Ajouter l'event listener après la création
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', function(event) {
        const siteId = event.target.getAttribute('data-site-id');
        handleDeleteSite(siteId);
    });
    
    return card;
}

// Fonction appelée lors du clic sur supprimer
function handleDeleteSite(siteId) {
    console.log('Suppression du site avec ID:', siteId);
    
    // Confirmation avant suppression
    if (confirm('Êtes-vous sûr de vouloir supprimer ce site ?')) {
        // Votre logique de suppression ici
        removeSite(siteId);
        renderBlockedSites();
    }
}

        // Fonction pour afficher les sites bloqués
        function renderBlockedSites() {
            loadSites().then((sites) => {
            blockedSites = sites;
            blockedSitesGrid.innerHTML = '';
            if (blockedSites.length === 0) {
                blockedSitesGrid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🚫</div>
                        <div class="empty-state-text">Aucun site bloqué pour le moment</div>
                    </div>
                `;
            } else {
                blockedSites.forEach(site => {
                    const card = createSiteCard(site);
                    blockedSitesGrid.appendChild(card);
                });
            }

    });
            
        }

        // Fonction pour basculer l'affichage des sites bloqués
        function toggleBlockedSites() {
            isBlockedSitesVisible = !isBlockedSitesVisible;
            
            if (isBlockedSitesVisible) {
                renderBlockedSites();
                blockedSitesContainer.classList.add('show');
                showBlockedBtn.innerHTML = '📋 Masquer les sites bloqués';
            } else {
                blockedSitesContainer.classList.remove('show');
                showBlockedBtn.innerHTML = '📋 Afficher les sites bloqués';
                blockedSitesGrid.innerHTML = ``;
            }
        }

        // Écouteurs d'événements
        showBlockedBtn.addEventListener('click', toggleBlockedSites);


        // Animation d'entrée pour les boutons au chargement
        window.addEventListener('load', function() {
            const buttons = document.querySelectorAll('.add-btn, .show-blocked-btn');
            buttons.forEach((btn, index) => {
                setTimeout(() => {
                    btn.style.transform = 'scale(1)';
                }, index * 100);
            });
        });
