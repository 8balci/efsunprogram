const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { kimlikDogrula } = require('../middleware/auth');

const router = express.Router();
router.use(kimlikDogrula);

const ODEME_TURLERI = ['NAKIT', 'KART', 'HAVALE', 'FAST', 'QR', 'DIGER'];

const gelirSemasi = z.object({
  tarih: z.string(),
  tutar: z.number().positive('Tutar sıfırdan büyük olmalıdır.'),
  kategori: z.string().min(1, 'Kategori zorunludur.'),
  aciklama: z.string().optional(),
  odemeTuru: z.enum(ODEME_TURLERI).default('NAKIT'),
});

// GET /api/gelir?baslangic=&bitis=&kategori=&odemeTuru=
router.get('/', async (req, res) => {
  const { baslangic, bitis, kategori, odemeTuru, sayfa = 1, adet = 50 } = req.query;
  const where = {};
  if (baslangic || bitis) {
    where.tarih = {};
    if (baslangic) where.tarih.gte = new Date(baslangic);
    if (bitis) where.tarih.lte = new Date(bitis);
  }
  if (kategori) where.kategori = kategori;
  if (odemeTuru) where.odemeTuru = odemeTuru;

  const [kayitlar, toplam, toplamTutar] = await Promise.all([
    prisma.gelir.findMany({
      where,
      orderBy: [{ tarih: 'desc' }, { saat: 'desc' }],
      skip: (parseInt(sayfa) - 1) * parseInt(adet),
      take: parseInt(adet),
      include: { ekleyen: { select: { adSoyad: true } } },
    }),
    prisma.gelir.count({ where }),
    prisma.gelir.aggregate({ where, _sum: { tutar: true } }),
  ]);

  res.json({ kayitlar, toplam, toplamTutar: Number(toplamTutar._sum.tutar || 0) });
});

// POST /api/gelir
router.post('/', async (req, res) => {
  const sonuc = gelirSemasi.safeParse(req.body);
  if (!sonuc.success) return res.status(400).json({ hata: sonuc.error.errors[0].message });

  const bugun = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
  const kasaGunu = await prisma.kasaGunu.findUnique({ where: { tarih: bugun } });

  const gelir = await prisma.gelir.create({
    data: {
      tarih: new Date(sonuc.data.tarih),
      tutar: sonuc.data.tutar,
      kategori: sonuc.data.kategori,
      aciklama: sonuc.data.aciklama,
      odemeTuru: sonuc.data.odemeTuru,
      ekleyenId: req.user.id,
      kasaGunuId: kasaGunu ? kasaGunu.id : null,
    },
  });

  await prisma.islemLog.create({
    data: { kullaniciId: req.user.id, islemTipi: 'OLUSTURMA', modul: 'GELIR', aciklama: `${gelir.tutar} TL gelir eklendi`, ipAdresi: req.ip },
  });

  res.status(201).json(gelir);
});

// DELETE /api/gelir/:id
router.delete('/:id', async (req, res) => {
  const gelir = await prisma.gelir.findUnique({ where: { id: req.params.id } });
  if (!gelir) return res.status(404).json({ hata: 'Kayıt bulunamadı.' });

  await prisma.gelir.delete({ where: { id: req.params.id } });
  await prisma.islemLog.create({
    data: { kullaniciId: req.user.id, islemTipi: 'SILME', modul: 'GELIR', aciklama: `${gelir.tutar} TL gelir silindi`, ipAdresi: req.ip },
  });

  res.json({ mesaj: 'Gelir kaydı silindi.' });
});

module.exports = router;
