# 📚 School Library Management System (Metland Library)

Sistem Informasi Manajemen Perpustakaan Sekolah modern berbasis web yang dirancang untuk mendigitalkan dan mengoptimalkan seluruh operasional perpustakaan sekolah—mulai dari katalogisasi buku, manajemen sirkulasi peminjaman, pelacakan denda keterlambatan, hingga portal interaktif bagi siswa untuk mencari dan mengajukan pinjaman buku secara mandiri.

Dibangun dengan teknologi modern **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS**, **Prisma ORM 7**, dan **PostgreSQL**.

---

## ✨ Fitur Unggulan

### 👨‍💼 Portal Administrator & Pustakawan
* **Dashboard Statistik Interaktif**: Ringkasan total judul buku, anggota terdaftar, peminjaman aktif, keterlambatan, serta grafik analitik sirkulasi berbasis **Recharts**.
* **Manajemen Katalog Lengkap**:
  * Pengelolaan data **Buku** (judul, nomor ISBN, kategori, penulis, penerbit, tahun terbit, stok, serta upload file cover buku).
  * Manajemen master data **Kategori**, **Penulis**, dan **Penerbit**.
* **Sirkulasi & Transaksi**:
  * Verifikasi & persetujuan pengajuan peminjaman online dari siswa.
  * Pencatatan pengembalian buku dengan kalkulasi **denda keterlambatan otomatis**.
* **Manajemen Data Anggota**: Pendataan profil siswa (NIS, nama, kelas, kontak).
* **Laporan Perpustakaan**: Riwayat sirkulasi dan aktivitas peminjaman buku.

### 👨‍🎓 Portal Siswa
* **Katalog Digital Interaktif**: Eksplorasi koleksi buku dengan pencarian instan dan filter kategori.
* **Tampilan Modern 3D Book Cover**: Tampilan visual buku yang menarik dan interaktif.
* **Pengajuan Pinjaman Online**: Siswa dapat mengajukan peminjaman buku langsung melalui portal tanpa antre.
* **Dashboard Riwayat & Status Peminjaman**: Memantau status pengajuan (*Menunggu Konfirmasi*, *Dipinjam*, *Dikembalikan*, atau *Terlambat*) beserta rincian denda jika ada.
* **Profil Siswa**: Manajemen data diri dan informasi keanggotaan.

