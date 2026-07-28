/* ==========================================================================
   CENTRAL STORE WITH OBSERVER PATTERN (src/core/store.js)
   ========================================================================== */

export class Store {
    constructor(initialState = {}) {
        this.state = {
            currentFormId: 'feam-2026',
            currentStep: 1,
            formData: {},
            responses: [],
            customForms: [],
            formDefinitions: {},
            isAuthenticated: false,
            activeTab: 'fill',
            searchQuery: '',
            responseFilterFormId: 'all',
            draftSavedTimestamp: null,
            ...initialState
        };
        this.listeners = [];
    }

    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    setFormData(fieldId, value, silent = true) {
        this.state = {
            ...this.state,
            formData: {
                ...this.state.formData,
                [fieldId]: value
            },
            draftSavedTimestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        if (!silent) {
            this.notify();
        }
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(fn => fn !== listener);
        };
    }

    notify() {
        this.listeners.forEach(fn => fn(this.state));
    }
}

export const appStore = new Store();
