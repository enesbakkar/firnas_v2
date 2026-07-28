/* ==========================================================================
   Firnas Form Suite - Admin Portal Script (admin.js)
   Multi-Form Custom URL Slug Generator & Responses Manager
   ========================================================================== */

const ADMIN_CORRECT_PASSWORD = 'FORMS_fir_2023';
const ALL_FORMS_KEY = 'firnas_all_forms';

// Default system forms catalog
const DEFAULT_SYSTEM_FORMS = [
    {
        slug: 'feam-2026',
        title: 'FEAM Networking 2026',
        category: 'Etkinlik & Buluşma',
        desc: 'Lise ve üniversite öğrencilerinin teknoloji buluşması katılımcı başvuru formu.',
        banner: '/asset/feam_banner.png',
        createdDate: '01.08.2026'
    },
    {
        slug: 'proje-basvuru',
        title: 'Firnas Proje & AR-GE Başvurusu',
        category: 'Proje & AR-GE',
        desc: 'Otonom sistemler, yazılım ve STEM projeleri geliştirici ve ekip başvuruları.',
        banner: null,
        createdDate: '15.07.2026'
    },
    {
        slug: 'kurumsal-iletisim',
        title: 'Kurumsal İletişim & Destek',
        category: 'İletişim & Destek',
        desc: 'Firnas Technologies ürünleri, FiCo eğitim kitleri ve genel kurumsal destek talepleri.',
        banner: null,
        createdDate: '10.07.2026'
    }
];

let customFormQuestions = [
    { id: 1, type: 'text', title: 'İsim Soyisim', required: true },
    { id: 2, type: 'text', title: 'Telefon Numarası', required: true },
    { id: 3, type: 'text', title: 'E-posta Adresi', required: true },
    { id: 4, type: 'text', title: 'İkamet Edilen İlçe', required: true },
    { id: 5, type: 'text', title: 'Üniversite / Okul', required: true },
    { id: 6, type: 'text', title: 'Bölüm', required: true }
];

document.addEventListener('DOMContentLoaded', () => {
    checkAdminPageAuth();
    initFormsStorage();
    renderAdminFormsCatalog();
    populateFormFilterDropdown();
    loadAdminResponsesTable();
    renderBuilderQuestions();
    loadWebhookUrlSetting();
    updateBuilderSlugPreview();
});

/* -------------------------------------------------------------------------- */
/* AUTHENTICATION                                                      */
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
        renderAdminFormsCatalog();
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

    if (tabName === 'forms-list') renderAdminFormsCatalog();
    if (tabName === 'responses') loadAdminResponsesTable();
}

/* -------------------------------------------------------------------------- */
/* FORMS CATALOG & DEDICATED CUSTOM LINKS MANAGER                              */
/* -------------------------------------------------------------------------- */
function initFormsStorage() {
    if (!localStorage.getItem(ALL_FORMS_KEY)) {
        localStorage.setItem(ALL_FORMS_KEY, JSON.stringify(DEFAULT_SYSTEM_FORMS));
    }
}

