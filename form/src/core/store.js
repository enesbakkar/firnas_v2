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

    setFormData(fieldId, value) {
        this.state = {
            ...this.state,
            formData: {
                ...this.state.formData,
                [fieldId]: value
            }
        };
        this.notify();
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
