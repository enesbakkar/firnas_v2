/* ==========================================================================
   Firnas Form Suite - Dedicated Form Runner Engine (script.js)
   Renders Dedicated Form View for URL slugs (?f=slug)
   ========================================================================== */

let GOOGLE_APPS_SCRIPT_URL = localStorage.getItem('firnas_google_script_url') || 'https://script.google.com/macros/s/AKfycbx_EXAMPLE_WEBHOOK_URL/exec';

let currentStep = 1;
const totalSteps = 3;
let activeFormSlug = 'feam-2026';
let activeFormConfig = null;

// Built-in system fallback forms
const FALLBACK_SYSTEM_FORMS = {
    'feam-2026': {
        slug: 'feam-2026',
        title: 'FEAM Networking 2026',
        category: 'Etkinlik & Buluşma',
        banner: '/asset/feam_banner.png',
        meta1: { icon: 'fa-calendar-day', text: '1 Ağustos 2026, 15:00' },
        meta2: { icon: 'fa-location-dot', text: 'Atölye Üsküdar' },
        meta3: { icon: 'fa-users', text: 'Gençlik & Teknoloji Buluşması' },
        desc: '<i class="fas fa-circle-info info-icon"></i> Lise ve üniversite öğrencilerinin teknoloji ve inovasyon etrafında bir araya geldiği bu özel buluşmada yerinizi almak için aşağıdaki formu eksiksiz doldurun!'
    },
    'proje-basvuru': {
        slug: 'proje-basvuru',
        title: 'Firnas Proje & AR-GE Başvurusu',
        category: 'Proje & AR-GE',
        banner: null,
        meta1: { icon: 'fa-microchip', text: 'AR-GE & Otonom Sistemler' },
        meta2: { icon: 'fa-laptop-code', text: 'Yazılım, Donanım & STEM' },
        meta3: { icon: 'fa-bolt', text: 'Başvurular Açık' },
        desc: '<i class="fas fa-rocket info-icon"></i> Firnas Technologies bünyesinde yürütülen teknoloji, yazılım, robotik ve STEM projelerinde yer almak veya kendi projenizle başvuru yapmak için formu doldurun.'
    },
    'kurumsal-iletisim': {
        slug: 'kurumsal-iletisim',
        title: 'Kurumsal İletişim & Destek Formu',
        category: 'İletişim & Destek',
        banner: null,
        meta1: { icon: 'fa-headset', text: '7/24 İletişim Merkezi' },
        meta2: { icon: 'fa-building', text: 'Firnas Technologies HQ' },
        meta3: { icon: 'fa-envelope-open-text', text: 'Kurumsal & Bireysel Talepler' },
        desc: '<i class="fas fa-handshake info-icon"></i> Firnas Technologies ürünleri, FiCo eğitim kitleri veya kurumsal iş birliği talepleriniz için doğrudan yönetim ve destek ekibimize mesajınızı iletin.'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    activeFormSlug = detectActiveFormSlug();
    loadFormConfig(activeFormSlug);
    restoreFormDraft();
    updateProgressUI();
});

/* -------------------------------------------------------------------------- */
/* DETECT & RENDER FORM CONFIGURATION FROM URL SLUG                            */
/* -------------------------------------------------------------------------- */
function detectActiveFormSlug() {
    const urlParams = new URLSearchParams(window.location.search);
    let slug = urlParams.get('f') || urlParams.get('form');
    if (!slug && window.location.hash) {
        slug = window.location.hash.substring(1);
    }
    return slug || 'feam-2026';
}

