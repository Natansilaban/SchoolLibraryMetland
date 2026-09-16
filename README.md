# 📚 School Library Management System (Metland Library)

> **Disclaimer**: This project and its documentation are intended for **educational and testing purposes only**.

A modern web-based School Library Management System designed to digitize and streamline library operations—from book cataloging, circulation workflows, automated overdue fines calculation, to an interactive student portal for browsing books and requesting loans independently.

Built with modern web technologies: **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS**, **Prisma ORM 7**, and **PostgreSQL**.

---

## ✨ Key Features

### 👨‍💼 Administrator & Librarian Portal
* **Interactive Statistics Dashboard**: Real-time overview of total book titles, registered members, active loans, overdue returns, and circulation analytics charts powered by **Recharts**.
* **Comprehensive Catalog Management**:
  * Book management (title, ISBN, category, author, publisher, publication year, inventory stock, and book cover file uploads).
  * Master data management for **Categories**, **Authors**, and **Publishers**.
* **Circulation & Transactions**:
  * Review and approve/reject online book loan requests submitted by students.
  * Book return processing with **automated overdue fine calculation**.
* **Member Management**: Student membership directory and records (Student ID/NIS, name, class, contact information).
* **Library Reports**: Comprehensive history and reporting for book loans and circulation activities.

### 👨‍🎓 Student Portal
* **Interactive Digital Catalog**: Browse school book collections with real-time search and category filtering.
* **Modern 3D Book Cards**: Engaging and interactive visual presentation of book covers.
* **Online Loan Requests**: Students can request book loans directly from the web portal without queuing.
* **Dashboard & Loan History**: Track loan request statuses (*Pending Confirmation*, *Borrowed*, *Returned*, or *Overdue*) along with detailed fine breakdowns if applicable.
* **Student Profile**: Manage personal contact details and view library membership information.

