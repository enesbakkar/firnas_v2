/* ==========================================================================
   FIRNAS FORM PORTAL — Google Apps Script Backend
   Google Sheets = Veritabanı | Google Drive = Dosya Depolama
   
   KURULUM:
   1. script.google.com → Yeni proje oluştur
   2. Bu kodu yapıştır
   3. initializeSheets() fonksiyonunu bir kez çalıştır (sekmeleri oluşturur)
   4. setupAdminCredentials() fonksiyonunu çalıştır (şifreyi ayarlar)
   5. Yayınla → Web App → Herkes erişebilir → Deploy
   6. Çıkan URL'yi kopyala → form/src/config/appConstants.js dosyasına yapıştır
   ========================================================================== */

// CORS HEADERS
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function successResponse(data) {
  return jsonResponse({ success: true, data: data });
}

function errorResponse(message, code) {
  return jsonResponse({ success: false, error: message, code: code || 'ERROR' });
}

// PROPERTIES (Güvenli Saklama)
function getProps() {
  return PropertiesService.getScriptProperties();
}

// SHEET YARDIMCILARI
function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) { sheet = ss.insertSheet(name); }
  return sheet;
}

// KURULUM FONKSİYONLARI (Bir kez çalıştırılır)
function initializeSheets() {
  var responses = getOrCreateSheet('responses');
  if (responses.getLastRow() === 0) {
    responses.appendRow(['refCode','formSlug','fullName','phone','email','district','university','department','grade','hearAbout','notes','customAnswers','kvkkAccepted','date','timestamp']);
    responses.getRange(1,1,1,15).setFontWeight('bold');
    responses.setFrozenRows(1);
  }
  var forms = getOrCreateSheet('forms');
  if (forms.getLastRow() === 0) {
    forms.appendRow(['id','title','description','category','steps_json','banner','theme','status','publishedAt','createdAt','updatedAt']);
    forms.getRange(1,1,1,11).setFontWeight('bold');
    forms.setFrozenRows(1);
  }
  var audit = getOrCreateSheet('audit_log');
  if (audit.getLastRow() === 0) {
    audit.appendRow(['timestamp','action','actor','detail']);
    audit.getRange(1,1,1,4).setFontWeight('bold');
    audit.setFrozenRows(1);
  }
  return 'Sheets başarıyla oluşturuldu.';
}

function setupAdminCredentials() {
  var ADMIN_PASSWORD = 'FORMS_fir_2023';
  var SECRET_SALT = Utilities.getUuid();
  var props = getProps();
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, ADMIN_PASSWORD + SECRET_SALT);
  var hash = digest.map(function(b){ return ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2); }).join('');
  props.setProperties({
    'ADMIN_HASH': hash,
    'ADMIN_SALT': SECRET_SALT,
    'RATE_LIMIT_WINDOW': '60',
    'RATE_LIMIT_MAX': '30',
    'DRIVE_FOLDER_ID': ''
  });
  Logger.log('Admin kimlik bilgileri kaydedildi.');
  return 'Tamamlandı. Salt: ' + SECRET_SALT;
}

// RATE LIMITER
function checkRateLimit(key) {
  var props = getProps();
  var now = Date.now();
  var window = parseInt(props.getProperty('RATE_LIMIT_WINDOW') || '60') * 1000;
  var max = parseInt(props.getProperty('RATE_LIMIT_MAX') || '30');
  var rlKey = 'rl_' + key.replace(/[^a-zA-Z0-9]/g, '_');
  var stored = props.getProperty(rlKey);
  var data = stored ? JSON.parse(stored) : { count: 0, reset: now + window };
  if (now > data.reset) { data = { count: 1, reset: now + window }; }
  else {
    data.count++;
    if (data.count > max) return false;
  }
  props.setProperty(rlKey, JSON.stringify(data));
  return true;
}

