/* ==========================================================================
   STRING HELPERS (src/utils/stringHelpers.js)
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
