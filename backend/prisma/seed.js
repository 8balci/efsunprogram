// Varsayilan yonetici kullanicisi ve gider kategorilerini olusturur.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const VARSAYILAN_GIDER_KATEGORILERI = [
  'Elektrik', 'Su', 'Doğalgaz', 'Telefon', 'İnternet', 'Muhasebeci', 'Vergi',
  'Kira', 'POS Komisyonu', 'Yakıt', 'Personel', 'Ürün Alımı', 'Toptancı Ödemesi',
  'Temizlik', 'Bakım', 'Tamir', 'Reklam', 'Ambalaj', 'Poşet', 'Kargo', 'Sigorta',
  'Aidat', 'Diğer',
];

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@efsunmarket.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Efsun2026!';

  const mevcutAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!mevcutAdmin) {
    const sifreHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        adSoyad: 'Yönetici',
        email: adminEmail,
        sifreHash,
        rol: 'YONETICI',
      },
    });
    console.log(`Yönetici kullanıcı oluşturuldu -> email: ${adminEmail} / şifre: ${adminPassword}`);
  } else {
    console.log('Yönetici kullanıcı zaten mevcut, atlanıyor.');
  }

  for (const ad of VARSAYILAN_GIDER_KATEGORILERI) {
    await prisma.giderKategori.upsert({
      where: { ad },
      update: {},
      create: { ad, varsayilan: true },
    });
  }
  console.log(`${VARSAYILAN_GIDER_KATEGORILERI.length} gider kategorisi hazır.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
