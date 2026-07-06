const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { kimlikDogrula } = require('../middleware/auth');

const router = express.Router();

const girisSemasi = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin.'),
  sifre: z.string().min(1, 'Şifre zorunludur.'),
  beniHatirla: z.boolean().optional(),
});

function tokenOlustur(user, uzunOmurlu) {
  return jwt.sign(
    { id: user.id, email: user.email, rol: user.rol, adSoyad: user.adSoyad },
    process.env.JWT_SECRET,
    { expiresIn: uzunOmurlu ? '30d' : '12h' }
  );
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const sonuc = girisSemasi.safeParse(req.body);
  if (!sonuc.success) {
    return res.status(400).json({ hata: sonuc.error.errors[0].message });
  }
  const { email, sifre, beniHatirla } = sonuc.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.aktif) {
    return res.status(401).json({ hata: 'E-posta veya şifre hatalı.' });
  }

  const dogruMu = await bcrypt.compare(sifre, user.sifreHash);
  if (!dogruMu) {
    return res.status(401).json({ hata: 'E-posta veya şifre hatalı.' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { sonGirisTarihi: new Date(), beniHatirla: !!beniHatirla },
  });

  await prisma.islemLog.create({
    data: {
      kullaniciId: user.id,
      islemTipi: 'GIRIS',
      modul: 'AUTH',
      ipAdresi: req.ip,
    },
  });

  const token = tokenOlustur(user, beniHatirla);
  res.json({
    token,
    kullanici: {
      id: user.id,
      adSoyad: user.adSoyad,
      email: user.email,
      rol: user.rol,
    },
  });
});

// GET /api/auth/me
router.get('/me', kimlikDogrula, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ hata: 'Kullanıcı bulunamadı.' });
  res.json({
    id: user.id,
    adSoyad: user.adSoyad,
    email: user.email,
    rol: user.rol,
    sonGirisTarihi: user.sonGirisTarihi,
  });
});

// POST /api/auth/sifre-degistir
const sifreDegistirSemasi = z.object({
  mevcutSifre: z.string().min(1),
  yeniSifre: z.string().min(6, 'Yeni şifre en az 6 karakter olmalıdır.'),
});

router.post('/sifre-degistir', kimlikDogrula, async (req, res) => {
  const sonuc = sifreDegistirSemasi.safeParse(req.body);
  if (!sonuc.success) {
    return res.status(400).json({ hata: sonuc.error.errors[0].message });
  }
  const { mevcutSifre, yeniSifre } = sonuc.data;

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const dogruMu = await bcrypt.compare(mevcutSifre, user.sifreHash);
  if (!dogruMu) {
    return res.status(400).json({ hata: 'Mevcut şifre hatalı.' });
  }

  const yeniHash = await bcrypt.hash(yeniSifre, 10);
  await prisma.user.update({ where: { id: user.id }, data: { sifreHash: yeniHash } });

  res.json({ mesaj: 'Şifreniz başarıyla güncellendi.' });
});

// POST /api/auth/cikis  (log kaydi icin, JWT stateless oldugundan client tarafinda token silinir)
router.post('/cikis', kimlikDogrula, async (req, res) => {
  await prisma.islemLog.create({
    data: {
      kullaniciId: req.user.id,
      islemTipi: 'CIKIS',
      modul: 'AUTH',
      ipAdresi: req.ip,
    },
  });
  res.json({ mesaj: 'Çıkış yapıldı.' });
});

module.exports = router;
