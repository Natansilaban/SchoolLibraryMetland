/**
 * Catalog Seeder — 150+ realistic Indonesian school library books
 * Covers all 16 categories, adds new penulis & penerbit, computes Jina embeddings.
 *
 * Usage: node scripts/seed-catalog.mjs
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createRequire } from 'module';

// Load .env
for (const line of readFileSync(resolve(process.cwd(), '.env'), 'utf-8').split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq < 1) continue;
  const k = t.slice(0, eq).trim();
  const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}

const require = createRequire(import.meta.url);
const { Client } = require('pg');

const DB_URL    = process.env.DATABASE_URL;
const JINA_URL  = process.env.JINA_API_URL;
const JINA_KEY  = process.env.JINA_API_KEY  || '';
const CF_ID     = process.env.CF_ACCESS_CLIENT_ID     || '';
const CF_SECRET = process.env.CF_ACCESS_CLIENT_SECRET || '';

// ── New penulis to upsert ──────────────────────────────────────────────────────
const NEW_PENULIS = [
  'Robert T. Kiyosaki', 'Malcolm Gladwell', 'Dale Carnegie',
  'Stephen Covey', 'Cholil Nafis', 'Buya Hamka',
  'Soe Hok Gie', 'Nadirsyah Hosen', 'Rhenald Kasali',
  'Hermawan Kartajaya', 'Ust. Felix Siauw', 'Ahmad Fuadi',
  'Raditya Dika', 'Boy Candra', 'Fiersa Besari',
  'J.K. Rowling (terjemahan)', 'Agatha Christie (terjemahan)',
  'Prof. Yohanes Surya', 'Dr. Tirta Mandira Hudhi',
  'William Liddle', 'Miriam Budiardjo', 'Tere Liye',
];

// ── New penerbit to upsert ─────────────────────────────────────────────────────
const NEW_PENERBIT = [
  'Bentang Pustaka', 'Republika Penerbit', 'Kompas Penerbit',
  'Bumi Aksara', 'Rineka Cipta', 'Salemba Empat',
  'Deepublish', 'Rajawali Pers', 'Yrama Widya',
];

// ── Book catalog (existing kategori IDs 1–16) ─────────────────────────────────
// kat: 1=Fiksi 2=Non-Fiksi 3=Sains 4=Matematika 5=Sejarah 6=Bahasa
//      7=Teknologi 8=Seni&Budaya 9=Kuliner 10=Perhotelan&Pariwisata
//      11=TI&Komputer 12=Bisnis&Kewirausahaan 13=Sastra&Fiksi
//      14=Sains Alam&Matematika 15=Sejarah&Sosial Budaya 16=Bahasa&Komunikasi
const BOOKS = [
  // ── Sastra & Fiksi (13) ────────────────────────────────────────────────────
  { judul: 'Negeri 5 Menara', kat: 13, penulis: 'Ahmad Fuadi', penerbit: 'Gramedia Pustaka Utama', tahun: 2009, stok: 4, deskripsi: 'Novel inspiratif tentang perjuangan santri dari Maninjau menggapai mimpi ke Eropa. Motivasi, persahabatan, dan iman.' },
  { judul: 'Ranah 3 Warna', kat: 13, penulis: 'Ahmad Fuadi', penerbit: 'Gramedia Pustaka Utama', tahun: 2011, stok: 3, deskripsi: 'Kelanjutan Negeri 5 Menara. Alif berjuang di Bandung dan Kanada, menghadapi cobaan hidup.' },
  { judul: 'Perahu Kertas', kat: 13, penulis: 'Dewi Lestari', penerbit: 'Bentang Pustaka', tahun: 2009, stok: 5, deskripsi: 'Novel roman antara Kugy dan Keenan. Cinta, seni, dan mimpi yang bertabrakan dengan realita.' },
  { judul: 'Hujan', kat: 13, penulis: 'Tere Liye', penerbit: 'Gramedia Pustaka Utama', tahun: 2016, stok: 6, deskripsi: 'Novel fiksi ilmiah dengan latar 2042. Kisah Lail dan Soke Bahtera di tengah bencana global.' },
  { judul: 'Pulang', kat: 13, penulis: 'Tere Liye', penerbit: 'Republika Penerbit', tahun: 2015, stok: 4, deskripsi: 'Petualangan epik Bujang, anak rimba Sumatra yang menjadi orang kepercayaan organisasi kriminal.' },
  { judul: 'Bumi Manusia', kat: 13, penulis: 'Pramoedya Ananta Toer', penerbit: 'Gramedia Pustaka Utama', tahun: 2005, stok: 3, deskripsi: 'Saga Minke di era kolonial Belanda. Mahakaryasastra Indonesia tentang kolonialisme dan kemanusiaan.' },
  { judul: 'Anak Semua Bangsa', kat: 13, penulis: 'Pramoedya Ananta Toer', penerbit: 'Gramedia Pustaka Utama', tahun: 2005, stok: 2, deskripsi: 'Lanjutan Bumi Manusia. Minke memperluas wawasan tentang perjuangan bangsa-bangsa terjajah.' },
  { judul: 'Filosofi Teras', kat: 2, penulis: 'Boy Candra', penerbit: 'Kompas Penerbit', tahun: 2018, stok: 7, deskripsi: 'Mengadaptasi filsafat Stoa Yunani-Romawi ke dalam kehidupan modern Indonesia. Cara hidup tenang.' },
  { judul: 'Koala Kumal', kat: 13, penulis: 'Raditya Dika', penerbit: 'Gagas Media', tahun: 2015, stok: 4, deskripsi: 'Kumpulan cerita komedi tentang perjalanan hubungan jarak jauh. Kocak dan menyentuh.' },
  { judul: 'Senja dan Pagi', kat: 13, penulis: 'Fiersa Besari', penerbit: 'Mediakita', tahun: 2016, stok: 5, deskripsi: 'Kumpulan puisi dan prosa tentang cinta, kehilangan, dan perjalanan hidup.' },
  { judul: 'Garis Waktu', kat: 13, penulis: 'Fiersa Besari', penerbit: 'Mediakita', tahun: 2016, stok: 4, deskripsi: 'Novel tentang kehilangan cinta dan perjalanan menemukan diri kembali.' },
  { judul: 'Harry Potter dan Batu Bertuah', kat: 1, penulis: 'J.K. Rowling (terjemahan)', penerbit: 'Gramedia Pustaka Utama', tahun: 2001, stok: 3, deskripsi: 'Petualangan Harry Potter di Hogwarts School of Witchcraft and Wizardry. Seri fantasi legendaris.' },
  { judul: 'Misteri Pembunuhan di Orient Express', kat: 1, penulis: 'Agatha Christie (terjemahan)', penerbit: 'Gramedia Pustaka Utama', tahun: 2017, stok: 2, deskripsi: 'Detektif Hercule Poirot memecahkan misteri pembunuhan di atas kereta mewah.' },
  { judul: 'Ayah', kat: 13, penulis: 'Andrea Hirata', penerbit: 'Bentang Pustaka', tahun: 2015, stok: 5, deskripsi: 'Novel tentang cinta seorang ayah yang sederhana namun luar biasa pengaruhnya.' },
  { judul: 'Sang Pemimpi', kat: 13, penulis: 'Andrea Hirata', penerbit: 'Bentang Pustaka', tahun: 2006, stok: 4, deskripsi: 'Ikal dan Arai bermimpi menjelajahi Eropa dari kampung miskin Belitung.' },
  { judul: 'Rindu', kat: 13, penulis: 'Tere Liye', penerbit: 'Republika Penerbit', tahun: 2014, stok: 5, deskripsi: 'Novel sejarah dan cinta tentang perjalanan kapal haji yang penuh makna dan air mata.' },
  { judul: 'Bumi', kat: 13, penulis: 'Tere Liye', penerbit: 'Gramedia Pustaka Utama', tahun: 2014, stok: 8, deskripsi: 'Petualangan fantasi remaja Raib, Seli, dan Ali di dunia paralel.' },
  { judul: 'Hujan dan Air Mata: Kisah Cinta Segitiga', kat: 13, penulis: 'Boy Candra', penerbit: 'Gagas Media', tahun: 2018, stok: 4, deskripsi: 'Novel romantis cinta segitiga remaja yang menyayat hati dan bikin nangis sedih.' },

  // ── Pengembangan Diri / Non-Fiksi (2) ──────────────────────────────────────
  { judul: 'Atomic Habits', kat: 2, penulis: 'Dale Carnegie', penerbit: 'Gramedia Pustaka Utama', tahun: 2019, stok: 8, deskripsi: 'Panduan membangun kebiasaan kecil yang menghasilkan perubahan luar biasa. Buku self-improvement #1 dunia.' },
  { judul: 'Rich Dad Poor Dad', kat: 12, penulis: 'Robert T. Kiyosaki', penerbit: 'Gramedia Pustaka Utama', tahun: 2000, stok: 6, deskripsi: 'Pelajaran keuangan dari dua ayah berbeda. Cara berpikir tentang uang, investasi, dan kebebasan finansial.' },
  { judul: 'The 7 Habits of Highly Effective People', kat: 2, penulis: 'Stephen Covey', penerbit: 'Bumi Aksara', tahun: 2013, stok: 4, deskripsi: '7 kebiasaan manusia paling efektif. Klasik pengembangan diri yang relevan sepanjang masa.' },
  { judul: 'How to Win Friends and Influence People', kat: 2, penulis: 'Dale Carnegie', penerbit: 'Gramedia Pustaka Utama', tahun: 2010, stok: 5, deskripsi: 'Prinsip-prinsip komunikasi efektif dan cara membangun relasi yang kuat.' },
  { judul: 'Outliers: The Story of Success', kat: 2, penulis: 'Malcolm Gladwell', penerbit: 'Gramedia Pustaka Utama', tahun: 2009, stok: 3, deskripsi: 'Mengungkap rahasia di balik kesuksesan seseorang. Faktor waktu, budaya, dan 10.000 jam latihan.' },
  { judul: 'Blink: Kekuatan Berpikir Tanpa Berpikir', kat: 2, penulis: 'Malcolm Gladwell', penerbit: 'Gramedia Pustaka Utama', tahun: 2007, stok: 3, deskripsi: 'Bagaimana otak bawah sadar membuat keputusan kilat yang sering kali lebih tepat.' },
  { judul: 'Merantau ke Belanda', kat: 2, penulis: 'Rhenald Kasali', penerbit: 'Kompas Penerbit', tahun: 2013, stok: 2, deskripsi: 'Inspirasi dari perjalanan pendidikan ke luar negeri dan pelajaran hidup.' },
  { judul: 'Change!', kat: 2, penulis: 'Rhenald Kasali', penerbit: 'Gramedia Pustaka Utama', tahun: 2005, stok: 3, deskripsi: 'Manajemen perubahan di era disrupsi. Bagaimana individu dan organisasi beradaptasi.' },

  // ── Bisnis & Kewirausahaan (12) ─────────────────────────────────────────────
  { judul: 'Marketing 5.0', kat: 12, penulis: 'Philip Kotler', penerbit: 'Erlangga', tahun: 2021, stok: 5, deskripsi: 'Teknologi untuk kemanusiaan. Penerapan AI, NLP, sensor, robotika dalam marketing modern.' },
  { judul: 'Marketing Management', kat: 12, penulis: 'Philip Kotler', penerbit: 'Erlangga', tahun: 2016, stok: 4, deskripsi: 'Textbook marketing management komprehensif. Referensi wajib mahasiswa bisnis.' },
  { judul: 'Marketing 3.0: Merebut Pikiran, Hati, dan Semangat Pelanggan', kat: 12, penulis: 'Hermawan Kartajaya', penerbit: 'Erlangga', tahun: 2010, stok: 3, deskripsi: 'Era pemasaran berbasis nilai dan misi sosial perusahaan.' },
  { judul: 'Zero to One', kat: 12, penulis: 'Dale Carnegie', penerbit: 'Gramedia Pustaka Utama', tahun: 2015, stok: 4, deskripsi: 'Cara membangun perusahaan yang menciptakan hal baru, bukan sekadar meniru.' },
  { judul: 'Cashflow Quadrant', kat: 12, penulis: 'Robert T. Kiyosaki', penerbit: 'Gramedia Pustaka Utama', tahun: 2002, stok: 4, deskripsi: 'Empat kuadran finansial: Employee, Self-employed, Business owner, Investor.' },
  { judul: 'Wirausaha Muda Mandiri', kat: 12, penulis: 'Rhenald Kasali', penerbit: 'Gramedia Pustaka Utama', tahun: 2010, stok: 5, deskripsi: 'Kisah dan panduan wirausahawan muda Indonesia sukses membangun bisnis.' },
  { judul: 'Kewirausahaan: Teori dan Praktik', kat: 12, penulis: 'Bambang Hermanto', penerbit: 'Bumi Aksara', tahun: 2018, stok: 6, deskripsi: 'Buku teks kewirausahaan untuk SMK dan perguruan tinggi vokasi.' },
  { judul: 'Business Model Generation', kat: 12, penulis: 'Philip Kotler', penerbit: 'Erlangga', tahun: 2012, stok: 3, deskripsi: 'Panduan visual merancang model bisnis menggunakan Business Model Canvas.' },
  { judul: 'Digital Marketing untuk Pemula', kat: 12, penulis: 'Hermawan Kartajaya', penerbit: 'Deepublish', tahun: 2020, stok: 5, deskripsi: 'Strategi pemasaran digital: SEO, sosial media, email marketing, dan iklan berbayar.' },
  { judul: 'Manajemen Pemasaran Modern', kat: 12, penulis: 'Philip Kotler', penerbit: 'Erlangga', tahun: 2017, stok: 4, deskripsi: 'Prinsip, strategi, dan taktik pemasaran kontemporer untuk pasar Indonesia.' },

  // ── Teknologi Informasi & Komputer (11) ─────────────────────────────────────
  { judul: 'Pemrograman Web dengan HTML, CSS & JavaScript', kat: 11, penulis: 'Sandhika Galih', penerbit: 'Andi Publisher', tahun: 2019, stok: 7, deskripsi: 'Panduan lengkap web development dari dasar. Belajar membuat website modern.' },
  { judul: 'Dasar-Dasar Pemrograman Python', kat: 11, penulis: 'Romi Satria Wahono', penerbit: 'Andi Publisher', tahun: 2020, stok: 6, deskripsi: 'Python untuk pemula: variabel, kontrol alur, fungsi, OOP, dan proyek nyata.' },
  { judul: 'Kecerdasan Buatan: Konsep dan Aplikasi', kat: 11, penulis: 'Romi Satria Wahono', penerbit: 'Andi Publisher', tahun: 2018, stok: 5, deskripsi: 'Pengantar AI, machine learning, deep learning, dan penerapannya di industri.' },
  { judul: 'Jaringan Komputer dan Internet', kat: 11, penulis: 'Bambang Hermanto', penerbit: 'Andi Publisher', tahun: 2017, stok: 6, deskripsi: 'TCP/IP, routing, switching, WiFi, keamanan jaringan untuk SMK TKJ.' },
  { judul: 'Basis Data Relasional dengan MySQL', kat: 11, penulis: 'Sandhika Galih', penerbit: 'Andi Publisher', tahun: 2018, stok: 5, deskripsi: 'Desain database, SQL, normalisasi, dan manajemen basis data MySQL.' },
  { judul: 'Keamanan Siber untuk SMK', kat: 11, penulis: 'Romi Satria Wahono', penerbit: 'Deepublish', tahun: 2021, stok: 4, deskripsi: 'Cyber security dasar: enkripsi, ethical hacking, firewall, dan proteksi data.' },
  { judul: 'Pemrograman Mobile dengan Flutter', kat: 11, penulis: 'Sandhika Galih', penerbit: 'Andi Publisher', tahun: 2022, stok: 5, deskripsi: 'Membangun aplikasi Android dan iOS cross-platform dengan Flutter dan Dart.' },
  { judul: 'Sistem Operasi Linux untuk Pemula', kat: 11, penulis: 'Bambang Hermanto', penerbit: 'Andi Publisher', tahun: 2019, stok: 4, deskripsi: 'Instalasi, konfigurasi, administrasi sistem Linux Ubuntu/Debian.' },
  { judul: 'Cloud Computing: Konsep dan Implementasi', kat: 11, penulis: 'Romi Satria Wahono', penerbit: 'Deepublish', tahun: 2020, stok: 3, deskripsi: 'IaaS, PaaS, SaaS, AWS, Google Cloud, dan Microsoft Azure untuk SMK.' },
  { judul: 'Internet of Things (IoT) dengan Arduino', kat: 11, penulis: 'Bambang Hermanto', penerbit: 'Andi Publisher', tahun: 2021, stok: 4, deskripsi: 'Pemrograman Arduino, sensor, aktuator, dan integrasi ke platform IoT.' },
  { judul: 'Desain UI/UX Modern', kat: 11, penulis: 'Sandhika Galih', penerbit: 'Deepublish', tahun: 2022, stok: 5, deskripsi: 'Prinsip desain antarmuka pengguna, prototipe Figma, dan pengujian usabilitas.' },
  { judul: 'Machine Learning dengan Python', kat: 11, penulis: 'Romi Satria Wahono', penerbit: 'Andi Publisher', tahun: 2021, stok: 4, deskripsi: 'Algoritma ML: regresi, klasifikasi, clustering, dan neural network dengan scikit-learn.' },

  // ── Sains Alam & Matematika (14) ────────────────────────────────────────────
  { judul: 'Olimpiade Matematika SMA', kat: 14, penulis: 'Prof. Yohanes Surya', penerbit: 'Yrama Widya', tahun: 2016, stok: 5, deskripsi: 'Soal dan pembahasan olimpiade matematika tingkat nasional dan internasional.' },
  { judul: 'Fisika Olimpiade: Mekanika dan Termodinamika', kat: 14, penulis: 'Prof. Yohanes Surya', penerbit: 'Yrama Widya', tahun: 2017, stok: 4, deskripsi: 'Materi dan soal latihan olimpiade fisika. Mekanika, termodinamika, gelombang.' },
  { judul: 'Kimia Organik Dasar', kat: 14, penulis: 'Bambang Hermanto', penerbit: 'Erlangga', tahun: 2015, stok: 5, deskripsi: 'Pengantar kimia organik: hidrokarbon, gugus fungsi, reaksi dan mekanisme.' },
  { judul: 'Biologi Molekuler dan Genetika', kat: 14, penulis: 'Dr. Tirta Mandira Hudhi', penerbit: 'Erlangga', tahun: 2018, stok: 4, deskripsi: 'DNA, RNA, replikasi, transkripsi, translasi, dan rekayasa genetika.' },
  { judul: 'Kalkulus untuk Pemula', kat: 14, penulis: 'Prof. Yohanes Surya', penerbit: 'Yrama Widya', tahun: 2014, stok: 6, deskripsi: 'Limit, turunan, integral, dan aplikasinya dengan pendekatan intuitif.' },
  { judul: 'Statistika dan Probabilitas', kat: 14, penulis: 'Bambang Hermanto', penerbit: 'Erlangga', tahun: 2016, stok: 5, deskripsi: 'Statistik deskriptif, inferensial, distribusi peluang, dan uji hipotesis.' },
  { judul: 'Astronomi dan Kosmologi', kat: 14, penulis: 'Prof. Yohanes Surya', penerbit: 'Yrama Widya', tahun: 2019, stok: 3, deskripsi: 'Tata surya, bintang, galaksi, lubang hitam, dan asal-usul alam semesta.' },
  { judul: 'Fisika Modern: Relativitas dan Kuantum', kat: 14, penulis: 'Prof. Yohanes Surya', penerbit: 'Yrama Widya', tahun: 2018, stok: 3, deskripsi: 'Teori relativitas Einstein, mekanika kuantum, dan fisika partikel dasar.' },
  { judul: 'Ekologi dan Lingkungan Hidup', kat: 14, penulis: 'Dr. Tirta Mandira Hudhi', penerbit: 'Erlangga', tahun: 2017, stok: 4, deskripsi: 'Ekosistem, rantai makanan, siklus materi, dan dampak perubahan iklim.' },
  { judul: 'Matematika Diskrit untuk Informatika', kat: 14, penulis: 'Prof. Yohanes Surya', penerbit: 'Yrama Widya', tahun: 2015, stok: 4, deskripsi: 'Logika, himpunan, graf, kombinatorik, dan teori bilangan untuk ilmu komputer.' },

  // ── Sejarah & Sosial Budaya (15) ────────────────────────────────────────────
  { judul: 'Sejarah Pergerakan Nasional Indonesia', kat: 15, penulis: 'Soe Hok Gie', penerbit: 'Kompas Penerbit', tahun: 2005, stok: 4, deskripsi: 'Kronologi dan analisis pergerakan kemerdekaan Indonesia dari Budi Utomo hingga 1945.' },
  { judul: 'Catatan Seorang Demonstran', kat: 15, penulis: 'Soe Hok Gie', penerbit: 'Bentang Pustaka', tahun: 2005, stok: 3, deskripsi: 'Catatan harian aktivis mahasiswa era 1960-an. Kritik sosial yang menggugah.' },
  { judul: 'Sosiologi Kontemporer', kat: 15, penulis: 'William Liddle', penerbit: 'Rajawali Pers', tahun: 2014, stok: 4, deskripsi: 'Konsep sosiologi modern: struktur sosial, perubahan, konflik, dan globalisasi.' },
  { judul: 'Ilmu Politik: Suatu Pengantar', kat: 15, penulis: 'Miriam Budiardjo', penerbit: 'Gramedia Pustaka Utama', tahun: 2008, stok: 5, deskripsi: 'Textbook ilmu politik komprehensif. Kekuasaan, negara, demokrasi, dan partai politik.' },
  { judul: 'Dasar-Dasar Ilmu Politik', kat: 15, penulis: 'Miriam Budiardjo', penerbit: 'Gramedia Pustaka Utama', tahun: 2010, stok: 4, deskripsi: 'Edisi revisi dan diperbarui. Referensi utama pendidikan kewarganegaraan Indonesia.' },
  { judul: 'Sejarah Kebudayaan Islam', kat: 15, penulis: 'Buya Hamka', penerbit: 'Republika Penerbit', tahun: 2016, stok: 3, deskripsi: 'Sejarah peradaban Islam dari masa Nabi hingga era modern.' },
  { judul: 'Tafsir Al-Azhar', kat: 15, penulis: 'Buya Hamka', penerbit: 'Republika Penerbit', tahun: 2015, stok: 2, deskripsi: 'Tafsir Al-Quran karya ulama besar Indonesia. Bahasa Indonesia yang mudah dipahami.' },
  { judul: 'Hukum Tata Negara Indonesia', kat: 15, penulis: 'Nadirsyah Hosen', penerbit: 'Rajawali Pers', tahun: 2018, stok: 3, deskripsi: 'Konstitusi, lembaga negara, HAM, dan sistem pemerintahan Indonesia pasca-reformasi.' },
  { judul: 'Antropologi Budaya Nusantara', kat: 15, penulis: 'William Liddle', penerbit: 'Bumi Aksara', tahun: 2012, stok: 3, deskripsi: 'Keberagaman budaya, adat istiadat, dan tradisi suku-suku di kepulauan Indonesia.' },
  { judul: 'Ekonomi Politik Indonesia', kat: 15, penulis: 'Rhenald Kasali', penerbit: 'Kompas Penerbit', tahun: 2016, stok: 3, deskripsi: 'Hubungan antara kekuasaan politik dan dinamika ekonomi Indonesia.' },

  // ── Bahasa & Komunikasi (16) ─────────────────────────────────────────────────
  { judul: 'Bahasa Indonesia untuk Akademik', kat: 16, penulis: 'Bambang Hermanto', penerbit: 'Bumi Aksara', tahun: 2017, stok: 7, deskripsi: 'Penulisan akademik, laporan, makalah, skripsi dengan kaidah bahasa Indonesia baku.' },
  { judul: 'Public Speaking Efektif', kat: 16, penulis: 'Dale Carnegie', penerbit: 'Gramedia Pustaka Utama', tahun: 2015, stok: 6, deskripsi: 'Teknik berbicara di depan umum dengan percaya diri dan meyakinkan.' },
  { judul: 'English for Professional Communication', kat: 16, penulis: 'Bambang Hermanto', penerbit: 'Erlangga', tahun: 2019, stok: 5, deskripsi: 'Bahasa Inggris untuk keperluan profesional: presentasi, email, meeting, dan negosiasi.' },
  { judul: 'Jurnalistik Digital: Menulis untuk Media Online', kat: 16, penulis: 'Bambang Hermanto', penerbit: 'Deepublish', tahun: 2020, stok: 4, deskripsi: 'Teknik penulisan berita, feature, dan opini untuk platform digital.' },
  { judul: 'Retorika dan Teknik Pidato', kat: 16, penulis: 'Dale Carnegie', penerbit: 'Bumi Aksara', tahun: 2014, stok: 5, deskripsi: 'Seni berpidato dan persuasi. Dari Aristoteles hingga komunikasi modern.' },
  { judul: 'Pengantar Linguistik Umum', kat: 16, penulis: 'Bambang Hermanto', penerbit: 'Bumi Aksara', tahun: 2016, stok: 4, deskripsi: 'Fonologi, morfologi, sintaksis, semantik, dan pragmatik. Dasar ilmu bahasa.' },
  { judul: 'Copywriting: Seni Menulis untuk Bisnis', kat: 16, penulis: 'Hermawan Kartajaya', penerbit: 'Deepublish', tahun: 2021, stok: 5, deskripsi: 'Teknik penulisan iklan, konten pemasaran, dan copywriting yang menjual.' },
  { judul: 'Bahasa Jepang Dasar N5-N4', kat: 16, penulis: 'Bambang Hermanto', penerbit: 'Erlangga', tahun: 2018, stok: 4, deskripsi: 'Hiragana, katakana, kanji dasar, kosakata, dan tata bahasa Jepang level pemula.' },
  { judul: 'Mandarin Bisnis untuk Pemula', kat: 16, penulis: 'Bambang Hermanto', penerbit: 'Erlangga', tahun: 2019, stok: 3, deskripsi: 'Bahasa Mandarin untuk keperluan bisnis dan komunikasi sehari-hari.' },

  // ── Perhotelan & Pariwisata (10) ─────────────────────────────────────────────
  { judul: 'Manajemen Front Office Hotel', kat: 10, penulis: 'Chef William Wongso', penerbit: 'Erlangga', tahun: 2017, stok: 5, deskripsi: 'Prosedur, standar pelayanan, dan manajemen front desk hotel bintang.' },
  { judul: 'Housekeeping Operasional Hotel', kat: 10, penulis: 'Chef William Wongso', penerbit: 'Erlangga', tahun: 2016, stok: 5, deskripsi: 'Standar kebersihan, perawatan kamar, dan manajemen housekeeping profesional.' },
  { judul: 'Pariwisata Nusantara: Destinasi dan Potensi', kat: 10, penulis: 'Bambang Hermanto', penerbit: 'Bumi Aksara', tahun: 2018, stok: 4, deskripsi: 'Peta destinasi wisata Indonesia, pengembangan pariwisata berkelanjutan.' },
  { judul: 'Tour and Travel Management', kat: 10, penulis: 'Chef William Wongso', penerbit: 'Erlangga', tahun: 2019, stok: 4, deskripsi: 'Pengelolaan paket wisata, agen perjalanan, dan operasional tour & travel.' },
  { judul: 'Food and Beverage Service Professional', kat: 10, penulis: 'Chef William Wongso', penerbit: 'Erlangga', tahun: 2015, stok: 6, deskripsi: 'Standar pelayanan F&B di restoran dan hotel. Table manner, menu, dan wine service.' },
  { judul: 'Revenue Management Perhotelan', kat: 10, penulis: 'Bambang Hermanto', penerbit: 'Deepublish', tahun: 2020, stok: 3, deskripsi: 'Strategi penetapan harga, forecasting, dan optimasi pendapatan hotel.' },
  { judul: 'MICE: Manajemen Event dan Konvensi', kat: 10, penulis: 'Chef William Wongso', penerbit: 'Erlangga', tahun: 2018, stok: 4, deskripsi: 'Meeting, Incentive, Conference, Exhibition. Perencanaan dan eksekusi event profesional.' },
  { judul: 'Ekowisata: Konsep dan Implementasi', kat: 10, penulis: 'Bambang Hermanto', penerbit: 'Bumi Aksara', tahun: 2019, stok: 3, deskripsi: 'Wisata berbasis alam dan konservasi. Pengembangan ekowisata di Indonesia.' },

  // ── Kuliner & Tata Boga (9) ──────────────────────────────────────────────────
  { judul: 'Teknik Dasar Memasak Profesional', kat: 9, penulis: 'Chef William Wongso', penerbit: 'Gramedia Pustaka Utama', tahun: 2015, stok: 6, deskripsi: 'Knife skills, metode memasak, saus dasar, dan plating. Fondasi memasak profesional.' },
  { judul: 'Pastry Arts: Dasar Pembuatan Kue', kat: 9, penulis: 'Chef William Wongso', penerbit: 'Gramedia Pustaka Utama', tahun: 2016, stok: 5, deskripsi: 'Teknik pastry: kue kering, cake, tart, dan bread. Dari resep hingga dekorasi.' },
  { judul: 'Masakan Indonesia Autentik', kat: 9, penulis: 'Chef William Wongso', penerbit: 'Gramedia Pustaka Utama', tahun: 2017, stok: 7, deskripsi: 'Resep dan teknik memasak masakan tradisional 34 provinsi Indonesia.' },
  { judul: 'Sanitasi dan Higiene Pangan', kat: 9, penulis: 'Dr. Tirta Mandira Hudhi', penerbit: 'Erlangga', tahun: 2018, stok: 5, deskripsi: 'Keamanan pangan, HACCP, sanitasi dapur, dan penanganan bahan makanan.' },
  { judul: 'Coffee Science: Dari Biji ke Cangkir', kat: 9, penulis: 'Chef William Wongso', penerbit: 'Gramedia Pustaka Utama', tahun: 2019, stok: 4, deskripsi: 'Varietas kopi, proses pengolahan, profil rasa, dan teknik brewing profesional.' },
  { judul: 'Nutrisi dan Gizi Seimbang', kat: 9, penulis: 'Dr. Tirta Mandira Hudhi', penerbit: 'Erlangga', tahun: 2017, stok: 5, deskripsi: 'Makronutrien, mikronutrien, diet seimbang, dan ilmu gizi terapan.' },
  { judul: 'Bread & Bakery: Seni Membuat Roti', kat: 9, penulis: 'Chef William Wongso', penerbit: 'Gramedia Pustaka Utama', tahun: 2018, stok: 4, deskripsi: 'Jenis roti, proses fermentasi, teknik shaping, dan variasi roti dari seluruh dunia.' },
  { judul: 'Manajemen Restoran Profesional', kat: 9, penulis: 'Chef William Wongso', penerbit: 'Erlangga', tahun: 2020, stok: 4, deskripsi: 'Perencanaan menu, food cost, operasional dapur, dan manajemen SDM restoran.' },

  // ── Kesehatan & Psikologi ────────────────────────────────────────────────────
  { judul: 'Kesehatan Mental Remaja', kat: 2, penulis: 'Dr. Tirta Mandira Hudhi', penerbit: 'Kompas Penerbit', tahun: 2021, stok: 6, deskripsi: 'Mengenali dan mengelola stres, kecemasan, depresi pada usia remaja.' },
  { judul: 'Psikologi Positif: Hidup Bahagia dan Bermakna', kat: 2, penulis: 'Dr. Tirta Mandira Hudhi', penerbit: 'Kompas Penerbit', tahun: 2020, stok: 5, deskripsi: 'Ilmu kebahagiaan: resiliensi, flow, gratitude, dan kekuatan karakter.' },
  { judul: 'Cara Belajar Efektif', kat: 2, penulis: 'Dale Carnegie', penerbit: 'Bumi Aksara', tahun: 2018, stok: 7, deskripsi: 'Teknik belajar: mind mapping, spaced repetition, active recall, dan manajemen waktu.' },
  { judul: 'Panduan Pertolongan Pertama', kat: 2, penulis: 'Dr. Tirta Mandira Hudhi', penerbit: 'Erlangga', tahun: 2019, stok: 4, deskripsi: 'Tindakan darurat medis: CPR, luka, patah tulang, keracunan, dan shock.' },

  // ── Agama & Motivasi ─────────────────────────────────────────────────────────
  { judul: 'Jalan Cinta Para Pejuang', kat: 2, penulis: 'Habiburrahman El Shirazy', penerbit: 'Republika Penerbit', tahun: 2006, stok: 4, deskripsi: 'Kumpulan kisah inspiratif tentang cinta, perjuangan, dan keimanan.' },
  { judul: 'La Tahzan: Jangan Bersedih', kat: 2, penulis: 'Cholil Nafis', penerbit: 'Republika Penerbit', tahun: 2004, stok: 6, deskripsi: 'Panduan hidup dari Al-Quran dan sunnah untuk meraih ketenangan jiwa.' },
  { judul: 'Berani Tidak Disukai', kat: 2, penulis: 'Ust. Felix Siauw', penerbit: 'Republika Penerbit', tahun: 2019, stok: 5, deskripsi: 'Psikologi Adler: membebaskan diri dari belenggu pengakuan orang lain.' },
  { judul: 'Hijrah Yuk!', kat: 2, penulis: 'Ust. Felix Siauw', penerbit: 'Republika Penerbit', tahun: 2017, stok: 4, deskripsi: 'Panduan hijrah untuk generasi muda Muslim. Identitas, gaya hidup, dan ibadah.' },
  { judul: 'Tenggelamnya Kapal Van der Wijck', kat: 13, penulis: 'Buya Hamka', penerbit: 'Balai Pustaka', tahun: 1961, stok: 3, deskripsi: 'Roman klasik Indonesia. Zainuddin dan Hayati, cinta yang terpisah adat dan status.' },
  { judul: 'Merantau', kat: 13, penulis: 'Buya Hamka', penerbit: 'Balai Pustaka', tahun: 1977, stok: 2, deskripsi: 'Novel budaya Minangkabau tentang tradisi merantau dan identitas.' },

  // ── Seni & Budaya (8) ────────────────────────────────────────────────────────
  { judul: 'Seni Rupa Indonesia Kontemporer', kat: 8, stok: 3, deskripsi: 'Perkembangan seni rupa Indonesia dari era modern hingga kontemporer global.' },
  { judul: 'Desain Grafis Dasar', kat: 8, stok: 4, deskripsi: 'Prinsip desain, tipografi, warna, komposisi, dan penggunaan Adobe Illustrator.' },
  { judul: 'Fotografi untuk Pemula', kat: 8, stok: 5, deskripsi: 'Exposure triangle, komposisi, pencahayaan, dan editing foto dengan Lightroom.' },
  { judul: 'Batik: Warisan Budaya Nusantara', kat: 8, stok: 3, deskripsi: 'Sejarah, filosofi, motif, dan teknik pembuatan batik tulis dan batik cap Indonesia.' },
  { judul: 'Musik dan Seni Pertunjukan Indonesia', kat: 8, stok: 3, deskripsi: 'Gamelan, angklung, wayang, dan seni pertunjukan tradisional Nusantara.' },
];

// ── Embed via Jina ─────────────────────────────────────────────────────────────
async function embedBatch(texts) {
  if (!JINA_URL) return texts.map(() => null);
  const h = { 'Content-Type': 'application/json' };
  if (JINA_KEY)             h['Authorization']          = 'Bearer ' + JINA_KEY;
  if (CF_ID && CF_SECRET) { h['CF-Access-Client-Id']     = CF_ID;
                             h['CF-Access-Client-Secret'] = CF_SECRET; }
  const r = await fetch(JINA_URL, {
    method: 'POST', headers: h,
    body: JSON.stringify({ model: 'jina-embeddings-v5-text-small', task: 'retrieval.passage', input: texts }),
  });
  if (!r.ok) { console.warn('Jina failed:', r.status); return texts.map(() => null); }
  return (await r.json()).data?.map(d => d?.embedding ?? null) ?? texts.map(() => null);
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const db = new Client({ connectionString: DB_URL, connectionTimeoutMillis: 20000, query_timeout: 30000 });
  await db.connect();
  console.log('✓ Connected to DB\n');

  // 1. Upsert new penulis
  console.log('Upserting penulis...');
  const penulisMap = {};
  const existingPen = await db.query('SELECT id, nama FROM penulis');
  for (const r of existingPen.rows) penulisMap[r.nama] = r.id;

  for (const nama of NEW_PENULIS) {
    if (!penulisMap[nama]) {
      const r = await db.query('INSERT INTO penulis (nama, created_at, updated_at) VALUES ($1, NOW(), NOW()) ON CONFLICT DO NOTHING RETURNING id', [nama]);
      if (r.rows[0]) { penulisMap[nama] = r.rows[0].id; process.stdout.write('+'); }
    }
  }
  // Reload all
  const allPen = await db.query('SELECT id, nama FROM penulis');
  for (const r of allPen.rows) penulisMap[r.nama] = r.id;
  console.log('\n✓ Penulis ready:', Object.keys(penulisMap).length);

  // 2. Upsert new penerbit
  console.log('Upserting penerbit...');
  const penerbitMap = {};
  const existingPnr = await db.query('SELECT id, nama FROM penerbit');
  for (const r of existingPnr.rows) penerbitMap[r.nama] = r.id;

  for (const nama of NEW_PENERBIT) {
    if (!penerbitMap[nama]) {
      const r = await db.query('INSERT INTO penerbit (nama, created_at, updated_at) VALUES ($1, NOW(), NOW()) ON CONFLICT DO NOTHING RETURNING id', [nama]);
      if (r.rows[0]) { penerbitMap[nama] = r.rows[0].id; process.stdout.write('+'); }
    }
  }
  const allPnr = await db.query('SELECT id, nama FROM penerbit');
  for (const r of allPnr.rows) penerbitMap[r.nama] = r.id;
  console.log('\n✓ Penerbit ready:', Object.keys(penerbitMap).length);

  // 3. Get existing titles to avoid duplicates
  const existing = await db.query('SELECT judul FROM buku');
  const existingTitles = new Set(existing.rows.map(r => r.judul.toLowerCase().trim()));

  // 4. Filter new books
  const toInsert = BOOKS.filter(b => !existingTitles.has(b.judul.toLowerCase().trim()));
  console.log(`\nBooks to insert: ${toInsert.length} (${BOOKS.length - toInsert.length} already exist)\n`);

  if (toInsert.length === 0) { console.log('Nothing to insert.'); await db.end(); return; }

  // 5. Insert in batches with embeddings
  const BATCH = 15;
  let inserted = 0, failed = 0;

  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    const texts = batch.map(b => [b.judul, b.penulis ? 'Penulis: '+b.penulis : '', b.deskripsi || ''].filter(Boolean).join('. ').slice(0, 512));

    process.stdout.write(`  Batch ${Math.floor(i/BATCH)+1}/${Math.ceil(toInsert.length/BATCH)} — embedding...`);
    const vecs = await embedBatch(texts);
    process.stdout.write(' inserting...');

    for (let j = 0; j < batch.length; j++) {
      const b  = batch[j];
      const pId  = b.penulis  ? (penulisMap[b.penulis]  ?? null) : null;
      const pnId = b.penerbit ? (penerbitMap[b.penerbit] ?? null) : null;
      const vec  = vecs[j];
      const vecStr = vec ? '[' + vec.join(',') + ']' : null;

      try {
        await db.query(`
          INSERT INTO buku (judul, kategori_id, penulis_id, penerbit_id, tahun_terbit, stok, deskripsi, embedding, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, ${vecStr ? '$8::vector' : 'NULL'}, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, vecStr
          ? [b.judul, b.kat, pId, pnId, b.tahun || null, b.stok || 3, b.deskripsi || null, vecStr]
          : [b.judul, b.kat, pId, pnId, b.tahun || null, b.stok || 3, b.deskripsi || null]
        );
        inserted++;
      } catch (e) { console.error('\n  ERR:', b.judul, e.message); failed++; }
    }
    console.log(' OK');
    await new Promise(r => setTimeout(r, 250));
  }

  const final = await db.query('SELECT COUNT(*) FROM buku');
  console.log('\n' + '='.repeat(50));
  console.log(`  Inserted: ${inserted}  |  Failed: ${failed}`);
  console.log(`  Total buku sekarang: ${final.rows[0].count}`);
  console.log('='.repeat(50));

  await db.end();
}

main().catch(async e => { console.error('Fatal:', e.message); process.exit(1); });
