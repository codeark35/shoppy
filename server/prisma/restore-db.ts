/**
 * restore-db.ts
 * Restaura la BD desde un archivo JSON generado por backup-db.ts
 *
 * Uso:  npx ts-node -r tsconfig-paths/register prisma/restore-db.ts [archivo]
 * Si no se pasa archivo, usa el backup más reciente en prisma/backups/
 *
 * ⚠️  ATENCIÓN: borra todos los datos actuales antes de restaurar.
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function findLatestBackup(): string {
  const backupsDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupsDir)) throw new Error('No existe el directorio prisma/backups/');

  const files = fs
    .readdirSync(backupsDir)
    .filter((f) => f.startsWith('backup-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) throw new Error('No hay archivos de backup en prisma/backups/');
  return path.join(backupsDir, files[0]);
}

async function main() {
  const filePath = process.argv[2] ?? findLatestBackup();

  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`);
  }

  console.log(`🔵 Restaurando desde: ${filePath}\n`);

  const backup = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`   Backup creado el: ${backup._meta.createdAt}\n`);

  // ── Limpiar en orden inverso a FK ──────────────────────────────────────────
  console.log('🗑️  Limpiando tablas actuales...');
  await prisma.$transaction([
    prisma.pushSubscription.deleteMany(),
    prisma.wishlist.deleteMany(),
    prisma.review.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.orderShipping.deleteMany(),
    prisma.order.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.shippingRate.deleteMany(),
    prisma.shippingZone.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.address.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // ── Restaurar en orden correcto ────────────────────────────────────────────
  console.log('⬆️  Restaurando datos...\n');

  if (backup.users?.length) {
    await prisma.user.createMany({ data: backup.users, skipDuplicates: true });
    console.log(`   ✅ users            ${backup.users.length}`);
  }
  if (backup.categories?.length) {
    await prisma.category.createMany({ data: backup.categories, skipDuplicates: true });
    console.log(`   ✅ categories       ${backup.categories.length}`);
  }
  if (backup.products?.length) {
    await prisma.product.createMany({ data: backup.products, skipDuplicates: true });
    console.log(`   ✅ products         ${backup.products.length}`);
  }
  if (backup.productImages?.length) {
    await prisma.productImage.createMany({ data: backup.productImages, skipDuplicates: true });
    console.log(`   ✅ productImages    ${backup.productImages.length}`);
  }
  if (backup.productVariants?.length) {
    await prisma.productVariant.createMany({ data: backup.productVariants, skipDuplicates: true });
    console.log(`   ✅ productVariants  ${backup.productVariants.length}`);
  }
  if (backup.addresses?.length) {
    await prisma.address.createMany({ data: backup.addresses, skipDuplicates: true });
    console.log(`   ✅ addresses        ${backup.addresses.length}`);
  }
  if (backup.shippingZones?.length) {
    await prisma.shippingZone.createMany({ data: backup.shippingZones, skipDuplicates: true });
    console.log(`   ✅ shippingZones    ${backup.shippingZones.length}`);
  }
  if (backup.shippingRates?.length) {
    await prisma.shippingRate.createMany({ data: backup.shippingRates, skipDuplicates: true });
    console.log(`   ✅ shippingRates    ${backup.shippingRates.length}`);
  }
  if (backup.coupons?.length) {
    await prisma.coupon.createMany({ data: backup.coupons, skipDuplicates: true });
    console.log(`   ✅ coupons          ${backup.coupons.length}`);
  }
  if (backup.orders?.length) {
    await prisma.order.createMany({ data: backup.orders, skipDuplicates: true });
    console.log(`   ✅ orders           ${backup.orders.length}`);
  }
  if (backup.orderItems?.length) {
    await prisma.orderItem.createMany({ data: backup.orderItems, skipDuplicates: true });
    console.log(`   ✅ orderItems       ${backup.orderItems.length}`);
  }
  if (backup.orderShippings?.length) {
    await prisma.orderShipping.createMany({ data: backup.orderShippings, skipDuplicates: true });
    console.log(`   ✅ orderShippings   ${backup.orderShippings.length}`);
  }
  if (backup.payments?.length) {
    await prisma.payment.createMany({ data: backup.payments, skipDuplicates: true });
    console.log(`   ✅ payments         ${backup.payments.length}`);
  }
  if (backup.wishlists?.length) {
    await prisma.wishlist.createMany({ data: backup.wishlists, skipDuplicates: true });
    console.log(`   ✅ wishlists        ${backup.wishlists.length}`);
  }
  if (backup.reviews?.length) {
    await prisma.review.createMany({ data: backup.reviews, skipDuplicates: true });
    console.log(`   ✅ reviews          ${backup.reviews.length}`);
  }

  console.log('\n✅ Restauración completada exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en restore:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
