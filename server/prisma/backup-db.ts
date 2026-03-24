/**
 * backup-db.ts
 * Vuelca toda la BD a un archivo JSON con timestamp.
 *
 * Uso:  npx ts-node -r tsconfig-paths/register prisma/backup-db.ts
 * El archivo se guarda en:  prisma/backups/backup-<timestamp>.json
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🔵 Iniciando backup de la base de datos...\n');

  const [
    users,
    categories,
    products,
    productImages,
    productVariants,
    addresses,
    orders,
    orderItems,
    orderShippings,
    payments,
    wishlists,
    reviews,
    coupons,
    shippingZones,
    shippingRates,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.category.findMany(),
    prisma.product.findMany(),
    prisma.productImage.findMany(),
    prisma.productVariant.findMany(),
    prisma.address.findMany(),
    prisma.order.findMany(),
    prisma.orderItem.findMany(),
    prisma.orderShipping.findMany(),
    prisma.payment.findMany(),
    prisma.wishlist.findMany(),
    prisma.review.findMany(),
    prisma.coupon.findMany(),
    prisma.shippingZone.findMany(),
    prisma.shippingRate.findMany(),
  ]);

  const backup = {
    _meta: {
      createdAt: new Date().toISOString(),
      tables: {
        users: users.length,
        categories: categories.length,
        products: products.length,
        productImages: productImages.length,
        productVariants: productVariants.length,
        addresses: addresses.length,
        orders: orders.length,
        orderItems: orderItems.length,
        orderShippings: orderShippings.length,
        payments: payments.length,
        wishlists: wishlists.length,
        reviews: reviews.length,
        coupons: coupons.length,
        shippingZones: shippingZones.length,
        shippingRates: shippingRates.length,
      },
    },
    users,
    categories,
    products,
    productImages,
    productVariants,
    addresses,
    orders,
    orderItems,
    orderShippings,
    payments,
    wishlists,
    reviews,
    coupons,
    shippingZones,
    shippingRates,
  };

  const backupsDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(backupsDir, `backup-${timestamp}.json`);

  fs.writeFileSync(filePath, JSON.stringify(backup, null, 2), 'utf8');

  console.log('✅ Backup completado:\n');
  Object.entries(backup._meta.tables).forEach(([table, count]) => {
    console.log(`   ${table.padEnd(20)} ${count} registros`);
  });
  console.log(`\n📦 Archivo: ${filePath}`);
}

main()
  .catch((e) => {
    console.error('❌ Error en backup:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
