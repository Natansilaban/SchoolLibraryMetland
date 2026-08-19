require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database Metland Library...');

  // Create admin user
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
  console.log('✅ Admin created:', admin.email);

  // Create categories
  const categories = ['Fiksi', 'Non-Fiksi', 'Sains', 'Matematika', 'Sejarah', 'Bahasa', 'Teknologi', 'Seni & Budaya'];
  for (const nama of categories) {
    await prisma.kategori.upsert({
      where: { nama },
      update: {},
      create: { nama },
    });
  }
  console.log('✅ Kategori created:', categories.length);

  // Create authors
  const authors = ['Andrea Hirata', 'Pramoedya Ananta Toer', 'Tere Liye', 'Dewi Lestari', 'Habiburrahman El Shirazy'];
  for (const nama of authors) {
    const existing = await prisma.penulis.findFirst({ where: { nama } });
    if (!existing) await prisma.penulis.create({ data: { nama } });
  }
  console.log('✅ Penulis created');

  // Create publishers
  const publishers = [
    { nama: 'Gramedia Pustaka Utama', kota: 'Jakarta' },
    { nama: 'Mizan', kota: 'Bandung' },
    { nama: 'Erlangga', kota: 'Jakarta' },
  ];
  for (const p of publishers) {
    const existing = await prisma.penerbit.findFirst({ where: { nama: p.nama } });
    if (!existing) await prisma.penerbit.create({ data: p });
  }
  console.log('✅ Penerbit created');

  // Create sample books
  const kategoriAll = await prisma.kategori.findMany();
  const penulisAll = await prisma.penulis.findMany();
  const penerbitAll = await prisma.penerbit.findMany();

  const books = [
    { judul: 'Laskar Pelangi', isbn: '978-979-687-670-5', tahunTerbit: 2005, stok: 5, deskripsi: 'Novel karya Andrea Hirata tentang perjuangan anak-anak di Belitung.' },
    { judul: 'Bumi Manusia', isbn: '978-979-696-234-5', tahunTerbit: 1980, stok: 3, deskripsi: 'Karya monumental Pramoedya Ananta Toer.' },
    { judul: 'Negeri 5 Menara', isbn: '978-602-03-3082-0', tahunTerbit: 2009, stok: 4 },
    { judul: 'Ayat-Ayat Cinta', isbn: '978-979-538-212-0', tahunTerbit: 2004, stok: 6 },
    { judul: 'Supernova: Ksatria, Puteri, dan Bintang Jatuh', isbn: '978-602-01-0100-0', tahunTerbit: 2001, stok: 2 },
    { judul: 'Matematika Dasar SMA', isbn: null, tahunTerbit: 2020, stok: 10 },
    { judul: 'Fisika Modern', isbn: null, tahunTerbit: 2019, stok: 8 },
    { judul: 'Sejarah Indonesia Lengkap', isbn: null, tahunTerbit: 2018, stok: 6 },
  ];

  for (const book of books) {
    const existing = await prisma.buku.findFirst({ where: { judul: book.judul } });
    if (!existing) {
      await prisma.buku.create({
        data: {
          ...book,
          kategoriId: kategoriAll[Math.floor(Math.random() * kategoriAll.length)].id,
          penulisId: penulisAll[Math.floor(Math.random() * penulisAll.length)].id,
          penerbitId: penerbitAll[0].id,
        },
      });
    }
  }
  console.log('✅ Sample books created');

  // Create sample student
  const siswaHash = await bcrypt.hash('siswa123', 10);
  const existingSiswa = await prisma.user.findUnique({ where: { email: 'siswa@metland.sch.id' } });
  if (!existingSiswa) {
    await prisma.user.create({
      data: {
        email: 'siswa@metland.sch.id',
        password: siswaHash,
        role: 'SISWA',
        anggota: {
          create: {
            nama: 'Budi Santoso',
            nis: '2024001',
            kelas: '10A',
            noHp: '081234567890',
          },
        },
      },
    });
  }
  console.log('✅ Sample student created: siswa@metland.sch.id');

  console.log('\n🎉 Seeding selesai!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin Login:');
  console.log('  Email   : admin@metland.sch.id');
  console.log('  Password: admin123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Siswa Login:');
  console.log('  Email   : siswa@metland.sch.id');
  console.log('  Password: siswa123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
