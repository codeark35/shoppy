#!/bin/sh
set -e

echo "🚀 Iniciando aplicación de ferretería..."

# Esperar a que PostgreSQL esté disponible
echo "⏳ Esperando a que PostgreSQL esté listo..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "✅ PostgreSQL está listo!"

# Ejecutar migraciones
echo "🗄️ Ejecutando migraciones de Prisma..."
npx prisma migrate deploy || echo "⚠️ Las migraciones fallaron, pero continuamos..."

# Ejecutar seed si es necesario
echo "🌱 Ejecutando seed de datos..."
npx prisma db seed || echo "⚠️ El seed falló, pero continuamos..."

# Iniciar la aplicación
echo "🎉 Iniciando servidor..."
exec npm run start:prod