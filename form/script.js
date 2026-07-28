/* ==========================================================================
   Firnas Form Suite JavaScript - Comprehensive Audit & Bug Fixes
   ========================================================================== */

const CORRECT_PASSWORD = 'FORMS_fir_2023';

let currentStep = 1;
const totalSteps = 3;
let pendingTabTarget = null;

// Default FEAM Networking Questions for Builder
let customFormQuestions = [
    { id: 1, type: 'text', title: 'İsim Soyisim', required: true },
    { id: 2, type: 'text', title: 'Telefon Numarası', required: true },
    { id: 3, type: 'text', title: 'E-posta Adresi', required: true },
    { id: 4, type: 'text', title: 'İkamet Edilen İlçe', required: true },
    { id: 5, type: 'text', title: 'Üniversite', required: true },
    { id: 6, type: 'text', title: 'Bölüm', required: true },
    { id: 7, type: 'dropdown', title: 'Sınıf (Hazırlık, 1. Sınıf, 2. Sınıf, 3. Sınıf, 4. Sınıf, Yüksek Lisans, Mezun)', required: true },
    { id: 8, type: 'choice', title: 'Etkinliği Nereden Duydunuz?', options: ['Instagram', 'LinkedIn', 'Arkadaş Tavsiyesi', 'WhatsApp Grupları', 'Diğer'], required: true },
    { id: 9, type: 'textarea', title: 'Eklemek İstedikleriniz (İsteğe bağlı)', required: false }
];

document.addEventListener('DOMContentLoaded', () => {
    checkInitialPageAuth();
    updateAdminLockBtnState();
    updateProgressUI();
    loadResponsesTable();
    renderBuilderQuestions();
    updateResponsesCounter();
});

/* -------------------------------------------------------------------------- */
/* AUTHENTICATION & ACCESS CONTROL                                             */
/* -------------------------------------------------------------------------- */
function isUserAuthenticated() {
    return sessionStorage.getItem('firnas_form_authenticated') === 'true';
}

function checkInitialPageAuth() {
    const overlay = document.getElementById('auth-lock-overlay');
    if (!overlay) return;
    if (isUserAuthenticated()) {
        overlay.classList.remove('active');
    } else {
        overlay.classList.add('active');
        const input = document.getElementById('auth-password-input');
        if (input) setTimeout(() => input.focus(), 100);
    }
}

function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input || !btn) return;
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    } else {
        input.type = 'password';
        if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
}

function updateAdminLockBtnState() {
    const lockBtn = document.getElementById('admin-lock-btn');
    if (lockBtn) {
        if (isUserAuthenticated()) {
            lockBtn.classList.remove('hidden');
        } else {
            lockBtn.classList.add('hidden');
        }
    }
}

function handleAuthSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('auth-password-input');
    const errorMsg = document.getElementById('auth-error-msg');
    const authCard = document.querySelector('.auth-card');

    if (input.value === CORRECT_PASSWORD) {
        sessionStorage.setItem('firnas_form_authenticated', 'true');
        if (errorMsg) errorMsg.style.display = 'none';
        document.getElementById('auth-lock-overlay').classList.remove('active');
        input.value = '';
        updateAdminLockBtnState();

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

function closeAuthModal() {
    if (!isUserAuthenticated()) {
        window.location.href = '/';
    } else {
        document.getElementById('auth-lock-overlay').classList.remove('active');
        pendingTabTarget = null;
    }
}

function lockAdminPanel() {
    sessionStorage.removeItem('firnas_form_authenticated');
    updateAdminLockBtnState();
    checkInitialPageAuth();
}

/* -------------------------------------------------------------------------- */
/* TAB SWITCHING WITH AUTH GUARD                                               */
/* -------------------------------------------------------------------------- */
function switchFormTab(tabName) {
    if ((tabName === 'responses' || tabName === 'builder') && !isUserAuthenticated()) {
        pendingTabTarget = tabName;
        document.getElementById('auth-error-msg').style.display = 'none';
        document.getElementById('auth-password-input').value = '';
        document.getElementById('auth-lock-overlay').classList.add('active');
        return;
    }

    activateTab(tabName);
}

function activateTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const activeBtn = document.getElementById(`tab-${tabName}-btn`);
    const activeTab = document.getElementById(`tab-${tabName}`);

    if (activeBtn && activeTab) {
        activeBtn.classList.add('active');
        activeTab.classList.add('active');
    }

    if (tabName === 'responses') {
        loadResponsesTable();
    }
}

