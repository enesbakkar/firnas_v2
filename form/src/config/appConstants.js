/* ==========================================================================
   APP CONSTANTS (src/config/appConstants.js)
   ========================================================================== */

// Admin şifresi artık kaynak kodda bulunmuyor.
// Şifre doğrulama sunucu tarafında (Google Apps Script) yapılıyor.
// Aşağıdaki hash sadece offline fallback içindir.
export const ADMIN_PASSWORD_HASH = '4129340ba99f33a623c0a2d920dfe874235cc613b4cc5f35cf239afd81f3324d';

// Google Apps Script Web App URL'si
// KURULUM: form/gas/KURULUM.md dosyasındaki adımları takip et
// Deploy ettikten sonra aşağıdaki URL'yi güncelle
export const GAS_BACKEND_URL = 'https://script.google.com/macros/s/KURULUMU_TAMAMLA_VE_BURAYA_URL_YAZ/exec';

// GAS backend aktif mi? (URL placeholder değilse aktif)
export const IS_GAS_CONFIGURED = !GAS_BACKEND_URL.includes('KURULUMU_TAMAMLA');

export const STORAGE_KEYS = {
    RESPONSES: 'feam_networking_responses',
    CUSTOM_FORMS: 'firnas_custom_forms',
    ADMIN_TOKEN: 'firnas_admin_token',
    ADMIN_TOKEN_EXPIRES: 'firnas_admin_token_exp',
    AUTH_STATE: 'firnas_form_authenticated',
    DRAFT_PREFIX: 'firnas_draft_'
};
