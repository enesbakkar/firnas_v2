/* ==========================================================================
   Firnas Form Suite - Unified Portal Engine (script.js)
   Form Portalı, Doldurma Motoru, Korumalı E-Tablo & Tasarımcı
   ========================================================================== */

const CORRECT_PASSWORD = 'FORMS_fir_2023';
let GOOGLE_APPS_SCRIPT_URL = localStorage.getItem('firnas_google_script_url') || 'https://script.google.com/macros/s/AKfycbx_EXAMPLE_WEBHOOK_URL/exec';

let currentStep = 1;
const totalSteps = 3;
let activePortalFormId = 'feam-2026';
let pendingTabTarget = null;

// Multi-form portal dictionary
const PORTAL_FORMS = {
    'feam-2026': {
        slug: 'feam-2026',
        title: 'FEAM Networking 2026',
        category: 'Etkinlik & Buluşma',
        banner: '/asset/feam_banner.png',
        bannerVisible: true,
        meta1: { icon: 'fa-calendar-day', text: '1 Ağustos 2026, 15:00' },
        meta2: { icon: 'fa-location-dot', text: 'Atölye Üsküdar' },
        meta3: { icon: 'fa-rocket', text: 'Firnas TEAM Buluşması' },
        desc: '<i class="fas fa-circle-info info-icon"></i> Lise ve üniversite öğrencilerinin teknoloji ve inovasyon etrafında bir araya geldiği; proje sunumları, tanışma etkinliği, networking çalışmaları ve ortak üretim odaklı fikir alışverişi yapılan bu özel buluşmada yerinizi almak için aşağıdaki formu eksiksiz doldurun!'
    },
    'proje-basvuru': {
        slug: 'proje-basvuru',
        title: 'Firnas Proje & AR-GE Başvurusu',
        category: 'Proje & AR-GE',
        banner: null,
        bannerVisible: false,
        meta1: { icon: 'fa-microchip', text: 'AR-GE & Otonom Sistemler' },
        meta2: { icon: 'fa-laptop-code', text: 'Yazılım, Donanım & STEM' },
        meta3: { icon: 'fa-bolt', text: 'Proje Başvuruları Açık' },
        desc: '<i class="fas fa-rocket info-icon"></i> Firnas Technologies bünyesinde yürütülen teknoloji, yazılım, robotik ve STEM projelerinde yer almak, kendi projenizle başvuru yapmak veya geliştirme ekibimize dahil olmak için aşağıdaki başvuru formunu doldurun.'
    },
    'kurumsal-iletisim': {
        slug: 'kurumsal-iletisim',
        title: 'Kurumsal İletişim & Destek Formu',
        category: 'İletişim & Destek',
        banner: null,
        bannerVisible: false,
        meta1: { icon: 'fa-headset', text: '7/24 İletişim Merkezi' },
        meta2: { icon: 'fa-building', text: 'Firnas Technologies HQ' },
        meta3: { icon: 'fa-envelope-open-text', text: 'Kurumsal & Bireysel Talepler' },
        desc: '<i class="fas fa-handshake info-icon"></i> Firnas Technologies ürünleri, eğitim kitlerimiz (FiCo) veya kurumsal iş birliği talepleriniz için doğrudan yönetim ve destek ekibimize mesajınızı iletebilirsiniz.'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    detectUrlFormSlug();
    restoreFormDraft();
    updateProgressUI();
    loadAdminResponsesTable();
    checkAdminAuthStateUI();
});

/* -------------------------------------------------------------------------- */
/* TAB NAVIGATION & PASSWORD PROTECTION                                       */
/* -------------------------------------------------------------------------- */
function isAuthenticated() {
    return sessionStorage.getItem('firnas_form_authenticated') === 'true';
}

function switchFormTab(targetTab) {
    if ((targetTab === 'responses' || targetTab === 'builder') && !isAuthenticated()) {
        pendingTabTarget = targetTab;
        openAuthOverlay();
        return;
    }

    activateTab(targetTab);
}

function activateTab(targetTab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const btn = document.getElementById(`tab-${targetTab}-btn`);
    const content = document.getElementById(`tab-${targetTab}`);

    if (btn && content) {
        btn.classList.add('active');
        content.classList.add('active');
    }

    if (targetTab === 'responses') {
        loadAdminResponsesTable();
    }
}

