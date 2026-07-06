require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const kasaRoutes = require('./routes/kasa');
const gelirRoutes = require('./routes/gelir');
const giderRoutes = require('./routes/gider');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 4000;

// uploads klasoru yoksa olustur
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Genel istek siniri (kaba kuvvet saldirilarina karsi)
const genelLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api/', genelLimiter);

const girisLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { hata: 'Çok fazla deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.' } });
app.use('/api/auth/login', girisLimiter);

app.use('/uploads', express.static(uploadsDir));

app.get('/api/saglik', (req, res) => res.json({ durum: 'ok', zaman: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/kasa', kasaRoutes);
app.use('/api/gelir', gelirRoutes);
app.use('/api/gider', giderRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res) => res.status(404).json({ hata: 'İstenen kaynak bulunamadı.' }));

// Genel hata yakalayici
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ hata: err.message || 'Sunucu hatası oluştu.' });
});

app.listen(PORT, () => {
  console.log(`EFSUN Market API ${PORT} portunda çalışıyor.`);
});
