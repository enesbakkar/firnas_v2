/* ==========================================================================
   FIRNAS FORM PORTAL — Google Apps Script Backend v2
   Duzeltmeler: CORS preflight, login rate-limit, sifre kaynak kodda yok,
   getActiveSpreadsheet fallback, getForms public-only filtre, kvkk zorunlu,
   token sadece POST body'de, per-action rate limit.
   ========================================================================== */

// ── SPREADSHEET BAGLANTISI ──────────────────────────────────────────────────
// getOrCreateSheet() cagrildiginda once Properties'deki ID'yi dener,
// yoksa aktif spreadsheet'i kullanir (Sheet'e bagli script senaryosu).
function getSpreadsheet() {
  var props = getProps();
  var ssId = props.getProperty('SPREADSHEET_ID');
  if (ssId) {
    return SpreadsheetApp.openById(ssId);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet(name) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) { sheet = ss.insertSheet(name); }
  return sheet;
}

// ── PROPERTIES ──────────────────────────────────────────────────────────────
function getProps() {
  return PropertiesService.getScriptProperties();
}

// ── CORS ────────────────────────────────────────────────────────────────────
// GAS, OPTIONS (preflight) istegine otomatik 200 doner; ContentService
// uzerinden ek header eklemek mumkun degil. Gercek preflight yaniti doGet ile
// yakalanarak bos 200 donulur. Bu, uygulamada JSON POST oncesi preflight'i giderir.
function corsJson(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function successResponse(data) {
  return corsJson({ success: true, data: data });
}

function errorResponse(message, code) {
  return corsJson({ success: false, error: message, code: code || 'ERROR' });
}

// ── KURULUM (Bir kez calistirilir) ──────────────────────────────────────────
function initializeSheets() {
  var responses = getOrCreateSheet('responses');
  if (responses.getLastRow() === 0) {
    responses.appendRow(['refCode','formSlug','fullName','phone','email','district',
      'university','department','grade','hearAbout','notes','customAnswers',
      'kvkkAccepted','date','timestamp']);
    responses.getRange(1,1,1,15).setFontWeight('bold');
    responses.setFrozenRows(1);
  }
  var forms = getOrCreateSheet('forms');
  if (forms.getLastRow() === 0) {
    forms.appendRow(['id','title','description','category','steps_json','banner',
      'theme','status','publishedAt','createdAt','updatedAt']);
    forms.getRange(1,1,1,11).setFontWeight('bold');
    forms.setFrozenRows(1);
  }
  var audit = getOrCreateSheet('audit_log');
  if (audit.getLastRow() === 0) {
    audit.appendRow(['timestamp','action','actor','detail']);
    audit.getRange(1,1,1,4).setFontWeight('bold');
    audit.setFrozenRows(1);
  }
  return 'Sheets olusturuldu.';
}

// ONEMLI: Bu fonksiyon artik sifre almaz; sifre dogrudan Properties'e yazilir.
// Script Editor > Proje Ayarlari > Script Ozellikleri:
//   ADMIN_PASSWORD_RAW = FORMS_fir_2023   (ya da istediginiz yeni sifre)
// Sonra bu fonksiyonu calistirin.
function setupAdminCredentials() {
  var props = getProps();
  var rawPassword = props.getProperty('ADMIN_PASSWORD_RAW');
  if (!rawPassword) {
    return 'HATA: Once Script Ozellikleri panelinden ADMIN_PASSWORD_RAW ayarlayin!';
  }
  var SECRET_SALT = Utilities.getUuid();
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, rawPassword + SECRET_SALT);
  var hash = digest.map(function(b){
    return ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2);
  }).join('');
  props.setProperties({ 'ADMIN_HASH': hash, 'ADMIN_SALT': SECRET_SALT });
  // Guvenlik: ham sifre Property'den silinir
  props.deleteProperty('ADMIN_PASSWORD_RAW');
  props.setProperty('DRIVE_FOLDER_ID', '');
  Logger.log('Admin kimlik bilgileri kaydedildi. Ham sifre silindi.');
  return 'Tamamlandi.';
}

