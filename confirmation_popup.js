chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("Content script received message:", request.action);
    if (request.action === "showConfirmationPopup") {
        showConfirmationPopup(request.siteIdToDelete);
    }
    // No need to return true if you're not calling sendResponse asynchronously here,
    // but it doesn't hurt.
    // If you add asynchronous operations within this listener later, remember to return true.
    return true;
});

// Function to create and display the confirmation popup
function showConfirmationPopup(siteId) {
    // Check if a popup already exists to prevent multiple popups
    if (document.getElementById('stop-goon-confirmation-popup-overlay')) {
        return;
    }

const questions = [
    "Êtes-vous certain(e) que débloquer ce site ne mettra pas en péril vos progrès ?",
    "Avez-vous bien réfléchi aux conséquences négatives de revisiter ce type de contenu ?",
    "Ce site vous a déjà causé du tort. Êtes-vous sûr(e) de vouloir reprendre ce risque ?",
    "Comprenez-vous que cette décision pourrait anéantir les efforts que vous avez déjà faits ?",
    "Pensez-vous vraiment que le déblocage de ce site s'aligne avec vos objectifs à long terme de bien-être ?",
    "N'y a-t-il pas une raison précise qui vous a poussé(e) à bloquer ce site initialement ?",
    "Êtes-vous prêt(e) à faire face aux mêmes défis ou tentations que par le passé ?",
    "Est-ce que céder à cette envie du moment est plus important que votre protection durable ?",
    "Confirmez-vous vouloir reprendre le chemin d'un comportement que vous avez choisi de quitter ?",
    "Êtes-vous absolument, catégoriquement certain(e) que ce déblocage est dans votre meilleur intérêt ?"
];

    const popupHtml = `
        <div id="stop-goon-confirmation-popup-overlay">
            <div id="stop-goon-confirmation-popup">
                <h2>Confirmation de Suppression</h2>
                <p>Pour confirmer la suppression de ce site, veuillez répondre "Oui" à toutes les questions ci-dessous :</p>
                <form id="stop-goon-confirmation-form">
                    ${questions.map((q, index) => `
                        <div class="question-item">
                            <label>${index + 1}. ${q}</label>
                            <div class="radio-group">
                                <input type="radio" id="q${index}-yes" name="q${index}" value="yes" required>
                                <label for="q${index}-yes">Oui</label>
                                <input type="radio" id="q${index}-no" name="q${index}" value="no">
                                <label for="q${index}-no">Non</label>
                            </div>
                        </div>
                    `).join('')}
                    <div class="popup-actions">
                        <button type="submit" id="stop-goon-confirm-btn">Confirmer la suppression</button>
                        <button type="button" id="stop-goon-cancel-btn">Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', popupHtml);

    // Add event listeners
    const form = document.getElementById('stop-goon-confirmation-form');
    const cancelButton = document.getElementById('stop-goon-cancel-btn');
    const overlay = document.getElementById('stop-goon-confirmation-popup-overlay');

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        let allYes = true;
        for (let i = 0; i < questions.length; i++) {
            const selectedValue = document.querySelector(`input[name="q${i}"]:checked`);
            if (!selectedValue || selectedValue.value !== 'yes') {
                allYes = false;
                break;
            }
        }

        if (allYes) {
            chrome.runtime.sendMessage({ action: "deleteConfirmed", siteId: siteId });
            alert("Site supprimé avec succès !"); // Or show a more integrated success message
        } else {
            chrome.runtime.sendMessage({ action: "deleteCanceled" });
            alert("Suppression annulée car toutes les conditions n'ont pas été remplies.");
        }
        overlay.remove(); // Remove the popup regardless of outcome
    });

    cancelButton.addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: "deleteCanceled" });
        overlay.remove();
    });
}