function openAuthOverlay() {
    const overlay = document.getElementById('auth-lock-overlay');
    const input = document.getElementById('auth-password-input');
    const errorMsg = document.getElementById('auth-error-msg');

    if (errorMsg) errorMsg.style.display = 'none';
    if (input) input.value = '';
    if (overlay) overlay.classList.add('active');
    if (input) setTimeout(() => input.focus(), 100);
}

function closeAuthOverlay() {
    const overlay = document.getElementById('auth-lock-overlay');
    if (overlay) overlay.classList.remove('active');
    pendingTabTarget = null;
}

function handleAuthSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('auth-password-input');
    const errorMsg = document.getElementById('auth-error-msg');
    const authCard = document.querySelector('.auth-card');

    if (input && input.value === CORRECT_PASSWORD) {
        sessionStorage.setItem('firnas_form_authenticated', 'true');
        closeAuthOverlay();
        checkAdminAuthStateUI();
        if (pendingTabTarget) {
            activateTab(pendingTabTarget);
            pendingTabTarget = null;
        }
    } else {
        if (errorMsg) errorMsg.style.display = 'block';
        if (authCard) {
            authCard.classList.add('shake');
            setTimeout(() => authCard.classList.remove('shake'), 400);
        }
    }
}

function lockAdminSession() {
    sessionStorage.removeItem('firnas_form_authenticated');
    checkAdminAuthStateUI();
    switchFormTab('fill');
}

function checkAdminAuthStateUI() {
    const lockBtn = document.getElementById('admin-lock-btn');
    if (lockBtn) {
        if (isAuthenticated()) {
            lockBtn.classList.remove('hidden');
        } else {
            lockBtn.classList.add('hidden');
        }
    }
}

/* -------------------------------------------------------------------------- */
/* FORM SWITCHER & URL DETECT                                                 */
/* -------------------------------------------------------------------------- */
function detectUrlFormSlug() {
    const urlParams = new URLSearchParams(window.location.search);
    let slug = urlParams.get('f') || urlParams.get('form');
    if (!slug && window.location.hash) {
        slug = window.location.hash.substring(1);
    }
    if (slug && PORTAL_FORMS[slug]) {
        selectPortalForm(slug);
    }
}

function selectPortalForm(formId) {
    if (!PORTAL_FORMS[formId]) return;
    activePortalFormId = formId;

    // Update switcher pills
    document.querySelectorAll('.switcher-pill').forEach(pill => pill.classList.remove('active'));
    const activePill = document.getElementById(`card-${formId}`);
    if (activePill) activePill.classList.add('active');

    const formData = PORTAL_FORMS[formId];

    // Update banner
    const bannerContainer = document.getElementById('form-banner-container');
    const bannerImg = document.getElementById('form-banner-img');
    if (bannerContainer && bannerImg) {
        if (formData.bannerVisible && formData.banner) {
            bannerImg.src = formData.banner;
            bannerContainer.style.display = 'flex';
        } else {
            bannerContainer.style.display = 'none';
        }
    }

    // Update metadata
    const m1 = document.getElementById('meta-text-1');
    const m2 = document.getElementById('meta-text-2');
    const m3 = document.getElementById('meta-text-3');

    if (m1 && formData.meta1) m1.parentElement.innerHTML = `<i class="fas ${formData.meta1.icon}"></i> <span>${formData.meta1.text}</span>`;
    if (m2 && formData.meta2) m2.parentElement.innerHTML = `<i class="fas ${formData.meta2.icon}"></i> <span>${formData.meta2.text}</span>`;
    if (m3 && formData.meta3) m3.parentElement.innerHTML = `<i class="fas ${formData.meta3.icon}"></i> <span>${formData.meta3.text}</span>`;

    // Update description
    const descText = document.getElementById('form-desc-text');
    if (descText) descText.innerHTML = formData.desc;
}

/* -------------------------------------------------------------------------- */
/* DRAFT AUTO-SAVE (sessionStorage)                                           */
/* -------------------------------------------------------------------------- */
function handleInputAutoSave(inputId) {
    clearInputError(inputId);
    saveFormDraft();
}

function getDraftKey() {
    return `firnas_draft_${activePortalFormId}`;
}

