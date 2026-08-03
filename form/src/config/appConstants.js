/* ==========================================================================
   APP CONSTANTS (src/config/appConstants.js)
   ========================================================================== */

// Hashed SHA-256 password (FORMS_fir_2023)
export const ADMIN_PASSWORD_HASH = '2e7cd34aa543b59bdc43a41c1075d9e5d4cbdf2bb19a3b6329c3be7a44f2b1d6';

export const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbx_EXAMPLE_WEBHOOK_URL/exec';

export const STORAGE_KEYS = {
    RESPONSES: 'feam_networking_responses',
    CUSTOM_FORMS: 'firnas_custom_forms',
    WEBHOOK_URL: 'firnas_google_script_url',
    AUTH_STATE: 'firnas_form_authenticated',
    DRAFT_PREFIX: 'firnas_draft_'
};
