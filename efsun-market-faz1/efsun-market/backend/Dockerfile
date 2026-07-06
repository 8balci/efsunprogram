FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

RUN mkdir -p uploads

EXPOSE 4000

# Ilk calistirmada semayi veritabanina uygular ve varsayilan kayitlari olusturur.
# Production'da surum kontrollu migration icin: `npx prisma migrate dev --name init` calistirip
# olusan prisma/migrations klasorunu repoya ekleyin, ardindan bu satiri `prisma migrate deploy` olarak degistirin.
CMD ["sh", "-c", "npx prisma db push --skip-generate && node prisma/seed.js && npm start"]
