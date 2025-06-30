/**
 * Bloqueur de requêtes HTTP - Programmation Fonctionnelle
 * Extension Chrome pour bloquer des sites web
 */

// ========== CONSTANTES ==========
const STORAGE_KEYS = {
    DEFAULT_RULES: 'default_blocking_rules',
    USER_RULES: 'user_blocking_rules',
    INSTALLED: 'extension_installed'
};

const RULE_TYPES = {
    DEFAULT: 'default',
    USER: 'user'
};

// ========== BASE DE DONNÉES INITIALE ==========
const getDefaultBlockingRules = () => [
    {
        id: 1,
        priority: 1,
        action: { type: "block" },
        condition: {
            urlFilter: "||pornhub.com/*",
            resourceTypes: ["main_frame"]
        },
        type: RULE_TYPES.DEFAULT,
        domain: "pornhub.com"
    },
    {
        id: 2,
        priority: 1,
        action: { type: "block" },
        condition: {
            urlFilter: "||xvideos.com/*",
            resourceTypes: ["main_frame"]
        },
        type: RULE_TYPES.DEFAULT,
        domain: "xvideos.com"
    },
    {
        id: 3,
        priority: 1,
        action: { type: "block" },
        condition: {
            urlFilter: "||xhamster.com/*",
            resourceTypes: ["main_frame"]
        },
        type: RULE_TYPES.DEFAULT,
        domain: "xhamster.com"
    },
    {
        id: 4,
        priority: 1,
        action: { type: "block" },
        condition: {
            urlFilter: "||youporn.com/*",
            resourceTypes: ["main_frame"]
        },
        type: RULE_TYPES.DEFAULT,
        domain: "youporn.com"
    },
    {
        id: 5,
        priority: 1,
        action: { type: "block" },
        condition: {
            urlFilter: "||redtube.com/*",
            resourceTypes: ["main_frame"]
        },
        type: RULE_TYPES.DEFAULT,
        domain: "redtube.com"
    },
    {
        id: 6,
        priority: 1,
        action: { type: "block" },
        condition: {
            urlFilter: "||bangbros.com/*",
            resourceTypes: ["main_frame"]
        },
        type: RULE_TYPES.DEFAULT,
        domain: "bangbros.com"
    },
    {
        id: 7,
        priority: 1,
        action: { type: "block" },
        condition: {
            urlFilter: "||porn.com/*",
            resourceTypes: ["main_frame"]
        },
        type: RULE_TYPES.DEFAULT,
        domain: "porn.com"
    },
    {
        id: 8,
        priority: 1,
        action: { type: "block" },
        condition: {
            urlFilter: "||theporndude.com/*",
            resourceTypes: ["main_frame"]
        },
        type: RULE_TYPES.DEFAULT,
        domain: "theporndude.com"
    }
];

// ========== UTILITAIRES ==========

/**
 * Nettoie et normalise un domaine
 */
const cleanDomain = (domain) => 
    domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]
        .trim()
        .toLowerCase();

/**
 * Valide un domaine
 */
const isValidDomain = (domain) => {
    const cleaned = cleanDomain(domain);
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return cleaned.length > 0 && domainRegex.test(cleaned);
};

/**
 * Crée une règle de blocage
 */
const createBlockingRule = (domain, id, priority = 1, type = RULE_TYPES.USER) => {
    const cleanedDomain = cleanDomain(domain);
    return {
        id,
        priority,
        action: { type: "block" },
        condition: {
            urlFilter: `||${cleanedDomain}/*`,
            resourceTypes: ["main_frame"]
        },
        type,
        domain: cleanedDomain
    };
};

/**
 * Trouve le prochain ID disponible
 */
const getNextId = (rules) => 
    rules.length === 0 ? 1 : Math.max(...rules.map(rule => rule.id)) + 1;

/**
 * Vérifie si un domaine existe déjà
 */
const domainExists = (rules, domain) => {
    const cleanedDomain = cleanDomain(domain);
    return rules.some(rule => rule.domain === cleanedDomain);
};

/**
 * Filtre les règles par type
 */