/* -------------------------------------------------------------------------- */
/* MULTI-STEP FORM WIZARD LOGIC                                               */
/* -------------------------------------------------------------------------- */
function changeStep(delta) {
    if (delta > 0 && !validateCurrentStep(currentStep)) {
        return;
    }

    const nextStep = currentStep + delta;
    if (nextStep >= 1 && nextStep <= totalSteps) {
        document.querySelector(`.form-step-panel[data-panel="${currentStep}"]`).classList.remove('active');
        currentStep = nextStep;
        document.querySelector(`.form-step-panel[data-panel="${currentStep}"]`).classList.add('active');

        if (currentStep === 3) {
            populateSummaryReview();
        }

        updateProgressUI();
    }
}

function updateProgressUI() {
    const percent = (currentStep / totalSteps) * 100;
    const progressFill = document.getElementById('progress-fill-bar');
    const percentText = document.getElementById('progress-percent-display');
    const stepTitleText = document.getElementById('step-title-display');

    const stepTitles = [
        "Adım 1: Kişisel Bilgiler",
        "Adım 2: Eğitim Bilgileri",
        "Adım 3: Etkinlik Detayları & Özet"
    ];

    if (progressFill) progressFill.style.width = `${percent}%`;
    if (percentText) percentText.innerText = `%${Math.round(percent)} Tamamlandı`;
    if (stepTitleText) stepTitleText.innerText = stepTitles[currentStep - 1];

    document.querySelectorAll('.step-dot').forEach(dot => {
        const stepNum = parseInt(dot.getAttribute('data-step'));
        dot.classList.remove('active', 'completed');
        if (stepNum === currentStep) {
            dot.classList.add('active');
        } else if (stepNum < currentStep) {
            dot.classList.add('completed');
        }
    });

    const btnPrev = document.getElementById('btn-prev-step');
    const btnNext = document.getElementById('btn-next-step');
    const btnSubmit = document.getElementById('btn-submit-form');

    if (btnPrev) btnPrev.disabled = (currentStep === 1);

    if (currentStep === totalSteps) {
        if (btnNext) btnNext.classList.add('hidden');
        if (btnSubmit) btnSubmit.classList.remove('hidden');
    } else {
        if (btnNext) btnNext.classList.remove('hidden');
        if (btnSubmit) btnSubmit.classList.add('hidden');
    }
}

/* -------------------------------------------------------------------------- */
/* STEP VALIDATION & INPUT ERROR CLEANUP                                       */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/* SUMMARY REVIEW                                                             */
/* -------------------------------------------------------------------------- */
function populateSummaryReview() {
    document.getElementById('sum-fullname').innerText = document.getElementById('fill-fullname').value || '-';
    document.getElementById('sum-contact').innerText = `${document.getElementById('fill-email').value || '-'} / ${document.getElementById('fill-phone').value || '-'}`;
    document.getElementById('sum-school').innerText = `${document.getElementById('fill-university').value || '-'} - ${document.getElementById('fill-department').value || '-'}`;
    document.getElementById('sum-grade-dist').innerText = `${document.getElementById('fill-grade').value || '-'} | ${document.getElementById('fill-district').value || '-'}`;
}

