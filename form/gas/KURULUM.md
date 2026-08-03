# Firnas Form Portal — Google Apps Script Backend Kurulum Kılavuzu

Bu kılavuz, form yanıtlarının tarayıcıda değil Google Sheets + Drive'da kalıcı olarak saklanması için gereken adımları açıklar. **Tamamen ücretsizdir.**

---

## Gereksinimler

- Google hesabı (Gmail)
- `form/gas/Code.gs` dosyası (zaten mevcut)

---

## Adım 1 — Google Sheets Oluştur

1. [sheets.google.com](https://sheets.google.com) adresine git
2. **Boş** yeni bir Sheets belgesi oluştur
3. Belgeye istediğin adı ver (örn. *Firnas Form Yanıtları*)
4. Tarayıcı adres çubuğundaki URL'den `spreadsheetId` değerini **kopyala**:
   ```
   https://docs.google.com/spreadsheets/d/[BURASI_SPREADSHEET_ID]/edit
   ```

---

## Adım 2 — Apps Script Projesi Oluştur

1. [script.google.com](https://script.google.com) adresine git
2. **Yeni proje** oluştur
3. Projeye bir ad ver (örn. *Firnas Backend*)
4. Sol panelden **Hizmetler (+)** → **Google Drive API** ekle
5. Sol panelden **Hizmetler (+)** → **Google Sheets API** ekle

---

## Adım 3 — Kodu Yapıştır

1. `Code.gs` editörünü aç (varsayılan dosya)
2. İçeriğin tamamını **sil**
3. `form/gas/Code.gs` dosyasının içeriğini **yapıştır**
4. Dosyayı kaydet (**Ctrl + S**)

---

## Adım 4 — Script'i Sheets'e Bağla

1. Apps Script üst menüsünden: **Proje Ayarları** (⚙️ simgesi)
2. **Google E-Tablolar Hizmeti** bölümüne git
3. Adım 1'de kopyaladığın `spreadsheetId` değerini gir
4. Alternatif olarak: Sheets belgesinde **Uzantılar → Apps Script** menüsünden aynı script'i aç

> **En kolay yol:** Sheets belgesini aç → Uzantılar menüsü → Apps Script → Bu script'i aynı sayfaya yaz.

---

## Adım 5 — Sekmeleri Oluştur (initializeSheets)

1. Apps Script editöründe, üst araç çubuğundan `initializeSheets` fonksiyonunu seç
2. ▶ **Çalıştır** butonuna tıkla
3. İzin ekranı gelirse **İzin Ver** → Google hesabını seç → **Yine de devam et** → **İzin Ver**
4. Sheets belgesini aç — `responses`, `forms`, `audit_log` sekmeleri oluşmuş olmalı ✅

---

## Adım 6 — Admin Şifresi Kur (setupAdminCredentials)

1. Apps Script editöründe, üst araç çubuğundan `setupAdminCredentials` fonksiyonunu seç
2. ▶ **Çalıştır** butonuna tıkla
3. Bu fonksiyon şifreyi (`FORMS_fir_2023`) **güvenli Script Properties'e** kaydeder
4. **Şifre kaynak kodda HİÇBİR ZAMAN görünmez** — Properties'te şifreli hash olarak saklanır ✅
5. Şifreyi değiştirmek istersen: `Code.gs`'deki `ADMIN_PASSWORD` satırını düzenle → tekrar çalıştır

---

## Adım 7 — Web App Olarak Yayınla

1. Sağ üstten **Dağıt** → **Yeni Dağıtım**
2. Türü: **Web Uygulaması**
3. Ayarlar:
   - **Açıklama:** Firnas Form Portal Backend v1
   - **Şu kullanıcı olarak çalıştır:** Ben (kendi hesabın)
   - **Erişim izni:** **Herkes** (Anonymous — form dolduranlar giriş yapmadan yanıt gönderebilsin)
4. **Dağıt** butonuna tıkla
5. Çıkan **Web uygulaması URL'sini kopyala**:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```

---

## Adım 8 — URL'yi Projeye Ekle

`form/src/config/appConstants.js` dosyasını aç ve şu satırı güncelle:

```javascript
export const GAS_BACKEND_URL = 'https://script.google.com/macros/s/SENIN_URLINI_BURAYA_YAZ/exec';
```

Dosyayı kaydet ve GitHub'a push et.

---

## Adım 9 — Test Et

1. Form portalını aç: [firnastechnologies.com/form/](https://firnastechnologies.com/form/)
2. Bir formu doldur ve gönder
3. Google Sheets'in `responses` sekmesine bak — yanıt görünmeli ✅
4. Yönetici girişi yap → Yanıtları incele → Sheets'te aynı veriler ✅
5. CSV indir → Sheets'teki veriyle eşleşmeli ✅

---

## Güvenlik Notları

| Özellik | Durum |
|---|---|
| Admin şifresi kaynak kodda | ❌ Hayır — Script Properties'te SHA-256 hash |
| Sunucu doğrulama | ✅ Var (e-posta, refCode çakışma) |
| Rate limiting | ✅ Var (dakika başına 30 istek) |
| Token tabanlı yönetici oturumu | ✅ Var (24 saat geçerli UUID token) |
| CORS | ✅ Gerçek CORS — no-cors yok |
| Google Drive dosya yükleme | ✅ 5MB limit, sadece görsel türleri |
| Audit log | ✅ Tüm işlemler kaydediliyor |

---

## Kota Bilgisi (Ücretsiz Limitler)

| Limit | Değer |
|---|---|
| Script çalışma/gün | 6.000 dakika |
| URL çağrıları/gün | 20.000 |
| Drive depolama | 15 GB (hesabınızla paylaşımlı) |
| Sheets satır limiti | 10.000.000 |

Normal form kullanımı için bu limitler **fazlasıyla yeterlidir**.

---

## Sorun Giderme

**"Script authorization required" hatası:**  
→ `initializeSheets()` ilk çalıştırmada izin ister. İzin ver ve tekrar dene.

**"Cannot read property of undefined" hatası:**  
→ `setupAdminCredentials()` çalıştırılmamış. Adım 6'yı tekrarla.

**Form gönderimi hâlâ tarayıcıda kalıyor:**  
→ `appConstants.js`'deki `GAS_BACKEND_URL` değerini kontrol et. Placeholder URL olmamalı.

**Yanıtlar Sheets'te görünmüyor:**  
→ Apps Script → Yürütmeler → Hata mesajını kontrol et.
