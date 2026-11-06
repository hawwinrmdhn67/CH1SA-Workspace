# Panduan Lengkap Deployment Production (Docker & VPS) - CH1SA Workspace

Dokumentasi ini adalah panduan resmi dan praktis untuk melakukan deployment aplikasi **CH1SA Workspace** ke VPS (Virtual Private Server) berbasis Linux menggunakan Docker dan Docker Compose.

---

## Daftar Isi
- [A. Informasi Project](#a-informasi-project)
- [B. Persiapan VPS](#b-persiapan-vps)
- [C. Persiapan Project & Konfigurasi](#c-persiapan-project--konfigurasi)
- [D. Proses Deployment](#d-proses-deployment)
- [E. Konfigurasi Domain dan HTTPS (SSL)](#e-konfigurasi-domain-dan-https-ssl)
- [F. Maintenance dan Update Aplikasi](#f-maintenance-dan-update-aplikasi)
- [G. Backup dan Restore Database](#g-backup-dan-restore-database)
- [H. Troubleshooting & Solusi Masalah](#h-troubleshooting--solusi-masalah)
- [I. Production Security Checklist](#i-production-security-checklist)
- [J. Command Cheat Sheet](#j-command-cheat-sheet)

---

## A. Informasi Project

### 1. Teknologi yang Digunakan
| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS | Mode `output: "standalone"` untuk efisiensi container minimal |
| **Backend API** | Go (Golang), Gin Web Framework, pgx/v5 | Kompilasi binary statis CGO-disabled pada Alpine Linux |
| **Database** | PostgreSQL 16 Alpine | Relational database dengan persistent Docker volume |
| **AI Integration** | NineRouter / OpenRouter API | Digunakan oleh modul Assistant/Chatbot |
| **Container Engine** | Docker & Docker Compose v2 | Multi-stage build, non-root user, internal network |
| **Reverse Proxy** | Nginx Alpine (Opsional) | SSL Termination & HTTP/HTTPS reverse proxy |

### 2. Arsitektur Deployment Docker
```
                  [ Internet / Browser User ]
                               │
                               ▼
                    [ Port 80 / 443 (HTTPS) ]
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       [ Nginx Reverse Proxy ]     (atau akses direct port)
        ├── / (Path Root)   ──────────► [ Frontend Container (Port 3000) ]
        └── /api & /health  ──────────► [ Backend Container  (Port 8080) ]
                                                │
                                                ▼ (Koneksi Internal Docker Network)
                                        [ PostgreSQL Container (Port 5432) ]
                                                │
                                                ▼ (Persistensi Data)
                                        [ Docker Volume: chisa_postgres_data ]
```

### 3. Daftar Service Container
| Service | Container Name | Port Internal | Port Host Default | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `postgres` | `chisa-postgres` | `5432` | *(Tidak diekspos)* | Terisolasi di internal network `chisa_network` demi keamanan |
| `backend` | `chisa-backend` | `8080` | `8080` | Gin REST API, auto-migration, health check |
| `frontend` | `chisa-frontend` | `3000` | `3000` | Next.js Standalone Node Server |
| `9router` | `chisa-9router` | `20128` | `127.0.0.1:20128` | AI Proxy Router (decolua/9router) terisolasi localhost |
| `nginx` *(opsional)* | `chisa-nginx` | `80`, `443` | `80`, `443` | Proxy gateway & SSL Let's Encrypt |

### 4. Kebutuhan Minimum Server (VPS)
- **Sistem Operasi**: Ubuntu 22.04 LTS / 24.04 LTS atau Debian 12 (64-bit).
- **CPU**: Minimal 1 vCPU (Direkomendasikan: 2 vCPU untuk kecepatan build).
- **RAM**: Minimal 2 GB RAM (Wajib menambahkan 2 GB Swap jika RAM 1 GB - 2 GB agar proses build Next.js berjalan stabil).
- **Penyimpanan**: Minimal 20 GB SSD.

---

## B. Persiapan VPS

Langkah-langkah berikut dijalankan di terminal lokal untuk login ke server VPS Anda.

### 1. Login ke VPS via SSH
Ganti `root` atau username VPS dan `IP_VPS_ANDA` dengan alamat IP server Anda:
```bash
ssh root@IP_VPS_ANDA
```

### 2. Update Sistem Operasi & Paket Dasar
Pastikan seluruh paket sistem operasi berada pada versi terbaru:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git htop ufw ca-certificates gnupg lsb-release
```

### 3. Konfigurasi Swap Memory (Sangat Direkomendasikan)
Next.js build dan kompilasi Go membutuhkan alokasi memori yang cukup. Jika server memiliki RAM 1-2 GB, buat swap 2 GB agar build tidak mengalami error *Out of Memory (OOM)*:
```bash
# Periksa apakah swap sudah ada
sudo swapon --show

# Jika belum ada swap, buat file swap 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Jadikan permanen setelah server reboot
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 4. Instalasi Docker Engine & Docker Compose Plugin
Gunakan repository resmi Docker untuk mendapatkan versi stabil terbaru:

```bash
# 1. Hapus instalasi lama jika ada
sudo apt remove -y docker docker-engine docker.io containerd runc

# 2. Tambahkan GPG key resmi Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# 3. Tambahkan Docker repository ke apt sources
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Install Docker Engine dan Docker Compose Plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. Aktifkan service Docker agar otomatis start saat VPS reboot
sudo systemctl enable --now docker
```

*(Catatan: Jika Anda menggunakan Debian, ganti URL GPG key dan repository dengan versi Debian).*

### 5. Izinkan Non-Root User Menggunakan Docker (Opsional)
Jika Anda login menggunakan user biasa (bukan root), tambahkan user tersebut ke grup docker:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 6. Verifikasi Instalasi Docker
Jalankan perintah ini untuk memastikan Docker dan Docker Compose telah terpasang dengan benar:
```bash
docker --version
docker compose version
```
*Output yang diharapkan:*
- `Docker version 24.x.x` (atau lebih baru)
- `Docker Compose version v2.x.x`

---

## C. Persiapan Project & Konfigurasi

### 1. Clone Project ke VPS
Unduh repository project ke direktori `/var/www/chisa` atau folder home user Anda:
```bash
# Contoh membuat direktori di home user
cd ~
git clone <URL_REPOSITORY_GIT_ANDA> CH1SA-Workspace
cd CH1SA-Workspace
```

### 2. Membuat File Environment Production (`.env`)
Di root direktori project, salin file template `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Buka file `.env` untuk diedit:
```bash
nano .env
```

### 3. Mengisi Variabel Environment
Sesuaikan variabel dengan konfigurasi sebenarnya:

```ini
# =================================================================
# 1. Database PostgreSQL
# =================================================================
POSTGRES_USER=chisa
# Buat password yang kuat dan acak:
POSTGRES_PASSWORD=generate_password_acak_disini
POSTGRES_DB=chisa

# =================================================================
# 2. Keamanan Backend & JWT
# =================================================================
# Generate secret 32-karakter acak dengan command: openssl rand -hex 32
JWT_SECRET=generate_jwt_secret_acak_disini
GIN_MODE=release
# Set 'true' jika ingin membuat user admin default saat deployment pertama
AUTO_SEED=true

# =================================================================
# 3. AI Assistant Integration (NineRouter / OpenRouter)
# =================================================================
NINEROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxx
NINEROUTER_BASE_URL=https://openrouter.ai/api/v1
NINEROUTER_MODEL=openai/gpt-4o-mini

# =================================================================
# 4. CORS & URL Frontend
# =================================================================
# Jika menggunakan IP VPS langsung tanpa domain:
CORS_ORIGINS=http://IP_VPS_ANDA:3000
NEXT_PUBLIC_API_URL=http://IP_VPS_ANDA:8080

# Jika menggunakan Domain / Nginx Reverse Proxy (Contoh):
# CORS_ORIGINS=https://app.domainanda.com,https://api.domainanda.com
# NEXT_PUBLIC_API_URL=https://api.domainanda.com (atau https://app.domainanda.com)

# =================================================================
# 5. Port Host (Opsional)
# =================================================================
FRONTEND_PORT=3000
BACKEND_PORT=8080
```

> **Tips Keamanan:** Untuk menghasilkan string password dan JWT secret acak yang kuat, jalankan di terminal:
> ```bash
> openssl rand -hex 24
> ```

### 4. Validasi Konfigurasi Compose
Sebelum melakukan build, periksa apakah syntax dan variabel Docker Compose sudah valid:
```bash
docker compose config
```
Jika tidak ada pesan error merah dan konfigurasi tercetak di terminal, berarti konfigurasi sudah 100% valid.

---

## D. Proses Deployment

Lakukan langkah-langkah deployment berikut secara berurutan:

### 1. Build dan Jalankan Container
Jalankan seluruh service dalam mode background (*detached*):
```bash
docker compose up -d --build
```
> **Catatan Proses:**
> - Docker akan mengunduh image `postgres:16-alpine`.
> - Docker akan melakukan kompilasi Go backend ke static binary Alpine.
> - Docker akan melakukan instalasi npm dan kompilasi Next.js Standalone.
> - Database migration akan otomatis dijalankan oleh entrypoint backend.
> - Jika `AUTO_SEED=true`, default data admin akan otomatis diisi ke database.

### 2. Memeriksa Status Seluruh Container
Pastikan ketiga container berada dalam status `Up (healthy)`:
```bash
docker compose ps
```
*Output yang diharapkan:*
```text
NAME             IMAGE                  COMMAND                  SERVICE    STATUS
chisa-backend    chisa-workspace-backend  "./docker-entrypoint…"   backend    Up (healthy)
chisa-frontend   chisa-workspace-frontend "node server.js"         frontend   Up (healthy)
chisa-postgres   postgres:16-alpine     "docker-entrypoint.s…"   postgres   Up (healthy)
```

### 3. Memeriksa Log Aplikasi
Untuk memastikan migrasi database berhasil dan server berjalan lancar:
```bash
# Melihat log gabungan seluruh service
docker compose logs -f

# Atau melihat log backend saja
docker compose logs -f backend

# Atau melihat log frontend saja
docker compose logs -f frontend
```
Tekan `Ctrl + C` untuk keluar dari tampilan log.

### 4. Verifikasi Akses Aplikasi
Lakukan pengujian HTTP langsung dari server:
```bash
# 1. Test Backend Health Check
curl -i http://localhost:8080/health
# Response yang diharapkan: HTTP/1.1 200 OK -> "OK"

# 2. Test Koneksi Backend ke Database PostgreSQL
curl -i http://localhost:8080/health/db
# Response yang diharapkan: HTTP/1.1 200 OK -> "Database is healthy"

# 3. Test Frontend Next.js
curl -I http://localhost:3000/
# Response yang diharapkan: HTTP/1.1 200 OK (atau 307 Redirect ke /login atau /dashboard)
```

Buka browser Anda dan akses:
- **Frontend App**: `http://IP_VPS_ANDA:3000`
- **Backend API**: `http://IP_VPS_ANDA:8080/health`

---

## E. Konfigurasi Domain dan HTTPS (SSL)

Untuk penggunaan production, sangat disarankan menggunakan domain resmi dan sertifikat SSL gratis dari Let's Encrypt.

### 1. Arahkan DNS A-Record
Buka dashboard DNS domain Anda (Cloudflare, Namecheap, Niagahoster, dll) dan buat DNS record:
- **Tipe**: `A`
- **Nama/Host**: `@` (atau subdomain misal `app`)
- **Target/Value**: `IP_VPS_ANDA`
- **TTL**: Auto / 300s

Jika ingin memisahkan domain backend:
- Buat record `api.domainanda.com` mengarah ke `IP_VPS_ANDA`.

---

### 2. Opsi A: Menggunakan Nginx di Host VPS (Metode Paling Mudah & Standar)
Metode ini memasang Nginx langsung di sistem operasi VPS dan mengelola SSL menggunakan `certbot`.

#### a. Install Nginx dan Certbot di VPS:
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

#### b. Buat Konfigurasi Virtual Host Nginx:
```bash
sudo nano /etc/nginx/sites-available/chisa
```
Tempelkan konfigurasi berikut (ganti `domainanda.com` dengan domain Anda):

```nginx
server {
    listen 80;
    server_name domainanda.com;

    client_max_body_size 25M;

    # Health check backend
    location = /health {
        proxy_pass http://127.0.0.1:8080/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Mendukung streaming respons AI
        proxy_buffering off;
        proxy_read_timeout 300s;
    }

    # Frontend Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### c. Aktifkan Konfigurasi & Reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/chisa /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

#### d. Pasang Sertifikat SSL Gratis dengan Certbot:
```bash
sudo certbot --nginx -d domainanda.com
```
Ikuti instruksi interaktif certbot. Certbot akan otomatis mengonfigurasi redirect HTTP ke HTTPS dan memperbarui file konfigurasi Nginx.

---

### 3. Opsi B: Menggunakan Nginx Docker Container (Profil `proxy`)
Jika Anda lebih memilih Nginx berjalan di dalam container Docker:
1. File konfigurasi sudah tersedia di `deploy/nginx/nginx.conf`.
2. Jalankan container dengan menyertakan flag `--profile proxy`:
   ```bash
   docker compose --profile proxy up -d
   ```

---

## F. Maintenance dan Update Aplikasi

### 1. Memeriksa Penggunaan Resource (RAM & CPU)
```bash
docker stats --no-stream
```

### 2. Menghentikan dan Menjalankan Kembali Aplikasi
```bash
# Menghentikan container (data database tetap aman di volume)
docker compose stop

# Menjalankan kembali container
docker compose start

# Mematikan dan menghapus container (volume database TIDAK terhapus)
docker compose down
```

### 3. Update Aplikasi setelah Perubahan Kode Git
Ketika Anda melakukan push perubahan kode ke GitHub/GitLab, jalankan langkah berikut di VPS:
```bash
cd ~/CH1SA-Workspace

# 1. Tarik pembaruan kode terbaru
git pull origin main

# 2. Rebuild dan restart container tanpa downtime database
docker compose up -d --build

# 3. Bersihkan sisa image build lama untuk menghemat kapasitas disk
docker image prune -f
```

---

## G. Backup dan Restore Database

Data database PostgreSQL disimpan secara persisten di Docker Named Volume `chisa_postgres_data`. Data ini **tidak akan hilang** meskipun container dihentikan, dihapus, atau di-rebuild.

### 1. Membuat Backup Database
Jalankan perintah berikut untuk mengekspor database ke file `.sql.gz` berstempel waktu:
```bash
# Buat folder khusus backup jika belum ada
mkdir -p ~/backups

# Ekspor database ke file terkompresi
docker compose exec -T postgres pg_dump -U chisa chisa | gzip > ~/backups/chisa_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Verifikasi file backup berhasil dibuat
ls -lh ~/backups
```

### 2. Mengatur Backup Otomatis (Cron Job Harian)
Untuk menjalankan backup setiap hari pukul 02:00 pagi:
```bash
crontab -e
```
Tambahkan baris berikut di akhir file:
```cron
0 2 * * * cd /home/ubuntu/CH1SA-Workspace && docker compose exec -T postgres pg_dump -U chisa chisa | gzip > /home/ubuntu/backups/chisa_backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz && find /home/ubuntu/backups -name "*.sql.gz" -mtime +14 -delete
```
*(Cron job di atas juga otomatis menghapus file backup yang berusia lebih dari 14 hari).*

### 3. Restore Database dari File Backup
Jika terjadi kendala data dan ingin mengembalikan database dari file backup:
```bash
# Ganti nama file dengan nama file backup yang ingin di-restore
gunzip -c ~/backups/chisa_backup_20261106_120000.sql.gz | docker compose exec -T postgres psql -U chisa -d chisa
```

---

## H. Troubleshooting & Solusi Masalah

### 1. Error: `bind: address already in use` (Port Konflik)
- **Penyebab**: Port `3000`, `8080`, atau `80` sudah digunakan oleh proses lain di VPS.
- **Pemeriksaan**:
  ```bash
  sudo lsof -i :8080
  sudo lsof -i :3000
  ```
- **Solusi**: Matikan proses lama atau ubah port host pada file `.env`:
  ```ini
  BACKEND_PORT=8081
  FRONTEND_PORT=3001
  ```
  Kemudian jalankan ulang `docker compose up -d`.

---

### 2. Error: `NINEROUTER_API_KEY environment variable is required`
- **Penyebab**: Variabel `NINEROUTER_API_KEY` belum diisi atau bernilai kosong di file `.env`.
- **Solusi**: Buka `.env` dan isi key NineRouter / OpenRouter yang valid, lalu restart backend:
  ```bash
  docker compose up -d backend
  ```

---

### 3. Error: Database `connection refused` atau `Failed to initialize database`
- **Penyebab**: Backend mencoba connect sebelum PostgreSQL siap melayani koneksi.
- **Solusi**: Di `docker-compose.yml`, backend sudah diproteksi dengan `condition: service_healthy` pada service postgres. Periksa log PostgreSQL untuk melihat kendala autentikasi:
  ```bash
  docker compose logs postgres
  ```
  Pastikan `POSTGRES_USER` dan `POSTGRES_PASSWORD` di `.env` sudah sama.

---

### 4. Build Next.js Gagal: `Out of Memory` atau `Killed`
- **Penyebab**: RAM VPS habis saat webpack/swc melakukan bundling Next.js.
- **Solusi**: Pastikan Swap Memory sudah aktif seperti pada [Langkah B.3](#3-konfigurasi-swap-memory-sangat-direkomendasikan). Cek dengan `free -m`.

---

### 5. Aplikasi Tidak Bisa Diakses dari Browser Luar
- **Penyebab**: Firewall UFW di VPS atau Security Group di dashboard cloud provider (AWS EC2 / DigitalOcean / Linode / GCP) memblokir port masuk.
- **Solusi**:
  ```bash
  # Periksa status firewall UFW
  sudo ufw status

  # Buka port yang diperlukan
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw allow 3000/tcp
  sudo ufw allow 8080/tcp
  sudo ufw enable
  ```
  *(Juga pastikan Inbound Rules pada dashboard cloud provider mengizinkan port tersebut).*

---

### 6. Error Permission Denied pada `docker-entrypoint.sh`
- **Penyebab**: File bash script tidak memiliki flag executable.
- **Solusi**:
  ```bash
  chmod +x backend/docker-entrypoint.sh
  docker compose build --no-cache backend
  docker compose up -d backend
  ```

---

## I. Production Security Checklist

Sebelum membuka aplikasi untuk pengguna umum, verifikasi checklist keamanan berikut:

- [ ] **Firewall UFW Aktif**: Hanya membuka port `22` (SSH), `80` (HTTP), dan `443` (HTTPS).
- [ ] **Port Database Terisolasi**: Port `5432` PostgreSQL **TIDAK** dibuka ke publik dan hanya dapat diakses antar-container melalui Docker Network.
- [ ] **SSH Hardening**: Menggunakan autentikasi SSH Key dan menonaktifkan login password root jika memungkinkan.
- [ ] **Kerahasiaan File `.env`**: File `.env` tidak pernah di-commit ke Git (sudah masuk di `.gitignore` dan `.dockerignore`).
- [ ] **Password Kuat**: `POSTGRES_PASSWORD` dan `JWT_SECRET` diganti menggunakan string acak berkeamanan tinggi minimal 32 karakter.
- [ ] **Non-Root User Container**: Container Backend berjalan sebagai `appuser` (UID 10001) dan Frontend berjalan sebagai `nextjs` (UID 1001).
- [ ] **HTTPS / SSL Aktif**: Domain menggunakan sertifikat SSL Let's Encrypt yang valid.
- [ ] **Graceful Shutdown**: Server Go menangani sinyal `SIGTERM` secara graceful sehingga koneksi database ditutup dengan aman saat container di-restart.
- [ ] **Persistent Backup**: Script backup database otomatis sudah terpasang di cron job.

---

## J. Command Cheat Sheet

| Kebutuhan | Perintah Terminal |
| :--- | :--- |
| **Menjalankan & Build Seluruh Service** | `docker compose up -d --build` |
| **Melihat Status Container** | `docker compose ps` |
| **Melihat Log Realtime Semua Service** | `docker compose logs -f` |
| **Melihat Log Backend API** | `docker compose logs -f backend` |
| **Melihat Log Frontend Next.js** | `docker compose logs -f frontend` |
| **Melihat Log Database PostgreSQL** | `docker compose logs -f postgres` |
| **Restart Salah Satu Service** | `docker compose restart backend` |
| **Menghentikan Seluruh Aplikasi** | `docker compose down` |
| **Masuk ke Terminal Container Backend** | `docker compose exec backend sh` |
| **Masuk ke Shell PostgreSQL Database** | `docker compose exec postgres psql -U chisa -d chisa` |
| **Menjalankan Database Migration Manual** | `docker compose exec backend ./migrate up` |
| **Menjalankan Database Seeder Manual** | `docker compose exec backend ./seed` |
| **Monitor Penggunaan Resource (RAM/CPU)** | `docker stats` |
| **Membersihkan Image Build Usang** | `docker image prune -f` |
| **Backup Database Cepat** | `docker compose exec -T postgres pg_dump -U chisa chisa > backup.sql` |

