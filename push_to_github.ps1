Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "     Firnas Technologies - GitHub v2 Repository Push Assistant" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/6] Git deposu başlatılıyor (git init)..." -ForegroundColor Yellow
git init

Write-Host ""
Write-Host "[2/6] Dosyalar sahneye ekleniyor (git add .)..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "[3/6] İlk commit oluşturuluyor (git commit)..." -ForegroundColor Yellow
git commit -m "feat: redesign quick-nav cards and align branding with global peace and Ummah motto"

Write-Host ""
Write-Host "[4/6] Ana dal adı 'main' olarak güncelleniyor (git branch -M main)..." -ForegroundColor Yellow
git branch -M main

Write-Host ""
Write-Host "[5/6] GitHub deposu bağlantısı kuruluyor..." -ForegroundColor Yellow
Write-Host ""
$username = Read-Host "Lütfen GitHub kullanıcı adınızı girin (örn: enesb)"

git remote remove origin 2>$null
git remote add origin "https://github.com/$username/firnas_v2.git"

Write-Host ""
Write-Host "[6/6] Kodlar GitHub'a gönderiliyor (git push -u origin main)..." -ForegroundColor Yellow
Write-Host "NOT: Eğer ilk defa bağlanıyorsanız, GitHub giriş penceresi açılabilir."
Write-Host ""
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "====================================================================" -ForegroundColor Green
    Write-Host "   BAŞARILI! Kodlarınız 'firnas_v2' deposuna başarıyla yüklendi." -ForegroundColor Green
    Write-Host "====================================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "====================================================================" -ForegroundColor Red
    Write-Host "   HATA: Kodlar gönderilemedi. Lütfen internet bağlantınızı," -ForegroundColor Red
    Write-Host "   kullanıcı adınızı ve GitHub'da 'firnas_v2' adında boş bir depo" -ForegroundColor Red
    Write-Host "   oluşturup oluşturmadığınızı kontrol edin." -ForegroundColor Red
    Write-Host "====================================================================" -ForegroundColor Red
}
Write-Host ""
Read-Host "Devam etmek için Enter tuşuna basın..."
