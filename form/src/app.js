/* ==========================================================================
   MAIN APP ENTRY POINT (src/app.js)
   Form Sharing Engine, Standalone Participant View & Multi-Form Manager
   ========================================================================== */

import { appStore } from './core/store.js';
import { BUILTIN_FORM_DEFINITIONS } from './config/formDefinitions.js';
import { STORAGE_KEYS } from './config/appConstants.js';
import { getResponses, getCustomForms, loadDraft } from './core/apiService.js';
import { copyTextToClipboard } from './utils/stringHelpers.js';
import { setupFormWizard } from './components/FormWizard.js';
import { setupResponseTable } from './components/ResponseTable.js';
import { setupFormBuilder } from './components/Builder.js';
import { setupAuthModal } from './components/AuthModal.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Detect URL Slug (?f=slug or #slug)
    const urlParams = new URLSearchParams(window.location.search);
    const hasFormParam = urlParams.has('f') || urlParams.has('form') || (window.location.hash && window.location.hash.length > 1);
    
    let initialSlug = urlParams.get('f') || urlParams.get('form');
    if (!initialSlug && window.location.hash) {
        initialSlug = window.location.hash.substring(1);
    }
    if (!initialSlug) initialSlug = 'feam-2026';

    // 2. Set Standalone Participant View Mode if a specific form link was opened
    if (hasFormParam) {
        document.body.classList.add('standalone-form-mode');
    } else {
        document.body.classList.remove('standalone-form-mode');
    }

    // Global helper to toggle standalone mode & exit preview
    window.toggleStandaloneMode = (enable) => {
        if (enable) document.body.classList.add('standalone-form-mode');
        else document.body.classList.remove('standalone-form-mode');
    };

    window.exitPreviewToCatalog = () => {
        document.body.classList.remove('standalone-form-mode');
        const previewBar = document.getElementById('form-preview-bar');
        if (previewBar) previewBar.style.display = 'none';
        appStore.setState({ activeTab: 'fill' });
        const catalogSec = document.querySelector('.portal-gallery-section');
        if (catalogSec) catalogSec.scrollIntoView({ behavior: 'smooth' });
    };

    // 3. Load Stored Data
    const storedResponses = getResponses();
    const storedCustomForms = getCustomForms();
    const isAuth = sessionStorage.getItem(STORAGE_KEYS.AUTH_STATE) === 'true';

    // Merge Builtin + Custom Form Definitions
    const mergedDefinitions = { ...BUILTIN_FORM_DEFINITIONS };
    storedCustomForms.forEach(form => {
        mergedDefinitions[form.id] = form;
    });

    if (!mergedDefinitions[initialSlug]) {
        initialSlug = 'feam-2026';
    }

    // 4. Load Draft for Initial Form
    const initialDraft = loadDraft(initialSlug);

    // 5. Initialize Store State
    appStore.setState({
        currentFormId: initialSlug,
        currentStep: 1,
        formData: initialDraft,
        responses: storedResponses,
        customForms: storedCustomForms,
        formDefinitions: mergedDefinitions,
        isAuthenticated: isAuth,
        activeTab: 'fill'
    });

    // 6. Initialize Components & Sharing Engine
    const rootContainer = document.body;
    setupAuthModal(rootContainer, appStore);
    setupFormWizard(rootContainer, appStore);
    setupResponseTable(rootContainer, appStore);
    setupFormBuilder(rootContainer, appStore);
    setupShareModal(rootContainer, appStore);

    // 7. Bind Global Events & Switchers
    bindGlobalEvents(rootContainer, appStore);

    // 8. Subscribe Global UI Updates
    appStore.subscribe(state => {
        updateTabVisibility(state);
        updateSwitcherPills(state);
    });

    updateTabVisibility(appStore.getState());
    updateSwitcherPills(appStore.getState());
});

