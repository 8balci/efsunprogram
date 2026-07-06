const jwt = require('jsonwebtoken');

/**
 * Authorization header'indan JWT dogrular ve req.user'a kullanici bilgisini ekler.
 */
function kimlikDogrula(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ hata: 'Oturum bulunamadı. Lütfen giriş yapın.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, rol, adSoyad }
    next();
  } catch (err) {
    return res.status(401).json({ hata: 'Oturum süresi dolmuş veya geçersiz. Lütfen tekrar giriş yapın.' });
  }
}

/**
 * Belirli rollere sahip kullanicilarin erisimine izin verir.
 * Kullanim: yetkiKontrol('YONETICI', 'MUHASEBE')
 */
function yetkiKontrol(...izinliRoller) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ hata: 'Oturum bulunamadı.' });
    }
    if (!izinliRoller.includes(req.user.rol)) {
      return res.status(403).json({ hata: 'Bu işlem için yetkiniz bulunmuyor.' });
    }
    next();
  };
}

module.exports = { kimlikDogrula, yetkiKontrol };
