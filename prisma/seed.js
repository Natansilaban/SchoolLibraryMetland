const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Prioritize .env.local if present, consistent with Next.js environment resolution
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
dotenv.config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Memulai proses seeding data Perpustakaan SMK Pariwisata Metland...');

  // 1. Seed Akun Petugas & Siswa
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@metland.sch.id' },
    update: {},
    create: {
      email: 'admin@metland.sch.id',
      password: adminHash,
      role: 'ADMIN',
    },
  });
  console.log('✅ Akun Admin/Petugas siap:', admin.email);

  const siswaHash = await bcrypt.hash('siswa123', 10);
  const siswa = await prisma.user.upsert({
    where: { email: 'siswa@metland.sch.id' },
    update: {},
    create: {
      email: 'siswa@metland.sch.id',
      password: siswaHash,
      role: 'SISWA',
      anggota: {
        create: {
          nama: 'Budi Pratama',
          nis: '2024001',
          kelas: 'X Perhotelan 1',
          alamat: 'Jl. Raya Metland Transyogi No. 12, Bogor',
          noHp: '081234567890',
        },
      },
    },
  });
  console.log('✅ Akun Siswa siap:', siswa.email);

  // 2. Seed Kategori Koleksi (Relevan untuk SMK Pariwisata & Umum)
  const categoriesData = [
    { nama: 'Kuliner & Tata Boga', deskripsi: 'Teknik memasak, manajemen dapur, pastry and bakery, serta higienitas sanitasi makanan.' },
    { nama: 'Perhotelan & Pariwisata', deskripsi: 'Operasional kantor depan, tata graha, layanan makanan dan minuman, serta manajemen destinasi wisata.' },
    { nama: 'Teknologi Informasi & Komputer', deskripsi: 'Dasar pemrograman, rekayasa perangkat lunak, kecerdasan buatan, dan jaringan komputer.' },
    { nama: 'Bisnis & Kewirausahaan', deskripsi: 'Pemasaran digital, manajemen keuangan usaha, kepemimpinan, dan etika bisnis.' },
    { nama: 'Sastra & Fiksi', deskripsi: 'Novel sastra Indonesia klasik dan kontemporer, antologi cerpen, dan karya fiksi pilihan.' },
    { nama: 'Sains Alam & Matematika', deskripsi: 'Fisika terapan, kimia pangan, biologi lingkungan, dan logika matematika.' },
    { nama: 'Sejarah & Sosial Budaya', deskripsi: 'Sejarah peradaban Nusantara, dinamika sosial masyarakat, dan kebudayaan daerah.' },
    { nama: 'Bahasa & Komunikasi', deskripsi: 'Tata bahasa Indonesia, korespondensi bisnis, bahasa Inggris pariwisata, dan percakapan bahasa asing.' },
  ];

  const categoryMap = {};
  for (const c of categoriesData) {
    const record = await prisma.kategori.upsert({
      where: { nama: c.nama },
      update: { deskripsi: c.deskripsi },
      create: c,
    });
    categoryMap[c.nama] = record.id;
  }
  console.log('✅ Kategori terdaftar:', Object.keys(categoryMap).length);

  // 3. Seed Penulis
  const authorsData = [
    { nama: 'Pramoedya Ananta Toer', bio: 'Sastrawan terkemuka Indonesia, penulis Tetralogi Buru.' },
    { nama: 'Andrea Hirata', bio: 'Novelis Indonesia, penulis fenomena internasional Laskar Pelangi.' },
    { nama: 'Tere Liye', bio: 'Penulis produktif fiksi dan nilai kehidupan Indonesia.' },
    { nama: 'Dewi Lestari', bio: 'Penulis seri fiksi ilmiah dan fantasi Supernova.' },
    { nama: 'Eka Kurniawan', bio: 'Novelis kontemporer peraih nominasi Man Booker International Prize.' },
    { nama: 'Chef William Wongso', bio: 'Pakar kuliner legendaris Indonesia dan duta kuliner tradisional.' },
    { nama: 'Bambang Hermanto', bio: 'Praktisi industri perhotelan internasional dan pengajar hospitality management.' },
    { nama: 'Sandhika Galih', bio: 'Pendidik teknologi dan pengembang web di komunitas programmer Indonesia.' },
    { nama: 'Prof. Dr. B.J. Habibie', bio: 'Insinyur kedirgantaraan dunia dan Presiden ke-3 Republik Indonesia.' },
    { nama: 'Philip Kotler', bio: 'Guru pemasaran modern dan pakar strategi bisnis dunia.' },
    { nama: 'Romi Satria Wahono', bio: 'Pakar rekayasa perangkat lunak dan arsitektur data sistem informasi.' },
  ];

  const authorMap = {};
  for (const a of authorsData) {
    const existing = await prisma.penulis.findFirst({ where: { nama: a.nama } });
    if (existing) {
      authorMap[a.nama] = existing.id;
    } else {
      const created = await prisma.penulis.create({ data: a });
      authorMap[a.nama] = created.id;
    }
  }
  console.log('✅ Penulis terdaftar:', Object.keys(authorMap).length);

  // 4. Seed Penerbit
  const publishersData = [
    { nama: 'Gramedia Pustaka Utama', kota: 'Jakarta', website: 'https://gpu.id' },
    { nama: 'Erlangga', kota: 'Jakarta', website: 'https://erlangga.co.id' },
    { nama: 'Mizan Pustaka', kota: 'Bandung', website: 'https://mizan.com' },
    { nama: 'Andi Publisher', kota: 'Yogyakarta', website: 'https://andipublisher.com' },
    { nama: 'Balai Pustaka', kota: 'Jakarta', website: 'https://balaipustaka.co.id' },
  ];

  const publisherMap = {};
  for (const p of publishersData) {
    const existing = await prisma.penerbit.findFirst({ where: { nama: p.nama } });
    if (existing) {
      publisherMap[p.nama] = existing.id;
    } else {
      const created = await prisma.penerbit.create({ data: p });
      publisherMap[p.nama] = created.id;
    }
  }
  console.log('✅ Penerbit terdaftar:', Object.keys(publisherMap).length);

  // 5. Seed 30 Buku Mockup Kaya Metadata untuk Pengujian Semantic Search
  const booksCollection = [
    // Kuliner & Tata Boga
    {
      judul: 'Cita Rasa Nusantara: Seni Mengolah Masakan Tradisional Indonesia',
      isbn: '978-602-03-8810-1',
      tahunTerbit: 2021,
      stok: 5,
      kategori: 'Kuliner & Tata Boga',
      penulis: 'Chef William Wongso',
      penerbit: 'Gramedia Pustaka Utama',
      deskripsi: 'Panduan lengkap bumbu rempah autentik, metode memasak slow cooking, dan teknik plating modern untuk masakan khas berbagai daerah kepulauan Indonesia.',
    },
    {
      judul: 'Teknik Dasar Pastry & Bakery Profesional',
      isbn: '978-979-01-5521-3',
      tahunTerbit: 2022,
      stok: 4,
      kategori: 'Kuliner & Tata Boga',
      penulis: 'Bambang Hermanto',
      penerbit: 'Erlangga',
      deskripsi: 'Buku teks standar kejuruan yang membahas laminasi adonan croissant, teknik fermentasi ragi alami, pembuatan kue tart, serta sanitasi keamanan pangan di dapur pastry.',
    },
    {
      judul: 'Higienitas, Sanitasi, dan Keselamatan Kerja Dapur Komersial',
      isbn: '978-979-01-7782-0',
      tahunTerbit: 2020,
      stok: 6,
      kategori: 'Kuliner & Tata Boga',
      penulis: 'Bambang Hermanto',
      penerbit: 'Erlangga',
      deskripsi: 'Penerapan standar HACCP, pencegahan kontaminasi silang bakteri makanan, penanganan limbah organik dapur, serta SOP keselamatan kerja bagi juru masak.',
    },
    {
      judul: 'Seni Barista dan Manajemen Kedai Kopi Modern',
      isbn: '978-602-06-1194-2',
      tahunTerbit: 2023,
      stok: 3,
      kategori: 'Kuliner & Tata Boga',
      penulis: 'Chef William Wongso',
      penerbit: 'Gramedia Pustaka Utama',
      deskripsi: 'Mengenal profil sangrai biji kopi arabika dan robusta, teknik seduh manual brew V60, pengoperasian mesin espresso, latte art, dan kalkulasi modal kedai kopi.',
    },

    // Perhotelan & Pariwisata
    {
      judul: 'Manajemen Operasional Front Office Hotel Berbintang',
      isbn: '978-979-01-4412-2',
      tahunTerbit: 2021,
      stok: 5,
      kategori: 'Perhotelan & Pariwisata',
      penulis: 'Bambang Hermanto',
      penerbit: 'Erlangga',
      deskripsi: 'Standar operasional reservasi kamar, prosedur check-in dan check-out tamu VIP, penanganan keluhan pelanggan, sistem kasir hotel, serta etika komunikasi staf resepsionis.',
    },
    {
      judul: 'Tata Graha dan Housekeeping Excellence: Menata Kamar Tamu Standar Internasional',
      isbn: '978-979-01-6634-1',
      tahunTerbit: 2019,
      stok: 4,
      kategori: 'Perhotelan & Pariwisata',
      penulis: 'Bambang Hermanto',
      penerbit: 'Erlangga',
      deskripsi: 'Teknik merapikan tempat tidur making bed dengan linen standar hotel bintang lima, pembersihan kamar mandi secara higienis, perawatan binatu laundry, dan inventaris amenities.',
    },
    {
      judul: 'Pengembangan Ekowisata Berkelanjutan dan Pemanduan Wisata',
      isbn: '978-602-03-7729-0',
      tahunTerbit: 2022,
      stok: 3,
      kategori: 'Perhotelan & Pariwisata',
      penulis: 'Bambang Hermanto',
      penerbit: 'Gramedia Pustaka Utama',
      deskripsi: 'Strategi mengelola destinasi wisata berbasis alam dan kearifan lokal, etika pemandu wisata (tour guiding), serta konservasi lingkungan objek wisata daerah.',
    },
    {
      judul: 'Food & Beverage Service: Seni Tata Meja dan Jamuan Resmi',
      isbn: '978-979-01-8890-4',
      tahunTerbit: 2020,
      stok: 5,
      kategori: 'Perhotelan & Pariwisata',
      penulis: 'Bambang Hermanto',
      penerbit: 'Erlangga',
      deskripsi: 'Teknik table setting perjamuan formal, etika melayani tamu restoran fine dining (banquet service), pengenalan peralatan makan silverware, dan etiket penyajian hidangan.',
    },

    // Teknologi Informasi & Komputer
    {
      judul: 'Pemrograman Web Modern dengan JavaScript dan React',
      isbn: '978-623-01-0982-1',
      tahunTerbit: 2023,
      stok: 8,
      kategori: 'Teknologi Informasi & Komputer',
      penulis: 'Sandhika Galih',
      penerbit: 'Andi Publisher',
      deskripsi: 'Panduan membangun aplikasi web interaktif mulai dari HTML5, CSS modern, JavaScript asinkron, hingga pembuatan komponen antarmuka dengan React dan Next.js.',
    },
    {
      judul: 'Dasar-Dasar Rekayasa Perangkat Lunak dan Basis Data Relasional',
      isbn: '978-623-01-1123-7',
      tahunTerbit: 2022,
      stok: 6,
      kategori: 'Teknologi Informasi & Komputer',
      penulis: 'Romi Satria Wahono',
      penerbit: 'Andi Publisher',
      deskripsi: 'Konsep siklus hidup pengembangan sistem SDLC, pemodelan ERD, normalisasi basis data, dan teknik kueri SQL relasional menggunakan PostgreSQL.',
    },
    {
      judul: 'Pengantar Kecerdasan Buatan dan Pembelajaran Mesin (Machine Learning)',
      isbn: '978-623-01-2245-6',
      tahunTerbit: 2024,
      stok: 4,
      kategori: 'Teknologi Informasi & Komputer',
      penulis: 'Romi Satria Wahono',
      penerbit: 'Andi Publisher',
      deskripsi: 'Pemahaman konsep dasar neural network, vektor embedding, pencarian semantik teks, pemrosesan bahasa alami (NLP), dan etika pemanfaatan kecerdasan buatan.',
    },
    {
      judul: 'Administrasi Jaringan Komputer dan Keamanan Siber SMK',
      isbn: '978-979-01-9981-8',
      tahunTerbit: 2021,
      stok: 5,
      kategori: 'Teknologi Informasi & Komputer',
      penulis: 'Sandhika Galih',
      penerbit: 'Erlangga',
      deskripsi: 'Konfigurasi routing Mikrotik, pembagian subnetting IP address, pemasangan firewall jaringan, dan teknik pertahanan dasar terhadap serangan peretasan siber.',
    },

    // Bisnis & Kewirausahaan
    {
      judul: 'Kewirausahaan Kreatif Generasi Muda: Merintis Startup dari Nol',
      isbn: '978-602-06-4421-6',
      tahunTerbit: 2023,
      stok: 5,
      kategori: 'Bisnis & Kewirausahaan',
      penulis: 'Philip Kotler',
      penerbit: 'Gramedia Pustaka Utama',
      deskripsi: 'Langkah praktis merancang Business Model Canvas (BMC), validasi produk ke calon pelanggan, pengelolaan arus kas keuangan, serta strategi pitching kepada investor.',
    },
    {
      judul: 'Manajemen Pemasaran Digital dan Media Sosial',
      isbn: '978-602-06-3392-0',
      tahunTerbit: 2022,
      stok: 7,
      kategori: 'Bisnis & Kewirausahaan',
      penulis: 'Philip Kotler',
      penerbit: 'Gramedia Pustaka Utama',
      deskripsi: 'Strategi optimasi mesin pencari (SEO), pembuatan konten video promosi viral, periklanan berbayar di media sosial, dan pengukuran metrik konversi penjualan daring.',
    },
    {
      judul: 'Akuntansi Dasar dan Pembukuan Keuangan Usaha Jasa',
      isbn: '978-979-01-3378-5',
      tahunTerbit: 2020,
      stok: 6,
      kategori: 'Bisnis & Kewirausahaan',
      penulis: 'Bambang Hermanto',
      penerbit: 'Erlangga',
      deskripsi: 'Dasar pencatatan jurnal umum, buku besar, penyusunan neraca saldo, dan laporan laba rugi sederhana untuk usaha jasa pariwisata dan perhotelan.',
    },
    {
      judul: 'Etika Bisnis dan Komunikasi Antar Budaya di Era Global',
      isbn: '978-602-03-9912-8',
      tahunTerbit: 2021,
      stok: 4,
      kategori: 'Bisnis & Kewirausahaan',
      penulis: 'Philip Kotler',
      penerbit: 'Gramedia Pustaka Utama',
      deskripsi: 'Pentingnya integritas profesional, cara bernegosiasi dengan mitra bisnis lintas negara, etika korespondensi resmi, dan tanggung jawab sosial perusahaan.',
    },

    // Sastra & Fiksi
    {
      judul: 'Bumi Manusia',
      isbn: '978-979-973-123-4',
      tahunTerbit: 1980,
      stok: 5,
      kategori: 'Sastra & Fiksi',
      penulis: 'Pramoedya Ananta Toer',
      penerbit: 'Balai Pustaka',
      deskripsi: 'Novel sejarah mahakarya sastra Indonesia yang mengisahkan pergulatan pemikiran Minke, pemuda pribumi terpelajar di tengah hegemoni kolonial Hindia Belanda.',
    },
    {
      judul: 'Laskar Pelangi',
      isbn: '978-979-687-670-5',
      tahunTerbit: 2005,
      stok: 6,
      kategori: 'Sastra & Fiksi',
      penulis: 'Andrea Hirata',
      penerbit: 'Mizan Pustaka',
      deskripsi: 'Kisah inspiratif persahabatan sepuluh anak sekolah di Pulau Belitung yang berjuang menempuh pendidikan dengan keterbatasan fasilitas dan kemiskinan ekonomi.',
    },
    {
      judul: 'Sang Pemimpi',
      isbn: '978-979-306-292-1',
      tahunTerbit: 2006,
      stok: 4,
      kategori: 'Sastra & Fiksi',
      penulis: 'Andrea Hirata',
      penerbit: 'Mizan Pustaka',
      deskripsi: 'Kelanjutan kisah perjuangan Ikal dan Arai di masa remaja sekolah menengah untuk menggapai mimpi menuntut ilmu ke Sorbonne di kota Paris.',
    },
    {
      judul: 'Cantik Itu Luka',
      isbn: '978-602-03-1258-2',
      tahunTerbit: 2002,
      stok: 3,
      kategori: 'Sastra & Fiksi',
      penulis: 'Eka Kurniawan',
      penerbit: 'Gramedia Pustaka Utama',
      deskripsi: 'Realisme magis berlatar kota pesisir Halimunda yang merefleksikan luka sejarah pendudukan Jepang, masa revolusi fisik, dan tragedi kemanusiaan keluarga Dewi Ayu.',
    },
    {
      judul: 'Hujan',
      isbn: '978-602-03-2478-4',
      tahunTerbit: 2016,
      stok: 5,
      kategori: 'Sastra & Fiksi',
      penulis: 'Tere Liye',
      penerbit: 'Gramedia Pustaka Utama',
      deskripsi: 'Novel fiksi masa depan tentang persahabatan, ketabahan menghadapi bencana alam dahsyat, pengorbanan, dan teknologi rekayasa ingatan manusia.',
    },
    {
      judul: 'Supernova: Ksatria, Puteri, dan Bintang Jatuh',
      isbn: '978-602-01-0100-0',
      tahunTerbit: 2001,
      stok: 3,
      kategori: 'Sastra & Fiksi',
      penulis: 'Dewi Lestari',
      penerbit: 'Mizan Pustaka',
      deskripsi: 'Sebuah eksplorasi fiksi yang memadukan sains kuantum, filsafat eksistensial, dan jalinan romantisme perkotaan metropolitan Jakarta.',
    },

    // Sains Alam & Matematika
    {
      judul: 'Fisika Terapan dan Termodinamika Dapur untuk Kejuruan',
      isbn: '978-979-01-2290-7',
      tahunTerbit: 2021,
      stok: 6,
      kategori: 'Sains Alam & Matematika',
      penulis: 'Prof. Dr. B.J. Habibie',
      penerbit: 'Erlangga',
      deskripsi: 'Prinsip perpindahan kalor konduksi dan konveksi pada oven, efisiensi energi kompor induksi, serta konsep tekanan udara dalam peralatan memasak presisi.',
    },
    {
      judul: 'Kimia Pangan dan Nutrisi Makanan Seimbang',
      isbn: '978-979-01-3312-9',
      tahunTerbit: 2022,
      stok: 5,
      kategori: 'Sains Alam & Matematika',
      penulis: 'Chef William Wongso',
      penerbit: 'Erlangga',
      deskripsi: 'Reaksi kimia pencokelatan Maillard pada pemanggangan daging, struktur emulsi saus, pengawetan alami bahan pangan, dan analisis nilai gizi makanan.',
    },
    {
      judul: 'Matematika Terapan untuk Bisnis Perhotelan dan Manajemen Biaya',
      isbn: '978-979-01-4498-3',
      tahunTerbit: 2020,
      stok: 7,
      kategori: 'Sains Alam & Matematika',
      penulis: 'Bambang Hermanto',
      penerbit: 'Erlangga',
      deskripsi: 'Statistik peramalan okupansi kamar hotel, kalkulasi food cost percentage resep masakan, analisis titik impas BEP, dan diskon musiman pariwisata.',
    },

    // Sejarah & Sosial Budaya
    {
      judul: 'Sejarah Nasional Indonesia: Menelusuri Jalur Rempah Nusantara',
      isbn: '978-602-03-6612-4',
      tahunTerbit: 2021,
      stok: 4,
      kategori: 'Sejarah & Sosial Budaya',
      penulis: 'Pramoedya Ananta Toer',
      penerbit: 'Gramedia Pustaka Utama',
      deskripsi: 'Peran strategis perdagangan pala dan cengkih kepulauan Maluku yang membentuk jalur pelayaran internasional serta memicu ekspedisi bangsa-bangsa Eropa ke Asia.',
    },
    {
      judul: 'Warisan Kuliner dan Tradisi Jamuan Keraton Jawa',
      isbn: '978-602-03-7744-1',
      tahunTerbit: 2019,
      stok: 3,
      kategori: 'Sejarah & Sosial Budaya',
      penulis: 'Chef William Wongso',
      penerbit: 'Balai Pustaka',
      deskripsi: 'Mengenal filosofi sajian tumpeng, makanan upacara adat sekaten keraton Surakarta dan Yogyakarta, serta etika jamuan makan ningrat tradisional.',
    },
    {
      judul: 'Sosiologi Pariwisata dan Dampak Kebudayaan Masyarakat Lokal',
      isbn: '978-602-03-8823-9',
      tahunTerbit: 2022,
      stok: 4,
      kategori: 'Sejarah & Sosial Budaya',
      penulis: 'Bambang Hermanto',
      penerbit: 'Gramedia Pustaka Utama',
      deskripsi: 'Interaksi sosial antara wisatawan domestik maupun mancanegara dengan warga desa wisata lokal, adaptasi kebudayaan, serta pencegahan komersialisasi berlebihan ritual adat.',
    },

    // Bahasa & Komunikasi
    {
      judul: 'Bahasa Inggris Praktis untuk Front Office dan Pramusaji Hotel',
      isbn: '978-979-01-5589-2',
      tahunTerbit: 2022,
      stok: 8,
      kategori: 'Bahasa & Komunikasi',
      penulis: 'Bambang Hermanto',
      penerbit: 'Erlangga',
      deskripsi: 'Percakapan standar menyambut tamu di lobi hotel (greeting guests), menjelaskan menu makanan (explaining menu dishes), menangani reservasi lewat telepon, dan kalimat sopan menerima komplain.',
    },
    {
      judul: 'Teknik Public Speaking dan Presentasi Efektif bagi Siswa SMK',
      isbn: '978-602-06-5591-1',
      tahunTerbit: 2023,
      stok: 6,
      kategori: 'Bahasa & Komunikasi',
      penulis: 'Sandhika Galih',
      penerbit: 'Gramedia Pustaka Utama',
      deskripsi: 'Mengatasi rasa gugup di depan umum, pengaturan bahasa tubuh dan kontak mata, teknik intonasi suara, serta cara menyusun materi tayangan presentasi yang menarik.',
    },
  ];

  // Import 46 additional highly detailed mock books to reach 72 total
  const extraBooks = require('./mock-extra.js');
  
  for (let i = 0; i < extraBooks.length; i++) {
    const b = extraBooks[i];
    booksCollection.push({
      ...b,
      isbn: `978-600-99-${2000 + i}-X`,
      tahunTerbit: 2018 + (i % 7),
      stok: (i % 8) + 1,
    });
  }

  for (const b of booksCollection) {
    const existing = await prisma.buku.findFirst({ where: { judul: b.judul } });
    if (!existing) {
      await prisma.buku.create({
        data: {
          judul: b.judul,
          isbn: b.isbn,
          tahunTerbit: b.tahunTerbit,
          stok: b.stok,
          deskripsi: b.deskripsi,
          kategoriId: categoryMap[b.kategori] || null,
          penulisId: authorMap[b.penulis] || null,
          penerbitId: publisherMap[b.penerbit] || null,
        },
      });
    } else {
      await prisma.buku.update({
        where: { id: existing.id },
        data: {
          isbn: b.isbn,
          tahunTerbit: b.tahunTerbit,
          stok: b.stok,
          deskripsi: b.deskripsi,
          kategoriId: categoryMap[b.kategori] || null,
          penulisId: authorMap[b.penulis] || null,
          penerbitId: publisherMap[b.penerbit] || null,
        },
      });
    }
  }
  console.log(`✅ ${booksCollection.length} buku mockup berhasil dimasukkan ke katalog.`);

  console.log('\n🎉 Seeding selesai dengan sukses!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Akun Uji Coba (Disimpan untuk referensi pengujian):');
  console.log('  Admin : admin@metland.sch.id / admin123');
  console.log('  Siswa : siswa@metland.sch.id / siswa123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Gagal menjalankan seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
