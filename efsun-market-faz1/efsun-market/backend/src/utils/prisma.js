const { PrismaClient } = require('@prisma/client');

// Uygulama boyunca tek bir Prisma Client ornegi kullanilir.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