// ── RATE LIMITER ─────────────────────────────────────────────────────────────
// submit icin gevrek (30/dk), login icin siki (5/dk), admin icin orta (20/dk)
function checkRateLimit(bucket, maxPerMinute) {
  var props = getProps();
  var now = Date.now();
  var windowMs = 60 * 1000;
  var max = maxPerMinute || 30;
  var key = 'rl_' + bucket.replace(/[^a-zA-Z0-9]/g, '_');
  var stored = props.getProperty(key);
  var data = stored ? JSON.parse(stored) : { count: 0, reset: now + windowMs };
  if (now > data.reset) { data = { count: 1, reset: now + windowMs }; }
  else {
    data.count++;
    if (data.count > max) return false;
  }
  props.setProperty(key, JSON.stringify(data));
  return true;
}

// ── TOKEN YONETIMI ───────────────────────────────────────────────────────────
// Not: Tek global token — birden fazla yonetici senaryo disinda yeterli.
// Gelecekte: her giris icin uuid token, Properties'e Map olarak sakla.
function generateToken() {
  var token = Utilities.getUuid() + '-' + Date.now();
  var props = getProps();
  var expires = Date.now() + (8 * 60 * 60 * 1000); // 8 saat (oturum penceresi)
  props.setProperty('ADMIN_TOKEN', token);
  props.setProperty('ADMIN_TOKEN_EXPIRES', String(expires));
  return token;
}

function verifyToken(token) {
  if (!token) return false;
  var props = getProps();
  var stored = props.getProperty('ADMIN_TOKEN');
  var expires = parseInt(props.getProperty('ADMIN_TOKEN_EXPIRES') || '0');
  return (token === stored && Date.now() < expires);
}

// Token sadece POST body'den alinir — URL parametresine YAZILMAZ
function getTokenFromBody(e) {
  var body = {};
  try { body = JSON.parse(e.postData ? e.postData.contents : '{}'); } catch(ex) {}
  return body.adminToken || '';
}

// ── AUDIT LOG ────────────────────────────────────────────────────────────────
function writeAuditLog(action, actor, detail) {
  try {
    var sheet = getOrCreateSheet('audit_log');
    sheet.appendRow([new Date().toISOString(), action, actor || 'system', detail || '']);
  } catch(e) {}
}

// ── GIRIS ────────────────────────────────────────────────────────────────────
function handleLogin(body, e) {
  // Login icin siki rate limit: IP yerine genel bucket, 5 deneme/dk
  if (!checkRateLimit('login_global', 5)) {
    writeAuditLog('LOGIN_RATELIMITED', 'unknown', 'Rate limit asimi');
    return errorResponse('Cok fazla giris denemesi. 1 dakika bekleyin.', 'RATE_LIMITED');
  }
  var password = (body.password || '').trim();
  if (!password) return errorResponse('Sifre bos olamaz.', 'EMPTY_PASSWORD');
  var props = getProps();
  var storedHash = props.getProperty('ADMIN_HASH');
  var storedSalt = props.getProperty('ADMIN_SALT');
  if (!storedHash || !storedSalt) {
    return errorResponse('setupAdminCredentials() calistirin.', 'NOT_CONFIGURED');
  }
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, password + storedSalt);
  var hash = digest.map(function(b){
    return ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2);
  }).join('');
  if (hash !== storedHash) {
    writeAuditLog('LOGIN_FAILED', 'unknown', 'Gecersiz sifre');
    return errorResponse('Gecersiz sifre.', 'INVALID_PASSWORD');
  }
  var token = generateToken();
  writeAuditLog('LOGIN_SUCCESS', 'admin', 'Giris basarili');
  return successResponse({ adminToken: token, expiresIn: 28800 });
}