function saveFormDraft() {
    try {
        const hearAboutChoice = document.querySelector('input[name="fill_hear_about"]:checked');
        const draftData = {
            fullName: document.getElementById('fill-fullname')?.value || '',
            phone: document.getElementById('fill-phone')?.value || '',
            email: document.getElementById('fill-email')?.value || '',
            district: document.getElementById('fill-district')?.value || '',
            university: document.getElementById('fill-university')?.value || '',
            department: document.getElementById('fill-department')?.value || '',
            grade: document.getElementById('fill-grade')?.value || '',
            hearAbout: hearAboutChoice ? hearAboutChoice.value : 'Instagram',
            notes: document.getElementById('fill-notes')?.value || '',
            kvkkAccepted: document.getElementById('fill-kvkk')?.checked || false
        };
        sessionStorage.setItem(getDraftKey(), JSON.stringify(draftData));
    } catch (err) {
        console.warn('Auto-save warning:', err);
    }
}

function restoreFormDraft() {
    try {
        const data = sessionStorage.getItem(getDraftKey());
        if (!data) return;

        const draft = JSON.parse(data);
        if (draft.fullName) document.getElementById('fill-fullname').value = draft.fullName;
        if (draft.phone) document.getElementById('fill-phone').value = draft.phone;
        if (draft.email) document.getElementById('fill-email').value = draft.email;
        if (draft.district) document.getElementById('fill-district').value = draft.district;
        if (draft.university) document.getElementById('fill-university').value = draft.university;
        if (draft.department) document.getElementById('fill-department').value = draft.department;
        if (draft.grade) document.getElementById('fill-grade').value = draft.grade;
        if (draft.notes) document.getElementById('fill-notes').value = draft.notes;
        if (draft.kvkkAccepted) document.getElementById('fill-kvkk').checked = draft.kvkkAccepted;

        if (draft.hearAbout) {
            const radio = document.querySelector(`input[name="fill_hear_about"][value="${draft.hearAbout}"]`);
            if (radio) radio.checked = true;
        }
    } catch (err) {
        console.warn('Restore draft warning:', err);
    }
}

function clearFormDraft() {
    sessionStorage.removeItem(getDraftKey());
}

/* -------------------------------------------------------------------------- */
/* WIZARD NAVIGATION & VALIDATION                                             */
/* -------------------------------------------------------------------------- */
function changeStep(direction) {
    if (direction === 1 && !validateCurrentStep(currentStep)) {
        return;
    }

    currentStep += direction;
    if (currentStep < 1) currentStep = 1;
    if (currentStep > totalSteps) currentStep = totalSteps;

    updateProgressUI();

    document.querySelectorAll('.form-step-panel').forEach(panel => panel.classList.remove('active'));
    const activePanel = document.querySelector(`.form-step-panel[data-panel="${currentStep}"]`);
    if (activePanel) activePanel.classList.add('active');

    if (currentStep === 3) {
        populateSummaryReview();
    }

    const formCard = document.querySelector('.event-form-card');
    if (formCard) formCard.scrollIntoView({ behavior: 'smooth' });
}

function updateProgressUI() {
    const percent = Math.round((currentStep / totalSteps) * 100);
    const stepTitles = ["Adım 1: Kişisel Bilgiler", "Adım 2: Eğitim Bilgileri", "Adım 3: Detaylar & KVKK"];

    document.getElementById('step-title-display').innerText = stepTitles[currentStep - 1];
    document.getElementById('progress-percent-display').innerText = `%${percent} Tamamlandı`;
    document.getElementById('progress-fill-bar').style.width = `${percent}%`;

    document.querySelectorAll('.step-dot').forEach(dot => {
        const stepNum = parseInt(dot.getAttribute('data-step'));
        dot.classList.remove('active', 'completed');
        if (stepNum === currentStep) {
            dot.classList.add('active');
        } else if (stepNum < currentStep) {
            dot.classList.add('completed');
        }
    });

    const prevBtn = document.getElementById('btn-prev-step');
    const nextBtn = document.getElementById('btn-next-step');
    const submitBtn = document.getElementById('btn-submit-form');

    if (prevBtn) prevBtn.disabled = (currentStep === 1);

    if (currentStep === totalSteps) {
        if (nextBtn) nextBtn.classList.add('hidden');
        if (submitBtn) submitBtn.classList.remove('hidden');
    } else {
        if (nextBtn) nextBtn.classList.remove('hidden');
        if (submitBtn) submitBtn.classList.add('hidden');
    }
}

