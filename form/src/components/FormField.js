/* ==========================================================================
   FORM FIELD COMPONENT (src/components/FormField.js)
   ========================================================================== */

import { escapeHtml } from '../utils/stringHelpers.js';

export function renderFormField(fieldDef, value = '', error = '') {
    const fieldId = fieldDef.id;
    const requiredMark = fieldDef.required ? '<span class="required">*</span>' : '';
    const errorClass = error ? 'has-error' : '';
    const errorMsgHtml = `<span class="error-msg" id="err-${fieldId}" style="${error ? 'display:block;' : ''}">${escapeHtml(error)}</span>`;

    if (fieldDef.type === 'kvkk_checkbox') {
        return `
            <div class="form-group kvkk-checkbox-group ${errorClass}" id="group-${fieldId}">
                <label class="kvkk-container-label">
                    <input type="checkbox" id="fill-${fieldId}" ${value ? 'checked' : ''} required>
                    <span class="checkmark"></span>
                    <span class="kvkk-text">
                        <a href="#" id="open-kvkk-link">KVKK Aydınlatma Metni</a>'ni okudum, anladım ve kişisel verilerimin işlenmesini onaylıyorum. ${requiredMark}
                    </span>
                </label>
                ${errorMsgHtml}
            </div>
        `;
    }

    if (fieldDef.type === 'radio_cards') {
        const optionsHtml = (fieldDef.options || []).map(opt => {
            const optVal = typeof opt === 'string' ? opt : opt.value;
            const optIcon = typeof opt === 'object' && opt.icon ? opt.icon : 'fas fa-check-circle';
            const isChecked = (value === optVal);

            return `
                <label class="category-card">
                    <input type="radio" name="fill_${fieldId}" value="${escapeHtml(optVal)}" ${isChecked ? 'checked' : ''}>
                    <div class="card-content">
                        <i class="${optIcon}"></i>
                        <h4>${escapeHtml(optVal)}</h4>
                    </div>
                </label>
            `;
        }).join('');

        return `
            <div class="form-group ${errorClass}" id="group-${fieldId}">
                <label>${escapeHtml(fieldDef.label)} ${requiredMark}</label>
                <div class="category-cards-grid">
                    ${optionsHtml}
                </div>
                ${errorMsgHtml}
            </div>
        `;
    }

    if (fieldDef.type === 'select') {
        const optionsHtml = (fieldDef.options || []).map(opt => {
            const selected = value === opt ? 'selected' : '';
            return `<option value="${escapeHtml(opt)}" ${selected}>${escapeHtml(opt)}</option>`;
        }).join('');

        return `
            <div class="form-group ${errorClass}" id="group-${fieldId}">
                <label for="fill-${fieldId}">${escapeHtml(fieldDef.label)} ${requiredMark}</label>
                <div class="input-icon-wrapper">
                    <i class="fas ${fieldDef.icon || 'fa-list'}"></i>
                    <select id="fill-${fieldId}" class="form-control" ${fieldDef.required ? 'required' : ''}>
                        <option value="">Lütfen seçim yapınız...</option>
                        ${optionsHtml}
                    </select>
                </div>
                ${errorMsgHtml}
            </div>
        `;
    }

    if (fieldDef.type === 'textarea') {
        return `
            <div class="form-group ${errorClass}" id="group-${fieldId}">
                <label for="fill-${fieldId}">${escapeHtml(fieldDef.label)} ${requiredMark}</label>
                <textarea id="fill-${fieldId}" class="form-control" rows="3" placeholder="${escapeHtml(fieldDef.placeholder || '')}">${escapeHtml(value)}</textarea>
                ${errorMsgHtml}
            </div>
        `;
    }

    // Default: text, email, tel
    return `
        <div class="form-group ${errorClass}" id="group-${fieldId}">
            <label for="fill-${fieldId}">${escapeHtml(fieldDef.label)} ${requiredMark}</label>
            <div class="input-icon-wrapper">
                <i class="fas ${fieldDef.icon || 'fa-pen'}"></i>
                <input type="${fieldDef.type || 'text'}" id="fill-${fieldId}" class="form-control" placeholder="${escapeHtml(fieldDef.placeholder || '')}" value="${escapeHtml(value)}" ${fieldDef.required ? 'required' : ''}>
            </div>
            ${errorMsgHtml}
        </div>
    `;
}
