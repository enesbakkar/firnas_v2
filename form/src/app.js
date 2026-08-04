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
        document.body.classList.remove('dashboard-view', 'form-filling-view');
    } else {
        document.body.classList.add('dashboard-view');
        document.body.classList.remove('standalone-form-mode', 'form-filling-view');
    }

    // Global helper to toggle standalone mode & exit preview
    window.toggleStandaloneMode = (enable) => {
        if (enable) {
            document.body.classList.add('standalone-form-mode');
            document.body.classList.remove('dashboard-view', 'form-filling-view');
        } else {
            document.body.classList.add('dashboard-view');
            document.body.classList.remove('standalone-form-mode', 'form-filling-view');
        }
    };

    window.exitPreviewToCatalog = () => {
        document.body.classList.add('dashboard-view');
        document.body.classList.remove('standalone-form-mode', 'form-filling-view');
        const previewBar = document.getElementById('form-preview-bar');
        if (previewBar) previewBar.style.display = 'none';

        const state = appStore.getState();
        if (!state.isAuthenticated) {
            const overlay = document.getElementById('auth-lock-overlay');
            if (overlay) overlay.classList.add('active');
        } else {
            appStore.setState({ activeTab: 'fill' });
            const catalogSec = document.querySelector('.portal-gallery-section');
            if (catalogSec) catalogSec.scrollIntoView({ behavior: 'smooth' });
        }
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

        const basePath = window.location.origin + window.location.pathname;
        const directUrl = `${basePath}?f=${f.id}`;
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
    // Global Modal Escape Key Listener (Accessibility)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        }
    });

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
        closeSuccess.onclick = () => {
            if (window.successRedirectTimer) clearInterval(window.successRedirectTimer);
            successModal.classList.remove('active');
        };
    }


    // Response Detail Modal Close
    const detailModal = container.querySelector('#response-detail-modal');
    const closeDetail = container.querySelector('#btn-close-detail-modal');
    if (closeDetail && detailModal) {
        closeDetail.onclick = () => detailModal.classList.remove('active');
    }

    // Global Event Delegation for Preview Bar Buttons & Catalog Navigation
    document.addEventListener('click', (e) => {
        // Back to Catalog Button (From Preview Bar, Builder, or Navigation Header)
        const backBtn = e.target.closest('#btn-preview-back-catalog') || e.target.closest('#btn-nav-back-to-portal') || e.target.closest('#btn-back-from-builder') || e.target.closest('#btn-back-to-form-catalog');
        if (backBtn) {
            e.preventDefault();
            if (window.exitPreviewToCatalog) {
                window.exitPreviewToCatalog();
            } else {
                document.body.classList.add('dashboard-view');
                document.body.classList.remove('standalone-form-mode', 'form-filling-view');
                const previewBar = document.getElementById('form-preview-bar');
                if (previewBar) previewBar.style.display = 'none';
                store.setState({ activeTab: 'fill' });
            }
            return;
        }

        // Edit Form Button (From Preview Bar)
        const editBtn = e.target.closest('#btn-preview-edit-form');
        if (editBtn) {
            e.preventDefault();
            const currentF = store.getState().currentFormId;
            const previewBar = document.getElementById('form-preview-bar');
            if (previewBar) previewBar.style.display = 'none';

            document.body.classList.add('dashboard-view');
            document.body.classList.remove('form-filling-view', 'standalone-form-mode');

            if (window.editFormInBuilder) {
                window.editFormInBuilder(currentF);
            } else if (window.requestAuthTabSwitch) {
                window.requestAuthTabSwitch('builder');
            } else {
                store.setState({ activeTab: 'builder' });
            }
            return;
        }
    });

    // Builder Header Sub-Tabs & Navigation
    const btnQ = container.querySelector('#btn-builder-tab-questions');
    const btnR = container.querySelector('#btn-builder-tab-responses');
    const btnP = container.querySelector('#btn-builder-tab-preview');

    if (btnQ) {
        btnQ.onclick = () => {
            btnQ.classList.add('active');
            if (btnR) btnR.classList.remove('active');
            if (btnP) btnP.classList.remove('active');
            store.setState({ activeTab: 'builder' });
        };
    }

    if (btnR) {
        btnR.onclick = () => {
            const currentF = store.getState().currentFormId;
            if (window.requestAuthTabSwitch) {
                store.setState({ responseFilterFormId: currentF, selectedFormId: currentF });
                window.requestAuthTabSwitch('responses');
            } else {
                store.setState({ activeTab: 'responses', responseFilterFormId: currentF, selectedFormId: currentF });
            }
        };
    }

    if (btnP) {
        btnP.onclick = () => {
            const currentF = store.getState().currentFormId;
            const f = store.getState().formDefinitions[currentF];
            if (f) {
                document.body.classList.add('form-filling-view');
                document.body.classList.remove('dashboard-view', 'standalone-form-mode');
                const previewBar = container.querySelector('#form-preview-bar');
                const previewName = container.querySelector('#preview-bar-form-name');
                if (previewBar) previewBar.style.display = 'flex';
                if (previewName) previewName.innerText = `Şu an "${f.title}" formunu önizliyorsunuz.`;
                store.setState({ activeTab: 'fill', currentStep: 1 });
            }
        };
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
