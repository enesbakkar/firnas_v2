/* ==========================================================================
   VALIDATORS (src/core/validators.js)
   ========================================================================== */

export const validators = {
    required: (val) => val !== undefined && val !== null && String(val).trim() !== '',
    email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim()),
    phone: (val) => /^[0-9\s\+\(\)\-]{7,20}$/.test(String(val).trim()),
    checkbox: (val) => val === true
};

export function validateField(fieldDef, value) {
    const errors = [];

    if (fieldDef.required) {
        if (fieldDef.type === 'kvkk_checkbox') {
            if (!validators.checkbox(value)) errors.push('Formu göndermek için KVKK metnini onaylamalısınız.');
        } else {
            if (!validators.required(value)) errors.push(`${fieldDef.label || 'Bu alan'} zorunludur.`);
        }
    }

    if (value && fieldDef.validate && validators[fieldDef.validate]) {
        if (!validators[fieldDef.validate](value)) {
            if (fieldDef.validate === 'email') errors.push('Geçerli bir e-posta adresi yazın.');
            else if (fieldDef.validate === 'phone') errors.push('Geçerli bir telefon numarası girin.');
            else errors.push('Geçersiz format.');
        }
    }

    return errors;
}

export function validateStepFields(stepDef, formData) {
    let isValid = true;
    const errorsMap = {};

    if (!stepDef || !stepDef.fields) return { isValid: true, errorsMap: {} };

    stepDef.fields.forEach(field => {
        const val = formData[field.id];
        const errors = validateField(field, val);
        if (errors.length > 0) {
            isValid = false;
            errorsMap[field.id] = errors[0];
        }
    });

    return { isValid, errorsMap };
}
