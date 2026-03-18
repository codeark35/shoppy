# Checklist de Implementacion - Promociones Automaticas

## Fase 0 - Reglas de negocio
- [ ] Definir orden de aplicacion: promocion automatica vs cupon
- [ ] Definir politica de combinacion (`combinable`)
- [ ] Definir regla de desempate por prioridad
- [ ] Definir redondeo monetario final

## Fase 1 - Datos y backend base
- [x] Agregar campo `isFeatured` en `Product` (ya implementado)
- [x] Agregar paginacion en cupones admin (ya implementado)
- [x] Agregar enums/modelos Prisma para promociones automaticas
- [x] Exponer CRUD admin para promociones automaticas
- [x] Validar targets por alcance (producto/categoria)
- [x] Aplicar sincronizacion de schema en dev (`prisma db push`)

## Fase 2 - Motor de promociones
- [x] Crear servicio de evaluacion por item
- [x] Resolver colisiones de multiples promociones
- [x] Soportar combinacion con cupon segun regla
- [x] Entregar breakdown por item y total
- [x] Agregar estrategias de aplicacion (`AUTO_FIRST`, `COUPON_FIRST`, `BEST_PRICE`)
- [x] Integrar estrategia en creacion de orden (`promotionStrategy`)
- [x] Exponer preview admin con estrategia + cupon

## Fase 3 - Integracion checkout
- [x] Aplicar promociones automaticas al recalculo del carrito (via calculatePricing en createFromCart)
- [x] Persistir snapshot de descuento por item en orden (unitDiscountApplied, unitPriceFinal)
- [ ] Revalidar promociones en confirmacion de pago

## Fase 4 - Admin UI
- [x] Crear vista admin de promociones automáticas (`AdminAutomaticPromotionsPage`)
- [x] Crear formulario de promocion con selector de productos/categorias
- [x] Agregar activacion/desactivacion desde tabla
- [x] Agregar paginacion y filtros (scope, estado, búsqueda)

## Fase 5 - Front tienda
- [x] Mostrar precio original/final y badge de promocion en ProductCard (activePromotion desde backend)
- [x] Mostrar promo aplicada en carrito (useCartPricing, desglose auto + cupón)
- [x] Mostrar promo aplicada en checkout (desglose auto + cupón en resumen del pedido)

## Fase 6 - QA y release
- [ ] Tests unitarios del motor de promociones
- [ ] Tests e2e de checkout con promo + cupon
- [ ] Feature flag para rollout gradual
- [ ] Monitoreo y runbook de rollback
