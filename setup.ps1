# ============================================================
# setup.ps1 -- Buruan Sae 2.0 Setup Script (Windows PowerShell)
# Jalankan dari folder Kode_Sumber:
#   cd "D:\project\IBBF\Aplikasi Buruan Sae 2.0\Buruan Sae 2.0\Kode_Sumber"
#   .\setup.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot

function Write-Step($msg) {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
}

function Write-OK($msg)   { Write-Host "  [OK]   $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "Buruan Sae 2.0 -- Setup Otomatis" -ForegroundColor Green
Write-Host "Pastikan Docker Desktop sudah berjalan sebelum lanjut." -ForegroundColor Gray

# -- Cek prerequisite --
Write-Step "0. Cek prerequisite"

$prereqs = @{
    "node"    = "Node.js"
    "npm"     = "npm"
    "docker"  = "Docker"
    "flutter" = "Flutter SDK"
    "dart"    = "Dart SDK"
}

$allOk = $true
foreach ($cmd in $prereqs.Keys) {
    if (Get-Command $cmd -ErrorAction SilentlyContinue) {
        Write-OK "$($prereqs[$cmd]) ditemukan"
    } else {
        Write-Fail "$($prereqs[$cmd]) TIDAK ditemukan -- install dulu!"
        $allOk = $false
    }
}

if (-not $allOk) {
    Write-Host ""
    Write-Host "  Instalasi yang dibutuhkan:" -ForegroundColor Yellow
    Write-Host "  - Node.js  : https://nodejs.org" -ForegroundColor Gray
    Write-Host "  - Docker   : https://docker.com/products/docker-desktop" -ForegroundColor Gray
    Write-Host "  - Flutter  : https://flutter.dev/docs/get-started/install" -ForegroundColor Gray
    exit 1
}

# -- Cek .env files --
Write-Step "1. Cek file .env"

$envFiles = @(
    @{ src = "$ROOT\backend\.env.example"; dst = "$ROOT\backend\.env" },
    @{ src = "$ROOT\web-admin\.env.local.example"; dst = "$ROOT\web-admin\.env.local" },
    @{ src = "$ROOT\mobile\.env.example"; dst = "$ROOT\mobile\.env" }
)

foreach ($ef in $envFiles) {
    if (-not (Test-Path $ef.dst)) {
        Copy-Item $ef.src $ef.dst
        Write-Warn "Dibuat $($ef.dst) dari example -- WAJIB diisi sebelum lanjut!"
    } else {
        Write-OK "$($ef.dst) sudah ada"
    }
}

Write-Host ""
Write-Warn "PENTING: Buka file .env dan isi semua nilai yang bertanda GANTI_"
Write-Warn "Tekan Enter untuk lanjut setelah mengisi .env files..."
Read-Host

# -- Backend setup --
Write-Step "2. Backend -- npm install"
Set-Location "$ROOT\backend"
npm install
Write-OK "Backend dependencies terpasang"

# -- Web Admin setup --
Write-Step "3. Web Admin -- npm install"
Set-Location "$ROOT\web-admin"
npm install
Write-OK "Web Admin dependencies terpasang"

# -- Mobile Flutter setup --
Write-Step "4. Mobile -- flutter pub get"
Set-Location "$ROOT\mobile"
flutter pub get
Write-OK "Flutter packages di-download"

# -- FlutterFire configure --
Write-Step "5. Firebase -- flutterfire configure"
Write-Host ""
Write-Warn "Langkah ini membutuhkan input manual dari Anda."
Write-Host "  Apakah flutterfire CLI sudah terinstall? (dart pub global activate flutterfire_cli)" -ForegroundColor Gray
Write-Host ""

$hasFlutterfire = Get-Command flutterfire -ErrorAction SilentlyContinue
if (-not $hasFlutterfire) {
    Write-Host "  Menginstall FlutterFire CLI..." -ForegroundColor Cyan
    dart pub global activate flutterfire_cli
}

Write-Host "  Menjalankan flutterfire configure..." -ForegroundColor Cyan
Write-Host "  -> Pilih Firebase project Anda dari daftar yang muncul" -ForegroundColor Yellow
Write-Host "  -> Centang platform: Android, iOS" -ForegroundColor Yellow
Write-Host ""
flutterfire configure
Write-OK "firebase_options.dart berhasil dibuat"

# -- Build Runner (Riverpod codegen) --
Write-Step "6. Mobile -- build_runner (generate .g.dart)"
Set-Location "$ROOT\mobile"
Write-Host "  Ini mungkin butuh 2-5 menit pertama kali..." -ForegroundColor Gray
dart run build_runner build --delete-conflicting-outputs
Write-OK "Semua file .g.dart berhasil di-generate"

# -- Docker services --
Write-Step "7. Infrastruktur -- docker compose up"
Set-Location "$ROOT"

Write-Host "  Menjalankan PostgreSQL, Redis, MinIO..." -ForegroundColor Cyan
docker compose up -d postgres redis minio
Write-Host "  Menunggu database siap (10 detik)..." -ForegroundColor Gray
Start-Sleep -Seconds 10
Write-OK "Services infrastruktur berjalan"

# -- Prisma migrate --
Write-Step "8. Database -- prisma generate + migrate"
Set-Location "$ROOT\backend"
npx prisma generate
Write-OK "Prisma Client ter-generate"

$migrationsPath = "$ROOT\backend\prisma\migrations"
if (Test-Path $migrationsPath) {
    Write-Host "  Migrations folder ditemukan -- menjalankan migrate deploy..." -ForegroundColor Cyan
    npx prisma migrate deploy
    Write-OK "Migrations ter-deploy"
} else {
    Write-Host "  Migrations folder belum ada -- membuat migration awal..." -ForegroundColor Cyan
    Write-Warn "Prisma mungkin meminta konfirmasi -- ketik y jika diminta"
    npx prisma migrate dev --name init
    Write-OK "Migration awal berhasil dibuat dan di-apply"
}
Write-OK "Database schema siap"

# -- Seed data --
Write-Step "9. Database -- seed data awal"
$doSeed = Read-Host "  Jalankan seed data (admin pertama)? (y/N)"
if ($doSeed -eq "y" -or $doSeed -eq "Y") {
    npm run seed
    Write-OK "Data awal berhasil di-seed"
} else {
    Write-Warn "Seed dilewati -- jalankan manual dengan: npm run seed"
}

# -- Start semua services --
Write-Step "10. Start semua services"
Set-Location "$ROOT"
docker compose up -d
Write-OK "Semua Docker services berjalan"

Write-Host ""
Write-Host "  Menunggu backend siap (5 detik)..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# -- Verifikasi --
Write-Step "11. Verifikasi"
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 5
    Write-OK "Backend health check: OK ($($health.status))"
} catch {
    Write-Warn "Backend belum merespons -- tunggu beberapa detik dan coba lagi"
}

# -- Ringkasan --
Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  Buruan Sae 2.0 siap dijalankan!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend API  : http://localhost:3001" -ForegroundColor Cyan
Write-Host "  API Docs     : http://localhost:3001/docs" -ForegroundColor Cyan
Write-Host "  Web Admin    : jalankan: cd web-admin && npm run dev" -ForegroundColor Cyan
Write-Host "                 lalu buka: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Mobile       : cd mobile && flutter run" -ForegroundColor Cyan
Write-Host "  MinIO Console: http://localhost:9001" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Untuk menghentikan: docker compose down" -ForegroundColor Gray
Write-Host ""
