const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { kimlikDogrula } = require('../middleware/auth');

const router = express.Router();
router.use(kimlikDogrula);

function bugunTarihi() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

// GET /api/kasa/bugun -> bugunun kasa durumu (yoksa null doner)
router.get('/bugun', async (req, res) => {
  const kasa = await prisma.kasaGunu.findUnique({
    where: { tarih: bugunTarihi() },
    include: {
      _count: { select: { gelirler: true, giderler: true } },
    },
  });
  res.json(kasa);
});

// GET /api/kasa -> gecmis kasa gunleri (sayfali)
router.get('/', async (req, res) => {
  const sayfa = parseInt(req.query.sayfa) || 1;
  const adet = parseInt(req.query.adet) || 20;
  const [kayitlar, toplam] = await Promise.all([
    prisma.kasaGunu.findMany({
      orderBy: { tarih: 'desc' },
      skip: (sayfa - 1) * adet,
      take: adet,
    }),
    prisma.kasaGunu.count(),
  ]);
  res.json({ kayitlar, toplam, sayfa, adet });
});

const acSemasi = z.object({
  acilisTutari: z.number().nonnegative('Açılış tutarı negatif olamaz.'),
  not: z.string().optional(),
});

// POST /api/kasa/ac
router.post('/ac', async (req, res) => {
  const sonuc = acSemasi.safeParse(req.body);
  if (!sonuc.success) return res.status(400).json({ hata: sonuc.error.errors[0].message });

  const tarih = bugunTarihi();
  const mevcut = await prisma.kasaGunu.findUnique({ where: { tarih } });
  if (mevcut) {
    return res.status(409).json({ hata: 'Bugün için kasa zaten açılmış.' });
  }

  const kasa = await prisma.kasaGunu.create({
    data: {
      tarih,
      acilisTutari: sonuc.data.acilisTutari,
      acilisNot: sonuc.data.not,
      acanKullaniciId: req.user.id,
      durum: 'ACIK',
    },
  });

  await prisma.islemLog.create({
    data: { kullaniciId: req.user.id, islemTipi: 'OLUSTURMA', modul: 'KASA', aciklama: 'Kasa açıldı', ipAdresi: req.ip },
  });

  res.status(201).json(kasa);
});

const kapatSemasi = z.object({
  sayilanGercekKasa: z.number().nonnegative('Tutar negatif olamaz.'),
  not: z.string().optional(),
});

// POST /api/kasa/:id/kapat
router.post('/:id/kapat', async (req, res) => {
  const sonuc = kapatSemasi.safeParse(req.body);
  if (!sonuc.success) return res.status(400).json({ hata: sonuc.error.errors[0].message });

  const kasa = await prisma.kasaGunu.findUnique({ where: { id: req.params.id } });
  if (!kasa) return res.status(404).json({ hata: 'Kasa kaydı bulunamadı.' });
  if (kasa.durum === 'KAPALI') return res.status(409).json({ hata: 'Bu kasa zaten kapatılmış.' });

  const [gelirToplam, giderToplam] = await Promise.all([
    prisma.gelir.aggregate({ where: { kasaGunuId: kasa.id }, _sum: { tutar: true } }),
    prisma.gider.aggregate({ where: { kasaGunuId: kasa.id }, _sum: { tutar: true } }),
  ]);

  const toplamGelir = Number(gelirToplam._sum.tutar || 0);
  const toplamGider = Number(giderToplam._sum.tutar || 0);
  const acilisTutari = Number(kasa.acilisTutari);
  const beklenenKasa = acilisTutari + toplamGelir - toplamGider;
  const sayilanGercekKasa = sonuc.data.sayilanGercekKasa;
  const kasaFarki = sayilanGercekKasa - beklenenKasa;

  const guncellenmis = await prisma.kasaGunu.update({
    where: { id: kasa.id },
    data: {
      durum: 'KAPALI',
      toplamGelir,
      toplamGider,
      beklenenKasa,
      sayilanGercekKasa,
      kasaFarki,
      kapanisSaat: new Date(),
      kapanisNot: sonuc.data.not,
      kapatanKullaniciId: req.user.id,
    },
  });

  await prisma.islemLog.create({
    data: { kullaniciId: req.user.id, islemTipi: 'GUNCELLEME', modul: 'KASA', aciklama: `Kasa kapatıldı, fark: ${kasaFarki}`, ipAdresi: req.ip },
  });

  res.json(guncellenmis);
});

module.exports = router;
