const express = require('express');
const prisma = require('../utils/prisma');
const { kimlikDogrula } = require('../middleware/auth');

const router = express.Router();
router.use(kimlikDogrula);

function gunBaslangici(d = new Date()) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}
function ayBaslangici(d = new Date()) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1));
}

// GET /api/dashboard -> tum kartlar icin canli veri
router.get('/', async (req, res) => {
  const bugun = gunBaslangici();
  const ayBasi = ayBaslangici();

  const [
    kasaGunu,
    bugunGelir,
    bugunGider,
    ayGelir,
    ayGider,
    sonGelirler,
    sonGiderler,
  ] = await Promise.all([
    prisma.kasaGunu.findUnique({ where: { tarih: bugun } }),
    prisma.gelir.aggregate({ where: { tarih: { gte: bugun } }, _sum: { tutar: true } }),
    prisma.gider.aggregate({ where: { tarih: { gte: bugun } }, _sum: { tutar: true } }),
    prisma.gelir.aggregate({ where: { tarih: { gte: ayBasi } }, _sum: { tutar: true } }),
    prisma.gider.aggregate({ where: { tarih: { gte: ayBasi } }, _sum: { tutar: true } }),
    prisma.gelir.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { ekleyen: { select: { adSoyad: true } } } }),
    prisma.gider.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { kategori: true, ekleyen: { select: { adSoyad: true } } } }),
  ]);

  const bugunGelirTutar = Number(bugunGelir._sum.tutar || 0);
  const bugunGiderTutar = Number(bugunGider._sum.tutar || 0);
  const ayGelirTutar = Number(ayGelir._sum.tutar || 0);
  const ayGiderTutar = Number(ayGider._sum.tutar || 0);

  const guncelNakit = kasaGunu
    ? Number(kasaGunu.acilisTutari) + bugunGelirTutar - bugunGiderTutar
    : 0;

  const sonIslemler = [...sonGelirler.map(g => ({
      tip: 'GELIR', id: g.id, tutar: Number(g.tutar), aciklama: g.kategori, tarih: g.tarih, saat: g.saat, ekleyen: g.ekleyen?.adSoyad,
    })), ...sonGiderler.map(g => ({
      tip: 'GIDER', id: g.id, tutar: Number(g.tutar), aciklama: g.kategori?.ad, tarih: g.tarih, saat: g.saat, ekleyen: g.ekleyen?.adSoyad,
    }))]
    .sort((a, b) => new Date(b.saat) - new Date(a.saat))
    .slice(0, 8);

  res.json({
    kasa: {
      durum: kasaGunu ? kasaGunu.durum : 'YOK', // ACIK, KAPALI, YOK (bugün açılmamış)
      acilisTutari: kasaGunu ? Number(kasaGunu.acilisTutari) : 0,
      guncelNakit,
      kasaFarki: kasaGunu?.kasaFarki !== null && kasaGunu?.kasaFarki !== undefined ? Number(kasaGunu.kasaFarki) : null,
    },
    bugun: {
      gelir: bugunGelirTutar,
      gider: bugunGiderTutar,
      netKar: bugunGelirTutar - bugunGiderTutar,
    },
    buAy: {
      gelir: ayGelirTutar,
      gider: ayGiderTutar,
      netKar: ayGelirTutar - ayGiderTutar,
    },
    // Sonraki fazlarda (Veresiye, Ürün/Stok, POS) doldurulacak alanlar:
    veresiye: { toplamBorc: 0, tahsilEdilecek: 0, hazir: false },
    stok: { toplamUrun: 0, azalanStokSayisi: 0, hazir: false },
    satis: { bugunkuSatisSayisi: 0, toplamMusteri: 0, hazir: false },
    yaklasanOdemeler: { adet: 0, hazir: false },
    sonIslemler,
    sonGelirler: sonGelirler.map(g => ({ id: g.id, tutar: Number(g.tutar), kategori: g.kategori, tarih: g.tarih })),
    sonGiderler: sonGiderler.map(g => ({ id: g.id, tutar: Number(g.tutar), kategori: g.kategori?.ad, tarih: g.tarih })),
  });
});

module.exports = router;