function loadFormConfig(slug) {
    let allForms = [];
    try {
        const stored = localStorage.getItem('firnas_all_forms');
        if (stored) allForms = JSON.parse(stored);
    } catch (e) {}

    const customObj = allForms.find(f => f.slug === slug);
    const fallbackObj = FALLBACK_SYSTEM_FORMS[slug];

    if (customObj) {
        activeFormConfig = customObj;
    } else if (fallbackObj) {
        activeFormConfig = fallbackObj;
    } else {
        activeFormConfig = {
            slug: slug,
            title: capitalizeSlug(slug) + ' Formu',
            category: 'Başvuru',
            banner: null,
            meta1: { icon: 'fa-link', text: `?f=${slug}` },
            meta2: { icon: 'fa-check-circle', text: 'Aktif Form' },
            meta3: { icon: 'fa-paper-plane', text: 'Canlı Başvuru' },
            desc: '<i class="fas fa-info-circle info-icon"></i> Bu başvuru formunu tamamlamak için aşağıdaki adımları eksiksiz doldurunuz.'
        };
    }

    renderActiveFormHeaderUI();
}

function renderActiveFormHeaderUI() {
    if (!activeFormConfig) return;

    // Document Title & Heading
    document.title = `${activeFormConfig.title} | Firnas Technologies`;
    const titleElem = document.getElementById('public-form-main-title');
    const badgeElem = document.getElementById('public-form-category-badge');
    const descElem = document.getElementById('public-form-desc-text');
    const bannerContainer = document.getElementById('public-form-banner-container');
    const bannerImg = document.getElementById('public-form-banner-img');

    if (titleElem) titleElem.innerText = activeFormConfig.title;
    if (badgeElem) badgeElem.innerText = (activeFormConfig.category || 'BAŞVURU FORM').toUpperCase();
    if (descElem) descElem.innerHTML = activeFormConfig.desc || '<i class="fas fa-info-circle info-icon"></i> Lütfen formu eksiksiz doldurun.';

    // Banner image visibility
    if (bannerContainer && bannerImg) {
        if (activeFormConfig.banner) {
            bannerImg.src = activeFormConfig.banner;
            bannerContainer.style.display = 'flex';
        } else {
            bannerContainer.style.display = 'none';
        }
    }

    // Metadata pills
    if (activeFormConfig.meta1) {
        const m1 = document.getElementById('meta-text-1');
        if (m1) m1.parentElement.innerHTML = `<i class="fas ${activeFormConfig.meta1.icon}"></i> <span>${activeFormConfig.meta1.text}</span>`;
    }
    if (activeFormConfig.meta2) {
        const m2 = document.getElementById('meta-text-2');
        if (m2) m2.parentElement.innerHTML = `<i class="fas ${activeFormConfig.meta2.icon}"></i> <span>${activeFormConfig.meta2.text}</span>`;
    }
    if (activeFormConfig.meta3) {
        const m3 = document.getElementById('meta-text-3');
        if (m3) m3.parentElement.innerHTML = `<i class="fas ${activeFormConfig.meta3.icon}"></i> <span>${activeFormConfig.meta3.text}</span>`;
    }
}

function capitalizeSlug(slug) {
    return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/* -------------------------------------------------------------------------- */
/* DRAFT AUTO-SAVE (sessionStorage per slug)                                  */
/* -------------------------------------------------------------------------- */
function handleInputAutoSave(inputId) {
    clearInputError(inputId);
    saveFormDraft();
}

function getDraftKey() {
    return `firnas_draft_${activeFormSlug}`;
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

    const prefix = activeFormSlug.toUpperCase().substring(0, 4);
    const refCode = `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;
    const hearAboutChoice = document.querySelector('input[name="fill_hear_about"]:checked');

    const newResponse = {
        refCode: refCode,
        formSlug: activeFormSlug,
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

    // 1. Dispatch POST request to Google Apps Script Webhook (Live Sheets Integration)
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

    // 3. Show Success Modal with Reference Code
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
/* KVKK MODAL HANDLERS                                                        */
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

function copyToClipboard(inputElemId) {
    const elem = document.getElementById(inputElemId);
    if (!elem) return;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(elem.value || elem.innerText);
    } else {
        elem.select();
        document.execCommand('copy');
    }
    alert('✅ Referans kodu başarıyla kopyalandı!');
}
