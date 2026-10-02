const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
dotenv.config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const categoriesData = [
  'Kuliner & Tata Boga',
  'Perhotelan & Pariwisata',
  'Teknologi Informasi & Komputer',
  'Bisnis & Kewirausahaan',
  'Sastra & Fiksi',
  'Sains Alam & Matematika',
  'Sejarah & Sosial Budaya',
  'Bahasa & Komunikasi'
];

const publishers = ['Gramedia Pustaka Utama', 'Erlangga', 'Mizan Pustaka', 'Andi Publisher', 'Balai Pustaka', 'Elex Media Komputindo', 'Penerbit Buku Kedokteran EGC', 'Informatika Bandung'];
const authors = ['Andrea Hirata', 'Tere Liye', 'Budi Santoso', 'Joko Widodo', 'Dewi Lestari', 'Eka Kurniawan', 'Chef Juna', 'Chef William Wongso', 'Sandhika Galih', 'Romi Satria Wahono', 'Prof. Dr. B.J. Habibie', 'Prof. Yohanes Surya', 'Dr. Boyke'];

const books = [
  { t: "Resep Rahasia Masakan Padang", d: "Panduan memasak rendang, gulai, dan sate padang asli dengan bumbu rempah tradisional pilihan." },
  { t: "Seni Plating Fine Dining", d: "Teknik menata makanan di piring untuk restoran bintang lima. Meningkatkan estetika hidangan." },
  { t: "Baking 101: Roti dan Pastry", d: "Buku dasar membuat roti, croissant, dan kue kering dengan teknik fermentasi yang benar." },
  { t: "Manajemen Dapur Komersial", d: "Cara mengelola stok bahan makanan, kebersihan, dan efisiensi waktu di dapur restoran besar." },
  { t: "Resep Makanan Sehat Diet", d: "Kumpulan menu masakan rendah kalori, gluten-free, dan vegan untuk gaya hidup sehat." },
  { t: "Sejarah Kuliner Nusantara", d: "Mempelajari asal-usul masakan daerah Indonesia dari Sabang sampai Merauke." },
  { t: "Teknik Barista: Racikan Kopi", d: "Panduan lengkap membuat espresso, latte art, dan manual brew ala kedai kopi modern." },
  { t: "Rahasia Dimsum Restoran", d: "Cara membuat kulit dimsum, isian siomay, hakau, dan teknik mengukus ala chef oriental." },
  { t: "Buku Pintar Pembuatan Kue Tradisional", d: "Melestarikan jajanan pasar seperti klepon, kue putu, dan lapis legit dengan resep nenek moyang." },
  { t: "Food Photography & Styling", d: "Cara menata dan memotret makanan agar terlihat menggugah selera untuk keperluan media sosial." },
  { t: "Mixology: Seni Minuman Mocktail", d: "Kumpulan resep minuman segar tanpa alkohol menggunakan sirup, buah, dan soda." },
  { t: "Hygiene dan Sanitasi Makanan", d: "Standar kebersihan dalam mengolah dan menyajikan makanan agar terhindar dari kontaminasi bakteri." },
  { t: "Masakan Jepang Populer", d: "Resep rumahan ala Jepang: Sushi, Ramen, Takoyaki, dan Chicken Katsu yang mudah dibuat." },
  { t: "Teknik Sous Vide untuk Pemula", d: "Memasak daging steak dengan suhu presisi menggunakan metode sous vide agar empuk sempurna." },
  { t: "Bisnis Katering Rumahan", d: "Strategi memulai usaha katering dari dapur rumah, menghitung HPP, dan manajemen menu harian." },
  { t: "Manajemen Front Office Hotel", d: "Standar operasional resepsionis, penanganan tamu, dan sistem reservasi kamar hotel." },
  { t: "Housekeeping: Tata Graha Profesional", d: "Teknik membersihkan kamar hotel, penataan tempat tidur, dan penggunaan alat kebersihan industri." },
  { t: "Pemandu Wisata Profesional", d: "Keterampilan public speaking dan pengetahuan lokal untuk menjadi tour guide bersertifikat." },
  { t: "Pengantar Industri Pariwisata", d: "Mengenal konsep pariwisata berkelanjutan, ekowisata, dan dampak ekonomi wisata bagi daerah." },
  { t: "Etika Layanan Food & Beverage", d: "Aturan table manner, cara menyajikan makanan, dan standar pelayanan waiter di restoran fine dining." },
  { t: "Strategi Pemasaran Hotel", d: "Cara meningkatkan okupansi kamar melalui digital marketing dan kerjasama Online Travel Agent (OTA)." },
  { t: "Manajemen Event dan MICE", d: "Panduan merencanakan pameran, konferensi, dan acara pernikahan di ballroom hotel." },
  { t: "Bahasa Inggris untuk Perhotelan", d: "Percakapan sehari-hari dan kosakata khusus bahasa Inggris bagi staf hotel saat melayani tamu asing." },
  { t: "Resolusi Konflik dengan Tamu", d: "Teknik handling complaint dan menenangkan tamu yang marah agar tetap menjaga reputasi hotel." },
  { t: "Audit Keuangan Perhotelan", d: "Sistem pelaporan pendapatan kamar, restoran, dan rekonsiliasi kas harian hotel (Night Audit)." },
  { t: "Ekowisata dan Konservasi Alam", d: "Mengembangkan destinasi wisata alam tanpa merusak lingkungan hidup dan memberdayakan warga lokal." },
  { t: "Desain Interior Hotel Butik", d: "Tren arsitektur dan penataan ruang hotel butik untuk memberikan pengalaman menginap yang unik." },
  { t: "Keselamatan Kerja di Perhotelan", d: "SOP penanganan kebakaran, kecelakaan kerja, dan evakuasi darurat di gedung perhotelan." },
  { t: "Manajemen Restoran dan Bar", d: "Mengelola operasional harian restoran, menyusun menu, dan memastikan kualitas layanan." },
  { t: "Tren Pariwisata Pasca Pandemi", d: "Analisis perubahan perilaku wisatawan yang lebih memilih wisata privat, alam, dan kebersihan tinggi." },
  { t: "Algoritma dan Struktur Data", d: "Konsep dasar pemrograman, array, linked list, tree, dan algoritma sorting untuk mahasiswa Informatika." },
  { t: "Mastering React dan Next.js", d: "Membangun aplikasi web modern dengan Server-Side Rendering, App Router, dan Tailwind CSS." },
  { t: "Pengantar Kecerdasan Buatan (AI)", d: "Buku dasar pengenalan Machine Learning, Neural Networks, dan implementasi AI di dunia nyata." },
  { t: "Jaringan Komputer Lanjut", d: "Panduan konfigurasi router Cisco, subnetting IP, firewall, dan protokol TCP/IP tingkat mahir." },
  { t: "Keamanan Siber dan Etika Hacking", d: "Teknik penetration testing, mencari celah keamanan aplikasi, dan mencegah serangan malware." },
  { t: "Belajar Pemrograman Python", d: "Buku wajib pemula untuk memahami syntax Python, manipulasi string, dan pembuatan script otomatisasi." },
  { t: "Data Science dengan Pandas", d: "Cara mengolah dataset besar, visualisasi data, dan pemodelan prediktif menggunakan pustaka Python." },
  { t: "Arsitektur Microservices", d: "Memecah aplikasi monolitik menjadi layanan kecil menggunakan Docker, Kubernetes, dan API Gateway." },
  { t: "Desain UI/UX untuk Pemula", d: "Membuat antarmuka pengguna yang indah dan mudah digunakan menggunakan Figma dan prinsip wireframing." },
  { t: "Manajemen Basis Data SQL", d: "Menulis query SQL yang efisien, normalisasi tabel, dan manajemen transaksi di PostgreSQL dan MySQL." },
  { t: "Pemrograman Aplikasi Android", d: "Membuat aplikasi mobile native menggunakan Kotlin dan Android Studio dengan arsitektur MVVM." },
  { t: "Cloud Computing dengan AWS", d: "Panduan mendeploy aplikasi ke cloud, mengatur load balancer, dan menggunakan layanan S3 dan EC2." },
  { t: "Blockchain dan Smart Contract", d: "Memahami desentralisasi mata uang kripto dan cara menulis smart contract menggunakan Solidity." },
  { t: "Sistem Operasi Linux", d: "Perintah dasar terminal bash, manajemen user, dan konfigurasi server berbasis Ubuntu Linux." },
  { t: "Game Development dengan Unity", d: "Membuat game 2D dan 3D interaktif menggunakan bahasa C# dan engine Unity." },
  { t: "Strategi Digital Marketing", d: "Cara mengoptimalkan iklan di Facebook, Instagram, dan Google Ads untuk meningkatkan penjualan UMKM." },
  { t: "Akuntansi untuk Usaha Kecil", d: "Membuat laporan laba rugi, neraca, dan arus kas sederhana tanpa perlu latar belakang akuntansi." },
  { t: "Manajemen SDM Modern", d: "Teknik rekrutmen karyawan, penilaian kinerja, dan menciptakan budaya kerja yang positif di perusahaan." },
  { t: "Prinsip Investasi Saham", d: "Analisis fundamental dan teknikal untuk pemula yang ingin mulai berinvestasi di pasar modal." },
  { t: "Kewirausahaan Sosial", d: "Membangun bisnis yang tidak hanya mengejar profit, tapi juga memberikan dampak positif bagi masyarakat." },
  { t: "Teknik Negosiasi Bisnis", d: "Strategi memenangkan kesepakatan B2B, teknik persuasi, dan cara membaca bahasa tubuh klien." },
  { t: "Membangun Brand Identity", d: "Langkah-langkah menciptakan logo, visi misi, dan ciri khas merek yang mudah diingat konsumen." },
  { t: "Manajemen Rantai Pasok", d: "Mengoptimalkan logistik, manajemen gudang, dan distribusi barang dari pabrik ke tangan konsumen." },
  { t: "Hukum Bisnis dan Kontrak", d: "Penjelasan legalitas usaha, pendirian PT/CV, HAKI, dan penyusunan surat perjanjian kerjasama." },
  { t: "Rahasia Sukses E-Commerce", d: "Tips berjualan laris di marketplace, optimasi SEO produk, dan strategi flash sale." },
  { t: "Ekonomi Makro Terapan", d: "Memahami inflasi, suku bunga, dan kebijakan moneter yang mempengaruhi keputusan bisnis makro." },
  { t: "Pitching ke Investor", d: "Cara membuat presentasi pitch deck yang meyakinkan Venture Capital untuk mendanai startup Anda." },
  { t: "Bisnis Waralaba (Franchise)", d: "Panduan membeli, mengelola, atau menyusun sistem kemitraan franchise restoran dan minimarket." },
  { t: "Manajemen Risiko Perusahaan", d: "Cara mengidentifikasi, mengukur, dan memitigasi risiko kerugian dalam ekspansi bisnis besar." },
  { t: "Customer Relationship Management", d: "Menjaga loyalitas pelanggan dengan program membership, layanan purna jual, dan software CRM." },
  { t: "Bumi Manusia", d: "Kisah cinta dan perlawanan Minke di era kolonial Hindia Belanda. Sebuah mahakarya sastra Indonesia." },
  { t: "Laskar Pelangi", d: "Perjuangan 10 anak desa di Belitung untuk mendapatkan pendidikan yang layak meski di tengah kemiskinan." },
  { t: "Cantik Itu Luka", d: "Kisah epik magis realisme tentang kutukan kecantikan sebuah keluarga di kota fiksi Halimunda." },
  { t: "Supernova: Ksatria, Puteri, dan Bintang Jatuh", d: "Novel sains fiksi romantis yang memadukan teori fisika kuantum dengan kehidupan urban Jakarta." },
  { t: "Hujan", d: "Kisah cinta masa depan di mana teknologi mampu menghapus ingatan tentang kenangan menyakitkan." },
  { t: "Laut Bercerita", d: "Novel sejarah kelam tentang penculikan aktivis mahasiswa di era reformasi 1998." },
  { t: "Pulang", d: "Kisah perjalanan seorang mantan pembunuh bayaran internasional yang merindukan kedamaian kampung halamannya." },
  { t: "Tenggelamnya Kapal Van der Wijck", d: "Kisah tragis Zainuddin dan Hayati yang terhalang adat Minangkabau di masa kolonial." },
  { t: "Ronggeng Dukuh Paruk", d: "Kehidupan penari ronggeng Srintil dan pergolakan politik desa miskin di tahun 1965." },
  { t: "Gadis Kretek", d: "Pencarian cinta masa lalu seorang pengusaha rokok kretek yang mengupas sejarah industri kretek lokal." },
  { t: "Perahu Kertas", d: "Dinamika persahabatan dan cinta antara Kugy dan Keenan dalam meraih mimpi dan keajaiban." },
  { t: "Negeri 5 Menara", d: "Perjuangan santri di pondok pesantren Madani untuk menggapai mimpi berkeliling dunia lewat pepatah Man Jadda Wajada." },
  { t: "Aroma Karsa", d: "Petualangan pencarian bunga langka beraroma magis yang menyimpan rahasia kutukan kuno dari zaman Majapahit." },
  { t: "Bidadari-Bidadari Surga", d: "Kisah pengorbanan seorang kakak perempuan yang rela menunda kebahagiaannya demi menyekolahkan adik-adiknya." },
  { t: "Marmut Merah Jambu", d: "Kumpulan cerita komedi romantis tentang pengalaman cinta masa sekolah yang konyol dan tak terlupakan." },
  { t: "Kalkulus Edisi Kesembilan", d: "Buku referensi wajib mahasiswa teknik untuk memahami limit, turunan, dan integral secara mendalam." },
  { t: "Fisika Dasar Universitas", d: "Mekanika klasik, termodinamika, elektromagnetisme, dan optik dengan pendekatan problem-solving." },
  { t: "Biologi Molekuler Sel", d: "Struktur DNA, pembelahan sel, sintesis protein, dan mekanisme genetik makhluk hidup tingkat seluler." },
  { t: "Kimia Organik Lanjut", d: "Reaksi senyawa hidrokarbon, polimer, alkohol, dan aplikasinya dalam industri farmasi dan medis." },
  { t: "Kosmologi dan Alam Semesta", d: "Membahas teori Big Bang, lubang hitam (black hole), materi gelap, dan perluasan alam semesta." },
  { t: "Matematika Diskrit", d: "Logika himpunan, teori graf, kombinatorika, dan peluang yang menjadi dasar ilmu komputer." },
  { t: "Anatomi dan Fisiologi Manusia", d: "Buku panduan ilmu kedokteran dasar yang membahas sistem saraf, pencernaan, peredaran darah, dan tulang." },
  { t: "Pengantar Ilmu Penyakit (Patologi)", d: "Buku kedokteran yang membahas mekanisme virus, bakteri, dan sel kanker dalam merusak jaringan tubuh sehat." },
  { t: "Farmakologi Kedokteran", d: "Buku kedokteran tentang interaksi obat-obatan kimia dengan reseptor tubuh manusia untuk menyembuhkan penyakit." },
  { t: "Statistika Terapan", d: "Cara menghitung probabilitas, uji hipotesis, dan regresi linier untuk analisis data penelitian sains." },
  { t: "Genetika Evolusioner", d: "Teori evolusi Darwin, seleksi alam, dan mutasi genetik yang membentuk keanekaragaman hayati bumi." },
  { t: "Fisika Kuantum untuk Pemula", d: "Pengenalan dunia sub-atomik, prinsip ketidakpastian Heisenberg, dan dualitas gelombang-partikel cahaya." },
  { t: "Kimia Lingkungan", d: "Analisis dampak polusi logam berat, efek rumah kaca, dan solusi energi terbarukan secara kimiawi." },
  { t: "Botani Tumbuhan Berpembuluh", d: "Morfologi, anatomi, dan taksonomi tumbuhan tingkat tinggi serta siklus fotosintesis fotosistem." },
  { t: "Kalkulus Multivariabel", d: "Perluasan ilmu kalkulus untuk ruang tiga dimensi, turunan parsial, dan integral lipat ganda." },
  { t: "Sejarah Nasional Indonesia Jilid I", d: "Zaman prasejarah dan kerajaan Hindu-Buddha di Nusantara. Menelusuri kejayaan Sriwijaya dan Majapahit." },
  { t: "Sosiologi Suatu Pengantar", d: "Konsep dasar interaksi sosial, stratifikasi masyarakat, konflik kelas, dan perubahan kebudayaan." },
  { t: "Antropologi Budaya", d: "Mempelajari keragaman suku bangsa, adat istiadat, ritual keagamaan, dan bahasa lokal di seluruh dunia." },
  { t: "Perang Dunia Kedua di Pasifik", d: "Kronologi pengeboman Pearl Harbor, pendudukan Jepang di Indonesia, hingga bom atom Hiroshima." },
  { t: "Filsafat Ilmu dan Logika", d: "Dasar pemikiran filsuf Yunani Kuno (Plato, Aristoteles) dan epistemologi pencarian kebenaran mutlak." },
  { t: "Politik Luar Negeri Indonesia", d: "Sejarah diplomasi bebas aktif, Konferensi Asia Afrika, dan peran RI dalam perdamaian PBB." },
  { t: "Psikologi Perkembangan Anak", d: "Teori perkembangan kognitif, emosional, dan motorik anak sejak usia dini hingga masa pubertas." },
  { t: "Sejarah Kerajaan Islam Nusantara", d: "Perkembangan Kesultanan Demak, Mataram, Aceh, dan Gowa-Tallo dalam jalur perdagangan rempah internasional." },
  { t: "Hukum Adat di Indonesia", d: "Kompilasi sistem hukum tidak tertulis peninggalan leluhur yang masih berlaku di desa-desa adat." },
  { t: "Komunikasi Massa", d: "Pengaruh media cetak, televisi, dan internet terhadap opini publik, propaganda, dan perilaku masyarakat." },
  { t: "Mitologi Yunani dan Nordik", d: "Kisah dewa-dewi Olympus, Thor, Odin, dan legenda epik yang membentuk sastra peradaban Barat." },
  { t: "Dekolonisasi Asia Afrika", d: "Proses runtuhnya imperialisme Eropa dan lahirnya negara-negara merdeka di pertengahan abad ke-20." },
  { t: "Demografi dan Kependudukan", d: "Analisis piramida penduduk, migrasi, urbanisasi, dan ancaman ledakan populasi di negara berkembang." },
  { t: "Feminisme dan Kesetaraan Gender", d: "Sejarah gerakan perempuan menuntut hak pilih, kesetaraan gaji, dan penolakan diskriminasi patriarki." },
  { t: "Sejarah Perang Dingin", d: "Ketegangan ideologi antara Amerika Serikat dan Uni Soviet, perlombaan senjata nuklir, dan perang proksi." },
  { t: "Tata Bahasa Baku Bahasa Indonesia", d: "Pedoman resmi pembentukan kata, penyusunan kalimat efektif, dan aturan Ejaan Yang Disempurnakan (EYD)." },
  { t: "TOEFL Preparation Guide", d: "Latihan soal listening, reading, dan structure untuk mencapai skor TOEFL iBT di atas 100." },
  { t: "Public Speaking untuk Introvert", d: "Teknik mengatasi grogi, menyusun materi pidato, dan menguasai panggung presentasi dengan percaya diri." },
  { t: "Jurnalistik Dasar", d: "Cara menulis berita hard news, feature, teknik wawancara narasumber, dan etika pers yang objektif." },
  { t: "Bahasa Jepang Praktis N5", d: "Pengenalan huruf Hiragana, Katakana, dan tata bahasa dasar untuk lulus ujian sertifikasi JLPT N5." },
  { t: "Linguistik Umum", d: "Ilmu fonologi, morfologi, sintaksis, dan semantik untuk memahami struktur bahasa manusia secara ilmiah." },
  { t: "Komunikasi Interpersonal", d: "Seni mendengarkan aktif, membaca bahasa tubuh, dan membangun empati dalam percakapan sehari-hari." },
  { t: "Menulis Esai Akademik", d: "Panduan menyusun karya tulis ilmiah, skripsi, dan makalah dengan sitasi daftar pustaka yang benar." },
  { t: "Mastering English Grammar", d: "Penjelasan tenses lengkap, passive voice, conditionals, dan phrasal verbs dengan contoh penggunaan harian." },
  { t: "Bahasa Mandarin untuk Bisnis", d: "Kosakata bahasa Mandarin esensial untuk keperluan negosiasi, rapat, dan ekspor impor dengan China." },
  { t: "Copywriting: Seni Menjual dengan Tulisan", d: "Cara menulis caption media sosial, email marketing, dan landing page yang memicu konversi penjualan." },
  { t: "Kamus Sinonim dan Antonim", d: "Buku saku untuk memperkaya kosakata bahasa Indonesia agar tulisan tidak membosankan dan repetitif." },
  { t: "Retorika: Seni Berdebat", d: "Mempelajari falasi logika, teknik mematahkan argumen lawan, dan merancang silogisme yang masuk akal." },
  { t: "Bahasa Arab Dasar", d: "Pelajaran percakapan bahasa Arab sehari-hari, ilmu Nahwu, dan Shorof untuk pemula." },
  { t: "Komunikasi Lintas Budaya", d: "Memahami perbedaan gaya komunikasi antara orang Barat yang blak-blakan dan orang Timur yang menjaga harmoni." }
];

