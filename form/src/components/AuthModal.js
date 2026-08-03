/* ==========================================================================
   AUTH MODAL COMPONENT (src/components/AuthModal.js)
   GAS Backend login first — local hash fallback if GAS not configured
   ========================================================================== */

import { ADMIN_PASSWORD_HASH, STORAGE_KEYS, IS_GAS_CONFIGURED } from '../config/appConstants.js';
import { hashPasswordSHA256 } from '../utils/stringHelpers.js';
import { loginAdmin, clearAdminToken } from '../core/apiService.js';

export function setupAuthModal(container, store) {
    let pendingTabTarget = null;
    const overlay = container.querySelector('#auth-lock-overlay');
    const authForm = container.querySelector('#auth-form');
    const cancelBtn = container.querySelector('#btn-cancel-auth');

    function render() {
        const state = store.getState();
        const lockBtn = container.querySelector('#admin-lock-btn');
        if (lockBtn) {
            if (state.isAuthenticated) lockBtn.classList.remove('hidden');
            else lockBtn.classList.add('hidden');
        }
        const isStandalone = document.body.classList.contains('standalone-form-mode');
        if (!state.isAuthenticated && !isStandalone) {
            if (overlay) overlay.classList.add('active');
        } else if (state.isAuthenticated) {
            if (overlay) overlay.classList.remove('active');
        }
    }

    if (authForm) {
        authForm.onsubmit = async (e) => {
            e.preventDefault();
            const input = container.querySelector('#auth-password-input');
            const errorMsg = container.querySelector('#auth-error-msg');
            const authCard = container.querySelector('.auth-card');
            const submitBtn = container.querySelector('#btn-auth-submit') || authForm.querySelector('button[type="submit"]');

            if (!input) return;
            const rawInput = (input.value || '').trim();
            if (!rawInput) return;

            if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Dogrulanıyor...'; }

            let authenticated = false;

            if (IS_GAS_CONFIGURED) {
                const result = await loginAdmin(rawInput);
                if (result.success) {
                    authenticated = true;
                } else if (result.offline) {
                    const inputHash = await hashPasswordSHA256(rawInput);
                    authenticated = (inputHash === ADMIN_PASSWORD_HASH);
                } else {
                    authenticated = false;
                }
            } else {
                const inputHash = await hashPasswordSHA256(rawInput);
                authenticated = (inputHash === ADMIN_PASSWORD_HASH);
            }

            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-unlock"></i> Giris Yap'; }

            if (authenticated) {
                sessionStorage.setItem(STORAGE_KEYS.AUTH_STATE, 'true');
                if (errorMsg) errorMsg.style.display = 'none';
                if (overlay) overlay.classList.remove('active');
                input.value = '';
                store.setState({ isAuthenticated: true });
                if (pendingTabTarget) {
                    store.setState({ activeTab: pendingTabTarget });
                    pendingTabTarget = null;
                }
            } else {
                if (errorMsg) { errorMsg.style.display = 'block'; errorMsg.innerText = 'Sifre yanlis. Tekrar deneyin.'; }
                if (authCard) {
                    authCard.classList.add('shake');
                    setTimeout(() => authCard.classList.remove('shake'), 400);
                }
            }
        };
    }

    if (cancelBtn) {
        cancelBtn.onclick = () => {
            const state = store.getState();
            if (!state.isAuthenticated) {
                window.location.href = '/';
            } else {
                if (overlay) overlay.classList.remove('active');
                pendingTabTarget = null;
            }
        };
    }

    const lockBtn = container.querySelector('#admin-lock-btn');
    if (lockBtn) {
        lockBtn.onclick = () => {
            clearAdminToken();
            store.setState({ isAuthenticated: false, activeTab: 'fill' });
            if (overlay) overlay.classList.add('active');
        };
    }

    window.requestAuthTabSwitch = (targetTab) => {
        const state = store.getState();
        if (state.isAuthenticated) {
            store.setState({ activeTab: targetTab });
        } else {
            pendingTabTarget = targetTab;
            const input = container.querySelector('#auth-password-input');
            const errorMsg = container.querySelector('#auth-error-msg');
            if (errorMsg) errorMsg.style.display = 'none';
            if (input) input.value = '';
            if (overlay) overlay.classList.add('active');
            if (input) setTimeout(() => input.focus(), 100);
        }
    };

    store.subscribe(render);
    render();
}