/* -------------------------------------------------------------------------- */
/* FORM SUBMISSION & LOCALSTORAGE                                             */
/* -------------------------------------------------------------------------- */
function handleFormSubmission(e) {
    e.preventDefault();
    if (!validateCurrentStep(1) || !validateCurrentStep(2)) {
        changeStep(1 - currentStep); // Navigate back to step 1 to fix errors
        return;
    }

    const refCode = 'FEAM-' + Math.floor(10000 + Math.random() * 90000);
    const hearAboutChoice = document.querySelector('input[name="fill_hear_about"]:checked');

    const newResponse = {
        refCode: refCode,
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

    saveResponseToStorage(newResponse);

    document.getElementById('modal-ref-code').innerText = refCode;
    document.getElementById('form-success-modal').classList.add('active');

    // Reset Form & Step Progress
    document.getElementById('interactive-main-form').reset();
    currentStep = 1;
    updateProgressUI();
    document.querySelectorAll('.form-step-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelector('.form-step-panel[data-panel="1"]').classList.add('active');
    
    // Scroll smoothly to form header
    document.querySelector('.event-form-card').scrollIntoView({ behavior: 'smooth' });
}

function closeSuccessModal() {
    document.getElementById('form-success-modal').classList.remove('active');
}

function getStoredResponses() {
    const data = localStorage.getItem('feam_networking_responses');
    return data ? JSON.parse(data) : [];
}

function saveResponseToStorage(response) {
    const responses = getStoredResponses();
    responses.unshift(response);
    localStorage.setItem('feam_networking_responses', JSON.stringify(responses));
    updateResponsesCounter();
}

function updateResponsesCounter() {
    const responses = getStoredResponses();
    const counter = document.getElementById('responses-counter');
    if (counter) counter.innerText = responses.length;
}

/* -------------------------------------------------------------------------- */
/* RESPONSES TABLE DISPLAY (GOOGLE SHEETS FORMAT)                             */
/* -------------------------------------------------------------------------- */
function loadResponsesTable() {
    const responses = getStoredResponses();
    const tbody = document.getElementById('responses-table-body');
    const totalCount = document.getElementById('stat-total-count');

    if (totalCount) totalCount.innerText = responses.length;

    if (responses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center text-muted" style="padding: 2rem;">Henüz kayıtlı katılımcı bulunmuyor. Canlı Etkinlik Formu sekmesinden ilk kaydı oluşturabilirsiniz.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = responses.map((r, index) => `
        <tr>
            <td><strong>${r.fullName}</strong></td>
            <td>${r.phone}</td>
            <td>${r.email}</td>
            <td>${r.district}</td>
            <td>${r.university}</td>
            <td>${r.department}</td>
            <td><span class="badge-tag">${r.grade}</span></td>
            <td>${r.hearAbout}</td>
            <td>${r.date}</td>
            <td>
                <div style="display: flex; gap: 6px;">
                    <button class="btn btn-secondary btn-sm" onclick="viewSingleResponse(${index})" title="Detay"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteSingleResponse(${index})" title="Sil"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function viewSingleResponse(index) {
    const responses = getStoredResponses();
    const r = responses[index];
    if (!r) return;

    const modalBody = document.getElementById('detail-modal-body');
    modalBody.innerHTML = `
        <div class="summary-item"><span class="s-label">Referans Kodu:</span><span class="s-val text-accent">${r.refCode}</span></div>
        <div class="summary-item"><span class="s-label">Kayıt Tarihi:</span><span class="s-val">${r.date}</span></div>
        <div class="summary-item"><span class="s-label">İsim Soyisim:</span><span class="s-val">${r.fullName}</span></div>
        <div class="summary-item"><span class="s-label">Telefon:</span><span class="s-val">${r.phone}</span></div>
        <div class="summary-item"><span class="s-label">E-posta Adresi:</span><span class="s-val">${r.email}</span></div>
        <div class="summary-item"><span class="s-label">İkamet Edilen İlçe:</span><span class="s-val">${r.district}</span></div>
        <div class="summary-item"><span class="s-label">Üniversite / Okul:</span><span class="s-val">${r.university}</span></div>
        <div class="summary-item"><span class="s-label">Bölüm:</span><span class="s-val">${r.department}</span></div>
        <div class="summary-item"><span class="s-label">Sınıf:</span><span class="s-val">${r.grade}</span></div>
        <div class="summary-item"><span class="s-label">Nereden Duydunuz?:</span><span class="s-val">${r.hearAbout}</span></div>
        <div class="summary-item full-width" style="margin-top: 10px; border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 10px;">
            <span class="s-label">Eklemek İstedikleriniz:</span>
            <span class="s-val">${r.notes || 'Yok'}</span>
        </div>
    `;

    document.getElementById('response-detail-modal').classList.add('active');
}

function closeDetailModal() {
    document.getElementById('response-detail-modal').classList.remove('active');
}

function deleteSingleResponse(index) {
    if (confirm('Bu katılımcı kaydını silmek istediğinize emin misiniz?')) {
        const responses = getStoredResponses();
        responses.splice(index, 1);
        localStorage.setItem('feam_networking_responses', JSON.stringify(responses));
        loadResponsesTable();
        updateResponsesCounter();
    }
}

function exportResponsesCSV() {
    const responses = getStoredResponses();
    if (responses.length === 0) {
        alert('İndirilecek kayıtlı katılımcı verisi bulunmamaktadır.');
        return;
    }

    const headers = ["İsim Soyisim", "Telefon Numarası", "E-posta Adresi", "İkamet Edilen İlçe", "Üniversite", "Bölüm", "Sınıf", "Etkinliği Nereden Duydunuz?", "Eklemek İstedikleriniz", "Kayıt Tarihi"];
    const rows = responses.map(r => [
        `"${r.fullName}"`,
        `"${r.phone}"`,
        `"${r.email}"`,
        `"${r.district}"`,
        `"${r.university}"`,
        `"${r.department}"`,
        `"${r.grade}"`,
        `"${r.hearAbout}"`,
        `"${r.notes || ''}"`,
        `"${r.date}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `FEAM_Networking_Katilimci_Kayitlari_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportResponsesJSON() {
    const responses = getStoredResponses();
    if (responses.length === 0) {
        alert('İndirilecek kayıtlı veri bulunmamaktadır.');
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(responses, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `feam_networking_responses_${Date.now()}.json`);
    dlAnchorElem.click();
}

function clearAllResponses() {
    if (confirm('Tüm FEAM Networking katılımcı kayıtlarını silmek istediğinizden emin misiniz?')) {
        localStorage.removeItem('feam_networking_responses');
        loadResponsesTable();
        updateResponsesCounter();
    }
}

/* -------------------------------------------------------------------------- */
/* FORM BUILDER LOGIC                                                         */
/* -------------------------------------------------------------------------- */
function addQuestionToBuilder(type) {
    const id = Date.now();
    let newQ = { id, type, title: 'Yeni Soru', required: false };

    if (type === 'text') newQ.title = 'Kısa Yanıt Sorunuz';
    else if (type === 'textarea') newQ.title = 'Paragraf / Açıklama Sorunuz';
    else if (type === 'choice') {
        newQ.title = 'Çoktan Seçmeli Soru';
        newQ.options = ['Seçenek 1', 'Seçenek 2', 'Seçenek 3'];
    } else if (type === 'dropdown') {
        newQ.title = 'Açılır Menü (Dropdown) Sorusu';
        newQ.options = ['Seçenek A', 'Seçenek B', 'Seçenek C'];
    }

    customFormQuestions.push(newQ);
    renderBuilderQuestions();
}

function deleteQuestionFromBuilder(id) {
    customFormQuestions = customFormQuestions.filter(q => q.id !== id);
    renderBuilderQuestions();
}

function updateQuestionTitle(id, val) {
    const q = customFormQuestions.find(item => item.id === id);
    if (q) q.title = val;
}

function updateBuilderTitle() {
    const titleVal = document.getElementById('builder-form-title').value;
    const descVal = document.getElementById('builder-form-desc').value;

    document.getElementById('preview-form-title').innerText = titleVal || 'Özel Form';
    document.getElementById('preview-form-desc').innerText = descVal || '';
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
                <input type="text" class="q-title-input" value="${q.title}" oninput="updateQuestionTitle(${q.id}, this.value)" placeholder="Soru başlığı...">
                <div class="q-actions">
                    <button class="btn-q-delete" onclick="deleteQuestionFromBuilder(${q.id})" title="Soruyu Sil"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="q-item-preview" style="margin-top: 10px;">
                ${renderQuestionControlPreview(q)}
            </div>
        </div>
    `).join('');
}

function renderQuestionControlPreview(q) {
    if (q.type === 'text') {
        return `<input type="text" class="form-control" placeholder="Kullanıcı yanıtı..." disabled>`;
    } else if (q.type === 'textarea') {
        return `<textarea class="form-control" rows="2" placeholder="Açıklama..." disabled></textarea>`;
    } else if (q.type === 'choice') {
        return (q.options || ['Seçenek 1']).map(opt => `
            <div style="margin-bottom: 4px;"><input type="radio" disabled> <span style="font-size: 0.9rem; color: #475569;">${opt}</span></div>
        `).join('');
    } else if (q.type === 'dropdown') {
        return `<select class="form-control" disabled><option>Seçenek seçiniz...</option></select>`;
    }
    return '';
}

function resetBuilderForm() {
    if (confirm('Form tasarımını sıfırlamak istediğinize emin misiniz?')) {
        customFormQuestions = [];
        renderBuilderQuestions();
    }
}

function publishCustomForm() {
    const formId = 'feam-networking-' + Math.floor(1000 + Math.random() * 9000);
    const directUrl = `${window.location.origin}${window.location.pathname}#${formId}`;
    const iframeCode = `<iframe src="${directUrl}" width="100%" height="750px" frameborder="0" style="border:none; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,0.1);"></iframe>`;

    document.getElementById('share-direct-url').value = directUrl;
    document.getElementById('share-iframe-code').value = iframeCode;

    document.getElementById('embed-code-modal').classList.add('active');
}

function closeEmbedModal() {
    document.getElementById('embed-code-modal').classList.remove('active');
}

function copyToClipboard(inputElemId) {
    const elem = document.getElementById(inputElemId);
    if (!elem) return;

    elem.select();
    elem.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(elem.value);

    alert('✅ Kod başarıyla panoya kopyalandı!');
}

/* -------------------------------------------------------------------------- */
/* PORTAL FORM SELECTOR & SWITCHING                                            */
/* -------------------------------------------------------------------------- */
const PORTAL_FORMS = {
    'feam-2026': {
        title: 'FEAM Networking 2026',
        banner: '/asset/feam_banner.png',
        bannerVisible: true,
        meta1: { icon: 'fa-calendar-day', text: '1 Ağustos 2026, 15:00' },
        meta2: { icon: 'fa-location-dot', text: 'Atölye Üsküdar' },
        meta3: { icon: 'fa-rocket', text: 'Firnas TEAM Buluşması' },
        desc: '<i class="fas fa-circle-info info-icon"></i> Lise ve üniversite öğrencilerinin teknoloji ve inovasyon etrafında bir araya geldiği; proje sunumları, tanışma etkinliği, networking çalışmaları ve ortak üretim odaklı fikir alışverişi yapılan bu özel buluşmada yerinizi almak için aşağıdaki formu eksiksiz doldurun!'
    },
    'project-apply': {
        title: 'Firnas Proje & AR-GE Başvurusu',
        banner: null,
        bannerVisible: false,
        meta1: { icon: 'fa-microchip', text: 'AR-GE & Otonom Sistemler' },
        meta2: { icon: 'fa-laptop-code', text: 'Yazılım, Donanım & STEM' },
        meta3: { icon: 'fa-bolt', text: 'Proje Başvuruları Açık' },
        desc: '<i class="fas fa-rocket info-icon"></i> Firnas Technologies bünyesinde yürütülen teknoloji, yazılım, robotik ve STEM projelerinde yer almak, kendi projenizle başvuru yapmak veya geliştirme ekibimize dahil olmak için aşağıdaki başvuru formunu doldurun.'
    },
    'general-contact': {
        title: 'Kurumsal İletişim & Destek Formu',
        banner: null,
        bannerVisible: false,
        meta1: { icon: 'fa-headset', text: '7/24 İletişim Merkezi' },
        meta2: { icon: 'fa-building', text: 'Firnas Technologies HQ' },
        meta3: { icon: 'fa-envelope-open-text', text: 'Kurumsal & Bireysel Talepler' },
        desc: '<i class="fas fa-handshake info-icon"></i> Firnas Technologies ürünleri, eğitim kitlerimiz (FiCo) veya kurumsal iş birliği talepleriniz için doğrudan yönetim ve destek ekibimize mesajınızı iletebilirsiniz.'
    }
};

let activePortalFormId = 'feam-2026';

function selectPortalForm(formId) {
    if (!PORTAL_FORMS[formId]) return;
    activePortalFormId = formId;

    // Update catalog cards active state
    document.querySelectorAll('.form-select-card').forEach(card => {
        card.classList.remove('active');
        const indicator = card.querySelector('.card-active-indicator');
        if (indicator) indicator.innerHTML = '<i class="fas fa-circle"></i> Seç';
    });

    const activeCard = document.getElementById(`card-${formId}`);
    if (activeCard) {
        activeCard.classList.add('active');
        const indicator = activeCard.querySelector('.card-active-indicator');
        if (indicator) indicator.innerHTML = '<i class="fas fa-circle-check"></i> Aktif';
    }

    const formData = PORTAL_FORMS[formId];

    // Update Banner Container
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

    // Update Metadata
    const mText1 = document.getElementById('meta-text-1');
    const mText2 = document.getElementById('meta-text-2');
    const mText3 = document.getElementById('meta-text-3');

    if (mText1 && formData.meta1) mText1.parentElement.innerHTML = `<i class="fas ${formData.meta1.icon}"></i> <span>${formData.meta1.text}</span>`;
    if (mText2 && formData.meta2) mText2.parentElement.innerHTML = `<i class="fas ${formData.meta2.icon}"></i> <span>${formData.meta2.text}</span>`;
    if (mText3 && formData.meta3) mText3.parentElement.innerHTML = `<i class="fas ${formData.meta3.icon}"></i> <span>${formData.meta3.text}</span>`;

    // Update Description
    const descText = document.getElementById('form-desc-text');
    if (descText) descText.innerHTML = formData.desc;

    // Smooth scroll to form card
    const formWrapper = document.getElementById('selected-form-wrapper');
    if (formWrapper) formWrapper.scrollIntoView({ behavior: 'smooth' });
}

function openFormViewer(formId) {
    selectPortalForm(formId);

    const dashboardView = document.getElementById('portal-dashboard-view');
    const viewerView = document.getElementById('portal-form-viewer-view');
    const badge = document.getElementById('viewer-form-title-badge');

    if (dashboardView && viewerView) {
        dashboardView.classList.add('hidden');
        viewerView.classList.remove('hidden');
        if (badge && PORTAL_FORMS[formId]) {
            badge.innerText = PORTAL_FORMS[formId].title;
        }

        viewerView.scrollIntoView({ behavior: 'smooth' });
    }
}

function closeFormViewer() {
    const dashboardView = document.getElementById('portal-dashboard-view');
    const viewerView = document.getElementById('portal-form-viewer-view');

    if (dashboardView && viewerView) {
        viewerView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        dashboardView.scrollIntoView({ behavior: 'smooth' });
    }
}