### 🛡️ Keamanan & Antarmuka
* **Role-Based Access Control (RBAC)**: Pemisahan hak akses antara akun `ADMIN` dan `SISWA` melalui **NextAuth.js**.
* **Enkripsi Password**: Pengamanan kredensial menggunakan algoritma hashing **bcryptjs**.
* **Modern UI & Responsive Design**:
  * Tampilan bersih berkonsep glassmorphism dengan Tailwind CSS.
  * Form input ramah layar sentuh / mobile (*grid 2x2*).
  * Sistem notifikasi kustom (*Toast popup notification*) dan dialog modal interaktif menggantikan alert bawaan browser.

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
| :--- | :--- |
| **Framework Utama** | [Next.js 16](https://nextjs.org/) (App Router, Server Components & Server Actions) |
| **User Interface** | [React 19](https://react.dev/) & [Tailwind CSS](https://tailwindcss.com/) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) & [Prisma ORM 7](https://www.prisma.io/) |
| **Autentikasi** | [NextAuth.js](https://next-auth.js.org/) |
| **Komponen & Ikon** | [Lucide React](https://lucide.dev/) |
| **Grafik & Visualisasi** | [Recharts](https://recharts.org/) |
| **Kontainerisasi** | [Docker](https://www.docker.com/) (Multi-stage build, Node 22 Alpine) |

---

## 📁 Struktur Direktori Proyek

```plaintext
SchoolLibraryMetland/
├── prisma/
│   ├── schema.prisma       # Skema database relasional (PostgreSQL)
│   └── seed.js             # Skrip data awal (Admin, Siswa, Kategori, Buku dummy)
├── public/
│   └── uploads/            # Direktori penyimpanan file cover buku yang diunggah
├── src/
│   ├── app/
│   │   ├── admin/          # Halaman & fitur portal Administrator
│   │   │   ├── anggota/    # Manajemen data anggota perpustakaan
│   │   │   ├── buku/       # Katalog & penambahan buku + upload cover
│   │   │   ├── dashboard/  # Dashboard metrik & statistik
│   │   │   ├── kategori/   # Manajemen kategori buku
│   │   │   ├── laporan/    # Laporan sirkulasi
│   │   │   ├── peminjaman/ # Verifikasi transaksi peminjaman
│   │   │   └── pengembalian/ # Proses pengembalian & hitung denda
│   │   ├── siswa/          # Halaman & fitur portal Siswa
│   │   │   ├── buku/       # Pencarian buku & pengajuan pinjam
│   │   │   ├── dashboard/  # Dashboard & riwayat siswa
│   │   │   ├── peminjaman/ # Status pinjaman aktif
│   │   │   └── profil/     # Profil siswa
│   │   ├── api/            # API Route handlers & NextAuth endpoint
│   │   ├── login/          # Halaman login
│   │   └── register/       # Halaman registrasi akun siswa
│   ├── components/         # Komponen UI (Navbar, Sidebar, Toast, Modal, dsb.)
│   └── lib/                # Konfigurasi Prisma client & NextAuth
├── .dockerignore
├── .env.example            # Template variabel lingkungan
├── Dockerfile              # Multi-stage production build container
├── docker-compose.yml      # Template orkestrasi aplikasi + database
└── package.json
```

---

## 💻 Panduan Instalasi Lokal (Local Development)

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di komputer lokal.

### 1. Prasyarat Sistem
Pastikan perangkat Anda telah terpasang:
* **Node.js**: Versi `>= 20.x` (disarankan Node.js 22 LTS)
* **npm**: Versi `>= 10.x`
* **PostgreSQL**: Server PostgreSQL aktif lokal atau cloud (misalnya Supabase, Neon, atau Docker PostgreSQL)
* **Git**

---

### 2. Clone Repository
Buka terminal dan unduh repositori:
```bash
git clone https://github.com/Natansilaban/SchoolLibraryMetland.git
cd SchoolLibraryMetland
```

---

### 3. Instalasi Dependensi
Install seluruh paket dependensi yang dibutuhkan:
```bash
npm install
```

---

### 4. Konfigurasi File Environment (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Buka file `.env` dengan text editor Anda dan sesuaikan isinya:

```env
# URL koneksi ke database PostgreSQL
DATABASE_URL="postgresql://postgres:password_anda@localhost:5432/school_library?schema=public"

# URL lokal aplikasi
NEXTAUTH_URL="http://localhost:3000"

# Kunci rahasia session NextAuth (minimal 32 karakter)
# Buat string acak dengan perintah: openssl rand -base64 32
NEXTAUTH_SECRET="kunci_rahasia_acak_minimal_32_karakter_bebas_diisi"
```

> **Catatan Database**: Pastikan database bernama `school_library` (atau nama lain yang Anda tentukan) sudah dibuat di PostgreSQL Anda.

---

### 5. Setup Database & Seeding Data Awal
Jalankan perintah berikut untuk membuat tabel database dan mengisi data awal (akun default, kategori, penulis, dan buku contoh):

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Sinkronkan skema ke database PostgreSQL
npx prisma db push

# 3. Jalankan seeding data awal
node prisma/seed.js
```

---

### 6. Jalankan Development Server
Mulai server development Next.js:
```bash
npm run dev
```

Buka browser Anda dan akses:
👉 **`http://localhost:3000`**

---

### 🔑 Akun Default untuk Pengujian

Setelah menjalankan `node prisma/seed.js`, Anda dapat login menggunakan akun berikut:

| Peran (Role) | Email | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@metland.sch.id` | `admin123` | Akses penuh dashboard admin, kelola buku, anggota, dan sirkulasi |
| **Siswa (Contoh)** | `siswa@metland.sch.id` | `siswa123` | Akses portal siswa, pinjam buku, dan melihat riwayat pinjaman |

> Anda juga dapat mendaftarkan akun siswa baru melalui halaman `/register`.

---

## 🚀 Panduan Deployment ke Server (Production)

Berikut adalah beberapa pilihan metode deployment ke server produksi (VPS Ubuntu/Debian, ZimaOS, CasaOS, dll).

---

### Metode 1: Menggunakan Docker Compose (Paling Direkomendasikan)

Metode ini otomatis menyiapkan container aplikasi Next.js sekaligus container database PostgreSQL secara terisolasi.

1. **Clone repositori di server Anda:**
   ```bash
   git clone https://github.com/Natansilaban/SchoolLibraryMetland.git
   cd SchoolLibraryMetland
   ```

2. **Periksa & Sesuaikan `docker-compose.yml`:**
   Pastikan variabel `NEXTAUTH_URL` diarahkan ke domain publik Anda (misal `https://perpus.sekolah.sch.id`) dan ganti `NEXTAUTH_SECRET` dengan string acak:
   ```yaml
   environment:
     - NODE_ENV=production
     - DATABASE_URL=postgresql://perpus_user:perpus_password@db:5432/school_library?schema=public
     - NEXTAUTH_URL=https://perpus.sekolah.sch.id
     - NEXTAUTH_SECRET=rahasia_super_aman_minimal_32_karakter
     - AUTH_TRUST_HOST=true
   ```

3. **Jalankan container:**
   ```bash
   docker compose up -d --build
   ```

4. **Inisialisasi Database (Push Schema & Seed) di dalam container:**
   ```bash
   # Sinkronisasi tabel
   docker compose exec app npx prisma db push

   # Seed data awal
   docker compose exec app node prisma/seed.js
   ```

Aplikasi kini aktif dan berjalan di port `3000`.

---

### Metode 2: Standalone Docker Run (Cocok untuk ZimaOS / CasaOS)

Jika Anda sudah memiliki database PostgreSQL yang berjalan terpisah di host / server Anda:

1. **Build Docker image:**
   ```bash
   docker build -t perpus-app:latest .
   ```

2. **Jalankan container dengan persistent volume untuk folder upload:**
   ```bash
   docker run -d \
     --name perpus-app \
     --restart always \
     -p 3000:3000 \
     -e NODE_ENV=production \
     -e DATABASE_URL="postgresql://user:password@IP_DATABASE:5432/school_library?schema=public" \
     -e NEXTAUTH_URL="https://perpus.sekolah.sch.id" \
     -e NEXTAUTH_SECRET="kunci_rahasia_anda" \
     -e AUTH_TRUST_HOST="true" \
     -v perpus_uploads:/app/public/uploads \
     perpus-app:latest
   ```

3. **Jalankan migrasi skema:**
   ```bash
   docker exec -it perpus-app npx prisma db push
   docker exec -it perpus-app node prisma/seed.js
   ```

> **Penting untuk Upload Cover Buku**: Penambahan parameter `-v perpus_uploads:/app/public/uploads` memastikan file gambar cover buku yang diunggah tidak hilang saat container diperbarui atau di-restart.

---

### Metode 3: VPS Standar Tanpa Docker (Node.js & PM2)

1. **Pastikan Node.js 22 LTS, PostgreSQL, dan PM2 terpasang:**
   ```bash
   sudo npm install -g pm2
   ```

2. **Setup repositori & environment:**
   ```bash
   git clone https://github.com/Natansilaban/SchoolLibraryMetland.git
   cd SchoolLibraryMetland
   npm ci
   cp .env.example .env
   # Edit .env dengan kredensial produksi Anda
   nano .env
   ```

3. **Migrasi Database & Build Aplikasi:**
   ```bash
   npx prisma generate
   npx prisma db push
   node prisma/seed.js
   npm run build
   ```

4. **Jalankan aplikasi dengan PM2:**
   ```bash
   pm2 start npm --name "school-library" -- start
   pm2 save
   pm2 startup
   ```

---

## 🌐 Konfigurasi Reverse Proxy & Domain Publik

Jika Anda menggunakan domain dan reverse proxy seperti **Nginx** atau **Cloudflare Tunnel**:

### Pengaturan Nginx Reverse Proxy
Tambahkan blok konfigurasi Nginx berikut:

```nginx
server {
    listen 80;
    server_name perpus.sekolah.sch.id;

    # Redirect ke HTTPS (opsional jika menggunakan SSL certbot)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name perpus.sekolah.sch.id;

    ssl_certificate /etc/letsencrypt/live/perpus.sekolah.sch.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/perpus.sekolah.sch.id/privkey.pem;

    # Ukuran maksimal upload file (cover buku)
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Pengaturan Cloudflare Tunnel
Jika menggunakan Cloudflare Zero Trust Tunnel:
* **Service Type**: `HTTP`
* **URL**: `localhost:3000` atau `IP_SERVER:3000`
* Pastikan di environment container/server diset:
  ```env
  NEXTAUTH_URL=https://perpus.sekolah.sch.id
  AUTH_TRUST_HOST=true
  ```

---

## 🔧 Perintah Pemeliharaan (Maintenance)

* **Melihat & Mengedit Database via GUI (Prisma Studio)**:
  ```bash
  npx prisma studio
  ```
  *(Akses via browser di `http://localhost:5555`)*

* **Memperbarui Skema Database**:
  Setelah mengubah file `prisma/schema.prisma`:
  ```bash
  npx prisma generate
  npx prisma db push
  ```

* **Melihat Log Container Docker**:
  ```bash
  docker logs -f school-library-app
  ```

---

## 📄 Lisensi
Proyek ini dibuat untuk keperluan manajemen perpustakaan sekolah SMK Metland. Bebas digunakan dan dikembangkan untuk institusi pendidikan.