function validateCurrentStep(step) {
    let isValid = true;

    if (step === 1) {
        const nameInput = document.getElementById('fill-fullname');
        const phoneInput = document.getElementById('fill-phone');
        const emailInput = document.getElementById('fill-email');
        const districtInput = document.getElementById('fill-district');

        if (!nameInput.value.trim()) { showInputError('fill-fullname'); isValid = false; } else { clearInputError('fill-fullname'); }
        if (!phoneInput.value.trim()) { showInputError('fill-phone'); isValid = false; } else { clearInputError('fill-phone'); }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) { showInputError('fill-email'); isValid = false; } else { clearInputError('fill-email'); }
        if (!districtInput.value.trim()) { showInputError('fill-district'); isValid = false; } else { clearInputError('fill-district'); }

    } else if (step === 2) {
        const uniInput = document.getElementById('fill-university');
        const deptInput = document.getElementById('fill-department');
        const gradeInput = document.getElementById('fill-grade');

        if (!uniInput.value.trim()) { showInputError('fill-university'); isValid = false; } else { clearInputError('fill-university'); }
        if (!deptInput.value.trim()) { showInputError('fill-department'); isValid = false; } else { clearInputError('fill-department'); }
        if (!gradeInput.value) { showInputError('fill-grade'); isValid = false; } else { clearInputError('fill-grade'); }

    } else if (step === 3) {
        const kvkkCheckbox = document.getElementById('fill-kvkk');
        if (!kvkkCheckbox || !kvkkCheckbox.checked) {
            showInputError('fill-kvkk');
            isValid = false;
        } else {
            clearInputError('fill-kvkk');
        }
    }

    return isValid;
}

function showInputError(inputId) {
    const field = document.getElementById(inputId);
    if (field) {
        const group = field.closest('.form-group');
        if (group) group.classList.add('has-error');
    }
}

function clearInputError(inputId) {
    const field = document.getElementById(inputId);
    if (field) {
        const group = field.closest('.form-group');
        if (group) group.classList.remove('has-error');
    }
}

function populateSummaryReview() {
    document.getElementById('sum-fullname').innerText = document.getElementById('fill-fullname').value || '-';
    document.getElementById('sum-contact').innerText = `${document.getElementById('fill-email').value || '-'} / ${document.getElementById('fill-phone').value || '-'}`;
    document.getElementById('sum-school').innerText = `${document.getElementById('fill-university').value || '-'} - ${document.getElementById('fill-department').value || '-'}`;
    document.getElementById('sum-grade-dist').innerText = `${document.getElementById('fill-grade').value || '-'} | ${document.getElementById('fill-district').value || '-'}`;
}

