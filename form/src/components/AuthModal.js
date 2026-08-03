/* ==========================================================================
   AUTH MODAL COMPONENT (src/components/AuthModal.js)
   ========================================================================== */

import { ADMIN_PASSWORD_HASH, STORAGE_KEYS } from '../config/appConstants.js';
import { hashPasswordSHA256 } from '../utils/stringHelpers.js';

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

        // Strict Portal Lock: If not authenticated and NOT in standalone form fill mode, LOCK IMMEDIATELY!
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

            if (!input) return;

            const inputHash = await hashPasswordSHA256(input.value);

            if (inputHash === ADMIN_PASSWORD_HASH) {
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
                if (errorMsg) errorMsg.style.display = 'block';
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
                // Return to home page if canceled on initial lock
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
            sessionStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
            store.setState({ isAuthenticated: false, activeTab: 'fill' });
            if (overlay) overlay.classList.add('active');
        };
    }

    // Expose method to trigger auth challenge
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