function getAllForms() {
    try {
        const stored = localStorage.getItem(ALL_FORMS_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_SYSTEM_FORMS;
    } catch (e) {
        return DEFAULT_SYSTEM_FORMS;
    }
}

function renderAdminFormsCatalog() {
    const forms = getAllForms();
    const grid = document.getElementById('admin-forms-catalog-grid');
    if (!grid) return;

    const origin = window.location.origin;

    grid.innerHTML = forms.map(f => {
        const dedicatedUrl = `${origin}/form/?f=${f.slug}`;
        const responsesCount = getResponsesCountForForm(f.slug);

        return `
            <div class="dashboard-form-card">
                <div class="card-top-row">
                    <div class="card-icon-box icon-cyan">
                        <i class="fas fa-file-signature"></i>
                    </div>
                    <span class="form-badge-tag tag-cyan">${escapeHtml(f.category || 'Genel')}</span>
                </div>
                <h4>${escapeHtml(f.title)}</h4>
                <p class="card-desc">${escapeHtml(f.desc || '')}</p>
                <div class="card-meta">
                    <span><i class="fas fa-link"></i> <code style="color: var(--form-accent); font-weight:700;">?f=${escapeHtml(f.slug)}</code></span>
                    <span><i class="fas fa-users"></i> ${responsesCount} Kayıt Yanıtı</span>
                </div>
                <div class="card-actions-row" style="flex-direction: column; gap: 8px;">
                    <a href="${dedicatedUrl}" target="_blank" class="btn btn-primary full-width" style="text-decoration:none;">
                        <i class="fas fa-external-link-alt"></i> Formu Doldur (Önizle)
                    </a>
                    <div style="display:flex; gap:6px;">
                        <button class="btn btn-secondary full-width" onclick="copyFormDedicatedUrl('${f.slug}')">
                            <i class="fas fa-copy"></i> Özel URL'yi Kopyala
                        </button>
                        <button class="btn btn-danger btn-icon-only" onclick="deleteFormBySlug('${f.slug}')" title="Formu Sil">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function copyFormDedicatedUrl(slug) {
    const dedicatedUrl = `${window.location.origin}/form/?f=${slug}`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(dedicatedUrl);
    } else {
        const dummy = document.createElement('input');
        document.body.appendChild(dummy);
        dummy.value = dedicatedUrl;
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);
    }
    alert(`✅ "${slug}" formu özel URL bağlantısı panoya kopyalandı!\n\n${dedicatedUrl}`);
}

function deleteFormBySlug(slug) {
    if (confirm(`"${slug}" özel URL'li form silinsin mi?`)) {
        let forms = getAllForms();
        forms = forms.filter(f => f.slug !== slug);
        localStorage.setItem(ALL_FORMS_KEY, JSON.stringify(forms));
        renderAdminFormsCatalog();
        populateFormFilterDropdown();
    }
}

/* -------------------------------------------------------------------------- */
/* RESPONSES DASHBOARD & FILTERING                                            */
/* -------------------------------------------------------------------------- */
function getStoredResponses() {
    const data = localStorage.getItem('feam_networking_responses');
    return data ? JSON.parse(data) : [];
}

function getResponsesCountForForm(slug) {
    const responses = getStoredResponses();
    if (slug === 'all') return responses.length;
    return responses.filter(r => (r.formSlug === slug || (!r.formSlug && slug === 'feam-2026'))).length;
}

function populateFormFilterDropdown() {
    const dropdown = document.getElementById('admin-responses-form-filter');
    if (!dropdown) return;

    const forms = getAllForms();
    dropdown.innerHTML = `
        <option value="all">Tüm Formlar (Toplam Kayıtlar)</option>
        ${forms.map(f => `<option value="${f.slug}">${escapeHtml(f.title)} (?f=${f.slug})</option>`).join('')}
    `;
}

function filterResponsesByForm(selectedSlug) {
    loadAdminResponsesTable(selectedSlug);
}

function loadAdminResponsesTable(selectedSlug = 'all') {
    const responses = getStoredResponses();
    const tbody = document.getElementById('responses-table-body');
    const counter = document.getElementById('responses-counter');

    const filtered = selectedSlug === 'all' 
        ? responses 
        : responses.filter(r => (r.formSlug === selectedSlug || (!r.formSlug && selectedSlug === 'feam-2026')));

    if (counter) counter.innerText = responses.length;
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">Seçilen form için henüz kayıtlı yanıt bulunmuyor.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map((r, index) => `
        <tr>
            <td><strong style="color: var(--form-accent);">${r.refCode || 'FEAM-0000'}</strong></td>
            <td><span class="badge-count" style="background:#e0f2fe; color:#0284c7;">?f=${escapeHtml(r.formSlug || 'feam-2026')}</span></td>
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
            <div class="summary-item"><span class="s-label">Form URL Kimliği:</span><span class="s-val">?f=${item.formSlug || 'feam-2026'}</span></div>
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
    if (confirm('Tüm katılımcı yanıtlarını silmek istediğinize emin misiniz?')) {
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

    let csvContent = "\uFEFFReferans Kodu,Form Slug,Ad Soyad,Telefon,E-posta,İlçe,Üniversite,Bölüm,Sınıf,Nereden Duydunuz,Ek Notlar,Kayıt Tarihi\n";
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

function exportResponsesJSON() {
    const responses = getStoredResponses();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(responses, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `Firnas_Form_Yanitlar_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
}

/* -------------------------------------------------------------------------- */
/* WEBHOOK & APPS SCRIPT                                                      */
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
    
    sheet.appendRow([
      data.refCode || '',
      data.formSlug || '',
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
/* FORM BUILDER & CUSTOM SLUG GENERATOR                                       */
/* -------------------------------------------------------------------------- */
function updateBuilderTitlePreview() {
    const titleVal = document.getElementById('builder-form-title')?.value;
    const descVal = document.getElementById('builder-form-desc')?.value;
    const catVal = document.getElementById('builder-form-category')?.value;

    if (document.getElementById('preview-form-title')) document.getElementById('preview-form-title').innerText = titleVal || 'Özel Form';
    if (document.getElementById('preview-form-desc')) document.getElementById('preview-form-desc').innerText = descVal || '';
    if (document.getElementById('preview-form-badge')) document.getElementById('preview-form-badge').innerText = (catVal || 'GENEL').toUpperCase();

    // Auto-generate slug if slug field was not manually modified
    const slugInput = document.getElementById('builder-form-slug');
    if (slugInput && titleVal) {
        const slugified = slugifyText(titleVal);
        if (!slugInput.dataset.manual) {
            slugInput.value = slugified;
            updateBuilderSlugPreview();
        }
    }
}

function updateBuilderSlugPreview() {
    const slugInput = document.getElementById('builder-form-slug');
    const previewUrl = document.getElementById('builder-slug-preview-url');
    const headerDisplay = document.getElementById('preview-form-url-display');

    if (slugInput) {
        slugInput.dataset.manual = "true";
        const cleanSlug = slugifyText(slugInput.value);
        const fullUrl = `${window.location.origin}/form/?f=${cleanSlug}`;

        if (previewUrl) previewUrl.innerText = fullUrl;
        if (headerDisplay) headerDisplay.innerText = fullUrl;
    }
}

function slugifyText(str) {
    if (!str) return 'form-' + Math.floor(1000 + Math.random() * 9000);
    return str.toString()
        .toLowerCase()
        .trim()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function saveAndPublishForm() {
    const title = document.getElementById('builder-form-title')?.value.trim();
    const slugInput = document.getElementById('builder-form-slug')?.value.trim();
    const category = document.getElementById('builder-form-category')?.value.trim() || 'Etkinlik';
    const desc = document.getElementById('builder-form-desc')?.value.trim() || '';

    if (!title) {
        alert('Lütfen form başlığını giriniz.');
        return;
    }

    const slug = slugifyText(slugInput || title);
    const newFormObj = {
        slug: slug,
        title: title,
        category: category,
        desc: desc,
        banner: null,
        createdDate: new Date().toLocaleDateString('tr-TR')
    };

    let forms = getAllForms();
    // Overwrite if slug already exists or push new
    const existingIndex = forms.findIndex(f => f.slug === slug);
    if (existingIndex >= 0) {
        forms[existingIndex] = newFormObj;
    } else {
        forms.push(newFormObj);
    }

    localStorage.setItem(ALL_FORMS_KEY, JSON.stringify(forms));

    const directUrl = `${window.location.origin}/form/?f=${slug}`;
    const iframeCode = `<iframe src="${directUrl}" width="100%" height="750px" frameborder="0" style="border:none; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,0.1);"></iframe>`;

    document.getElementById('share-direct-url').value = directUrl;
    document.getElementById('share-iframe-code').value = iframeCode;
    document.getElementById('embed-code-modal').classList.add('active');

    renderAdminFormsCatalog();
    populateFormFilterDropdown();
}

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

function closeEmbedModal() {
    document.getElementById('embed-code-modal').classList.remove('active');
}

function copyToClipboard(inputElemId) {
    const elem = document.getElementById(inputElemId);
    if (!elem) return;

    elem.select();
    elem.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(elem.value);

    alert('✅ Kod / Bağlantı başarıyla panoya kopyalandı!');
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
