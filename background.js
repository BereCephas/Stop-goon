// background.js
import HttpBlocker from "./http_blocker.js";
// Function to check if a URL is valid for content script injection
// This mainly filters chrome://, about: and internal pages, but not necessarily error pages
function isValidUrlForInjection(url) {
    return url && (url.startsWith('http://') || url.startsWith('https://')) &&
           !url.startsWith('https://chromewebstore.google.com/'); // Exclude specific sites if needed
}

// Listen for when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            if (isValidUrlForInjection(tab.url)) {
                // We'll rely on the try-catch in executeScript to handle error pages
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['confirmation_popup.js']
                }).catch(error => {
                    // Log or ignore errors related to inaccessible frames (like error pages)
                    if (error.message.includes("Frame with ID 0 is showing error page")) {
                        console.warn(`Skipping injection for tab ${tab.id} (${tab.url}) because it's an error page.`);
                    } else {
                        console.warn(`Failed to inject JS script into tab ${tab.id} (${tab.url}):`, error.message);
                    }
                });

                chrome.scripting.insertCSS({
                    target: { tabId: tab.id },
                    files: ['confirmation_popup.css']
                }).catch(error => {
                     if (error.message.includes("Frame with ID 0 is showing error page")) {
                        console.warn(`Skipping CSS injection for tab ${tab.id} (${tab.url}) because it's an error page.`);
                    } else {
                        console.warn(`Failed to inject CSS into tab ${tab.id} (${tab.url}):`, error.message);
                    }
                });
            }
        });
    });
});

// Listener for messages from core.js (your popup)
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === "showConfirmationPopup") {
        const tabId = request.tabId;
        const siteIdToDelete = request.siteIdToDelete;

        let tab;
        try {
            tab = await chrome.tabs.get(tabId);
        } catch (error) {
            console.error(`Failed to get tab ${tabId}:`, error);
            sendResponse({ success: false, error: "Impossible de trouver l'onglet ciblé." });
            return true;
        }

        // Essential check for valid URL *before* attempting injection/message
        if (!isValidUrlForInjection(tab.url)) {
            console.warn(`Cannot show confirmation popup on this URL: ${tab.url}`);
            sendResponse({ success: false, error: "Impossible d'afficher la confirmation sur cette page (pages internes du navigateur, par exemple)." });
            return true;
        }

        try {
            // Attempt to inject content script and CSS.
            // This is the point where "Frame with ID 0 is showing error page" will occur
            // if the tab is displaying an error page.
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['confirmation_popup.js']
            });
            await chrome.scripting.insertCSS({
                target: { tabId: tabId },
                files: ['confirmation_popup.css']
            });
            console.log(`Content script and CSS ensured for tab ${tabId}.`);

            // Now send the message. If the script was just injected, its listener should be ready.
            await chrome.tabs.sendMessage(tabId, {
                action: "showConfirmationPopup",
                siteIdToDelete: siteIdToDelete
            });
            console.log(`Message sent to content script in tab ${tabId}.`);
            sendResponse({ success: true }); // Acknowledge message was sent successfully

        } catch (error) {
            // Catch specific errors related to inaccessible frames or connection issues
            if (error.message.includes("Frame with ID 0 is showing error page")) {
                console.error(`Cannot show confirmation popup on tab ${tabId} (${tab.url}): The page is showing an error page.`);
                sendResponse({ success: false, error: "Impossible d'afficher la confirmation : la page est en erreur ou non chargée." });
            } else if (error.message.includes("Could not establish connection. Receiving end does not exist.")) {
                 console.error(`Failed to send message to tab ${tabId} (${tab.url}): Content script not ready.`, error);
                 sendResponse({ success: false, error: "La page n'est pas prête pour afficher la confirmation. Veuillez recharger la page ou réessayer." });
            } else {
                console.error(`Unexpected error during content script injection or message sending to tab ${tabId}:`, error);
                sendResponse({ success: false, error: "Une erreur interne est survenue lors de l'affichage de la confirmation." });
            }
        }
    } else if (request.action === "deleteConfirmed") {
        console.log("Delete confirmed in background script for site ID:", request.siteId);
        try {
            const result = await HttpBlocker.removeSite(request.siteId);
            chrome.runtime.sendMessage({ action: "deletionResult", success: true, message: result.message });
        } catch (error) {
            console.error("Error during site deletion:", error);
            chrome.runtime.sendMessage({ action: "deletionResult", success: false, error: error.message || "Erreur lors de la suppression." });
        }
    } else if (request.action === "deleteCanceled") {
        console.log("Delete canceled in background script.");
        chrome.runtime.sendMessage({ action: "deletionResult", success: false, error: "Suppression annulée." });
    }
    return true;
});