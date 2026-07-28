/* ==========================================================================
   Firnas Form Suite - Standalone Admin Portal Script (admin.js)
   ========================================================================== */

const ADMIN_CORRECT_PASSWORD = 'FORMS_fir_2023';
let customFormQuestions = [
    { id: 1, type: 'text', title: 'İsim Soyisim', required: true },
    { id: 2, type: 'text', title: 'Telefon Numarası', required: true },
    { id: 3, type: 'text', title: 'E-posta Adresi', required: true },
    { id: 4, type: 'text', title: 'İkamet Edilen İlçe', required: true },
    { id: 5, type: 'text', title: 'Üniversite', required: true },
    { id: 6, type: 'text', title: 'Bölüm', required: true },
    { id: 7, type: 'dropdown', title: 'Sınıf (Hazırlık, 1, 2, 3, 4, YL, Mezun)', required: true },
    { id: 8, type: 'choice', title: 'Etkinliği Nereden Duydunuz?', options: ['Instagram', 'LinkedIn', 'Arkadaş Tavsiyesi', 'WhatsApp', 'Diğer'], required: true }
];

document.addEventListener('DOMContentLoaded', () => {
    checkAdminPageAuth();
    loadAdminResponsesTable();
    renderBuilderQuestions();
    loadWebhookUrlSetting();
});

/* -------------------------------------------------------------------------- */
/* ADMIN AUTHENTICATION                                                      */
/* -------------------------------------------------------------------------- */
function isAdminAuthenticated() {
    return sessionStorage.getItem('firnas_admin_authenticated') === 'true';
}

function checkAdminPageAuth() {
    const overlay = document.getElementById('admin-lock-overlay');
    if (!overlay) return;
    if (isAdminAuthenticated()) {
        overlay.classList.remove('active');
    } else {
        overlay.classList.add('active');
        const input = document.getElementById('admin-password-input');
        if (input) setTimeout(() => input.focus(), 100);
    }
}

function handleAdminAuthSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('admin-password-input');
    const errorMsg = document.getElementById('admin-auth-error-msg');
    const authCard = document.querySelector('.auth-card');

    if (input && input.value === ADMIN_CORRECT_PASSWORD) {
        sessionStorage.setItem('firnas_admin_authenticated', 'true');
        if (errorMsg) errorMsg.style.display = 'none';
        document.getElementById('admin-lock-overlay').classList.remove('active');
        input.value = '';
        loadAdminResponsesTable();
    } else {
        if (errorMsg) errorMsg.style.display = 'block';
        if (authCard) {
            authCard.classList.add('shake');
            setTimeout(() => authCard.classList.remove('shake'), 400);
        }
    }
}

function lockAdminPanel() {
    sessionStorage.removeItem('firnas_admin_authenticated');
    checkAdminPageAuth();
}

function switchAdminTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const activeBtn = document.getElementById(`tab-${tabName}-btn`);
    const activeTab = document.getElementById(`tab-${tabName}`);

    if (activeBtn && activeTab) {
        activeBtn.classList.add('active');
        activeTab.classList.add('active');
    }
}

/* -------------------------------------------------------------------------- */
/* RESPONSES DASHBOARD                                                         */
/* -------------------------------------------------------------------------- */
function getStoredResponses() {
    const data = localStorage.getItem('feam_networking_responses');
    return data ? JSON.parse(data) : [];
}

