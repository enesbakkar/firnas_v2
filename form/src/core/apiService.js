/* ==========================================================================
   API & STORAGE SERVICE (src/core/apiService.js)
   Google Apps Script Backend + localStorage Fallback
   ========================================================================== */

import { STORAGE_KEYS, GAS_BACKEND_URL, IS_GAS_CONFIGURED } from '../config/appConstants.js';

// ─── ADMIN TOKEN HELPERS ──────────────────────────────────────────────────
export function getAdminToken() {
    return sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || '';
}

export function setAdminToken(token, expiresIn) {
    sessionStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
    const exp = Date.now() + ((expiresIn || 86400) * 1000);
    sessionStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN_EXPIRES, String(exp));
}

export function clearAdminToken() {
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN_EXPIRES);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
}

export function isAdminTokenValid() {
    const token = getAdminToken();
    const exp = parseInt(sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN_EXPIRES) || '0');
    return !!token && Date.now() < exp;
}

// ─── GAS API ÇAĞRISI ──────────────────────────────────────────────────────
async function gasPost(action, body = {}) {
    const resp = await fetch(`${GAS_BACKEND_URL}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, action })
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
}

async function gasGet(action, params = {}) {
    const qs = new URLSearchParams({ action, ...params }).toString();
    const resp = await fetch(`${GAS_BACKEND_URL}?${qs}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
}

// ─── YÖNETİCİ GİRİŞİ ─────────────────────────────────────────────────────
export async function loginAdmin(password) {
    if (!IS_GAS_CONFIGURED) {
        // GAS kurulmamışsa eski hash tabanlı offline doğrulamaya dön
        return { success: false, error: 'GAS backend henüz kurulmadı. form/gas/KURULUM.md dosyasını takip edin.', offline: true };
    }
    try {
        const result = await gasPost('login', { password });
        if (result.success && result.data && result.data.adminToken) {
            setAdminToken(result.data.adminToken, result.data.expiresIn);
            sessionStorage.setItem(STORAGE_KEYS.AUTH_STATE, 'true');
        }
        return result;
    } catch (err) {
        return { success: false, error: 'Sunucuya bağlanılamadı: ' + err.message };
    }
}

// ─── YANIT GÖNDER ─────────────────────────────────────────────────────────
export async function submitResponse(responseData) {
    // Her zaman önce localStorage'a yedekle (çevrimdışı güvence)
    saveResponseToLocal(responseData);

    if (!IS_GAS_CONFIGURED) {
        console.warn('GAS backend kurulmadı — yanıt sadece tarayıcıda saklandı.');
        return { success: true, local: true, data: { refCode: responseData.refCode } };
    }

    try {
        const result = await gasPost('submitResponse', responseData);
        if (!result.success) {
            console.warn('GAS yanıt hatası:', result.error);
        }
        return result;
    } catch (err) {
        console.warn('GAS bağlantı hatası, sadece yerel kayıt:', err.message);
        return { success: true, local: true, data: { refCode: responseData.refCode } };
    }
}

// ─── YANITILAR GETİR ──────────────────────────────────────────────────────
export async function fetchResponses(formSlug) {
    if (!IS_GAS_CONFIGURED) {
        // Offline: localStorage'dan getir
        return { success: true, local: true, data: getLocalResponses() };
    }
    try {
        const token = getAdminToken();
        const params = { adminToken: token };
        if (formSlug && formSlug !== 'all') params.formSlug = formSlug;
        const result = await gasGet('getResponses', params);
        if (result.success) {
            // Local cache'i de güncelle
            localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(result.data));
        }
        return result;
    } catch (err) {
        return { success: true, local: true, data: getLocalResponses() };
    }
}

// ─── YANIT SİL ────────────────────────────────────────────────────────────
export async function deleteResponseByRefCode(refCode) {
    // Yerel listeden hemen çıkar (anlık UI güncelleme)
    const local = getLocalResponses().filter(r => r.refCode !== refCode);
    localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(local));

    if (!IS_GAS_CONFIGURED) return { success: true, local: true };
    try {
        const token = getAdminToken();
        return await gasPost('deleteResponse', { adminToken: token, refCode });
    } catch (err) {
        return { success: true, local: true };
    }
}

// ─── TÜM YANITILAR SİL ────────────────────────────────────────────────────
export async function clearAllResponses(formSlug) {
    // Yerel liste temizle
    if (formSlug && formSlug !== 'all') {
        const remaining = getLocalResponses().filter(r => r.formSlug !== formSlug);
        localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(remaining));
    } else {
        localStorage.removeItem(STORAGE_KEYS.RESPONSES);
    }

    if (!IS_GAS_CONFIGURED) return { success: true, local: true };
    try {
        const token = getAdminToken();
        return await gasPost('clearAll', { adminToken: token, formSlug: formSlug || null });
    } catch (err) {
        return { success: true, local: true };
    }
}

