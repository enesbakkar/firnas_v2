/* ==========================================================================
   GOOGLE FORMS STYLE BUILDER COMPONENT (src/components/Builder.js)
   Firnas Dark Glassmorphism Styling + Google Forms Editor UX
   ========================================================================== */

import { saveCustomForm } from '../core/apiService.js';
import { slugify, escapeHtml, showAlertDialog, showToastNotification } from '../utils/stringHelpers.js';

export function setupFormBuilder(container, store) {
    let builderQuestions = [
        {
            id: 'q_default_1',
            type: 'text',
            title: 'Katılımcı Notu veya İlgi Alanı',
            required: false,
            options: []
        }
    ];

    function render() {
        const state = store.getState();
        if (state.activeTab !== 'builder') return;

        const canvasList = container.querySelector('#builder-questions-list');
        if (!canvasList) return;

        if (builderQuestions.length === 0) {
            canvasList.innerHTML = `
                <div class="gform-empty-card text-center py-5">
                    <i class="fas fa-file-circle-plus" style="font-size: 2.5rem; color: var(--form-accent); margin-bottom: 1rem;"></i>
                    <h4 style="color:#ffffff;">Henüz soru eklenmedi</h4>
                    <p class="text-muted small">Yeni bir soru eklemek için "Soru Ekle" butonuna tıklayın.</p>
                </div>
            `;
        } else {
            canvasList.innerHTML = builderQuestions.map((q, qIdx) => {
                const isOptionType = (q.type === 'choice' || q.type === 'dropdown');
                
                let optionsHtml = '';
                if (isOptionType) {
                    const opts = q.options && q.options.length > 0 ? q.options : ['Seçenek 1'];
                    optionsHtml = `
                        <div class="gform-options-editor" style="margin-top: 1rem; padding-left: 0.5rem;">
                            ${opts.map((optVal, optIdx) => `
                                <div class="gform-option-row" style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                                    <i class="${q.type === 'choice' ? 'far fa-circle' : 'fas fa-caret-right'}" style="color:var(--form-accent);"></i>
                                    <input type="text" class="form-control gform-opt-input" data-qidx="${qIdx}" data-optidx="${optIdx}" value="${escapeHtml(optVal)}" placeholder="Seçenek ${optIdx + 1}">
                                    ${opts.length > 1 ? `<button type="button" class="btn-icon-danger btn-delete-opt" data-qidx="${qIdx}" data-optidx="${optIdx}" title="Seçeneği Sil"><i class="fas fa-times"></i></button>` : ''}
                                </div>
                            `).join('')}
                            <button type="button" class="btn btn-secondary btn-sm btn-add-opt" data-qidx="${qIdx}" style="margin-top:4px;">
                                <i class="fas fa-plus"></i> Seçenek Ekle
                            </button>
                        </div>
                    `;
                }

                return `
                    <div class="gform-question-card" data-qidx="${qIdx}">
                        <div class="gform-card-top-bar">
                            <div class="gform-q-title-wrapper" style="flex:1;">
                                <input type="text" class="gform-q-title-input" data-qidx="${qIdx}" value="${escapeHtml(q.title)}" placeholder="Soru metnini giriniz...">
                            </div>
                            <div class="gform-q-type-select-wrapper">
                                <select class="gform-q-type-select" data-qidx="${qIdx}">
                                    <option value="text" ${q.type === 'text' ? 'selected' : ''}>📝 Kısa Yanıt</option>
                                    <option value="textarea" ${q.type === 'textarea' ? 'selected' : ''}>📄 Paragraf Metni</option>
                                    <option value="choice" ${q.type === 'choice' ? 'selected' : ''}>🔘 Çoktan Seçmeli</option>
                                    <option value="dropdown" ${q.type === 'dropdown' ? 'selected' : ''}>▼ Açılır Liste</option>
                                </select>
                            </div>
                        </div>

                        ${optionsHtml}

                        <div class="gform-card-footer">
                            <div class="gform-footer-left">
                                <button type="button" class="btn-gform-action btn-duplicate-q" data-qidx="${qIdx}" title="Soruyu Çoğalt">
                                    <i class="fas fa-copy"></i> Çoğalt
                                </button>
                                <button type="button" class="btn-gform-action btn-delete-q" data-qidx="${qIdx}" title="Soruyu Sil">
                                    <i class="fas fa-trash-can"></i> Sil
                                </button>
                            </div>
                            <div class="gform-footer-right">
                                <label class="gform-toggle-switch">
                                    <span>Zorunlu</span>
                                    <input type="checkbox" class="gform-req-checkbox" data-qidx="${qIdx}" ${q.required ? 'checked' : ''}>
                                    <span class="gform-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Bind Question Card Inputs & Actions
            bindCardEvents(canvasList);
        }

        bindToolButtons(container);
    }

    function bindCardEvents(canvasList) {
        // Question Title Input
        canvasList.querySelectorAll('.gform-q-title-input').forEach(input => {
            input.oninput = (e) => {
                const qIdx = parseInt(e.target.dataset.qidx);
                if (builderQuestions[qIdx]) {
                    builderQuestions[qIdx].title = e.target.value;
                }
            };
        });

        // Question Type Select
        canvasList.querySelectorAll('.gform-q-type-select').forEach(select => {
            select.onchange = (e) => {
                const qIdx = parseInt(e.target.dataset.qidx);
                const newType = e.target.value;
                if (builderQuestions[qIdx]) {
                    builderQuestions[qIdx].type = newType;
                    if ((newType === 'choice' || newType === 'dropdown') && (!builderQuestions[qIdx].options || builderQuestions[qIdx].options.length === 0)) {
                        builderQuestions[qIdx].options = ['Seçenek 1', 'Seçenek 2', 'Seçenek 3'];
                    }
                    render();
                }
            };
        });

        // Option Inputs
        canvasList.querySelectorAll('.gform-opt-input').forEach(input => {
            input.oninput = (e) => {
                const qIdx = parseInt(e.target.dataset.qidx);
                const optIdx = parseInt(e.target.dataset.optidx);
                if (builderQuestions[qIdx] && builderQuestions[qIdx].options) {
                    builderQuestions[qIdx].options[optIdx] = e.target.value;
                }
            };
        });

        // Add Option Button
        canvasList.querySelectorAll('.btn-add-opt').forEach(btn => {
            btn.onclick = () => {
                const qIdx = parseInt(btn.dataset.qidx);
                if (builderQuestions[qIdx]) {
                    if (!builderQuestions[qIdx].options) builderQuestions[qIdx].options = [];
                    builderQuestions[qIdx].options.push(`Seçenek ${builderQuestions[qIdx].options.length + 1}`);
                    render();
                }
            };
        });

        // Delete Option Button
        canvasList.querySelectorAll('.btn-delete-opt').forEach(btn => {
            btn.onclick = () => {
                const qIdx = parseInt(btn.dataset.qidx);
                const optIdx = parseInt(btn.dataset.optidx);
                if (builderQuestions[qIdx] && builderQuestions[qIdx].options) {
                    builderQuestions[qIdx].options.splice(optIdx, 1);
                    render();
                }
            };
        });

        // Duplicate Question
        canvasList.querySelectorAll('.btn-duplicate-q').forEach(btn => {
            btn.onclick = () => {
                const qIdx = parseInt(btn.dataset.qidx);
                if (builderQuestions[qIdx]) {
                    const qCopy = JSON.parse(JSON.stringify(builderQuestions[qIdx]));
                    qCopy.id = 'q_' + Date.now();
                    qCopy.title = qCopy.title + ' (Kopya)';
                    builderQuestions.splice(qIdx + 1, 0, qCopy);
                    render();
                }
            };
        });

        // Delete Question
        canvasList.querySelectorAll('.btn-delete-q').forEach(btn => {
            btn.onclick = () => {
                const qIdx = parseInt(btn.dataset.qidx);
                builderQuestions.splice(qIdx, 1);
                render();
            };
        });

        // Required Toggle Switch
        canvasList.querySelectorAll('.gform-req-checkbox').forEach(cb => {
            cb.onchange = (e) => {
                const qIdx = parseInt(e.target.dataset.qidx);
                if (builderQuestions[qIdx]) {
                    builderQuestions[qIdx].required = e.target.checked;
                }
            };
        });
    }

    function bindToolButtons(container) {
        const backBtn = container.querySelector('#btn-back-from-builder');
        if (backBtn) {
            backBtn.onclick = () => store.setState({ activeTab: 'fill' });
        }

        const addQBtn = container.querySelector('#btn-gform-add-question');
        if (addQBtn) {
            addQBtn.onclick = () => {
                builderQuestions.push({
                    id: 'q_' + Date.now(),
                    type: 'text',
                    title: 'Yeni Soru',
                    required: true,
                    options: []
                });
                render();
                showToastNotification('Yeni soru bloğu eklendi.');
            };
        }

        const titleInput = container.querySelector('#builder-form-title');
        const descInput = container.querySelector('#builder-form-desc');
        const previewTitle = container.querySelector('#preview-form-title');
        const previewDesc = container.querySelector('#preview-form-desc');

        if (titleInput) {
            titleInput.oninput = () => {
                if (previewTitle) previewTitle.innerText = titleInput.value || 'Özel Form';
            };
        }
        if (descInput) {
            descInput.oninput = () => {
                if (previewDesc) previewDesc.innerText = descInput.value || '';
            };
        }

        const publishBtn = container.querySelector('#btn-publish-builder-form');
        if (publishBtn) {
            publishBtn.onclick = () => publishForm(titleInput, descInput, store);
        }
    }

    function publishForm(titleInput, descInput, store) {
        const title = (titleInput?.value || '').trim();
        const desc = (descInput?.value || '').trim();

        if (!title) {
            showAlertDialog('Eksik Bilgi', 'Lütfen yayınlamak için geçerli bir form başlığı giriniz.');
            return;
        }

        const formSlug = slugify(title);
        const newFormDef = {
            id: formSlug,
            title: title,
            category: 'Özel Tasarım',
            banner: null,
            meta: [
                { icon: 'fa-wand-magic-sparkles', text: 'Özel Tasarım Form' },
                { icon: 'fa-check-circle', text: 'Aktif Form' }
            ],
            description: desc || 'Özel oluşturulmuş başvuru formu.',
            steps: [
                {
                    id: 'step_1',
                    title: 'Form Bilgileri',
                    icon: 'fa-pen',
                    desc: 'Lütfen istenen alanları doldurun.',
                    fields: [
                        { id: 'fullName', label: 'İsim Soyisim', type: 'text', required: true, icon: 'fa-user', placeholder: 'Ad Soyad' },
                        { id: 'phone', label: 'Telefon Numarası', type: 'tel', required: true, icon: 'fa-phone', placeholder: '0555 123 45 67', validate: 'phone' },
                        { id: 'email', label: 'E-posta Adresi', type: 'email', required: true, icon: 'fa-envelope', placeholder: 'ornek@domain.com', validate: 'email' },
                        { id: 'district', label: 'İlçe', type: 'text', required: true, icon: 'fa-map-pin', placeholder: 'İlçe' },
                        ...builderQuestions.map(q => ({
                            id: q.id,
                            label: q.title,
                            type: q.type === 'choice' ? 'radio_cards' : (q.type === 'dropdown' ? 'select' : q.type),
                            required: q.required,
                            icon: 'fa-circle-question',
                            options: q.options || []
                        })),
                        { id: 'kvkk', label: 'KVKK Onayı', type: 'kvkk_checkbox', required: true }
                    ]
                }
            ]
        };

        // Save Custom Form
        const updatedCustomForms = saveCustomForm(newFormDef);
        const state = store.getState();

        // Update Store's formDefinitions
        const newDefs = {
            ...state.formDefinitions,
            [formSlug]: newFormDef
        };

        store.setState({
            formDefinitions: newDefs,
            customForms: updatedCustomForms,
            currentFormId: formSlug,
            activeTab: 'fill',
            currentStep: 1,
            formData: {}
        });

        if (window.openFormShareModal) {
            window.openFormShareModal(formSlug);
        }
    }

    store.subscribe(render);
    render();
}
