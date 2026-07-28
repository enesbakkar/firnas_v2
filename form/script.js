/* ==========================================================================
   Firnas Form Suite - Public Participant Form Engine (script.js)
   ========================================================================== */

// Configurable Google Apps Script Webhook Endpoint (Defaults to saved value or placeholder)
let GOOGLE_APPS_SCRIPT_URL = localStorage.getItem('firnas_google_script_url') || 'https://script.google.com/macros/s/AKfycbx_EXAMPLE_WEBHOOK_URL/exec';

let currentStep = 1;
const totalSteps = 3;
const DRAFT_STORAGE_KEY = 'firnas_form_draft';

document.addEventListener('DOMContentLoaded', () => {
    restoreFormDraft();
    updateProgressUI();
});

/* -------------------------------------------------------------------------- */
/* DRAFT AUTO-SAVE (sessionStorage)                                           */
/* -------------------------------------------------------------------------- */
function handleInputAutoSave(inputId) {
    clearInputError(inputId);
    saveFormDraft();
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
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
    } catch (err) {
        console.warn('Auto-save warning:', err);
    }
}

function restoreFormDraft() {
    try {
        const data = sessionStorage.getItem(DRAFT_STORAGE_KEY);
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
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
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
