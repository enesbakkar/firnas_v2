/* ==========================================================================
   MAIN APP ENTRY POINT (src/app.js)
   ========================================================================== */

import { appStore } from './core/store.js';
import { BUILTIN_FORM_DEFINITIONS } from './config/formDefinitions.js';
import { STORAGE_KEYS } from './config/appConstants.js';
import { getResponses, getCustomForms, loadDraft } from './core/apiService.js';
import { setupFormWizard } from './components/FormWizard.js';
import { setupResponseTable } from './components/ResponseTable.js';
import { setupFormBuilder } from './components/Builder.js';
import { setupAuthModal } from './components/AuthModal.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Detect URL Slug (?f=slug or #slug)
    const urlParams = new URLSearchParams(window.location.search);
    let initialSlug = urlParams.get('f') || urlParams.get('form');
    if (!initialSlug && window.location.hash) {
        initialSlug = window.location.hash.substring(1);
    }
    if (!initialSlug) initialSlug = 'feam-2026';

    // 2. Load Stored Data
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

    // 3. Load Draft for Initial Form
    const initialDraft = loadDraft(initialSlug);

    // 4. Initialize Store State
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

    // 5. Initialize Components
    const rootContainer = document.body;
    setupAuthModal(rootContainer, appStore);
    setupFormWizard(rootContainer, appStore);
    setupResponseTable(rootContainer, appStore);
    setupFormBuilder(rootContainer, appStore);

    // 6. Bind Tab Switching & Form Switcher Bar
    bindGlobalEvents(rootContainer, appStore);

    // 7. Subscribe Global UI Updates (Tabs & Modal visibility)
    appStore.subscribe(state => {
        updateTabVisibility(state);
        updateSwitcherPills(state);
    });

    updateTabVisibility(appStore.getState());
    updateSwitcherPills(appStore.getState());
});

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
            const state = store.getState();
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
