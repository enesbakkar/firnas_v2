/* ==========================================================================
   FORM WIZARD COMPONENT (src/components/FormWizard.js)
   ========================================================================== */

import { renderFormField } from './FormField.js';
import { validateStepFields } from '../core/validators.js';
import { saveDraft, clearDraft, postToGoogleSheets, saveResponseToLocal } from '../core/apiService.js';
import { generateRefCode } from '../utils/stringHelpers.js';

export function setupFormWizard(container, store) {
    let lastRenderedFormId = null;
    let errorsMap = {};

    function render() {
        const state = store.getState();
        const formDef = state.formDefinitions[state.currentFormId];
        if (!formDef) return;

        // Render header & banner if form switched
        if (lastRenderedFormId !== state.currentFormId) {
            lastRenderedFormId = state.currentFormId;
            renderFormHeader(formDef, state, store);
        }

        // Render Step Panels
        renderStepPanels(formDef, state, errorsMap);

        // Update Progress Bar UI
        renderProgressUI(formDef, state);

        // Bind Input Auto-Save & Change Listeners
        bindInputEvents(container, formDef, state, store);
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

            // If step 3 (last step), include summary review box
            let summaryHtml = '';
            if (idx === totalSteps - 1) {
                summaryHtml = `
                    <div class="form-group" style="margin-top: 1.5rem;">
                        <label>Başvuru Özeti İncelemesi</label>
                        <div class="summary-review-card">
                            <div class="summary-item"><span class="s-label">Ad Soyad:</span><span class="s-val">${state.formData.fullName || '-'}</span></div>
                            <div class="summary-item"><span class="s-label">İletişim:</span><span class="s-val">${state.formData.email || '-'} / ${state.formData.phone || '-'}</span></div>
                            <div class="summary-item"><span class="s-label">Okul & Bölüm:</span><span class="s-val">${state.formData.university || '-'} - ${state.formData.department || '-'}</span></div>
                            <div class="summary-item"><span class="s-label">Sınıf & İlçe:</span><span class="s-val">${state.formData.grade || '-'} | ${state.formData.district || '-'}</span></div>
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

        // Switcher Pills Active state
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

        if (titleDisplay && currentStepDef) titleDisplay.innerText = `Adım ${currentStep}: ${currentStepDef.title}`;
        if (percentDisplay) percentDisplay.innerText = `%${percent} Tamamlandı`;
        if (fillBar) fillBar.style.width = `${percent}%`;

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

    function bindInputEvents(container, formDef, state, store) {
        const currentStepDef = formDef.steps[state.currentStep - 1];
        if (!currentStepDef) return;

        currentStepDef.fields.forEach(field => {
            let elem = container.querySelector(`#fill-${field.id}`);
            if (field.type === 'radio_cards') {
                container.querySelectorAll(`input[name="fill_${field.id}"]`).forEach(radio => {
                    radio.onchange = (e) => {
                        store.setFormData(field.id, e.target.value);
                        saveDraft(state.currentFormId, store.getState().formData);
                    };
                });
            } else if (elem) {
                if (field.type === 'kvkk_checkbox') {
                    elem.onchange = (e) => {
                        store.setFormData(field.id, e.target.checked);
                        saveDraft(state.currentFormId, store.getState().formData);
                    };
                    const kvkkLink = container.querySelector('#open-kvkk-link');
                    if (kvkkLink) {
                        kvkkLink.onclick = (e) => {
                            e.preventDefault();
                            document.getElementById('kvkk-modal')?.classList.add('active');
                        };
                    }
                } else {
                    elem.oninput = (e) => {
                        store.setFormData(field.id, e.target.value);
                        saveDraft(state.currentFormId, store.getState().formData);
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
                if (state.currentStep > 1) {
                    errorsMap = {};
                    store.setState({ currentStep: state.currentStep - 1 });
                }
            };
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                const validation = validateStepFields(currentStepDef, state.formData);
                if (validation.isValid) {
                    errorsMap = {};
                    store.setState({ currentStep: state.currentStep + 1 });
                } else {
                    errorsMap = validation.errorsMap;
                    render();
                }
            };
        }

        if (formElem) {
            formElem.onsubmit = async (e) => {
                e.preventDefault();
                const validation = validateStepFields(currentStepDef, state.formData);
                if (!validation.isValid) {
                    errorsMap = validation.errorsMap;
                    render();
                    return;
                }

                const submitBtn = container.querySelector('#btn-submit-form');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Gönderiliyor...`;
                }

                const refCode = generateRefCode(state.currentFormId);
                const responsePayload = {
                    refCode: refCode,
                    formSlug: state.currentFormId,
                    fullName: state.formData.fullName || '',
                    phone: state.formData.phone || '',
                    email: state.formData.email || '',
                    district: state.formData.district || '',
                    university: state.formData.university || '',
                    department: state.formData.department || '',
                    grade: state.formData.grade || '',
                    hearAbout: state.formData.hearAbout || 'Instagram',
                    notes: state.formData.notes || '-',
                    date: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                };

                await postToGoogleSheets(responsePayload);
                const updatedResponses = saveResponseToLocal(responsePayload);
                clearDraft(state.currentFormId);

                // Show Success Modal
                const modalRef = document.getElementById('modal-ref-code');
                const modalRefInput = document.getElementById('modal-ref-code-text');
                const successModal = document.getElementById('form-success-modal');

                if (modalRef) modalRef.innerText = refCode;
                if (modalRefInput) modalRefInput.value = refCode;
                if (successModal) successModal.classList.add('active');

                // Reset Form State
                errorsMap = {};
                store.setState({
                    currentStep: 1,
                    formData: {},
                    responses: updatedResponses
                });

                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> Kaydı Tamamla & Gönder`;
                }
            };
        }
    }

    store.subscribe(render);
    render();
}