/* -------------------------------------------------------------------------- */
/* FORM SUBMISSION & GOOGLE SHEETS WEBHOOK (POST)                             */
/* -------------------------------------------------------------------------- */
async function handleFormSubmission(e) {
    e.preventDefault();
    if (!validateCurrentStep(1) || !validateCurrentStep(2) || !validateCurrentStep(3)) {
        if (!validateCurrentStep(1)) changeStep(1 - currentStep);
        else if (!validateCurrentStep(2)) changeStep(2 - currentStep);
        return;
    }

    const submitBtn = document.getElementById('btn-submit-form');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Gönderiliyor...`;
    }

    const prefix = activePortalFormId.toUpperCase().substring(0, 4);
    const refCode = `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;
    const hearAboutChoice = document.querySelector('input[name="fill_hear_about"]:checked');

    const newResponse = {
        refCode: refCode,
        formSlug: activePortalFormId,
        fullName: document.getElementById('fill-fullname').value.trim(),
        phone: document.getElementById('fill-phone').value.trim(),
        email: document.getElementById('fill-email').value.trim(),
        district: document.getElementById('fill-district').value.trim(),
        university: document.getElementById('fill-university').value.trim(),
        department: document.getElementById('fill-department').value.trim(),
        grade: document.getElementById('fill-grade').value,
        hearAbout: hearAboutChoice ? hearAboutChoice.value : 'Instagram',
        notes: document.getElementById('fill-notes').value.trim() || '-',
        date: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    // 1. Dispatch POST request to Google Apps Script Webhook
    try {
        const webhookUrl = localStorage.getItem('firnas_google_script_url') || GOOGLE_APPS_SCRIPT_URL;
        if (webhookUrl && webhookUrl.startsWith('http')) {
            await fetch(webhookUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newResponse)
            });
        }
    } catch (err) {
        console.warn('Webhook post warning:', err);
    }

    // 2. Local Backup Storage
    saveResponseToLocalStorage(newResponse);

    // 3. Show Success Modal
    document.getElementById('modal-ref-code').innerText = refCode;
    document.getElementById('modal-ref-code-text').value = refCode;
    document.getElementById('form-success-modal').classList.add('active');

    // 4. Reset Form & Clear Auto-Save Draft
    document.getElementById('interactive-main-form').reset();
    clearFormDraft();
    currentStep = 1;
    updateProgressUI();
    document.querySelectorAll('.form-step-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelector('.form-step-panel[data-panel="1"]').classList.add('active');

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> Kaydı Tamamla & Gönder`;
    }
}

function saveResponseToLocalStorage(response) {
    try {
        const stored = localStorage.getItem('feam_networking_responses');
        const responses = stored ? JSON.parse(stored) : [];
        responses.unshift(response);
        localStorage.setItem('feam_networking_responses', JSON.stringify(responses));
    } catch (err) {
        console.warn('Local storage save warning:', err);
    }
}

function closeSuccessModal() {
    document.getElementById('form-success-modal').classList.remove('active');
}

/* -------------------------------------------------------------------------- */
/* RESPONSES DASHBOARD                                                         */
/* -------------------------------------------------------------------------- */
function getStoredResponses() {
    const data = localStorage.getItem('feam_networking_responses');
    return data ? JSON.parse(data) : [];
}

function loadAdminResponsesTable() {
    const responses = getStoredResponses();
    const tbody = document.getElementById('responses-table-body');
    const counter = document.getElementById('responses-counter');
    const statCounter = document.getElementById('stat-total-count');

    if (counter) counter.innerText = responses.length;
    if (statCounter) statCounter.innerText = responses.length;

    if (!tbody) return;

    if (responses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">Henüz kayıtlı yanıt bulunmuyor.</td></tr>`;
        return;
    }

    tbody.innerHTML = responses.map((r, index) => `
        <tr>
            <td><strong style="color: var(--form-accent);">${r.refCode || 'FEAM-0000'}</strong></td>
            <td><span class="badge-count" style="background:#e0f2fe; color:#0284c7;">${escapeHtml(r.formSlug || 'feam-2026')}</span></td>
            <td><strong>${escapeHtml(r.fullName || '-')}</strong></td>
            <td>
                <div><i class="fas fa-envelope text-muted"></i> ${escapeHtml(r.email || '-')}</div>
                <div class="small text-muted"><i class="fas fa-phone"></i> ${escapeHtml(r.phone || '-')}</div>
            </td>
            <td>${escapeHtml(r.district || '-')}</td>
            <td>${escapeHtml(r.university || '-')} <div class="small text-muted">${escapeHtml(r.department || '-')}</div></td>
            <td><span class="badge-count" style="background:#e2e8f0; color:#0f2e4a;">${escapeHtml(r.grade || '-')}</span></td>
            <td class="small text-muted">${r.date || '-'}</td>
            <td>
                <div style="display:flex; gap:6px;">
                    <button class="btn btn-secondary btn-sm" onclick="viewResponseDetail(${index})" title="Detay"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteResponse(${index})" title="Sil"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function viewResponseDetail(index) {
    const responses = getStoredResponses();
    const item = responses[index];
    if (!item) return;

    const modalBody = document.getElementById('modal-detail-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="summary-item"><span class="s-label">Referans Kodu:</span><span class="s-val">${item.refCode || '-'}</span></div>
            <div class="summary-item"><span class="s-label">Form Kimliği:</span><span class="s-val">${item.formSlug || 'feam-2026'}</span></div>
            <div class="summary-item"><span class="s-label">Ad Soyad:</span><span class="s-val">${escapeHtml(item.fullName || '-')}</span></div>
            <div class="summary-item"><span class="s-label">E-posta / Tel:</span><span class="s-val">${escapeHtml(item.email || '-')} / ${escapeHtml(item.phone || '-')}</span></div>
            <div class="summary-item"><span class="s-label">İkamet İlçe:</span><span class="s-val">${escapeHtml(item.district || '-')}</span></div>
            <div class="summary-item"><span class="s-label">Okul / Bölüm:</span><span class="s-val">${escapeHtml(item.university || '-')} - ${escapeHtml(item.department || '-')}</span></div>
            <div class="summary-item"><span class="s-label">Sınıf & Duyum:</span><span class="s-val">${escapeHtml(item.grade || '-')} | ${escapeHtml(item.hearAbout || '-')}</span></div>
            <div class="summary-item full-width"><span class="s-label">Ek Notlar:</span><span class="s-val">${escapeHtml(item.notes || '-')}</span></div>
            <div class="summary-item full-width"><span class="s-label">Kayıt Tarihi:</span><span class="s-val">${item.date || '-'}</span></div>
        `;
    }

    document.getElementById('response-detail-modal').classList.add('active');
}