function loadAdminResponsesTable() {
    const responses = getStoredResponses();
    const tbody = document.getElementById('responses-table-body');
    const counter = document.getElementById('responses-counter');
    const statCounter = document.getElementById('stat-total-count');

    if (counter) counter.innerText = responses.length;
    if (statCounter) statCounter.innerText = responses.length;

    if (!tbody) return;

    if (responses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">Henüz kayıtlı katılımcı bulunmuyor.</td></tr>`;
        return;
    }

    tbody.innerHTML = responses.map((r, index) => `
        <tr>
            <td><strong style="color: var(--form-accent);">${r.refCode || 'FEAM-0000'}</strong></td>
            <td><strong>${escapeHtml(r.fullName || '-')}</strong></td>
            <td>
                <div><i class="fas fa-envelope text-muted"></i> ${escapeHtml(r.email || '-')}</div>
                <div class="small text-muted"><i class="fas fa-phone"></i> ${escapeHtml(r.phone || '-')}</div>
            </td>
            <td>${escapeHtml(r.district || '-')}</td>
            <td>${escapeHtml(r.university || '-')} <div class="small text-muted">${escapeHtml(r.department || '-')}</div></td>
            <td><span class="badge-count" style="background:#e2e8f0; color:#0f2e4a;">${escapeHtml(r.grade || '-')}</span></td>
            <td><span class="badge-count">${escapeHtml(r.hearAbout || '-')}</span></td>
            <td class="small text-muted">${r.date || '-'}</td>
            <td>
                <div style="display:flex; gap:6px;">
                    <button class="btn btn-secondary btn-sm" onclick="viewResponseDetail(${index})" title="Detay"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteResponse(${index})" title="Sil"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function viewResponseDetail(index) {
    const responses = getStoredResponses();
    const item = responses[index];
    if (!item) return;

    const modalBody = document.getElementById('modal-detail-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="summary-item"><span class="s-label">Referans Kodu:</span><span class="s-val">${item.refCode || '-'}</span></div>
            <div class="summary-item"><span class="s-label">Ad Soyad:</span><span class="s-val">${escapeHtml(item.fullName || '-')}</span></div>
            <div class="summary-item"><span class="s-label">E-posta / Tel:</span><span class="s-val">${escapeHtml(item.email || '-')} / ${escapeHtml(item.phone || '-')}</span></div>
            <div class="summary-item"><span class="s-label">İkamet İlçe:</span><span class="s-val">${escapeHtml(item.district || '-')}</span></div>
            <div class="summary-item"><span class="s-label">Okul / Bölüm:</span><span class="s-val">${escapeHtml(item.university || '-')} - ${escapeHtml(item.department || '-')}</span></div>
            <div class="summary-item"><span class="s-label">Sınıf & Duyum:</span><span class="s-val">${escapeHtml(item.grade || '-')} | ${escapeHtml(item.hearAbout || '-')}</span></div>
            <div class="summary-item full-width"><span class="s-label">Ek Notlar:</span><span class="s-val">${escapeHtml(item.notes || '-')}</span></div>
            <div class="summary-item full-width"><span class="s-label">Kayıt Tarihi:</span><span class="s-val">${item.date || '-'}</span></div>
        `;
    }

    document.getElementById('response-detail-modal').classList.add('active');
}

function closeDetailModal() {
    document.getElementById('response-detail-modal').classList.remove('active');
}

function deleteResponse(index) {
    if (confirm('Bu kayıt silinsin mi?')) {
        const responses = getStoredResponses();
        responses.splice(index, 1);
        localStorage.setItem('feam_networking_responses', JSON.stringify(responses));
        loadAdminResponsesTable();
    }
}

function clearAllResponses() {
    if (confirm('Tüm katılımcı kayıtlarını silmek istediğinize emin misiniz?')) {
        localStorage.removeItem('feam_networking_responses');
        loadAdminResponsesTable();
    }
}

