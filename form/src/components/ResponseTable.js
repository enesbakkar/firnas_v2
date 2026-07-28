/* ==========================================================================
   RESPONSE TABLE COMPONENT (src/components/ResponseTable.js)
   ========================================================================== */

import { escapeHtml } from '../utils/stringHelpers.js';
import { deleteResponse, clearAllResponses } from '../core/apiService.js';

export function setupResponseTable(container, store) {
    let currentFilterSlug = 'all';

    function render() {
        const state = store.getState();
        if (state.activeTab !== 'responses') return;

        const responses = state.responses || [];
        const filtered = (currentFilterSlug === 'all') 
            ? responses 
            : responses.filter(r => (r.formSlug === currentFilterSlug || (!r.formSlug && currentFilterSlug === 'feam-2026')));

        // Counter Badges & Stats
        const counter = container.querySelector('#responses-counter');
        const statTotal = container.querySelector('#stat-total-count');
        const tbody = container.querySelector('#responses-table-body');

        if (counter) counter.innerText = responses.length;
        if (statTotal) statTotal.innerText = responses.length;

        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">Henüz kayıtlı yanıt bulunmuyor.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map((r, index) => `
            <tr>
                <td><strong style="color: var(--form-accent);">${escapeHtml(r.refCode || 'FEAM-0000')}</strong></td>
                <td><span class="badge-count" style="background:#e0f2fe; color:#0284c7;">${escapeHtml(r.formSlug || 'feam-2026')}</span></td>
                <td><strong>${escapeHtml(r.fullName || '-')}</strong></td>
                <td>
                    <div><i class="fas fa-envelope text-muted"></i> ${escapeHtml(r.email || '-')}</div>
                    <div class="small text-muted"><i class="fas fa-phone"></i> ${escapeHtml(r.phone || '-')}</div>
                </td>
                <td>${escapeHtml(r.district || '-')}</td>
                <td>${escapeHtml(r.university || '-')} <div class="small text-muted">${escapeHtml(r.department || '-')}</div></td>
                <td><span class="badge-count" style="background:#e2e8f0; color:#0f2e4a;">${escapeHtml(r.grade || '-')}</span></td>
                <td class="small text-muted">${r.date || '-'}</td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button class="btn btn-secondary btn-sm btn-detail-view" data-index="${index}" title="Detay"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-danger btn-sm btn-delete-row" data-index="${index}" title="Sil"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Bind Detail & Delete Row Actions
        tbody.querySelectorAll('.btn-detail-view').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.index);
                showResponseDetailModal(filtered[idx]);
            };
        });

        tbody.querySelectorAll('.btn-delete-row').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.index);
                if (confirm('Bu kayıt silinsin mi?')) {
                    const newResponses = deleteResponse(idx);
                    store.setState({ responses: newResponses });
                }
            };
        });

        // Bind Top Export Buttons
        bindExportActions(container, store);
    }

    function bindExportActions(container, store) {
        const btnCsv = container.querySelector('#btn-export-csv');
        const btnJson = container.querySelector('#btn-export-json');
        const btnClear = container.querySelector('#btn-clear-all-responses');

        if (btnCsv) {
            btnCsv.onclick = () => exportResponsesCSV(store.getState().responses);
        }
        if (btnJson) {
            btnJson.onclick = () => exportResponsesJSON(store.getState().responses);
        }
        if (btnClear) {
            btnClear.onclick = () => {
                if (confirm('Tüm katılımcı kayıtlarını silmek istediğinize emin misiniz?')) {
                    const emptyResponses = clearAllResponses();
                    store.setState({ responses: emptyResponses });
                }
            };
        }
    }

    function showResponseDetailModal(item) {
        if (!item) return;
        const modalBody = document.getElementById('modal-detail-body');
        const modalElem = document.getElementById('response-detail-modal');

        if (modalBody) {
            modalBody.innerHTML = `
                <div class="summary-item"><span class="s-label">Referans Kodu:</span><span class="s-val">${escapeHtml(item.refCode || '-')}</span></div>
                <div class="summary-item"><span class="s-label">Form Kimliği:</span><span class="s-val">${escapeHtml(item.formSlug || 'feam-2026')}</span></div>
                <div class="summary-item"><span class="s-label">Ad Soyad:</span><span class="s-val">${escapeHtml(item.fullName || '-')}</span></div>
                <div class="summary-item"><span class="s-label">E-posta / Tel:</span><span class="s-val">${escapeHtml(item.email || '-')} / ${escapeHtml(item.phone || '-')}</span></div>
                <div class="summary-item"><span class="s-label">İkamet İlçe:</span><span class="s-val">${escapeHtml(item.district || '-')}</span></div>
                <div class="summary-item"><span class="s-label">Okul / Bölüm:</span><span class="s-val">${escapeHtml(item.university || '-')} - ${escapeHtml(item.department || '-')}</span></div>
                <div class="summary-item"><span class="s-label">Sınıf & Duyum:</span><span class="s-val">${escapeHtml(item.grade || '-')} | ${escapeHtml(item.hearAbout || '-')}</span></div>
                <div class="summary-item full-width"><span class="s-label">Ek Notlar:</span><span class="s-val">${escapeHtml(item.notes || '-')}</span></div>
                <div class="summary-item full-width"><span class="s-label">Kayıt Tarihi:</span><span class="s-val">${item.date || '-'}</span></div>
            `;
        }
        if (modalElem) modalElem.classList.add('active');
    }

    function exportResponsesCSV(responses) {
        if (!responses || responses.length === 0) {
            alert('İndirilecek kayıt bulunmuyor.');
            return;
        }
        let csvContent = "\uFEFFReferans Kodu,Form Kimligi,Ad Soyad,Telefon,E-posta,İlçe,Üniversite,Bölüm,Sınıf,Nereden Duydunuz,Ek Notlar,Kayıt Tarihi\n";
        responses.forEach(r => {
            csvContent += `"${r.refCode}","${r.formSlug || 'feam-2026'}","${r.fullName}","${r.phone}","${r.email}","${r.district}","${r.university}","${r.department}","${r.grade}","${r.hearAbout}","${r.notes}","${r.date}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Firnas_Form_Yanitlar_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    }

    function exportResponsesJSON(responses) {
        if (!responses || responses.length === 0) {
            alert('İndirilecek kayıt bulunmuyor.');
            return;
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(responses, null, 2));
        const link = document.createElement('a');
        link.href = dataStr;
        link.download = `Firnas_Form_Yanitlar_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
    }

    store.subscribe(render);
    render();
}