function closeDetailModal() {
    document.getElementById('response-detail-modal').classList.remove('active');
}

function deleteResponse(index) {
    if (confirm('Bu kayıt silinsin mi?')) {
        const responses = getStoredResponses();
        responses.splice(index, 1);
        localStorage.setItem('feam_networking_responses', JSON.stringify(responses));
        loadAdminResponsesTable();
    }
}

function clearAllResponses() {
    if (confirm('Tüm katılımcı kayıtlarını silmek istediğinize emin misiniz?')) {
        localStorage.removeItem('feam_networking_responses');
        loadAdminResponsesTable();
    }
}

function exportResponsesCSV() {
    const responses = getStoredResponses();
    if (responses.length === 0) {
        alert('İndirilecek kayıt bulunmuyor.');
        return;
    }

    let csvContent = "\uFEFFReferans Kodu,Form Kimligi,Ad Soyad,Telefon,E-posta,İlçe,Üniversite,Bölüm,Sınıf,Nereden Duydunuz,Ek Notlar,Kayıt Tarihi\n";
    responses.forEach(r => {
        csvContent += `"${r.refCode}","${r.formSlug || 'feam-2026'}","${r.fullName}","${r.phone}","${r.email}","${r.district}","${r.university}","${r.department}","${r.grade}","${r.hearAbout}","${r.notes}","${r.date}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Firnas_Form_Yanitlar_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
}

function exportResponsesJSON() {
    const responses = getStoredResponses();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(responses, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `Firnas_Form_Yanitlar_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
}

/* -------------------------------------------------------------------------- */
/* KVKK MODAL                                                                 */
/* -------------------------------------------------------------------------- */
function openKvkkModal(e) {
    if (e) e.preventDefault();
    document.getElementById('kvkk-modal').classList.add('active');
}

function closeKvkkModal() {
    document.getElementById('kvkk-modal').classList.remove('active');
}

function acceptKvkkModal() {
    const cb = document.getElementById('fill-kvkk');
    if (cb) {
        cb.checked = true;
        clearInputError('fill-kvkk');
        saveFormDraft();
    }
    closeKvkkModal();
}

/* -------------------------------------------------------------------------- */
/* FORM BUILDER                                                               */
/* -------------------------------------------------------------------------- */
let customFormQuestions = [];

function addQuestionToBuilder(type) {
    const newId = Date.now();
    customFormQuestions.push({
        id: newId,
        type: type,
        title: 'Yeni Soru',
        options: type === 'choice' ? ['Seçenek 1', 'Seçenek 2'] : [],
        required: true
    });
    renderBuilderQuestions();
}

function updateBuilderTitle() {
    const title = document.getElementById('builder-form-title')?.value;
    const desc = document.getElementById('builder-form-desc')?.value;
    if (document.getElementById('preview-form-title')) document.getElementById('preview-form-title').innerText = title || 'Özel Form';
    if (document.getElementById('preview-form-desc')) document.getElementById('preview-form-desc').innerText = desc || '';
}

function renderBuilderQuestions() {
    const container = document.getElementById('builder-questions-list');
    if (!container) return;

    if (customFormQuestions.length === 0) {
        container.innerHTML = `<p class="text-center text-muted" style="padding: 2rem;">Henüz soru eklenmedi. Sol menüden soru türü seçin.</p>`;
        return;
    }

    container.innerHTML = customFormQuestions.map((q) => `
        <div class="builder-q-item">
            <div class="q-item-header">
                <input type="text" class="q-title-input" value="${escapeHtml(q.title)}" oninput="q.title = this.value" placeholder="Soru başlığı...">
                <button class="btn-q-delete" onclick="customFormQuestions = customFormQuestions.filter(item => item.id !== ${q.id}); renderBuilderQuestions();"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function publishCustomForm() {
    alert('✅ Yeni form tasarımları yayınlandı!');
}

function copyToClipboard(inputElemId) {
    const elem = document.getElementById(inputElemId);
    if (!elem) return;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(elem.value || elem.innerText);
    } else {
        elem.select();
        document.execCommand('copy');
    }
    alert('✅ Panoya kopyalandı!');
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