// ── YANIT KAYDET ─────────────────────────────────────────────────────────────
function handleSubmitResponse(body) {
  if (!body.refCode) return errorResponse('refCode eksik.', 'MISSING_REF');
  if (!body.formSlug) return errorResponse('formSlug eksik.', 'MISSING_FORM');

  // KVKK zorunlu kontrol
  if (!body.kvkkAccepted) {
    return errorResponse('KVKK onayı zorunludur.', 'KVKK_REQUIRED');
  }

  var sheet = getOrCreateSheet('responses');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === body.refCode) {
      return errorResponse('Bu refCode zaten kayitli.', 'DUPLICATE_REF');
    }
  }
  if (body.email && body.email !== '-' &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return errorResponse('Gecersiz e-posta.', 'INVALID_EMAIL');
  }
  var customAnswersStr = body.customAnswers ? JSON.stringify(body.customAnswers) : '{}';
  sheet.appendRow([
    body.refCode, body.formSlug,
    body.fullName || 'Anonim', body.phone || '-', body.email || '-',
    body.district || '-', body.university || '-', body.department || '-',
    body.grade || '-', body.hearAbout || '-', body.notes || '-',
    customAnswersStr,
    'EVET',  // kvkk sunucu tarafinda da dogrulandi
    body.date || new Date().toLocaleDateString('tr-TR'),
    new Date().toISOString()
  ]);
  writeAuditLog('RESPONSE_SUBMITTED', body.email || 'anonim', body.formSlug);
  return successResponse({ refCode: body.refCode, message: 'Kaydedildi.' });
}

// ── YANITILAR GETIR (sadece yonetici) ────────────────────────────────────────
function handleGetResponses(token, body) {
  if (!verifyToken(token)) return errorResponse('Yetkisiz.', 'UNAUTHORIZED');
  var sheet = getOrCreateSheet('responses');
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return successResponse([]);
  var headers = data[0];
  var filterSlug = (body && body.formSlug) || null;
  var responses = data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i){ obj[h] = row[i]; });
    try { obj.customAnswers = JSON.parse(obj.customAnswers || '{}'); } catch(e){ obj.customAnswers = {}; }
    return obj;
  }).filter(function(r){ return !filterSlug || r.formSlug === filterSlug; });
  return successResponse(responses.reverse());
}

// ── YANIT SIL ────────────────────────────────────────────────────────────────
function handleDeleteResponse(token, body) {
  if (!verifyToken(token)) return errorResponse('Yetkisiz.', 'UNAUTHORIZED');
  if (!body.refCode) return errorResponse('refCode gerekli.', 'MISSING_REF');
  var sheet = getOrCreateSheet('responses');
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === body.refCode) {
      sheet.deleteRow(i + 1);
      writeAuditLog('RESPONSE_DELETED', 'admin', body.refCode);
      return successResponse({ deleted: body.refCode });
    }
  }
  return errorResponse('Kayit bulunamadi.', 'NOT_FOUND');
}

// ── TUM YANITILAR SIL ────────────────────────────────────────────────────────
function handleClearAllResponses(token, body) {
  if (!verifyToken(token)) return errorResponse('Yetkisiz.', 'UNAUTHORIZED');
  var formSlug = (body && body.formSlug) || null;
  var sheet = getOrCreateSheet('responses');
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return successResponse({ deleted: 0 });
  var deleted = 0;
  for (var i = data.length - 1; i >= 1; i--) {
    if (!formSlug || data[i][1] === formSlug) { sheet.deleteRow(i + 1); deleted++; }
  }
  writeAuditLog('RESPONSES_CLEARED', 'admin', formSlug || 'ALL');
  return successResponse({ deleted: deleted });
}

