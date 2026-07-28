/* ==========================================================================
   API & STORAGE SERVICE (src/core/apiService.js)
   ========================================================================== */

import { STORAGE_KEYS, DEFAULT_WEBHOOK_URL } from '../config/appConstants.js';

export async function postToGoogleSheets(responseData) {
    try {
        const webhookUrl = localStorage.getItem(STORAGE_KEYS.WEBHOOK_URL) || DEFAULT_WEBHOOK_URL;
        if (webhookUrl && webhookUrl.startsWith('http')) {
            await fetch(webhookUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(responseData)
            });
        }
    } catch (err) {
        console.warn('Google Sheets Webhook POST warning:', err);
    }
}

export function saveResponseToLocal(responseData) {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.RESPONSES);
        const responses = stored ? JSON.parse(stored) : [];
        responses.unshift(responseData);
        localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(responses));
        return responses;
    } catch (err) {
        console.warn('Local responses save warning:', err);
        return [];
    }
}

export function getResponses() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.RESPONSES);
        return data ? JSON.parse(data) : [];
    } catch (err) {
        return [];
    }
}

export function deleteResponse(index) {
    const responses = getResponses();
    responses.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(responses));
    return responses;
}

export function clearAllResponses() {
    localStorage.removeItem(STORAGE_KEYS.RESPONSES);
    return [];
}

export function saveDraft(formId, formData) {
    try {
        const key = `${STORAGE_KEYS.DRAFT_PREFIX}${formId}`;
        sessionStorage.setItem(key, JSON.stringify(formData));
    } catch (err) {
        console.warn('Draft save warning:', err);
    }
}

export function loadDraft(formId) {
    try {
        const key = `${STORAGE_KEYS.DRAFT_PREFIX}${formId}`;
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : {};
    } catch (err) {
        return {};
    }
}

export function clearDraft(formId) {
    try {
        const key = `${STORAGE_KEYS.DRAFT_PREFIX}${formId}`;
        sessionStorage.removeItem(key);
    } catch (err) {}
}

export function getCustomForms() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_FORMS);
        return data ? JSON.parse(data) : [];
    } catch (err) {
        return [];
    }
}

export function saveCustomForm(formObj) {
    try {
        const customForms = getCustomForms();
        const existingIdx = customForms.findIndex(f => f.id === formObj.id);
        if (existingIdx >= 0) {
            customForms[existingIdx] = formObj;
        } else {
            customForms.push(formObj);
        }
        localStorage.setItem(STORAGE_KEYS.CUSTOM_FORMS, JSON.stringify(customForms));
        return customForms;
    } catch (err) {
        console.warn('Save custom form warning:', err);
        return [];
    }
}
