/* ==========================================================================
   FUNCTIONAL FORM BUILDER COMPONENT (src/components/Builder.js)
   ========================================================================== */

import { saveCustomForm } from '../core/apiService.js';
import { slugify, escapeHtml, showAlertDialog } from '../utils/stringHelpers.js';

export function setupFormBuilder(container, store) {
    let builderQuestions = [];

    function render() {
        const state = store.getState();
        if (state.activeTab !== 'builder') return;

        const canvasList = container.querySelector('#builder-questions-list');
        if (!canvasList) return;

        if (builderQuestions.length === 0) {
            canvasList.innerHTML = `<p class="text-center text-muted" style="padding: 2rem;">Henüz soru eklenmedi. Sol menüden soru türü seçin.</p>`;
        } else {
            canvasList.innerHTML = builderQuestions.map((q, idx) => `
                <div class="builder-q-item">
                    <div class="q-item-header">
                        <input type="text" class="q-title-input" value="${escapeHtml(q.title)}" data-idx="${idx}" placeholder="Soru başlığı...">
                        <button class="btn-q-delete" data-idx="${idx}" title="Sil"><i class="fas fa-trash"></i></button>
                    </div>
                    <div style="margin-top: 8px; font-size: 0.8rem; color: #64748b;">
                        Tür: <strong>${q.type}</strong> | Zorunlu: <input type="checkbox" class="q-req-cb" data-idx="${idx}" ${q.required ? 'checked' : ''}>
                    </div>
                </div>
            `).join('');

            // Bind Q inputs
            canvasList.querySelectorAll('.q-title-input').forEach(input => {
                input.oninput = (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    builderQuestions[idx].title = e.target.value;
                };
            });
            canvasList.querySelectorAll('.q-req-cb').forEach(cb => {
                cb.onchange = (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    builderQuestions[idx].required = e.target.checked;
                };
            });
            canvasList.querySelectorAll('.btn-q-delete').forEach(btn => {
                btn.onclick = () => {
                    const idx = parseInt(btn.dataset.idx);
                    builderQuestions.splice(idx, 1);
                    render();
                };
            });
        }

        bindToolButtons(container);
    }

    function bindToolButtons(container) {
        const backBtn = container.querySelector('#btn-back-from-builder');
        if (backBtn) {
            backBtn.onclick = () => store.setState({ activeTab: 'fill' });
        }

        container.querySelectorAll('.btn-tool-add').forEach(btn => {
            btn.onclick = () => {
                const type = btn.dataset.type || 'text';
                const defaultTitles = {
                    text: 'Yeni Metin Sorusu',
                    textarea: 'Yeni Açıklama Sorusu',
                    choice: 'Yeni Çoktan Seçmeli Soru',
                    dropdown: 'Yeni Açılır Liste Sorusu'
                };
                builderQuestions.push({
                    id: 'q_' + Date.now(),
                    type: type,
                    title: defaultTitles[type] || 'Yeni Soru',
                    required: true,
                    options: (type === 'choice' || type === 'dropdown') ? ['Seçenek 1', 'Seçenek 2', 'Seçenek 3'] : []
                });
                render();
            };
        });

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