function setupShareModal(container, store) {
    const shareModal = container.querySelector('#form-share-modal');
    if (!shareModal) return;

    window.openFormShareModal = (formId) => {
        const state = store.getState();
        const f = state.formDefinitions[formId] || state.formDefinitions['feam-2026'];
        if (!f) return;

        const directUrl = `${window.location.origin}/form/?f=${f.id}`;
        const iframeCode = `<iframe src="${directUrl}" width="100%" height="750px" frameborder="0" style="border:none; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,0.1);"></iframe>`;

        const titleElem = shareModal.querySelector('#share-modal-form-title');
        const badgeElem = shareModal.querySelector('#share-modal-form-badge');
        const urlInput = shareModal.querySelector('#share-modal-direct-url');
        const iframeInput = shareModal.querySelector('#share-modal-iframe-code');

        if (titleElem) titleElem.innerText = f.title;
        if (badgeElem) badgeElem.innerText = (f.category || 'FORM').toUpperCase();
        if (urlInput) urlInput.value = directUrl;
        if (iframeInput) iframeInput.value = iframeCode;

        // Social Share Links
        const btnWa = shareModal.querySelector('#btn-share-whatsapp');
        const btnLi = shareModal.querySelector('#btn-share-linkedin');
        const btnMail = shareModal.querySelector('#btn-share-email');

        const shareMessage = `${f.title} - Kayıt Formu: ${directUrl}`;

        if (btnWa) btnWa.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
        if (btnLi) btnLi.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(directUrl)}`;
        if (btnMail) btnMail.href = `mailto:?subject=${encodeURIComponent(f.title + ' Kayıt Formu')}&body=${encodeURIComponent(shareMessage)}`;

        // Copy Buttons
        const copyUrlBtn = shareModal.querySelector('#btn-copy-share-url');
        const copyIframeBtn = shareModal.querySelector('#btn-copy-iframe-code');

        if (copyUrlBtn) {
            copyUrlBtn.onclick = () => copyTextToClipboard(directUrl, '✅ Form özel bağlantısı panoya kopyalandı!');
        }
        if (copyIframeBtn) {
            copyIframeBtn.onclick = () => copyTextToClipboard(iframeCode, '✅ HTML iFrame gömme kodu panoya kopyalandı!');
        }

        shareModal.classList.add('active');
    };

    // Close Actions
    const closeBtn = shareModal.querySelector('#btn-close-share-modal');
    const doneBtn = shareModal.querySelector('#btn-done-share-modal');

    if (closeBtn) closeBtn.onclick = () => shareModal.classList.remove('active');
    if (doneBtn) doneBtn.onclick = () => shareModal.classList.remove('active');
}

function bindGlobalEvents(container, store) {
    // Tab Buttons
    container.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            const targetTab = btn.id.replace('tab-', '').replace('-btn', '');
            if (targetTab === 'responses' || targetTab === 'builder') {
                if (window.requestAuthTabSwitch) {
                    window.requestAuthTabSwitch(targetTab);
                }
            } else {
                store.setState({ activeTab: targetTab });
            }
        };
    });

    // Form Switcher Pills
    container.querySelectorAll('.switcher-pill').forEach(pill => {
        pill.onclick = () => {
            const formId = pill.dataset.formId;
            if (formId && store.getState().formDefinitions[formId]) {
                const draft = loadDraft(formId);
                store.setState({
                    currentFormId: formId,
                    currentStep: 1,
                    formData: draft
                });
            }
        };
    });

    // KVKK Modal Close / Accept
    const kvkkModal = container.querySelector('#kvkk-modal');
    const closeKvkk = container.querySelector('#btn-close-kvkk-modal');
    const acceptKvkk = container.querySelector('#btn-accept-kvkk-modal');

    if (closeKvkk && kvkkModal) {
        closeKvkk.onclick = () => kvkkModal.classList.remove('active');
    }
    if (acceptKvkk && kvkkModal) {
        acceptKvkk.onclick = () => {
            store.setFormData('kvkk', true);
            kvkkModal.classList.remove('active');
        };
    }

    // Success Modal Close
    const successModal = container.querySelector('#form-success-modal');
    const closeSuccess = container.querySelector('#btn-close-success-modal');
    if (closeSuccess && successModal) {
        closeSuccess.onclick = () => successModal.classList.remove('active');
    }

    // Response Detail Modal Close
    const detailModal = container.querySelector('#response-detail-modal');
    const closeDetail = container.querySelector('#btn-close-detail-modal');
    if (closeDetail && detailModal) {
        closeDetail.onclick = () => detailModal.classList.remove('active');
    }
}

function updateTabVisibility(state) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const activeBtn = document.getElementById(`tab-${state.activeTab}-btn`);
    const activeTab = document.getElementById(`tab-${state.activeTab}`);

    if (activeBtn) activeBtn.classList.add('active');
    if (activeTab) activeTab.classList.add('active');
}

function updateSwitcherPills(state) {
    document.querySelectorAll('.switcher-pill').forEach(pill => {
        pill.classList.remove('active');
        if (pill.dataset.formId === state.currentFormId) {
            pill.classList.add('active');
        }
    });
}