// TOKEN DOĞRULAMA
function generateToken() {
  var token = Utilities.getUuid() + '-' + Date.now();
  var props = getProps();
  var expires = Date.now() + (24 * 60 * 60 * 1000);
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

function getAdminToken(e) {
  var body = {};
  try { body = JSON.parse(e.postData ? e.postData.contents : '{}'); } catch(ex) {}
  var params = e.parameter || {};
  return body.adminToken || params.adminToken || '';
}

// AUDIT LOG
function writeAuditLog(action, actor, detail) {
  try {
    var sheet = getOrCreateSheet('audit_log');
    sheet.appendRow([new Date().toISOString(), action, actor || 'system', detail || '']);
  } catch(e) {}
}

// GİRİŞ
function handleLogin(body) {
  var password = (body.password || '').trim();
  if (!password) return errorResponse('Şifre boş olamaz.', 'EMPTY_PASSWORD');
  var props = getProps();
  var storedHash = props.getProperty('ADMIN_HASH');
  var storedSalt = props.getProperty('ADMIN_SALT');
  if (!storedHash || !storedSalt) return errorResponse('setupAdminCredentials() çalıştırın.', 'NOT_CONFIGURED');
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + storedSalt);
  var hash = digest.map(function(b){ return ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2); }).join('');
  if (hash !== storedHash) {
    writeAuditLog('LOGIN_FAILED', 'unknown', 'Geçersiz şifre');
    return errorResponse('Geçersiz şifre.', 'INVALID_PASSWORD');
  }
  var token = generateToken();
  writeAuditLog('LOGIN_SUCCESS', 'admin', 'Giriş başarılı');
  return successResponse({ adminToken: token, expiresIn: 86400 });
}

// YANIT KAYDET
function handleSubmitResponse(body) {
  if (!body.refCode) return errorResponse('refCode eksik.', 'MISSING_REF');
  if (!body.formSlug) return errorResponse('formSlug eksik.', 'MISSING_FORM');
  var sheet = getOrCreateSheet('responses');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === body.refCode) return errorResponse('Bu refCode zaten kayıtlı.', 'DUPLICATE_REF');
  }
  if (body.email && body.email !== '-' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return errorResponse('Geçersiz e-posta.', 'INVALID_EMAIL');
  }
  var customAnswersStr = body.customAnswers ? JSON.stringify(body.customAnswers) : '{}';
  sheet.appendRow([
    body.refCode, body.formSlug,
    body.fullName || 'Anonim', body.phone || '-', body.email || '-',
    body.district || '-', body.university || '-', body.department || '-',
    body.grade || '-', body.hearAbout || '-', body.notes || '-',
    customAnswersStr, body.kvkkAccepted ? 'EVET' : 'HAYIR',
    body.date || new Date().toLocaleDateString('tr-TR'), new Date().toISOString()
  ]);
  writeAuditLog('RESPONSE_SUBMITTED', body.email || 'anonim', body.formSlug);
  return successResponse({ refCode: body.refCode, message: 'Kaydedildi.' });
}

// YANITILAR GETİR
function handleGetResponses(token, params) {
  if (!verifyToken(token)) return errorResponse('Yetkisiz.', 'UNAUTHORIZED');
  var sheet = getOrCreateSheet('responses');
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return successResponse([]);
  var headers = data[0];
  var filterSlug = params.formSlug || null;
  var responses = data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i){ obj[h] = row[i]; });
    try { obj.customAnswers = JSON.parse(obj.customAnswers || '{}'); } catch(e){ obj.customAnswers = {}; }
    return obj;
  }).filter(function(r){ return !filterSlug || r.formSlug === filterSlug; });
  return successResponse(responses.reverse());
}

// YANIT SİL
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
  return errorResponse('Kayıt bulunamadı.', 'NOT_FOUND');
}

// TÜM YANITILAR SİL
function handleClearAllResponses(token, body) {
  if (!verifyToken(token)) return errorResponse('Yetkisiz.', 'UNAUTHORIZED');
  var formSlug = body.formSlug || null;
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

// FORM KAYDET
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
  writeAuditLog('FORM_SAVED', 'admin', formDef.id);
  return successResponse({ id: formDef.id, saved: true });
}

// FORMLAR GETİR
function handleGetForms() {
  var sheet = getOrCreateSheet('forms');
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return successResponse([]);
  var headers = data[0];
  var forms = data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i){ obj[h] = row[i]; });
    try { obj.steps = JSON.parse(obj.steps_json || '[]'); } catch(e){ obj.steps = []; }
    return obj;
  });
  return successResponse(forms);
}