async function main() {
  console.log('🌱 Menghapus data buku lama...');
  await prisma.peminjaman.deleteMany();
  await prisma.buku.deleteMany();
  
  console.log('🌱 Mengambil referensi Kategori, Penulis, dan Penerbit...');
  const catRows = await prisma.kategori.findMany();
  const catMap = {};
  catRows.forEach(c => catMap[c.nama] = c.id);

  const authRows = await prisma.penulis.findMany();
  const authMap = {};
  authRows.forEach(a => authMap[a.nama] = a.id);

  const pubRows = await prisma.penerbit.findMany();
  const pubMap = {};
  pubRows.forEach(p => pubMap[p.nama] = p.id);

  console.log('📚 Menyemai 120 Buku Baru (15 per kategori)...');
  
  const createdBooks = [];
  
  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    const catIndex = Math.floor(i / 15);
    const catName = categoriesData[catIndex];
    const authorName = authors[i % authors.length];
    const publisherName = publishers[i % publishers.length];
    
    const isbn = `978-602-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9)}`;

    const newBook = await prisma.buku.create({
      data: {
        judul: b.t,
        isbn: isbn,
        tahunTerbit: 2020 + Math.floor(Math.random() * 5),
        stok: Math.floor(Math.random() * 10) + 2,
        deskripsi: b.d,
        kategoriId: catMap[catName],
        penulisId: authMap[authorName] || Object.values(authMap)[0],
        penerbitId: pubMap[publisherName] || Object.values(pubMap)[0],
        cover: null
      }
    });
    createdBooks.push(newBook.judul);
  }

  console.log(`✅ Berhasil menyimpan ${createdBooks.length} buku!`);
  console.log('\n=============================================');
  console.log('🚀 JANGAN LUPA RUN SCRIPT EMBEDDING JINA AI 🚀');
  console.log('=============================================');
  console.log('Jalankan: node prisma/migrate-jina-embeddings.js');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