function exportResponsesCSV() {
    const responses = getStoredResponses();
    if (responses.length === 0) {
        alert('İndirilecek kayıt bulunmuyor.');
        return;
    }

    let csvContent = "\uFEFFReferans Kodu,Ad Soyad,Telefon,E-posta,İlçe,Üniversite,Bölüm,Sınıf,Nereden Duydunuz,Ek Notlar,Kayıt Tarihi\n";
    responses.forEach(r => {
        csvContent += `"${r.refCode}","${r.fullName}","${r.phone}","${r.email}","${r.district}","${r.university}","${r.department}","${r.grade}","${r.hearAbout}","${r.notes}","${r.date}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FEAM_Networking_Katilimcilar_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
}

function exportResponsesJSON() {
    const responses = getStoredResponses();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(responses, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `FEAM_Networking_Katilimcilar_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
}

/* -------------------------------------------------------------------------- */
/* WEBHOOK URL CONFIGURATION                                                  */
/* -------------------------------------------------------------------------- */
function loadWebhookUrlSetting() {
    const url = localStorage.getItem('firnas_google_script_url') || '';
    const input = document.getElementById('script-webhook-url-input');
    if (input) input.value = url;
}

function saveWebhookUrlSetting() {
    const input = document.getElementById('script-webhook-url-input');
    const msg = document.getElementById('webhook-saved-msg');
    if (input) {
        localStorage.setItem('firnas_google_script_url', input.value.trim());
        if (msg) {
            msg.style.display = 'block';
            setTimeout(() => msg.style.display = 'none', 3000);
        }
    }
}

function copyCodeSnippet() {
    const code = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // E-Tabloya yeni satır olarak ekle
    sheet.appendRow([
      data.refCode || '',
      data.fullName || '',
      data.phone || '',
      data.email || '',
      data.district || '',
      data.university || '',
      data.department || '',
      data.grade || '',
      data.hearAbout || '',
      data.notes || '',
      data.date || new Date().toLocaleString("tr-TR")
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({"result": "success"}))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"result": "error", "error": error.toString()}))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}`;
    navigator.clipboard.writeText(code);
    alert('✅ Google Apps Script kodu panoya kopyalandı!');
}

/* -------------------------------------------------------------------------- */
/* FORM BUILDER                                                               */
/* -------------------------------------------------------------------------- */
function addQuestionToBuilder(type) {
    const newId = Date.now();
    const defaultTitles = {
        text: 'Yeni Metin Sorusu',
        textarea: 'Yeni Açıklama Sorusu',
        choice: 'Yeni Çoktan Seçmeli Soru',
        dropdown: 'Yeni Açılır Liste Sorusu'
    };

    customFormQuestions.push({
        id: newId,
        type: type,
        title: defaultTitles[type] || 'Yeni Soru',
        options: type === 'choice' ? ['Seçenek 1', 'Seçenek 2', 'Seçenek 3'] : [],
        required: true
    });

    renderBuilderQuestions();
}

function deleteQuestionFromBuilder(id) {
    customFormQuestions = customFormQuestions.filter(q => q.id !== id);
    renderBuilderQuestions();
}

function updateQuestionTitle(id, val) {
    const q = customFormQuestions.find(item => item.id === id);
    if (q) q.title = val;
}

function updateBuilderTitle() {
    const titleVal = document.getElementById('builder-form-title').value;
    const descVal = document.getElementById('builder-form-desc').value;

    document.getElementById('preview-form-title').innerText = titleVal || 'Özel Form';
    document.getElementById('preview-form-desc').innerText = descVal || '';
}

function renderBuilderQuestions() {
    const container = document.getElementById('builder-questions-list');
    if (!container) return;

    if (customFormQuestions.length === 0) {
        container.innerHTML = `<p class="text-center text-muted" style="padding: 2rem;">Henüz soru eklenmedi. Sol menüden soru türü seçin.</p>`;
        return;
    }

    container.innerHTML = customFormQuestions.map((q) => `
        <div class="builder-q-item">
            <div class="q-item-header">
                <input type="text" class="q-title-input" value="${escapeHtml(q.title)}" oninput="updateQuestionTitle(${q.id}, this.value)" placeholder="Soru başlığı...">
                <div class="q-actions">
                    <button class="btn-q-delete" onclick="deleteQuestionFromBuilder(${q.id})" title="Soruyu Sil"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="q-item-preview" style="margin-top: 10px;">
                ${renderQuestionControlPreview(q)}
            </div>
        </div>
    `).join('');
}

function renderQuestionControlPreview(q) {
    if (q.type === 'text') {
        return `<input type="text" class="form-control" placeholder="Kullanıcı yanıtı..." disabled>`;
    } else if (q.type === 'textarea') {
        return `<textarea class="form-control" rows="2" placeholder="Açıklama..." disabled></textarea>`;
    } else if (q.type === 'choice') {
        return (q.options || ['Seçenek 1']).map(opt => `
            <div style="margin-bottom: 4px;"><input type="radio" disabled> <span style="font-size: 0.9rem; color: #475569;">${opt}</span></div>
        `).join('');
    } else if (q.type === 'dropdown') {
        return `<select class="form-control" disabled><option>Seçenek seçiniz...</option></select>`;
    }
    return '';
}

function resetBuilderForm() {
    if (confirm('Form tasarımını sıfırlamak istediğinize emin misiniz?')) {
        customFormQuestions = [];
        renderBuilderQuestions();
    }
}

function publishCustomForm() {
    const formId = 'feam-networking-' + Math.floor(1000 + Math.random() * 9000);
    const directUrl = `${window.location.origin}/form/?form=${formId}`;
    const iframeCode = `<iframe src="${directUrl}" width="100%" height="750px" frameborder="0" style="border:none; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,0.1);"></iframe>`;

    document.getElementById('share-direct-url').value = directUrl;
    document.getElementById('share-iframe-code').value = iframeCode;

    document.getElementById('embed-code-modal').classList.add('active');
}

function closeEmbedModal() {
    document.getElementById('embed-code-modal').classList.remove('active');
}

function copyToClipboard(inputElemId) {
    const elem = document.getElementById(inputElemId);
    if (!elem) return;

    elem.select();
    elem.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(elem.value);

    alert('✅ Kod başarıyla panoya kopyalandı!');
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