// CSV DIŞA AKTARMA
function handleExportCSV(token, params) {
  if (!verifyToken(token)) return errorResponse('Yetkisiz.', 'UNAUTHORIZED');
  var sheet = getOrCreateSheet('responses');
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return errorResponse('Veri yok.', 'NO_DATA');
  var filterSlug = params.formSlug || null;
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
  return ContentService.createTextOutput('\uFEFF' + csvRows.join('\n')).setMimeType(ContentService.MimeType.CSV);
}

// DOSYA YÜKLEME (Google Drive)
function handleFileUpload(token, body) {
  if (!verifyToken(token)) return errorResponse('Yetkisiz.', 'UNAUTHORIZED');
  var fileData = body.fileData;
  var fileName = body.fileName || 'upload_' + Date.now();
  var mimeType = body.mimeType || 'image/jpeg';
  if (!fileData) return errorResponse('Dosya verisi eksik.', 'MISSING_FILE');
  var sizeBytes = (fileData.length * 3) / 4;
  if (sizeBytes > 5 * 1024 * 1024) return errorResponse('5MB sınırını aşıyor.', 'FILE_TOO_LARGE');
  var allowed = ['image/jpeg','image/png','image/webp','image/gif'];
  if (allowed.indexOf(mimeType) < 0) return errorResponse('Desteklenmeyen tür.', 'INVALID_TYPE');
  var props = getProps();
  var folderId = props.getProperty('DRIVE_FOLDER_ID');
  var folder;
  if (!folderId) {
    folder = DriveApp.createFolder('Firnas Form Portal — Uploads');
    props.setProperty('DRIVE_FOLDER_ID', folder.getId());
  } else {
    try { folder = DriveApp.getFolderById(folderId); }
    catch(e) { folder = DriveApp.createFolder('Firnas Form Portal — Uploads'); props.setProperty('DRIVE_FOLDER_ID', folder.getId()); }
  }
  var decoded = Utilities.base64Decode(fileData.split(',').pop());
  var blob = Utilities.newBlob(decoded, mimeType, fileName);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var directUrl = 'https://drive.google.com/uc?export=view&id=' + file.getId();
  writeAuditLog('FILE_UPLOADED', 'admin', fileName);
  return successResponse({ url: directUrl, fileId: file.getId() });
}

// ANA ROUTER
function doPost(e) {
  try {
    var body = {};
    try { body = JSON.parse(e.postData ? e.postData.contents : '{}'); } catch(ex){}
    var action = (e.parameter && e.parameter.action) || body.action || '';
    var token = getAdminToken(e);
    if (action !== 'login' && !checkRateLimit(action + '_general')) {
      return errorResponse('Çok fazla istek.', 'RATE_LIMITED');
    }
    switch(action) {
      case 'login':           return handleLogin(body);
      case 'submitResponse':  return handleSubmitResponse(body);
      case 'saveForm':        return handleSaveForm(token, body);
      case 'deleteResponse':  return handleDeleteResponse(token, body);
      case 'clearAll':        return handleClearAllResponses(token, body);
      case 'uploadFile':      return handleFileUpload(token, body);
      default:                return errorResponse('Bilinmeyen işlem: ' + action, 'UNKNOWN_ACTION');
    }
  } catch(err) {
    Logger.log('doPost hatası: ' + err);
    return errorResponse('Sunucu hatası: ' + err.message, 'SERVER_ERROR');
  }
}

function doGet(e) {
  try {
    var action = (e.parameter && e.parameter.action) || '';
    var token = (e.parameter && e.parameter.adminToken) || '';
    var params = e.parameter || {};
    switch(action) {
      case 'getForms':      return handleGetForms();
      case 'getResponses':  return handleGetResponses(token, params);
      case 'exportCSV':     return handleExportCSV(token, params);
      case 'ping':          return successResponse({ status: 'ok', time: new Date().toISOString() });
      default:              return errorResponse('Bilinmeyen işlem: ' + action, 'UNKNOWN_ACTION');
    }
  } catch(err) {
    Logger.log('doGet hatası: ' + err);
    return errorResponse('Sunucu hatası: ' + err.message, 'SERVER_ERROR');
  }
}
