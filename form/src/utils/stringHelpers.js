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
