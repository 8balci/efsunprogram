const express = require('express');
const multer = require('multer');
const path = require('path');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { kimlikDogrula } = require('../middleware/auth');

const router = express.Router();
router.use(kimlikDogrula);

const ODEME_TURLERI = ['NAKIT', 'KART', 'HAVALE', 'FAST', 'QR', 'DIGER'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const izinliTurler = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (izinliTurler.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Sadece JPG, PNG, WEBP veya PDF dosyaları yüklenebilir.'));
  },
});

// GET /api/gider/kategoriler
router.get('/kategoriler', async (req, res) => {
  const kategoriler = await prisma.giderKategori.findMany({ orderBy: { ad: 'asc' } });
  res.json(kategoriler);
});

// GET /api/gider
router.get('/', async (req, res) => {
  const { baslangic, bitis, kategoriId, sayfa = 1, adet = 50 } = req.query;
  const where = {};
  if (baslangic || bitis) {
    where.tarih = {};
    if (baslangic) where.tarih.gte = new Date(baslangic);
    if (bitis) where.tarih.lte = new Date(bitis);
  }
  if (kategoriId) where.kategoriId = kategoriId;

  const [kayitlar, toplam, toplamTutar] = await Promise.all([
    prisma.gider.findMany({
      where,
      orderBy: [{ tarih: 'desc' }, { saat: 'desc' }],
      skip: (parseInt(sayfa) - 1) * parseInt(adet),
      take: parseInt(adet),
      include: { kategori: true, ekleyen: { select: { adSoyad: true } } },
    }),
    prisma.gider.count({ where }),
    prisma.gider.aggregate({ where, _sum: { tutar: true } }),
  ]);

  res.json({ kayitlar, toplam, toplamTutar: Number(toplamTutar._sum.tutar || 0) });
});

const giderSemasi = z.object({
  tarih: z.string(),
  tutar: z.coerce.number().positive('Tutar sıfırdan büyük olmalıdır.'),
  kategoriId: z.string().min(1, 'Kategori zorunludur.'),
  aciklama: z.string().optional(),
  odemeTuru: z.enum(ODEME_TURLERI).default('NAKIT'),
});

// POST /api/gider  (multipart/form-data; alan adi: belge)
router.post('/', upload.single('belge'), async (req, res) => {
  const sonuc = giderSemasi.safeParse(req.body);
  if (!sonuc.success) return res.status(400).json({ hata: sonuc.error.errors[0].message });

  const bugun = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
  const kasaGunu = await prisma.kasaGunu.findUnique({ where: { tarih: bugun } });

  const gider = await prisma.gider.create({
    data: {
      tarih: new Date(sonuc.data.tarih),
      tutar: sonuc.data.tutar,
      kategoriId: sonuc.data.kategoriId,
      aciklama: sonuc.data.aciklama,
      odemeTuru: sonuc.data.odemeTuru,
      belgeUrl: req.file ? `/uploads/${req.file.filename}` : null,
      ekleyenId: req.user.id,
      kasaGunuId: kasaGunu ? kasaGunu.id : null,
    },
    include: { kategori: true },
  });

  await prisma.islemLog.create({
    data: { kullaniciId: req.user.id, islemTipi: 'OLUSTURMA', modul: 'GIDER', aciklama: `${gider.tutar} TL gider eklendi`, ipAdresi: req.ip },
  });

  res.status(201).json(gider);
});

// DELETE /api/gider/:id
router.delete('/:id', async (req, res) => {
  const gider = await prisma.gider.findUnique({ where: { id: req.params.id } });
  if (!gider) return res.status(404).json({ hata: 'Kayıt bulunamadı.' });

  await prisma.gider.delete({ where: { id: req.params.id } });
  await prisma.islemLog.create({
    data: { kullaniciId: req.user.id, islemTipi: 'SILME', modul: 'GIDER', aciklama: `${gider.tutar} TL gider silindi`, ipAdresi: req.ip },
  });

  res.json({ mesaj: 'Gider kaydı silindi.' });
});

module.exports = router;
