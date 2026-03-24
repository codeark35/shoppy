/**
 * list-r2-images.ts
 * Lista todos los objetos en el bucket R2 y los compara con las URLs
 * registradas en la BD para identificar imágenes huérfanas.
 *
 * Uso:  npx ts-node -r tsconfig-paths/register prisma/list-r2-images.ts
 *
 * Genera: prisma/backups/r2-orphans-<timestamp>.json
 */

import { PrismaClient } from '@prisma/client';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function listAllR2Objects(): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const cmd = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME!,
      ContinuationToken: continuationToken,
    });
    const res = await r2.send(cmd);
    res.Contents?.forEach((obj) => {
      if (obj.Key) keys.push(obj.Key);
    });
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
}

async function main() {
  console.log('🔵 Listando objetos en R2...');
  const r2Keys = await listAllR2Objects();
  console.log(`   ${r2Keys.length} objetos en R2\n`);

  console.log('🔵 Consultando URLs registradas en la BD...');
  const dbImages = await prisma.productImage.findMany({
    select: { id: true, url: true, productId: true },
  });
  console.log(`   ${dbImages.length} imágenes en BD\n`);

  const publicUrl = process.env.R2_PUBLIC_URL!.replace(/\/$/, '');

  // Construir set de keys usadas en BD (extraer key desde la URL pública)
  const usedKeys = new Set(
    dbImages
      .map((img) => {
        try {
          return new URL(img.url).pathname.replace(/^\//, '');
        } catch {
          return null;
        }
      })
      .filter(Boolean) as string[],
  );

  const orphanKeys = r2Keys.filter((key) => !usedKeys.has(key));
  const missingInR2 = dbImages.filter((img) => {
    try {
      const key = new URL(img.url).pathname.replace(/^\//, '');
      return !r2Keys.includes(key);
    } catch {
      return false;
    }
  });

  console.log('📊 Resultado:');
  console.log(`   Objetos en R2:              ${r2Keys.length}`);
  console.log(`   Imágenes registradas en BD: ${dbImages.length}`);
  console.log(`   ⚠️  Huérfanas en R2:         ${orphanKeys.length}  (en R2 pero sin registro en BD)`);
  console.log(`   ⚠️  Sin archivo en R2:       ${missingInR2.length} (en BD pero sin archivo en R2)\n`);

  if (orphanKeys.length > 0) {
    console.log('📋 Imágenes huérfanas en R2:');
    orphanKeys.forEach((key) => console.log(`   ${publicUrl}/${key}`));
  }

  // Guardar reporte
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalInR2: r2Keys.length,
      totalInDb: dbImages.length,
      orphanInR2: orphanKeys.length,
      missingInR2: missingInR2.length,
    },
    orphanInR2: orphanKeys.map((key) => ({ key, url: `${publicUrl}/${key}` })),
    missingInR2: missingInR2.map((img) => ({ id: img.id, url: img.url, productId: img.productId })),
    allR2Keys: r2Keys,
  };

  const backupsDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(backupsDir, `r2-orphans-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📦 Reporte guardado en: ${reportPath}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
