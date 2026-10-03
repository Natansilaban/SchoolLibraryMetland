import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const demoUser = await prisma.user.findFirst({
    where: { role: 'SISWA' },
    include: { anggota: true },
    orderBy: { id: 'asc' },
  });

  if (demoUser && demoUser.anggota) {
    // Delete all peminjaman for this demo user
    const result = await prisma.peminjaman.deleteMany({
      where: { anggotaId: demoUser.anggota.id },
    });
    console.log(`Deleted ${result.count} peminjaman for demo user`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