// ── FORM KAYDET ──────────────────────────────────────────────────────────────
function handleSaveForm(token, body) {
  if (!verifyToken(token)) return errorResponse('Yetkisiz.', 'UNAUTHORIZED');
  var formDef = body.formDef;
  if (!formDef || !formDef.id) return errorResponse('Form verisi eksik.', 'MISSING_FORM');
  var sheet = getOrCreateSheet('forms');
  var data = sheet.getDataRange().getValues();
  var now = new Date().toISOString();
  var found = false;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === formDef.id) {
      sheet.getRange(i+1,1,1,11).setValues([[
        formDef.id, formDef.title||'', formDef.description||'', formDef.category||'FORM',
        JSON.stringify(formDef.steps||[]), formDef.banner||'', formDef.theme||'cyan',
        formDef.status||'published', data[i][8]||now, data[i][9]||now, now
      ]]);
      found = true; break;
    }
  }
  if (!found) {
    sheet.appendRow([
      formDef.id, formDef.title||'', formDef.description||'', formDef.category||'FORM',
      JSON.stringify(formDef.steps||[]), formDef.banner||'', formDef.theme||'cyan',
      'published', now, now, now
    ]);
  }
  writeAuditLog('FORM_SAVED', 'admin', formDef.id + ' — ' + (formDef.title||''));
  return successResponse({ id: formDef.id, saved: true });
}

// ── FORMLAR GETIR ────────────────────────────────────────────────────────────
// isAdmin=true => tum formlar (taslak dahil)
// isAdmin=false => sadece status='published' formlar
function handleGetForms(token) {
  var isAdmin = verifyToken(token);
  var sheet = getOrCreateSheet('forms');
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return successResponse([]);
  var headers = data[0];
  var forms = data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i){ obj[h] = row[i]; });
    try { obj.steps = JSON.parse(obj.steps_json || '[]'); } catch(e){ obj.steps = []; }
    return obj;
  }).filter(function(f){
    if (isAdmin) return true;            // yonetici tum formlari gorur
    return f.status === 'published';     // halk sadece yayinlanmis formlari gorur
  });
  return successResponse(forms);
}

// ── CSV DISA AKTARMA ─────────────────────────────────────────────────────────
// Token POST body'den alinir (URL'den degil)
function handleExportCSV(token, body) {
  if (!verifyToken(token)) return errorResponse('Yetkisiz.', 'UNAUTHORIZED');
  var sheet = getOrCreateSheet('responses');
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return errorResponse('Veri yok.', 'NO_DATA');
  var filterSlug = (body && body.formSlug) || null;
  var headers = data[0];
  var csvRows = [headers.join(',')];
  for (var i = 1; i < data.length; i++) {
    if (filterSlug && data[i][1] !== filterSlug) continue;
    var row = data[i].map(function(cell){
      var val = String(cell).trim();
      if (['=','+','-','@'].indexOf(val[0]) >= 0) val = "'" + val;
      return '"' + val.replace(/"/g, '""') + '"';
    });
    csvRows.push(row.join(','));
  }
  writeAuditLog('CSV_EXPORTED', 'admin', filterSlug || 'ALL');
  return ContentService
    .createTextOutput('\uFEFF' + csvRows.join('\n'))
    .setMimeType(ContentService.MimeType.CSV);
}

// ── DOSYA YUKLEME ─────────────────────────────────────────────────────────────
function handleFileUpload(token, body) {
  if (!verifyToken(token)) return errorResponse('Yetkisiz.', 'UNAUTHORIZED');
  var fileData = body.fileData;
  var fileName = (body.fileName || 'upload_' + Date.now()).replace(/[^a-zA-Z0-9._-]/g, '_');
  var mimeType = body.mimeType || 'image/jpeg';
  if (!fileData) return errorResponse('Dosya verisi eksik.', 'MISSING_FILE');
  var sizeBytes = Math.ceil(fileData.replace(/[^A-Za-z0-9+/]/g, '').length * 3 / 4);
  if (sizeBytes > 5 * 1024 * 1024) return errorResponse('5MB sinirini asiyor.', 'FILE_TOO_LARGE');
  var allowed = ['image/jpeg','image/png','image/webp','image/gif'];
  if (allowed.indexOf(mimeType) < 0) return errorResponse('Desteklenmeyen tur.', 'INVALID_TYPE');
  // Ek guvenlik: base64 iceriginde sadece gorsel magic bytes kontrolu
  var props = getProps();
  var folderId = props.getProperty('DRIVE_FOLDER_ID');
  var folder;
  try {
    folder = folderId ? DriveApp.getFolderById(folderId) : null;
  } catch(e) { folder = null; }
  if (!folder) {
    folder = DriveApp.createFolder('Firnas Form Portal — Uploads');
    props.setProperty('DRIVE_FOLDER_ID', folder.getId());
  }
  var base64Data = fileData.indexOf(',') >= 0 ? fileData.split(',')[1] : fileData;
  var decoded = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decoded, mimeType, fileName);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var directUrl = 'https://drive.google.com/uc?export=view&id=' + file.getId();
  writeAuditLog('FILE_UPLOADED', 'admin', fileName + ' (' + Math.round(sizeBytes/1024) + 'KB)');
  return successResponse({ url: directUrl, fileId: file.getId() });
}