### 🛡️ Security & Interface
* **Role-Based Access Control (RBAC)**: Secure access separation between `ADMIN` and `SISWA` (Student) roles powered by **NextAuth.js**.
* **Password Encryption**: Industry-standard password hashing using **bcryptjs**.
* **Modern UI & Responsive Design**:
  * Clean, elegant glassmorphism aesthetic built with Tailwind CSS.
  * Mobile-friendly touch layouts (adaptive 2x2 form grid).
  * Custom Toast notification popups and interactive confirmation modal dialogs (eliminating disruptive native browser alerts).

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Components & Server Actions) |
| **User Interface** | [React 19](https://react.dev/) & [Tailwind CSS](https://tailwindcss.com/) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) & [Prisma ORM 7](https://www.prisma.io/) |
| **Authentication** | [NextAuth.js](https://next-auth.js.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Data Visualization** | [Recharts](https://recharts.org/) |
| **Containerization** | [Docker](https://www.docker.com/) (Multi-stage build, Node 22 Alpine) |

---

## 📁 Directory Structure

```plaintext
SchoolLibraryMetland/
├── prisma/
│   ├── schema.prisma       # Relational database schema (PostgreSQL)
│   └── seed.js             # Initial database seed (Admin, Student, Categories, Sample books)
├── public/
│   └── uploads/            # Directory for uploaded book cover images
├── src/
│   ├── app/
│   │   ├── admin/          # Admin portal routes & pages
│   │   │   ├── anggota/    # Member / student management
│   │   │   ├── buku/       # Book catalog & cover upload
│   │   │   ├── dashboard/  # Analytics dashboard & metrics
│   │   │   ├── kategori/   # Category management
│   │   │   ├── laporan/    # Circulation reports
│   │   │   ├── peminjaman/ # Loan requests verification
│   │   │   └── pengembalian/ # Book return & fine calculation
│   │   ├── siswa/          # Student portal routes & pages
│   │   │   ├── buku/       # Book search & loan request
│   │   │   ├── dashboard/  # Student dashboard & history
│   │   │   ├── peminjaman/ # Active loan tracking
│   │   │   └── profil/     # Student profile
│   │   ├── api/            # API Route handlers & NextAuth endpoints
│   │   ├── login/          # Authentication login page
│   │   └── register/       # Student registration page
│   ├── components/         # Reusable UI components (Navbar, Sidebar, Toast, Modal, etc.)
│   └── lib/                # Database client (Prisma) & NextAuth configuration
├── .dockerignore
├── .env.example            # Environment variables template
├── Dockerfile              # Multi-stage production container build
├── docker-compose.yml      # Orchestration template (App + Database)
└── package.json
```

---

## 💻 Local Installation Tutorial

> [!NOTE]
> This tutorial, the local setup guide, and default seed credentials are provided for **education and testing purposes only**.

Follow the steps below to run the application locally in your development environment.

### 1. System Prerequisites
Ensure your system has the following installed:
* **Node.js**: Version `>= 20.x` (Node.js 22 LTS recommended)
* **npm**: Version `>= 10.x`
* **PostgreSQL**: A running local or remote PostgreSQL database instance (e.g., local PostgreSQL service, Docker container, Supabase, or Neon)
* **Git**

---

### 2. Clone Repository
Clone the repository to your local machine:
```bash
git clone https://github.com/Natansilaban/SchoolLibraryMetland.git
cd SchoolLibraryMetland
```

---

### 3. Install Dependencies
Install all required package dependencies:
```bash
npm install
```

---

### 4. Configure Environment Variables (`.env`)
Create your `.env` file by copying the template:
```bash
cp .env.example .env
```
Open `.env` in your editor and configure your database and authentication settings:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/school_library?schema=public"

# Canonical application URL
NEXTAUTH_URL="http://localhost:3000"

# NextAuth session encryption secret (minimum 32 characters)
# Generate a secure string using: openssl rand -base64 32
NEXTAUTH_SECRET="your_random_secret_string_min_32_characters"
```

> **Database Setup**: Ensure a database named `school_library` (or your chosen database name) has been created in your PostgreSQL server.

---

### 5. Database Setup & Seeding
Run the following commands to initialize the schema and populate initial test data (categories, authors, publishers, sample books, and default accounts):

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Push schema to PostgreSQL database
npx prisma db push

# 3. Seed initial data
node prisma/seed.js
```

---

### 6. Run the Development Server
Start the Next.js local development server:
```bash
npm run dev
```

Open your browser and navigate to:
👉 **`http://localhost:3000`**

---

### 🔑 Default Credentials (Education & Testing Only)

After running `node prisma/seed.js`, you can sign in using these default test accounts:

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@metland.sch.id` | `admin123` | Full access to admin dashboard, catalog management, member records, and circulation |
| **Student (Sample)** | `siswa@metland.sch.id` | `siswa123` | Student portal access, book loan requests, and loan history tracking |

> Student and staff accounts are created and managed directly by Administrators via the Admin Dashboard (`/admin/anggota`).

---

## 🚀 Deployment Tutorial (Production)

> [!IMPORTANT]
> The deployment guides and sample configurations below are provided for **education, testing, and staging purposes only**. Ensure you change all default passwords, secrets, and database credentials before deploying to any production environment.

---

### Option 1: Docker Compose (Recommended)

This method deploys both the Next.js application and an isolated PostgreSQL database container together.

1. **Clone the repository on your server:**
   ```bash
   git clone https://github.com/Natansilaban/SchoolLibraryMetland.git
   cd SchoolLibraryMetland
   ```

2. **Configure `docker-compose.yml`:**
   Ensure `NEXTAUTH_URL` points to your public domain (e.g., `https://perpus.sekolah.sch.id`) and generate a secure random string for `NEXTAUTH_SECRET`:
   ```yaml
   environment:
     - NODE_ENV=production
     - DATABASE_URL=postgresql://perpus_user:perpus_password@db:5432/school_library?schema=public
     - NEXTAUTH_URL=https://perpus.sekolah.sch.id
     - NEXTAUTH_SECRET=generate_a_secure_random_key_using_openssl
     - AUTH_TRUST_HOST=true
   ```

3. **Start the containers:**
   ```bash
   docker compose up -d --build
   ```

4. **Initialize Database inside the container:**
   ```bash
   # Push schema to database
   docker compose exec app npx prisma db push

   # Seed initial data
   docker compose exec app node prisma/seed.js
   ```

The application is now running and reachable on port `3000`.

---

### Option 2: Standalone Docker Run (ZimaOS / CasaOS / Existing Database)

If you are using an external PostgreSQL server or running on a home server OS (ZimaOS / CasaOS):

1. **Build Docker image:**
   ```bash
   docker build -t perpus-app:latest .
   ```

2. **Run container with a persistent volume for uploaded covers:**
   ```bash
   docker run -d \
     --name perpus-app \
     --restart always \
     -p 3000:3000 \
     -e NODE_ENV=production \
     -e DATABASE_URL="postgresql://user:password@DB_HOST:5432/school_library?schema=public" \
     -e NEXTAUTH_URL="https://perpus.sekolah.sch.id" \
     -e NEXTAUTH_SECRET="your_secure_secret" \
     -e AUTH_TRUST_HOST="true" \
     -v perpus_uploads:/app/public/uploads \
     perpus-app:latest
   ```

3. **Initialize schema:**
   ```bash
   docker exec -it perpus-app npx prisma db push
   docker exec -it perpus-app node prisma/seed.js
   ```

> **Persistent Uploads & Permissions**: The container automatically manages permissions for `/app/public/uploads` on boot using `su-exec`. If you ever encounter an `EACCES: permission denied` error on a manually mounted host volume, run:
> ```bash
> docker exec -u 0 -it <container_name> chown -R 1001:1001 /app/public/uploads
> ```

---

### Option 3: VPS Deployment without Docker (Node.js & PM2)

1. **Ensure Node.js 22 LTS, PostgreSQL, and PM2 are installed:**
   ```bash
   sudo npm install -g pm2
   ```

2. **Clone & install dependencies:**
   ```bash
   git clone https://github.com/Natansilaban/SchoolLibraryMetland.git
   cd SchoolLibraryMetland
   npm ci
   cp .env.example .env
   nano .env # Configure your production environment variables
   ```

3. **Database initialization & application build:**
   ```bash
   npx prisma generate
   npx prisma db push
   node prisma/seed.js
   npm run build
   ```

4. **Start and manage with PM2:**
   ```bash
   pm2 start npm --name "school-library" -- start
   pm2 save
   pm2 startup
   ```

---

## 🌐 Reverse Proxy & Domain Configuration

When deploying behind **Nginx** or **Cloudflare Tunnel**:

### Nginx Reverse Proxy
Add the following server block configuration:

```nginx
server {
    listen 80;
    server_name perpus.sekolah.sch.id;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name perpus.sekolah.sch.id;

    ssl_certificate /etc/letsencrypt/live/perpus.sekolah.sch.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/perpus.sekolah.sch.id/privkey.pem;

    # Maximum file upload size for book covers
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

### Cloudflare Zero Trust Tunnel
If routing traffic through Cloudflare Tunnel:
* **Service Type**: `HTTP`
* **URL**: `localhost:3000` (or `CONTAINER_IP:3000`)
* Set environment variables in your app container:
  ```env
  NEXTAUTH_URL=https://perpus.sekolah.sch.id
  AUTH_TRUST_HOST=true
  ```

---

## 🔧 Maintenance & Handy Commands

* **Launch Prisma Studio Database GUI**:
  ```bash
  npx prisma studio
  ```
  *(Access via web browser at `http://localhost:5555`)*

* **Update Database Schema**:
  After modifying `prisma/schema.prisma`:
  ```bash
  npx prisma generate
  npx prisma db push
  ```

* **Inspect Docker Logs**:
  ```bash
  docker logs -f school-library-app
  ```

---

## 📄 License & Proprietary Notice

**Copyright © SMK Metland. All Rights Reserved.**

This software and its source code are proprietary and confidential to **SMK Metland**. Exclusively developed for Metland School internal library operations. Unauthorized copying, distribution, modification, public display, or commercial use of this codebase, via any medium, is strictly prohibited without explicit written permission from SMK Metland.
