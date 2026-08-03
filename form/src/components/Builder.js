/* ==========================================================================
   COMPREHENSIVE GOOGLE FORMS STYLE BUILDER COMPONENT (src/components/Builder.js)
   Firnas Dark Glassmorphism + Rich Media (Photos, Video Embeds, Formatting & Themes)
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
            fontWeight: 'bold',
            fontSize: 'normal',
            options: []
        }
    ];

    let currentTheme = 'cyan';
    let currentBannerUrl = '';
    let currentVideoUrl = '';

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
                const isBold = q.fontWeight === 'bold';
                const isItalic = q.fontStyle === 'italic';
                const isUnderline = q.textDecoration === 'underline';

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

                // Question level image / video preview if attached
                let qMediaHtml = '';
                if (q.imageUrl) {
                    qMediaHtml += `
                        <div class="q-media-box" style="margin-top:0.75rem; position:relative;">
                            <img src="${escapeHtml(q.imageUrl)}" alt="Soru Görseli" style="max-height:160px; border-radius:10px; object-fit:cover;">
                            <button type="button" class="btn-icon-danger btn-remove-q-image" data-qidx="${qIdx}" style="position:absolute; top:5px; right:5px;"><i class="fas fa-times"></i></button>
                        </div>
                    `;
                }

                return `
                    <div class="gform-question-card" data-qidx="${qIdx}">
                        <!-- Rich Text Formatting Bar -->
                        <div class="gform-fmt-toolbar" style="display:flex; gap:6px; margin-bottom:8px; align-items:center;">
                            <button type="button" class="btn-fmt ${isBold ? 'active' : ''}" data-qidx="${qIdx}" data-fmt="bold" title="Kalın (Bold)"><strong>B</strong></button>
                            <button type="button" class="btn-fmt ${isItalic ? 'active' : ''}" data-qidx="${qIdx}" data-fmt="italic" title="İtalik (Italic)"><em>I</em></button>
                            <button type="button" class="btn-fmt ${isUnderline ? 'active' : ''}" data-qidx="${qIdx}" data-fmt="underline" title="Altı Çizili"><u>U</u></button>
                            <div style="width:1px; height:18px; background:rgba(255,255,255,0.15); margin:0 4px;"></div>
                            <button type="button" class="btn-fmt btn-add-q-image" data-qidx="${qIdx}" title="Soruya Fotoğraf Ekle"><i class="fas fa-image text-accent"></i></button>
                        </div>

                        <div class="gform-card-top-bar">
                            <div class="gform-q-title-wrapper" style="flex:1;">
                                <input type="text" class="gform-q-title-input ${isBold ? 'fw-bold' : ''} ${isItalic ? 'fst-italic' : ''} ${isUnderline ? 'text-decoration-underline' : ''}" data-qidx="${qIdx}" value="${escapeHtml(q.title)}" placeholder="Soru metnini giriniz...">
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

                        ${qMediaHtml}
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

            bindCardEvents(canvasList);
        }

        bindToolButtons(container);
        setupThemePicker(container);
        setupHeaderMediaTools(container);
    }

    function bindCardEvents(canvasList) {
        // Text Formatting Buttons (Bold, Italic, Underline)
        canvasList.querySelectorAll('.btn-fmt').forEach(btn => {
            btn.onclick = () => {
                const qIdx = parseInt(btn.dataset.qidx);
                const fmt = btn.dataset.fmt;
                if (!builderQuestions[qIdx]) return;

                if (fmt === 'bold') {
                    builderQuestions[qIdx].fontWeight = builderQuestions[qIdx].fontWeight === 'bold' ? 'normal' : 'bold';
                } else if (fmt === 'italic') {
                    builderQuestions[qIdx].fontStyle = builderQuestions[qIdx].fontStyle === 'italic' ? 'normal' : 'italic';
                } else if (fmt === 'underline') {
                    builderQuestions[qIdx].textDecoration = builderQuestions[qIdx].textDecoration === 'underline' ? 'none' : 'underline';
                }
                render();
            };
        });

        // Add Image to Question
        canvasList.querySelectorAll('.btn-add-q-image').forEach(btn => {
            btn.onclick = () => {
                const qIdx = parseInt(btn.dataset.qidx);
                const url = prompt('Soruya eklenecek fotoğraf bağlantısını (URL) giriniz:', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80');
                if (url && builderQuestions[qIdx]) {
                    builderQuestions[qIdx].imageUrl = url;
                    render();
                }
            };
        });

        // Remove Image from Question
        canvasList.querySelectorAll('.btn-remove-q-image').forEach(btn => {
            btn.onclick = () => {
                const qIdx = parseInt(btn.dataset.qidx);
                if (builderQuestions[qIdx]) {
                    delete builderQuestions[qIdx].imageUrl;
                    render();
                }
            };
        });

        // Title input
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

        // Required Toggle
        canvasList.querySelectorAll('.gform-req-checkbox').forEach(cb => {
            cb.onchange = (e) => {
                const qIdx = parseInt(e.target.dataset.qidx);
                if (builderQuestions[qIdx]) {
                    builderQuestions[qIdx].required = e.target.checked;
                }
            };
        });
    }

    function setupHeaderMediaTools(container) {
        const btnBanner = container.querySelector('#btn-add-header-banner');
        const btnVideo = container.querySelector('#btn-add-header-video');
        const bannerBox = container.querySelector('#gform-banner-preview-box');
        const bannerImg = container.querySelector('#gform-banner-preview-img');
        const btnRemoveBanner = container.querySelector('#btn-remove-banner');
        const videoBox = container.querySelector('#gform-video-preview-box');
        const videoIframe = container.querySelector('#gform-video-preview-iframe');
        const btnRemoveVideo = container.querySelector('#btn-remove-video');

        if (btnBanner) {
            btnBanner.onclick = () => {
                const url = prompt('Form Banner Görseli URL adresini giriniz:', '/asset/feam_banner.png');
                if (url) {
                    currentBannerUrl = url;
                    if (bannerImg) bannerImg.src = url;
                    if (bannerBox) bannerBox.style.display = 'block';
                    showToastNotification('Banner görseli eklendi.');
                }
            };
        }

        if (btnRemoveBanner) {
            btnRemoveBanner.onclick = () => {
                currentBannerUrl = '';
                if (bannerBox) bannerBox.style.display = 'none';
            };
        }

        if (btnVideo) {
            btnVideo.onclick = () => {
                const url = prompt('YouTube Video veya Tanıtım Linki giriniz (Örn: https://www.youtube.com/watch?v=dQw4w9WgXcQ):', 'https://www.youtube.com/embed/dQw4w9WgXcQ');
                if (url) {
                    let embedUrl = url;
                    if (url.includes('watch?v=')) {
                        embedUrl = url.replace('watch?v=', 'embed/');
                    }
                    currentVideoUrl = embedUrl;
                    if (videoIframe) videoIframe.src = embedUrl;
                    if (videoBox) videoBox.style.display = 'block';
                    showToastNotification('Tanıtım videosu eklendi.');
                }
            };
        }

        if (btnRemoveVideo) {
            btnRemoveVideo.onclick = () => {
                currentVideoUrl = '';
                if (videoBox) videoBox.style.display = 'none';
            };
        }
    }

    function setupThemePicker(container) {
        const themeModal = container.querySelector('#form-theme-modal');
        const openThemeBtn = container.querySelector('#btn-open-theme-modal');
        const closeThemeBtn = container.querySelector('#btn-close-theme-modal');
        const applyThemeBtn = container.querySelector('#btn-apply-theme-modal');
        const themeAccentLine = container.querySelector('#gform-theme-accent-line');

        if (openThemeBtn && themeModal) {
            openThemeBtn.onclick = () => themeModal.classList.add('active');
        }
        if (closeThemeBtn && themeModal) {
            closeThemeBtn.onclick = () => themeModal.classList.remove('active');
        }

        const themeCards = container.querySelectorAll('.theme-preset-card');
        themeCards.forEach(card => {
            card.onclick = () => {
                themeCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                currentTheme = card.dataset.theme;
            };
        });

        if (applyThemeBtn) {
            applyThemeBtn.onclick = () => {
                const themeGradients = {
                    cyan: 'linear-gradient(90deg, #00b8d4 0%, #38bdf8 100%)',
                    purple: 'linear-gradient(90deg, #a855f7 0%, #c084fc 100%)',
                    green: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                    amber: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)'
                };
                if (themeAccentLine) {
                    themeAccentLine.style.background = themeGradients[currentTheme] || themeGradients.cyan;
                }
                if (themeModal) themeModal.classList.remove('active');
                showToastNotification(`Form teması "${currentTheme.toUpperCase()}" olarak güncellendi.`);
            };
        }
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
                    fontWeight: 'bold',
                    options: []
                });
                render();
                showToastNotification('Yeni soru bloğu eklendi.');
            };
        }

        const titleInput = container.querySelector('#builder-form-title');
        const descInput = container.querySelector('#builder-form-desc');
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
            banner: currentBannerUrl || null,
            videoUrl: currentVideoUrl || null,
            theme: currentTheme || 'cyan',
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