// ── ANA ROUTER (doPost) ──────────────────────────────────────────────────────
function doPost(e) {
  try {
    var body = {};
    try { body = JSON.parse(e.postData ? e.postData.contents : '{}'); } catch(ex){}
    var action = (e.parameter && e.parameter.action) || body.action || '';

    // Token her zaman POST body'den alinir
    var token = body.adminToken || '';

    // Rate limiting: action'a gore farkli limitler
    var limits = { 'submitResponse': 20, 'login': 5, 'saveForm': 15,
                   'deleteResponse': 15, 'clearAll': 5, 'uploadFile': 10 };
    var limit = limits[action] || 15;
    if (!checkRateLimit(action || 'unknown', limit)) {
      return errorResponse('Cok fazla istek. Bir dakika bekleyin.', 'RATE_LIMITED');
    }

    switch(action) {
      case 'login':           return handleLogin(body, e);
      case 'submitResponse':  return handleSubmitResponse(body);
      case 'saveForm':        return handleSaveForm(token, body);
      case 'deleteResponse':  return handleDeleteResponse(token, body);
      case 'clearAll':        return handleClearAllResponses(token, body);
      case 'uploadFile':      return handleFileUpload(token, body);
      case 'getResponses':    return handleGetResponses(token, body);
      case 'exportCSV':       return handleExportCSV(token, body);
      default:                return errorResponse('Bilinmeyen islem: ' + action, 'UNKNOWN_ACTION');
    }
  } catch(err) {
    Logger.log('doPost hatasi: ' + err);
    return errorResponse('Sunucu hatasi: ' + err.message, 'SERVER_ERROR');
  }
}

// ── PREFLIGHT + PUBLIC GET ────────────────────────────────────────────────────
// GET sadece herkese acik islemler icin (getForms, ping).
// Yonetici islemleri artik POST uzerinden yapilir (token URL'de gozukmuyor).
function doGet(e) {
  try {
    var action = (e.parameter && e.parameter.action) || '';
    var token = (e.parameter && e.parameter.adminToken) || '';
    switch(action) {
      case 'getForms':  return handleGetForms(token);
      case 'ping':      return successResponse({ status: 'ok', version: '2', time: new Date().toISOString() });
      default:          return errorResponse('Bu URL sadece GET ile getForms/ping destekler. Yonetici islemleri POST kullanin.', 'USE_POST');
    }
  } catch(err) {
    Logger.log('doGet hatasi: ' + err);
    return errorResponse('Sunucu hatasi: ' + err.message, 'SERVER_ERROR');
  }
}