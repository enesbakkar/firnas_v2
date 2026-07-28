/* ==========================================================================
   FORM WIZARD & DASHBOARD COMPONENT (src/components/FormWizard.js)
   Google Forms Gallery & Form Filling Engine
   ========================================================================== */

import { renderFormField } from './FormField.js';
import { validateStepFields } from '../core/validators.js';
import { saveDraft, clearDraft, postToGoogleSheets, saveResponseToLocal } from '../core/apiService.js';
import { generateRefCode } from '../utils/stringHelpers.js';

export function setupFormWizard(container, store) {
    let lastRenderedFormId = null;
    let lastRenderedStep = null;
    let errorsMap = {};
    let saveDraftDebounceTimer = null;

    function render() {
        const state = store.getState();
        const formDef = state.formDefinitions[state.currentFormId];
        if (!formDef) return;

        // Render Dashboard Gallery Cards
        renderDashboardGallery(container, state, store);

        // Render Header & Banner if form switched
        if (lastRenderedFormId !== state.currentFormId) {
            lastRenderedFormId = state.currentFormId;
            lastRenderedStep = null;
            renderFormHeader(formDef, state, store);
        }

        // Render Step Panels ONLY if step or form changed or error map exists
        const stepChanged = (lastRenderedStep !== state.currentStep);
        if (stepChanged || Object.keys(errorsMap).length > 0) {
            lastRenderedStep = state.currentStep;
            renderStepPanels(formDef, state, errorsMap);
            bindInputEvents(container, formDef, store);
        }

        // Update Progress Bar UI
        renderProgressUI(formDef, state);
    }

    function renderDashboardGallery(container, state, store) {
        const galleryContainer = container.querySelector('#portal-dashboard-gallery');
        if (!galleryContainer) return;

        const allFormIds = Object.keys(state.formDefinitions);

        galleryContainer.innerHTML = allFormIds.map(fId => {
            const f = state.formDefinitions[fId];
            const isSelected = (fId === state.currentFormId);
            const responsesCount = (state.responses || []).filter(r => (r.formSlug === fId || (!r.formSlug && fId === 'feam-2026'))).length;

            return `
                <div class="dashboard-form-card ${isSelected ? 'selected' : ''}">
                    <div class="card-top-row">
                        <div class="card-icon-box icon-cyan">
                            <i class="fas ${f.banner ? 'fa-image' : 'fa-file-signature'}"></i>
                        </div>
                        <span class="form-badge-tag tag-cyan">${f.category || 'FORM'}</span>
                    </div>
                    <h4>${f.title}</h4>
                    <p class="card-desc">${f.description ? (f.description.substring(0, 95) + '...') : ''}</p>
                    <div class="card-meta">
                        <span><i class="fas fa-users text-accent"></i> ${responsesCount} Katılımcı Kaydı</span>
                        <span><i class="fas fa-link"></i> ?f=${f.id}</span>
                    </div>
                    <div class="card-actions-row" style="display:flex; gap:6px;">
                        <button class="btn ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-select-form" style="flex:1;" data-form-id="${f.id}">
                            <i class="fas ${isSelected ? 'fa-pen-to-square' : 'fa-arrow-right'}"></i> ${isSelected ? 'Şu An Açık' : 'Formu Doldur'}
                        </button>
                        <button class="btn btn-secondary btn-share-form" data-form-id="${f.id}" title="Form Bağlantısını Kopyala & Paylaş">
                            <i class="fas fa-share-nodes"></i> Paylaş
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        galleryContainer.querySelectorAll('.btn-select-form').forEach(btn => {
            btn.onclick = () => {
                const fId = btn.dataset.formId;
                if (fId && store.getState().formDefinitions[fId]) {
                    errorsMap = {};
                    store.setState({
                        currentFormId: fId,
                        currentStep: 1,
                        formData: {}
                    });
                    const wrapper = container.querySelector('#selected-form-wrapper');
                    if (wrapper) wrapper.scrollIntoView({ behavior: 'smooth' });
                }
            };
        });

        galleryContainer.querySelectorAll('.btn-share-form').forEach(btn => {
            btn.onclick = () => {
                const fId = btn.dataset.formId;
                if (window.openFormShareModal) {
                    window.openFormShareModal(fId);
                }
            };
        });
    }

    function renderStepPanels(formDef, state, errors) {
        const panelsContainer = container.querySelector('#wizard-step-panels-container');
        if (!panelsContainer) return;

        const currentStepIdx = state.currentStep - 1;
        const totalSteps = formDef.steps.length;

        panelsContainer.innerHTML = formDef.steps.map((step, idx) => {
            const isActive = (idx === currentStepIdx);
            const fieldsHtml = step.fields.map(field => {
                const val = state.formData[field.id] || '';
                const err = errors[field.id] || '';
                return renderFormField(field, val, err);
            }).join('');

            // Summary review on final step
            let summaryHtml = '';
            if (idx === totalSteps - 1) {
                summaryHtml = `
                    <div class="form-group" style="margin-top: 1.5rem;">
                        <label>Başvuru Özeti İncelemesi</label>
                        <div class="summary-review-card">
                            <div class="summary-item"><span class="s-label">Ad Soyad:</span><span class="s-val" id="sum-val-fullName">${state.formData.fullName || '-'}</span></div>
                            <div class="summary-item"><span class="s-label">İletişim:</span><span class="s-val" id="sum-val-contact">${state.formData.email || '-'} / ${state.formData.phone || '-'}</span></div>
                            <div class="summary-item"><span class="s-label">Okul & Bölüm:</span><span class="s-val" id="sum-val-school">${state.formData.university || '-'} - ${state.formData.department || '-'}</span></div>
                            <div class="summary-item"><span class="s-label">Sınıf & İlçe:</span><span class="s-val" id="sum-val-grade">${state.formData.grade || '-'} | ${state.formData.district || '-'}</span></div>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="form-step-panel ${isActive ? 'active' : ''}" data-panel="${idx + 1}">
                    <h2 class="step-heading"><i class="fas ${step.icon || 'fa-pen'}"></i> ${step.title}</h2>
                    <p class="step-desc">${step.desc || ''}</p>
                    ${fieldsHtml}
                    ${summaryHtml}
                </div>
            `;
        }).join('');
    }

    function renderFormHeader(formDef, state, store) {
        // Banner
        const bannerContainer = container.querySelector('#form-banner-container');
        const bannerImg = container.querySelector('#form-banner-img');
        if (bannerContainer && bannerImg) {
            if (formDef.banner) {
                bannerImg.src = formDef.banner;
                bannerContainer.style.display = 'flex';
            } else {
                bannerContainer.style.display = 'none';
            }
        }

        // Metadata Pills
        const metaContainer = container.querySelector('#form-meta-bar');
        if (metaContainer && formDef.meta) {
            metaContainer.innerHTML = formDef.meta.map(m => `
                <div class="meta-pill"><i class="fas ${m.icon}"></i> <span>${m.text}</span></div>
            `).join('');
        }

        // Description Box
        const descElem = container.querySelector('#form-desc-text');
        if (descElem) descElem.innerHTML = formDef.description || '';

        // Switcher Pills
        container.querySelectorAll('.switcher-pill').forEach(pill => {
            pill.classList.remove('active');
            if (pill.dataset.formId === state.currentFormId) pill.classList.add('active');
        });
    }

    function renderProgressUI(formDef, state) {
        const totalSteps = formDef.steps.length;
        const currentStep = state.currentStep;
        const percent = Math.round((currentStep / totalSteps) * 100);
        const currentStepDef = formDef.steps[currentStep - 1];

        const titleDisplay = container.querySelector('#step-title-display');
        const percentDisplay = container.querySelector('#progress-percent-display');
        const fillBar = container.querySelector('#progress-fill-bar');
        const dotsContainer = container.querySelector('.step-indicators');
        const draftBadge = container.querySelector('#draft-saved-badge');

        if (titleDisplay && currentStepDef) titleDisplay.innerText = `Adım ${currentStep}: ${currentStepDef.title}`;
        if (percentDisplay) percentDisplay.innerText = `%${percent} Tamamlandı`;
        if (fillBar) fillBar.style.width = `${percent}%`;

        if (draftBadge) {
            if (state.draftSavedTimestamp) {
                draftBadge.innerHTML = `<i class="fas fa-cloud-arrow-up text-accent"></i> Taslak Otomatik Kaydedildi (${state.draftSavedTimestamp})`;
                draftBadge.style.display = 'inline-flex';
            } else {
                draftBadge.style.display = 'none';
            }
        }

        if (dotsContainer) {
            dotsContainer.innerHTML = formDef.steps.map((step, idx) => {
                const stepNum = idx + 1;
                let statusClass = '';
                if (stepNum === currentStep) statusClass = 'active';
                else if (stepNum < currentStep) statusClass = 'completed';

                return `
                    <div class="step-dot ${statusClass}" data-step="${stepNum}">
                        <span>${stepNum}</span>
                        <label>${step.title.split(' ')[0]}</label>
                    </div>
                `;
            }).join('');
        }

        const prevBtn = container.querySelector('#btn-prev-step');
        const nextBtn = container.querySelector('#btn-next-step');
        const submitBtn = container.querySelector('#btn-submit-form');

        if (prevBtn) prevBtn.disabled = (currentStep === 1);
        if (currentStep === totalSteps) {
            if (nextBtn) nextBtn.classList.add('hidden');
            if (submitBtn) submitBtn.classList.remove('hidden');
        } else {
            if (nextBtn) nextBtn.classList.remove('hidden');
            if (submitBtn) submitBtn.classList.add('hidden');
        }
    }

    function bindInputEvents(container, formDef, store) {
        const state = store.getState();
        const currentStepDef = formDef.steps[state.currentStep - 1];
        if (!currentStepDef) return;

        currentStepDef.fields.forEach(field => {
            let elem = container.querySelector(`#fill-${field.id}`);
            if (field.type === 'radio_cards') {
                container.querySelectorAll(`input[name="fill_${field.id}"]`).forEach(radio => {
                    radio.onchange = (e) => {
                        store.setFormData(field.id, e.target.value, true);
                        triggerDebouncedAutoSave(store.getState());
                    };
                });
            } else if (elem) {
                if (field.type === 'kvkk_checkbox') {
                    elem.onchange = (e) => {
                        store.setFormData(field.id, e.target.checked, true);
                        triggerDebouncedAutoSave(store.getState());
                    };
                    const kvkkLink = container.querySelector('#open-kvkk-link');
                    if (kvkkLink) {
                        kvkkLink.onclick = (e) => {
                            e.preventDefault();
                            document.getElementById('kvkk-modal')?.classList.add('active');
                        };
                    }
                } else {
                    // FAST NATIVE TYPING HANDLER (No DOM destruction!)
                    elem.oninput = (e) => {
                        const val = e.target.value;
                        store.setFormData(field.id, val, true);
                        triggerDebouncedAutoSave(store.getState());

                        // Remove inline error state if typed
                        const parent = elem.closest('.form-group');
                        if (parent) parent.classList.remove('has-error');
                    };
                }
            }
        });

        // Navigation Buttons
        const prevBtn = container.querySelector('#btn-prev-step');
        const nextBtn = container.querySelector('#btn-next-step');
        const formElem = container.querySelector('#interactive-main-form');

        if (prevBtn) {
            prevBtn.onclick = () => {
                const curState = store.getState();
                if (curState.currentStep > 1) {
                    errorsMap = {};
                    store.setState({ currentStep: curState.currentStep - 1 });
                }
            };
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                const curState = store.getState();
                const stepDef = formDef.steps[curState.currentStep - 1];
                const validation = validateStepFields(stepDef, curState.formData);
                if (validation.isValid) {
                    errorsMap = {};
                    store.setState({ currentStep: curState.currentStep + 1 });
                } else {
                    errorsMap = validation.errorsMap;
                    lastRenderedStep = null; // force re-render with errors
                    render();
                }
            };
        }

        if (formElem) {
            formElem.onsubmit = async (e) => {
                e.preventDefault();
                const curState = store.getState();
                const stepDef = formDef.steps[curState.currentStep - 1];
                const validation = validateStepFields(stepDef, curState.formData);
                if (!validation.isValid) {
                    errorsMap = validation.errorsMap;
                    lastRenderedStep = null;
                    render();
                    return;
                }

                const submitBtn = container.querySelector('#btn-submit-form');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Gönderiliyor...`;
                }

                const refCode = generateRefCode(curState.currentFormId);
                const responsePayload = {
                    refCode: refCode,
                    formSlug: curState.currentFormId,
                    fullName: curState.formData.fullName || '',
                    phone: curState.formData.phone || '',
                    email: curState.formData.email || '',
                    district: curState.formData.district || '',
                    university: curState.formData.university || '',
                    department: curState.formData.department || '',
                    grade: curState.formData.grade || '',
                    hearAbout: curState.formData.hearAbout || 'Instagram',
                    notes: curState.formData.notes || '-',
                    date: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                };

                await postToGoogleSheets(responsePayload);
                const updatedResponses = saveResponseToLocal(responsePayload);
                clearDraft(curState.currentFormId);

                // Show Success Modal
                const modalRef = document.getElementById('modal-ref-code');
                const modalRefInput = document.getElementById('modal-ref-code-text');
                const successModal = document.getElementById('form-success-modal');

                if (modalRef) modalRef.innerText = refCode;
                if (modalRefInput) modalRefInput.value = refCode;
                if (successModal) successModal.classList.add('active');

                // Reset Form State
                errorsMap = {};
                lastRenderedStep = null;
                store.setState({
                    currentStep: 1,
                    formData: {},
                    responses: updatedResponses,
                    draftSavedTimestamp: null
                });

                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> Kaydı Tamamla & Gönder`;
                }
            };
        }
    }

    function triggerDebouncedAutoSave(state) {
        if (saveDraftDebounceTimer) clearTimeout(saveDraftDebounceTimer);
        saveDraftDebounceTimer = setTimeout(() => {
            saveDraft(state.currentFormId, state.formData);
            const draftBadge = container.querySelector('#draft-saved-badge');
            if (draftBadge && state.draftSavedTimestamp) {
                draftBadge.innerHTML = `<i class="fas fa-cloud-arrow-up text-accent"></i> Taslak Otomatik Kaydedildi (${state.draftSavedTimestamp})`;
                draftBadge.style.display = 'inline-flex';
            }
        }, 400);
    }

    store.subscribe(render);
    render();
}