const filterRulesByType = (rules, type) => 
    rules.filter(rule => rule.type === type);

/**
 * Combine plusieurs tableaux de règles
 */
const combineRules = (...ruleArrays) => 
    ruleArrays.flat().filter(rule => rule != null);

// ========== GESTION DU STOCKAGE ==========

/**
 * Lit les données du localStorage
 */
const readFromStorage = async (key) => {
    try {
        const result = await chrome.storage.local.get([key]);
        return result[key] || null;
    } catch (error) {
        console.error(`Erreur lecture storage ${key}:`, error);
        return null;
    }
};

/**
 * Écrit les données dans le localStorage
 */
const writeToStorage = async (key, data) => {
    try {
        await chrome.storage.local.set({ [key]: data });
        return true;
    } catch (error) {
        console.error(`Erreur écriture storage ${key}:`, error);
        return false;
    }
};

/**
 * Lit les règles par défaut
 */
const readDefaultRules = () => readFromStorage(STORAGE_KEYS.DEFAULT_RULES);

/**
 * Sauvegarde les règles par défaut
 */
const writeDefaultRules = (rules) => writeToStorage(STORAGE_KEYS.DEFAULT_RULES, rules);

/**
 * Lit les règles utilisateur
 */
const readUserRules = () => readFromStorage(STORAGE_KEYS.USER_RULES);

/**
 * Sauvegarde les règles utilisateur
 */
const writeUserRules = (rules) => writeToStorage(STORAGE_KEYS.USER_RULES, rules);

/**
 * Vérifie si l'extension est installée pour la première fois
 */
const isFirstInstall = async () => {
    const installed = await readFromStorage(STORAGE_KEYS.INSTALLED);
    return installed !== true;
};

/**
 * Marque l'extension comme installée
 */
const markAsInstalled = () => writeToStorage(STORAGE_KEYS.INSTALLED, true);

// ========== GESTION DES RÈGLES ==========

/**
 * Initialise les règles par défaut lors de la première installation
 */
const initializeDefaultRules = async () => {
    if (await isFirstInstall()) {
        const defaultRules = getDefaultBlockingRules();
        await writeDefaultRules(defaultRules);
        await writeUserRules([]);
        await markAsInstalled();
        console.log('Règles par défaut initialisées:', defaultRules.length);
        return defaultRules;
    }
    return await readDefaultRules() || [];
};

/**
 * Récupère toutes les règles (par défaut + utilisateur)
 */
const getAllRules = async () => {
    const defaultRules = await readDefaultRules() || [];
    const userRules = await readUserRules() || [];
    return combineRules(defaultRules, userRules);
};

/**
 * Récupère uniquement les règles utilisateur
 */
const getUserRules = async () => {
    return await readUserRules() || [];
};

/**
 * Ajoute une nouvelle règle utilisateur
 */
const addUserRule = async (domain, priority = 1) => {
    // Validation
    if (!isValidDomain(domain)) {
        throw new Error('Domaine invalide');
    }

    const cleanedDomain = cleanDomain(domain);
    const allRules = await getAllRules();
    
    // Vérification des doublons
    if (domainExists(allRules, cleanedDomain)) {
        throw new Error(`Le domaine ${cleanedDomain} est déjà bloqué`);
    }

    // Création de la nouvelle règle
    const userRules = await getUserRules();
    const newId = getNextId(allRules);
    const newRule = createBlockingRule(cleanedDomain, newId, priority, RULE_TYPES.USER);
    
    // Sauvegarde
    const updatedUserRules = [...userRules, newRule];
    const success = await writeUserRules(updatedUserRules);
    
    if (!success) {
        throw new Error('Erreur lors de la sauvegarde');
    }

    return newRule;
};

/**
 * Supprime une règle utilisateur
 */
const removeUserRule = async (ruleId) => {
    const userRules = await getUserRules();
    const ruleIndex = userRules.findIndex(rule => rule.id === parseInt(ruleId));
    
    if (ruleIndex === -1) {
        throw new Error(`Règle utilisateur avec l'ID ${ruleId} introuvable`);
    }

    const removedRule = userRules[ruleIndex];
    const updatedUserRules = userRules.filter(rule => rule.id !== parseInt(ruleId));
    
    const success = await writeUserRules(updatedUserRules);
    if (!success) {
        throw new Error('Erreur lors de la suppression');
    }

    return removedRule;
};