// ─── CSV DIŞA AKTARMA ─────────────────────────────────────────────────────
export async function exportResponsesCSV(formSlug) {
    if (!IS_GAS_CONFIGURED) {
        // Offline: yerel veriden CSV üret
        return { success: false, error: 'GAS backend kurulmadı. Yerel CSV için ResponseTable\'ı kullanın.' };
    }
    try {
        const token = getAdminToken();
        const params = { adminToken: token };
        if (formSlug && formSlug !== 'all') params.formSlug = formSlug;
        const qs = new URLSearchParams({ action: 'exportCSV', ...params }).toString();
        const url = `${GAS_BACKEND_URL}?${qs}`;
        // CSV doğrudan indir
        const link = document.createElement('a');
        link.href = url;
        link.download = `Firnas_Yanitlar_${formSlug || 'tumu'}_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// ─── FORM KAYDET (Google Sheets'e) ────────────────────────────────────────
export async function saveCustomForm(formDef) {
    // Her zaman localStorage'a kaydet (hızlı erişim için)
    saveFormToLocal(formDef);

    if (!IS_GAS_CONFIGURED) {
        return { success: true, local: true };
    }
    try {
        const token = getAdminToken();
        return await gasPost('saveForm', { adminToken: token, formDef });
    } catch (err) {
        return { success: true, local: true };
    }
}

// ─── FORMLAR GETİR ────────────────────────────────────────────────────────
export async function fetchForms() {
    if (!IS_GAS_CONFIGURED) {
        return { success: true, local: true, data: getCustomForms() };
    }
    try {
        const result = await gasGet('getForms', {});
        if (result.success && result.data) {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_FORMS, JSON.stringify(result.data));
        }
        return result;
    } catch (err) {
        return { success: true, local: true, data: getCustomForms() };
    }
}

// ─── DOSYA YÜKLEME (Google Drive) ─────────────────────────────────────────
export async function uploadFileToDrive(file) {
    if (!IS_GAS_CONFIGURED) {
        return { success: false, error: 'GAS backend kurulmamış. Dosya URL yapıştırarak ekleyin.' };
    }
    try {
        const token = getAdminToken();
        // Dosyayı base64'e çevir
        const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        return await gasPost('uploadFile', {
            adminToken: token,
            fileData: base64,
            fileName: file.name,
            mimeType: file.type
        });
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// ─── YEREL DEPOLAMA (localStorage Fallback) ───────────────────────────────
export function saveResponseToLocal(responseData) {
    try {
        const responses = getLocalResponses();
        // Duplicate kontrolü
        const exists = responses.some(r => r.refCode === responseData.refCode);
        if (!exists) responses.unshift(responseData);
        localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(responses));
        return responses;
    } catch (err) {
        console.warn('Yerel kayıt hatası:', err);
        return [];
    }
}

export function getLocalResponses() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.RESPONSES);
        return data ? JSON.parse(data) : [];
    } catch (err) {
        return [];
    }
}

// Eski senkron getResponses() → yerel veri döner (geriye dönük uyum)
export function getResponses() {
    return getLocalResponses();
}

function saveFormToLocal(formDef) {
    try {
        const forms = getCustomForms();
        const idx = forms.findIndex(f => f.id === formDef.id);
        if (idx >= 0) forms[idx] = formDef; else forms.push(formDef);
        localStorage.setItem(STORAGE_KEYS.CUSTOM_FORMS, JSON.stringify(forms));
        return forms;
    } catch (err) {
        return [];
    }
}

export function getCustomForms() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_FORMS);
        return data ? JSON.parse(data) : [];
    } catch (err) {
        return [];
    }
}

// ─── TASLAK (Draft) ───────────────────────────────────────────────────────
export function saveDraft(formId, formData) {
    try {
        sessionStorage.setItem(`${STORAGE_KEYS.DRAFT_PREFIX}${formId}`, JSON.stringify(formData));
    } catch (err) {}
}

export function loadDraft(formId) {
    try {
        const data = sessionStorage.getItem(`${STORAGE_KEYS.DRAFT_PREFIX}${formId}`);
        return data ? JSON.parse(data) : {};
    } catch (err) {
        return {};
    }
}

export function clearDraft(formId) {
    try {
        sessionStorage.removeItem(`${STORAGE_KEYS.DRAFT_PREFIX}${formId}`);
    } catch (err) {}
}

// postToGoogleSheets kept as no-op for backward compatibility with any remaining import
export async function postToGoogleSheets(responseData) {
    // Replaced by submitResponse() — this is a no-op kept for import compatibility
    return submitResponse(responseData);
}
