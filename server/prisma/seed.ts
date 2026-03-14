 import { PrismaClient, Role, OrderStatus, PaymentStatus, DiscountType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hash = (pwd: string) => bcrypt.hash(pwd, 12);

function slug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randDec(min: number, max: number, step = 1000) {
  return Math.round((Math.random() * (max - min) + min) / step) * step;
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Iniciando seed...\n');

  // ── 1. Limpiar BD (orden correcto por FK) ────────────────────────────────────
  await prisma.$transaction([
    prisma.pushSubscription.deleteMany(),
    prisma.wishlist.deleteMany(),
    prisma.review.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.orderShipping.deleteMany(),
    prisma.payment.deleteMany(),
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
  console.log('🗑️  Tablas limpiadas');

  // ── 2. Usuarios ──────────────────────────────────────────────────────────────
  const adminHash = await hash('Admin123!');
  const customerHash = await hash('Cliente123!');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@labscore.com.py',
      passwordHash: adminHash,
      name: 'Administrador',
      phone: '0981100000',
      role: Role.ADMIN,
    },
  });

  const warehouse = await prisma.user.create({
    data: {
      email: 'deposito@labscore.com.py',
      passwordHash: adminHash,
      name: 'Depósito Central',
      phone: '0981100001',
      role: Role.WAREHOUSE,
    },
  });

  const customersData = [
    { name: 'Carlos Rodríguez',  email: 'carlos@gmail.com',  phone: '0981234567' },
    { name: 'María González',    email: 'maria@gmail.com',   phone: '0982345678' },
    { name: 'Juan Fernández',    email: 'juan@gmail.com',    phone: '0983456789' },
    { name: 'Ana López',         email: 'ana@gmail.com',     phone: '0984567890' },
    { name: 'Pedro Martínez',    email: 'pedro@gmail.com',   phone: '0985678901' },
    { name: 'Laura Benítez',     email: 'laura@gmail.com',   phone: '0986789012' },
    { name: 'Diego Sánchez',     email: 'diego@gmail.com',   phone: '0987890123' },
    { name: 'Sofía Ramírez',     email: 'sofia@gmail.com',   phone: '0988901234' },
    { name: 'Miguel Cabrera',    email: 'miguel@gmail.com',  phone: '0989012345' },
    { name: 'Valentina Torres',  email: 'valen@gmail.com',   phone: '0990123456' },
  ];

  const customers = await Promise.all(
    customersData.map((c) =>
      prisma.user.create({ data: { ...c, passwordHash: customerHash, role: Role.CUSTOMER } }),
    ),
  );
  console.log(`👤 ${customers.length + 2} usuarios creados`);

  // ── 3. Direcciones ───────────────────────────────────────────────────────────
  const departments = ['Central', 'Alto Paraná', 'Itapúa', 'Cordillera', 'Caaguazú'];
  for (const customer of customers.slice(0, 6)) {
    await prisma.address.create({
      data: {
        userId: customer.id,
        label: 'Casa',
        street: `Calle ${randInt(1, 99)} N° ${randInt(100, 999)}`,
        city: rand(['Asunción', 'Ciudad del Este', 'Encarnación', 'Caaguazú', 'San Lorenzo']),
        department: rand(departments),
        isDefault: true,
      },
    });
  }

  // ── 4. Categorías ────────────────────────────────────────────────────────────
  const categoriesData = [
    { name: 'Electrónica',     children: ['Smartphones', 'Laptops', 'Tablets', 'Accesorios'] },
    { name: 'Ropa',            children: ['Hombre', 'Mujer', 'Niños', 'Deportiva'] },
    { name: 'Hogar',           children: ['Cocina', 'Dormitorio', 'Decoración', 'Limpieza'] },
    { name: 'Deporte',         children: ['Fútbol', 'Fitness', 'Ciclismo', 'Natación'] },
    { name: 'Belleza',         children: ['Cuidado Personal', 'Maquillaje', 'Perfumes'] },
  ];

  const categoryMap = new Map<string, string>(); // name → id

  for (const cat of categoriesData) {
    const parent = await prisma.category.create({
      data: { name: cat.name, slug: slug(cat.name) },
    });
    categoryMap.set(cat.name, parent.id);

    for (const child of cat.children) {
      const sub = await prisma.category.create({
        data: { name: child, slug: slug(child), parentId: parent.id },
      });
      categoryMap.set(child, sub.id);
    }
  }
  console.log(`📂 ${categoryMap.size} categorías creadas`);

  // ── 5. Productos ─────────────────────────────────────────────────────────────
  const productsData = [
    // Electrónica — Smartphones
    {
      name: 'Samsung Galaxy A55',
      desc: 'Smartphone Samsung Galaxy A55 5G, pantalla Super AMOLED 6.6", 256GB, cámara triple 50MP.',
      basePrice: 1_450_000,
      categoryKey: 'Smartphones',
      images: [
        'https://placehold.co/800x800/0F4C81/white?text=Galaxy+A55',
        'https://placehold.co/800x800/1A6BB5/white?text=Galaxy+A55+Back',
      ],
      variants: [
        { sku: 'SAM-A55-128-BLK', attrs: { color: 'Negro',    almacenamiento: '128GB' }, price: 1_250_000, stock: 15 },
        { sku: 'SAM-A55-256-BLK', attrs: { color: 'Negro',    almacenamiento: '256GB' }, price: 1_450_000, stock: 10 },
        { sku: 'SAM-A55-256-BLU', attrs: { color: 'Azul',     almacenamiento: '256GB' }, price: 1_450_000, stock: 8  },
        { sku: 'SAM-A55-256-WHT', attrs: { color: 'Blanco',   almacenamiento: '256GB' }, price: 1_450_000, stock: 5  },
      ],
    },
    {
      name: 'Xiaomi Redmi Note 13 Pro',
      desc: 'Xiaomi Redmi Note 13 Pro, AMOLED 120Hz, 200MP, carga 67W, batería 5100mAh.',
      basePrice: 980_000,
      categoryKey: 'Smartphones',
      images: ['https://placehold.co/800x800/F97316/white?text=Redmi+Note+13'],
      variants: [
        { sku: 'XIA-RN13P-256-BLK', attrs: { color: 'Negro',  almacenamiento: '256GB' }, price: 980_000, stock: 20 },
        { sku: 'XIA-RN13P-256-PRP', attrs: { color: 'Violeta',almacenamiento: '256GB' }, price: 980_000, stock: 12 },
      ],
    },
    // Electrónica — Laptops
    {
      name: 'Lenovo IdeaPad 15',
      desc: 'Laptop Lenovo IdeaPad, Intel Core i5, 8GB RAM, SSD 512GB, pantalla 15.6" Full HD.',
      basePrice: 3_200_000,
      categoryKey: 'Laptops',
      images: ['https://placehold.co/800x800/374151/white?text=Lenovo+IdeaPad'],
      variants: [
        { sku: 'LEN-IP15-8-512-GRY', attrs: { color: 'Gris', RAM: '8GB',  SSD: '512GB' }, price: 3_200_000, stock: 7 },
        { sku: 'LEN-IP15-16-512-GRY',attrs: { color: 'Gris', RAM: '16GB', SSD: '512GB' }, price: 3_700_000, stock: 5 },
      ],
    },
    {
      name: 'HP Victus 16 Gaming',
      desc: 'Laptop gamer HP Victus, AMD Ryzen 5, RTX 4060, 16GB RAM, SSD 512GB, pantalla 144Hz.',
      basePrice: 6_500_000,
      categoryKey: 'Laptops',
      images: ['https://placehold.co/800x800/111827/white?text=HP+Victus'],
      variants: [
        { sku: 'HP-V16-R5-16-512', attrs: { color: 'Negro', RAM: '16GB', GPU: 'RTX 4060' }, price: 6_500_000, stock: 4 },
      ],
    },
    // Ropa — Hombre
    {
      name: 'Remera Polo Clásica',
      desc: 'Remera tipo polo, 100% algodón pima, ideal para el calor paraguayo.',
      basePrice: 85_000,
      categoryKey: 'Hombre',
      images: ['https://placehold.co/800x800/6B7280/white?text=Polo+H'],
      variants: [
        { sku: 'RP-H-S-BLK', attrs: { talle: 'S', color: 'Negro'  }, price: 85_000, stock: 30 },
        { sku: 'RP-H-M-BLK', attrs: { talle: 'M', color: 'Negro'  }, price: 85_000, stock: 25 },
        { sku: 'RP-H-L-BLK', attrs: { talle: 'L', color: 'Negro'  }, price: 85_000, stock: 20 },
        { sku: 'RP-H-S-WHT', attrs: { talle: 'S', color: 'Blanco' }, price: 85_000, stock: 28 },
        { sku: 'RP-H-M-WHT', attrs: { talle: 'M', color: 'Blanco' }, price: 85_000, stock: 22 },
        { sku: 'RP-H-L-WHT', attrs: { talle: 'L', color: 'Blanco' }, price: 85_000, stock: 18 },
        { sku: 'RP-H-XL-WHT',attrs: { talle: 'XL',color: 'Blanco' }, price: 85_000, stock: 10 },
      ],
    },
    {
      name: 'Jean Slim Fit Hombre',
      desc: 'Jean slim fit, tela stretch, 5 bolsillos, lavado oscuro.',
      basePrice: 150_000,
      categoryKey: 'Hombre',
      images: ['https://placehold.co/800x800/0A3358/white?text=Jean+H'],
      variants: [
        { sku: 'JSF-H-30-DBL', attrs: { talle: '30', color: 'Azul oscuro' }, price: 150_000, stock: 15 },
        { sku: 'JSF-H-32-DBL', attrs: { talle: '32', color: 'Azul oscuro' }, price: 150_000, stock: 20 },
        { sku: 'JSF-H-34-DBL', attrs: { talle: '34', color: 'Azul oscuro' }, price: 150_000, stock: 12 },
        { sku: 'JSF-H-36-DBL', attrs: { talle: '36', color: 'Azul oscuro' }, price: 150_000, stock: 8  },
      ],
    },
    // Ropa — Mujer
    {
      name: 'Vestido Floral Verano',
      desc: 'Vestido floral manga corta, tela liviana, perfecto para el verano paraguayo.',
      basePrice: 120_000,
      categoryKey: 'Mujer',
      images: ['https://placehold.co/800x800/F97316/white?text=Vestido+F'],
      variants: [
        { sku: 'VF-M-XS-MUL', attrs: { talle: 'XS', color: 'Multicolor' }, price: 120_000, stock: 10 },
        { sku: 'VF-M-S-MUL',  attrs: { talle: 'S',  color: 'Multicolor' }, price: 120_000, stock: 15 },
        { sku: 'VF-M-M-MUL',  attrs: { talle: 'M',  color: 'Multicolor' }, price: 120_000, stock: 18 },
        { sku: 'VF-M-L-MUL',  attrs: { talle: 'L',  color: 'Multicolor' }, price: 120_000, stock: 12 },
      ],
    },
    // Hogar — Cocina
    {
      name: 'Licuadora Philips 600W',
      desc: 'Licuadora Philips 600W, vaso de vidrio 1.5L, 3 velocidades + pulso, cuchillas ProBlend.',
      basePrice: 350_000,
      categoryKey: 'Cocina',
      images: ['https://placehold.co/800x800/16A34A/white?text=Licuadora'],
      variants: [
        { sku: 'LIC-PHL-600-BLK', attrs: { color: 'Negro' }, price: 350_000, stock: 12 },
        { sku: 'LIC-PHL-600-WHT', attrs: { color: 'Blanco'}, price: 350_000, stock: 8  },
      ],
    },
    {
      name: 'Set de Ollas 5 Piezas',
      desc: 'Set de ollas antiadherente de aluminio, 5 piezas (16, 18, 20, 22, 24cm), tapa de vidrio.',
      basePrice: 490_000,
      categoryKey: 'Cocina',
      images: ['https://placehold.co/800x800/D97706/white?text=Set+Ollas'],
      variants: [
        { sku: 'SOL-5P-GRY', attrs: { color: 'Gris' }, price: 490_000, stock: 20 },
        { sku: 'SOL-5P-RED', attrs: { color: 'Rojo' }, price: 490_000, stock: 15 },
      ],
    },
    // Deporte — Fútbol
    {
      name: 'Pelota de Fútbol Adidas',
      desc: 'Pelota de fútbol Adidas FIFA Quality Pro, cuero sintético, talla 5.',
      basePrice: 180_000,
      categoryKey: 'Fútbol',
      images: ['https://placehold.co/800x800/111827/white?text=Pelota+Futbol'],
      variants: [
        { sku: 'PF-ADI-T5-WHT', attrs: { talla: '5', color: 'Blanco/Negro' }, price: 180_000, stock: 40 },
        { sku: 'PF-ADI-T5-RED', attrs: { talla: '5', color: 'Rojo/Negro'   }, price: 180_000, stock: 25 },
      ],
    },
    // Deporte — Fitness
    {
      name: 'Set de Mancuernas 20kg',
      desc: 'Set de mancuernas ajustables, 2 × 10kg, recubrimiento de goma, barra hexagonal.',
      basePrice: 420_000,
      categoryKey: 'Fitness',
      images: ['https://placehold.co/800x800/374151/white?text=Mancuernas'],
      variants: [
        { sku: 'MAN-SET-20KG', attrs: { peso: '2x10kg' }, price: 420_000, stock: 18 },
      ],
    },
    // Belleza
    {
      name: 'Perfume Versace Eros EDT 100ml',
      desc: 'Perfume Versace Eros Eau de Toilette 100ml, fragancia fresca y masculina.',
      basePrice: 750_000,
      categoryKey: 'Perfumes',
      images: ['https://placehold.co/800x800/0F4C81/white?text=Versace+Eros'],
      variants: [
        { sku: 'PERF-VER-EROS-100', attrs: { volumen: '100ml' }, price: 750_000, stock: 15 },
        { sku: 'PERF-VER-EROS-50',  attrs: { volumen: '50ml'  }, price: 450_000, stock: 20 },
      ],
    },
    // Accesorios
    {
      name: 'Auriculares Bluetooth JBL Tune 520BT',
      desc: 'Auriculares JBL Tune 520BT, over-ear, Bluetooth 5.3, 57 horas de batería, Pure Bass.',
      basePrice: 320_000,
      categoryKey: 'Accesorios',
      images: ['https://placehold.co/800x800/0284C7/white?text=JBL+T520'],
      variants: [
        { sku: 'JBL-T520BT-BLK', attrs: { color: 'Negro'  }, price: 320_000, stock: 22 },
        { sku: 'JBL-T520BT-WHT', attrs: { color: 'Blanco' }, price: 320_000, stock: 18 },
        { sku: 'JBL-T520BT-BLU', attrs: { color: 'Azul'   }, price: 320_000, stock: 14 },
      ],
    },
    {
      name: 'Smartwatch Xiaomi Band 8 Pro',
      desc: 'Smartwatch Xiaomi Band 8 Pro, AMOLED 1.74", GPS, 150 modos deportivos, SpO2.',
      basePrice: 280_000,
      categoryKey: 'Accesorios',
      images: ['https://placehold.co/800x800/16A34A/white?text=Xiaomi+Band+8'],
      variants: [
        { sku: 'XIA-BAND8P-BLK', attrs: { color: 'Negro' }, price: 280_000, stock: 30 },
        { sku: 'XIA-BAND8P-ORG', attrs: { color: 'Naranja'}, price: 280_000, stock: 12 },
      ],
    },
    {
      name: 'Cargador USB-C 65W GaN',
      desc: 'Cargador compacto GaN 65W con 2 puertos USB-C y 1 USB-A, compatible con PD 3.0.',
      basePrice: 95_000,
      categoryKey: 'Accesorios',
      images: ['https://placehold.co/800x800/374151/white?text=Cargador+GaN'],
      variants: [
        { sku: 'CHRG-GAN-65W-WHT', attrs: { color: 'Blanco' }, price: 95_000, stock: 50 },
        { sku: 'CHRG-GAN-65W-BLK', attrs: { color: 'Negro'  }, price: 95_000, stock: 40 },
      ],
    },
  ];

  const createdProducts: Array<{ id: string; name: string; variants: Array<{ id: string; sku: string; price: any; stock: number }> }> = [];

  for (const p of productsData) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: slug(p.name),
        description: p.desc,
        basePrice: p.basePrice,
        categoryId: categoryMap.get(p.categoryKey)!,
        isActive: true,
        images: {
          create: p.images.map((url, i) => ({ url, alt: p.name, position: i })),
        },
        variants: {
          create: p.variants.map((v) => ({
            sku: v.sku,
            attributes: v.attrs,
            price: v.price,
            stock: v.stock,
          })),
        },
      },
      include: { variants: true },
    });
    createdProducts.push({ id: product.id, name: product.name, variants: product.variants });
  }
  console.log(`📦 ${createdProducts.length} productos creados`);

  // ── 6. Zonas de envío ────────────────────────────────────────────────────────
  const zonaAsuncion = await prisma.shippingZone.create({
    data: {
      name: 'Asunción y Gran Asunción',
      departments: ['Central'],
      isActive: true,
      rates: {
        create: [
          { name: 'Envío estándar (2–3 días)',    price: 15_000, estimatedDays: 3, isActive: true },
          { name: 'Envío express (mismo día)',      price: 35_000, estimatedDays: 1, isActive: true },
        ],
      },
    },
    include: { rates: true },
  });

  const zonaEste = await prisma.shippingZone.create({
    data: {
      name: 'Alto Paraná',
      departments: ['Alto Paraná'],
      isActive: true,
      rates: {
        create: [
          { name: 'Envío estándar (3–5 días)', price: 25_000, estimatedDays: 4, isActive: true },
          { name: 'Envío rápido (2 días)',      price: 45_000, estimatedDays: 2, isActive: true },
        ],
      },
    },
    include: { rates: true },
  });

  await prisma.shippingZone.create({
    data: {
      name: 'Interior del País',
      departments: ['Itapúa', 'Cordillera', 'Caaguazú', 'Misiones', 'Paraguarí', 'San Pedro'],
      isActive: true,
      rates: {
        create: [
          { name: 'Envío estándar (4–7 días)', price: 30_000, estimatedDays: 5, isActive: true },
        ],
      },
    },
  });
  console.log('🚚 Zonas y tarifas de envío creadas');

  // ── 7. Cupones ───────────────────────────────────────────────────────────────
  await prisma.coupon.createMany({
    data: [
      {
        code: 'BIENVENIDO10',
        description: '10% de descuento para nuevos clientes',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        minPurchaseAmount: 50_000,
        maxUses: 500,
        usedCount: 47,
        validUntil: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: 'VERANO2026',
        description: 'Gs. 30.000 de descuento en compras de verano',
        discountType: DiscountType.FIXED,
        discountValue: 30_000,
        minPurchaseAmount: 150_000,
        maxUses: 200,
        usedCount: 88,
        validUntil: new Date('2026-03-31'),
        isActive: true,
      },
      {
        code: 'TECH15',
        description: '15% de descuento en electrónica',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 15,
        minPurchaseAmount: 500_000,
        maxUses: 100,
        usedCount: 23,
        validUntil: new Date('2026-06-30'),
        isActive: true,
      },
      {
        code: 'EXPIRADO',
        description: 'Cupón expirado (para tests)',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20,
        validUntil: new Date('2025-01-01'),
        isActive: false,
      },
    ],
  });
  console.log('🎟️  Cupones creados');

  // ── 8. Órdenes ───────────────────────────────────────────────────────────────
  const shippingRate = zonaAsuncion.rates[0];
  const shippingRateEste = zonaEste.rates[0];

  const ordersData = [
    // Orden completada — cliente 0
    {
      customer: customers[0],
      statusGroup: 'COMPLETED',
      variant: createdProducts[0].variants[1], // Galaxy A55 256 Negro
      qty: 1,
      shippingRate,
      daysAgoCreated: 45,
    },
    // Orden entregada — cliente 1
    {
      customer: customers[1],
      statusGroup: 'DELIVERED',
      variant: createdProducts[7].variants[0], // Licuadora
      qty: 2,
      shippingRate,
      daysAgoCreated: 20,
    },
    // Orden enviada — cliente 2
    {
      customer: customers[2],
      statusGroup: 'SHIPPED',
      variant: createdProducts[12].variants[0], // JBL
      qty: 1,
      shippingRate: shippingRateEste,
      daysAgoCreated: 8,
    },
    // Preparando — cliente 3
    {
      customer: customers[3],
      statusGroup: 'PREPARING',
      variant: createdProducts[4].variants[1], // Remera M-Negro
      qty: 3,
      shippingRate,
      daysAgoCreated: 3,
    },
    // Pagada — cliente 4
    {
      customer: customers[4],
      statusGroup: 'PAID',
      variant: createdProducts[10].variants[0], // Mancuernas
      qty: 1,
      shippingRate,
      daysAgoCreated: 2,
    },
    // Pendiente — cliente 5
    {
      customer: customers[5],
      statusGroup: 'PENDING',
      variant: createdProducts[14].variants[0], // Cargador
      qty: 2,
      shippingRate,
      daysAgoCreated: 0,
    },
    // Completada — cliente 6
    {
      customer: customers[6],
      statusGroup: 'COMPLETED',
      variant: createdProducts[2].variants[0], // Lenovo
      qty: 1,
      shippingRate: shippingRateEste,
      daysAgoCreated: 60,
    },
    // Completada — cliente 0 (segunda orden)
    {
      customer: customers[0],
      statusGroup: 'COMPLETED',
      variant: createdProducts[13].variants[1], // Band 8 Naranja
      qty: 1,
      shippingRate,
      daysAgoCreated: 15,
    },
    // Completada — cliente 1 (segunda orden)
    {
      customer: customers[1],
      statusGroup: 'COMPLETED',
      variant: createdProducts[9].variants[0], // Pelota
      qty: 2,
      shippingRate,
      daysAgoCreated: 30,
    },
    // Cancelada
    {
      customer: customers[7],
      statusGroup: 'CANCELLED',
      variant: createdProducts[11].variants[1], // Perfume 50ml
      qty: 1,
      shippingRate,
      daysAgoCreated: 10,
    },
  ];

  const orderStatusMap: Record<string, OrderStatus> = {
    PENDING: OrderStatus.PENDING,
    PAID: OrderStatus.PAID,
    PREPARING: OrderStatus.PREPARING,
    SHIPPED: OrderStatus.SHIPPED,
    DELIVERED: OrderStatus.DELIVERED,
    COMPLETED: OrderStatus.COMPLETED,
    CANCELLED: OrderStatus.CANCELLED,
  };

  for (const [idx, o] of ordersData.entries()) {
    const itemPrice = Number(o.variant.price);
    const shippingCost = Number(o.shippingRate.price);
    const subtotal = itemPrice * o.qty;
    const total = subtotal + shippingCost;
    const status = orderStatusMap[o.statusGroup];
    const createdAt = daysAgo(o.daysAgoCreated);
    const isPaid = !['PENDING', 'CANCELLED'].includes(o.statusGroup);
    const productName = createdProducts.find((p) =>
      p.variants.some((v) => v.id === o.variant.id),
    )?.name ?? 'Producto';

    await prisma.order.create({
      data: {
        userId: o.customer.id,
        status,
        total,
        createdAt,
        updatedAt: createdAt,
        items: {
          create: [{
            variantId: o.variant.id,
            sku: o.variant.sku,
            name: productName,
            price: itemPrice,
            quantity: o.qty,
          }],
        },
        shipping: {
          create: {
            recipientName: o.customer.name,
            phone: o.customer.phone ?? '0981000000',
            street: `Calle ${randInt(1, 99)} N° ${randInt(100, 999)}`,
            city: 'Asunción',
            department: 'Central',
            country: 'PY',
            shippingCost,
            shippingRateId: o.shippingRate.id,
          },
        },
        ...(isPaid && {
          payment: {
            create: {
              provider: 'bancard',
              shopProcessId: `SEED-ORD-${String(idx).padStart(4, '0')}`,
              status: PaymentStatus.APPROVED,
              amount: total,
              confirmedAt: createdAt,
            },
          },
        }),
      },
    });
  }
  console.log(`🛒 ${ordersData.length} órdenes creadas`);

  // ── 9. Reviews ───────────────────────────────────────────────────────────────
  const reviewData = [
    { customer: customers[0], product: createdProducts[0],  rating: 5, comment: '¡Excelente teléfono! Muy rápido y la cámara es increíble. Llegó en perfecto estado.', approved: true },
    { customer: customers[1], product: createdProducts[7],  rating: 4, comment: 'Muy buena licuadora, potente y silenciosa. El vaso de vidrio es de buena calidad.', approved: true },
    { customer: customers[2], product: createdProducts[12], rating: 5, comment: 'Los auriculares tienen un sonido espectacular para el precio. El bass es muy bueno.', approved: true },
    { customer: customers[3], product: createdProducts[4],  rating: 4, comment: 'La tela es cómoda y fresca, ideal para el calor. Las tallas son exactas.', approved: true },
    { customer: customers[4], product: createdProducts[10], rating: 5, comment: 'Las mancuernas llegaron bien empaquetadas. La goma agarra muy bien.', approved: true },
    { customer: customers[6], product: createdProducts[2],  rating: 4, comment: 'Buena laptop para trabajo y estudio. La pantalla es nítida y la batería dura bastante.', approved: true },
    { customer: customers[0], product: createdProducts[13], rating: 5, comment: 'El smartwatch funciona perfecto con Android. El GPS es muy preciso.', approved: true },
    { customer: customers[1], product: createdProducts[9],  rating: 3, comment: 'La pelota es buena pero el cuero se marca un poco rápido. Para uso recreativo está bien.', approved: true },
    { customer: customers[5], product: createdProducts[8],  rating: 5, comment: '¡El set de ollas es hermoso! El antiadherente es de calidad y las tapas ajustan perfecto.', approved: true },
    { customer: customers[7], product: createdProducts[11], rating: 4, comment: 'El perfume huele muy bien y dura bastante. El envase es idéntico al original.', approved: false },
  ];

  for (const r of reviewData) {
    await prisma.review.create({
      data: {
        userId: r.customer.id,
        productId: r.product.id,
        rating: r.rating,
        comment: r.comment,
        isApproved: r.approved,
      },
    });
  }
  console.log(`⭐ ${reviewData.length} reseñas creadas`);

  // ── 10. Wishlist ─────────────────────────────────────────────────────────────
  const wishlistData = [
    { customer: customers[0], product: createdProducts[3]  }, // HP Victus
    { customer: customers[0], product: createdProducts[11] }, // Perfume
    { customer: customers[1], product: createdProducts[0]  }, // Galaxy A55
    { customer: customers[1], product: createdProducts[13] }, // Band 8
    { customer: customers[2], product: createdProducts[6]  }, // Vestido
    { customer: customers[3], product: createdProducts[10] }, // Mancuernas
    { customer: customers[4], product: createdProducts[14] }, // Cargador GaN
  ];

  for (const w of wishlistData) {
    await prisma.wishlist.create({
      data: { userId: w.customer.id, productId: w.product.id },
    });
  }
  console.log(`❤️  ${wishlistData.length} items en wishlist`);

  // ── Resumen ──────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed completado exitosamente!\n');
  console.log('📋 Credenciales de acceso:');
  console.log('   Admin:     admin@labscore.com.py     / Admin123!');
  console.log('   Depósito:  deposito@labscore.com.py  / Admin123!');
  console.log('   Clientes:  carlos@gmail.com (etc.)   / Cliente123!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