/**
 * Supprime toutes les règles utilisateur
 */
const clearUserRules = async () => {
    const success = await writeUserRules([]);
    if (!success) {
        throw new Error('Erreur lors de la suppression');
    }
    return true;
};

// ========== GESTION DES RÈGLES CHROME ==========

/**
 * Met à jour les règles de blocage dans Chrome
 */
const updateChromeRules = async (rules) => {
    if (!chrome.declarativeNetRequest) {
        console.warn('declarativeNetRequest non disponible');
        return false;
    }

    try {
        // Supprimer toutes les règles existantes
        const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
        const existingRuleIds = existingRules.map(rule => rule.id);
        
        if (existingRuleIds.length > 0) {
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: existingRuleIds
            });
        }

        // Ajouter les nouvelles règles
        if (rules.length > 0) {
            const chromeRules = rules.map(rule => ({
                id: rule.id,
                priority: rule.priority,
                action: rule.action,
                condition: rule.condition
            }));

            await chrome.declarativeNetRequest.updateDynamicRules({
                addRules: chromeRules
            });
        }

        console.log(`Règles Chrome mises à jour: ${rules.length} règle(s)`);
        return true;
    } catch (error) {
        console.error('Erreur mise à jour règles Chrome:', error);
        return false;
    }
};

/**
 * Synchronise toutes les règles avec Chrome
 */
const syncRulesWithChrome = async () => {
    const allRules = await getAllRules();
    return await updateChromeRules(allRules);
};

// ========== FONCTIONS PUBLIQUES ==========

/**
 * Initialise l'extension
 */
const initializeExtension = async () => {
    try {
        await initializeDefaultRules();
        await syncRulesWithChrome();
        const allRules = await getAllRules();
        console.log(`Extension initialisée avec ${allRules.length} règle(s)`);
        return { success: true, rulesCount: allRules.length };
    } catch (error) {
        console.error('Erreur initialisation extension:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Ajoute un site à bloquer
 */
const addBlockedSite = async (domain, priority = 1) => {
    try {
        const newRule = await addUserRule(domain, priority);
        await syncRulesWithChrome();
        return { 
            success: true, 
            rule: newRule,
            message: `Site ${newRule.domain} ajouté à la liste de blocage`
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Supprime un site bloqué (uniquement les règles utilisateur)
 */
const removeBlockedSite = async (ruleId) => {
    try {
        const removedRule = await removeUserRule(ruleId);
        await syncRulesWithChrome();
        return { 
            success: true, 
            rule: removedRule,
            message: `Site ${removedRule.domain} supprimé de la liste de blocage`
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Récupère tous les sites bloqués
 */
const getBlockedSites = async () => {
    try {
        const allRules = await getAllRules();
        return { 
            success: true, 
            rules: allRules,
            defaultRules: filterRulesByType(allRules, RULE_TYPES.DEFAULT),
            userRules: filterRulesByType(allRules, RULE_TYPES.USER)
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Remet à zéro les règles utilisateur
 */
const resetUserRules = async () => {
    try {
        await clearUserRules();
        await syncRulesWithChrome();
        return { success: true, message: 'Règles utilisateur supprimées' };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ========== EXPORT ==========

// Fonctions principales pour l'extension
window.HttpBlocker = {
    // Initialisation
    initialize: initializeExtension,
    
    // Gestion des sites
    addSite: addBlockedSite,
    removeSite: removeBlockedSite,
    getSites: getBlockedSites,
    
    // Utilitaires
    resetUserSites: resetUserRules,
    sync: syncRulesWithChrome,
    
    // Validation
    isValidDomain: isValidDomain,
    cleanDomain: cleanDomain
};

// Auto-initialisation si dans le contexte Chrome
if (typeof chrome !== 'undefined' && chrome.storage) {
    initializeExtension();
}

export default HttpBlocker;