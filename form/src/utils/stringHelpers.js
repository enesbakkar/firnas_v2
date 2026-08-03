/* ==========================================================================
   STRING & UI HELPERS (src/utils/stringHelpers.js)
   ========================================================================== */

export function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function slugify(str) {
    if (!str) return 'form-' + Math.floor(1000 + Math.random() * 9000);
    return str.toString()
        .toLowerCase()
        .trim()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export function generateRefCode(formSlug = 'feam-2026') {
    const prefix = formSlug.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4) || 'FEAM';
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${randomDigits}`;
}

export async function hashPasswordSHA256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function copyTextToClipboard(text, successMessage = 'Panoya kopyalandı!') {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        const dummy = document.createElement('textarea');
        document.body.appendChild(dummy);
        dummy.value = text;
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);
    }
    showToastNotification(successMessage);
}

export function showToastNotification(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.style.cssText = `
        background: #051421;
        color: #38bdf8;
        border: 1px solid rgba(0, 184, 212, 0.4);
        border-radius: 12px;
        padding: 10px 18px;
        font-size: 0.88rem;
        font-weight: 700;
        box-shadow: 0 10px 25px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        gap: 8px;
        pointer-events: auto;
        animation: fadeIn 0.3s ease;
    `;
    toast.innerHTML = `<i class="fas fa-check-circle" style="color:#00b8d4;"></i> ${escapeHtml(message)}`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

export function showConfirmDialog(title, message, onConfirm) {
    let overlay = document.getElementById('custom-confirm-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'custom-confirm-modal';
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-card" style="max-width: 440px; text-align: center;" role="dialog" aria-modal="true">
                <div class="auth-shield-icon" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; margin: 0 auto 1rem auto;">
                    <i class="fas fa-triangle-exclamation"></i>
                </div>
                <h3 id="confirm-modal-title" style="margin-bottom: 0.5rem; color:#ffffff;">Onay</h3>
                <p id="confirm-modal-msg" style="color:#94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem;">Emin misiniz?</p>
                <div style="display:flex; gap:10px;">
                    <button class="btn btn-secondary full-width" id="btn-confirm-cancel">İptal</button>
                    <button class="btn btn-danger full-width" id="btn-confirm-ok">Evet, Devam Et</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    const titleElem = overlay.querySelector('#confirm-modal-title');
    const msgElem = overlay.querySelector('#confirm-modal-msg');
    const btnCancel = overlay.querySelector('#btn-confirm-cancel');
    const btnOk = overlay.querySelector('#btn-confirm-ok');

    if (titleElem) titleElem.innerText = title;
    if (msgElem) msgElem.innerText = message;

    overlay.classList.add('active');

    btnCancel.onclick = () => {
        overlay.classList.remove('active');
    };

    btnOk.onclick = () => {
        overlay.classList.remove('active');
        if (typeof onConfirm === 'function') onConfirm();
    };
}

export function showAlertDialog(title, message) {
    let overlay = document.getElementById('custom-alert-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'custom-alert-modal';
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-card" style="max-width: 420px; text-align: center;" role="dialog" aria-modal="true">
                <div class="auth-shield-icon" style="background: rgba(0, 184, 212, 0.15); color: var(--form-accent); margin: 0 auto 1rem auto;">
                    <i class="fas fa-circle-info"></i>
                </div>
                <h3 id="alert-modal-title" style="margin-bottom: 0.5rem; color:#ffffff;">Bilgi</h3>
                <p id="alert-modal-msg" style="color:#94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem;">Mesaj</p>
                <button class="btn btn-primary full-width" id="btn-alert-ok">Tamam</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    const titleElem = overlay.querySelector('#alert-modal-title');
    const msgElem = overlay.querySelector('#alert-modal-msg');
    const btnOk = overlay.querySelector('#btn-alert-ok');

    if (titleElem) titleElem.innerText = title;
    if (msgElem) msgElem.innerText = message;

    overlay.classList.add('active');

    btnOk.onclick = () => {
        overlay.classList.remove('active');
    };
}
