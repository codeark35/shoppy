import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Container, Card, Form, Button, Badge,
  Alert, Spinner, InputGroup,
} from 'react-bootstrap';
import {
  ArrowLeft, Save, Plus, Trash2, Image, X, Package, Pencil, Images,
} from 'lucide-react';
import {
  useCreateProduct,
  useUpdateProduct,
  useAdminProductById,
  useAdminCategories,
  useAddVariant,
  useUpdateVariant,
  useDeleteVariant,
  adminService,
} from '../features/admin';
import { formatPrice } from '../shared/utils/formatPrice';
import { RichTextEditor } from '../shared/components/RichTextEditor';
import { MediaGalleryPicker } from '../shared/components/MediaGalleryPicker';
import type {
  AdminProduct,
  AdminProductImage,
  AdminProductVariant,
  CreateProductPayload,
  CreateVariantPayload,
  UpdateVariantPayload,
} from '../features/admin';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const EMPTY_FORM: CreateProductPayload = {
  name: '', slug: '', description: '', basePrice: 0, categoryId: '', isActive: true, isFeatured: false,
};

// ─── Página ───────────────────────────────────────────────────────────────────

export default function AdminProductFormPage() {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const isEdit = !!id;

  // Producto desde router state (navegación desde lista) o fetch por ID
  const stateProduct = (location.state as { product?: AdminProduct } | null)?.product ?? null;
  const { data: fetchedProduct, isLoading: loadingProduct } = useAdminProductById(
    isEdit && !stateProduct ? id! : null,
  );
  const product = stateProduct ?? fetchedProduct ?? null;

  const { data: categories = [] } = useAdminCategories();
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();
  const addVariantMut = useAddVariant();
  const updateVariantMut = useUpdateVariant();
  const deleteVariantMut = useDeleteVariant();

  // ── Estados del formulario ───────────────────────────────────────────────────
  const [form, setForm] = useState<CreateProductPayload>(EMPTY_FORM);
  const [formReady, setFormReady] = useState(!isEdit);
  const [error, setError] = useState<string | null>(null);

  // ── Imágenes ─────────────────────────────────────────────────────────────────
  const [images, setImages] = useState<AdminProductImage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<
    Array<{ id: string; file: File; preview: string; alt: string }>
  >([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGallery, setShowGallery] = useState(false);
  // URLs de galería pendientes (modo crear, sin product.id aún)
  const [pendingGalleryUrls, setPendingGalleryUrls] = useState<
    Array<{ id: string; url: string }>
  >();

  // ── Variantes ────────────────────────────────────────────────────────────────
  const [variants, setVariants] = useState<AdminProductVariant[]>([]);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [variantForm, setVariantForm] = useState<CreateVariantPayload>({
    sku: '', price: 0, stock: 0, attributes: {},
  });
  const [attrKey, setAttrKey] = useState('');
  const [attrVal, setAttrVal] = useState('');
  const [variantError, setVariantError] = useState<string | null>(null);

  // Genera SKU automático basado en el slug del producto y el número de variantes existentes
  const buildAutoSku = (existingVariants: AdminProductVariant[]) => {
    const base = (product?.slug ?? form.slug ?? 'prod').toUpperCase().replace(/-/g, '-').substring(0, 20);
    const seq = existingVariants.length + 1;
    return `${base}-V${seq}`;
  };

  const openVariantForm = () => {
    setEditingVariantId(null);
    setVariantForm({
      sku: buildAutoSku(variants),
      price: product?.basePrice ?? form.basePrice ?? 0,
      stock: 0,
      attributes: {},
    });
    setAttrKey('');
    setAttrVal('');
    setVariantError(null);
    setShowVariantForm(true);
  };

  const openEditVariantForm = (v: AdminProductVariant) => {
    setEditingVariantId(v.id);
    setVariantForm({
      sku: v.sku,
      price: v.price,
      stock: v.stock,
      attributes: { ...(v.attributes ?? {}) },
    });
    setAttrKey('');
    setAttrVal('');
    setVariantError(null);
    setShowVariantForm(true);
  };

  // Populate formulario cuando carga el producto
  useEffect(() => {
    if (product && !formReady) {
      setForm({
        name: product.name,
        slug: product.slug,
        description: product.description,
        details: product.details,
        basePrice: product.basePrice,
        categoryId: product.category.id,
        isActive: product.isActive,
        isFeatured: product.isFeatured ?? false,
      });
      setImages(product.images ?? []);
      setVariants(product.variants ?? []);
      setFormReady(true);
    }
  }, [product, formReady]);

  // ── Helpers del form ─────────────────────────────────────────────────────────
  const set = (patch: Partial<CreateProductPayload>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleNameChange = (name: string) =>
    set({ name, ...(!isEdit ? { slug: toSlug(name) } : {}) });

  // ── Imágenes ─────────────────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    setImageError(null);

    if (isEdit && product) {
      setUploadingImages(true);
      try {
        for (const file of files) {
          const uploaded = await adminService.uploadMedia(file);
          const img = await adminService.addProductImage(product.id, { url: uploaded.url });
          setImages((prev) => [...prev, img]);
        }
      } catch {
        setImageError('Error al subir una o más imágenes.');
      } finally {
        setUploadingImages(false);
      }
    } else {
      setPendingFiles((prev) => [
        ...prev,
        ...files.map((file) => ({
          id: `p-${Date.now()}-${Math.random()}`,
          file,
          preview: URL.createObjectURL(file),
          alt: '',
        })),
      ]);
    }
  };

  const handleDeleteImage = async (img: AdminProductImage) => {
    if (isEdit && product) {
      try {
        await adminService.deleteProductImage(product.id, img.id);
      } catch { return; }
    }
    setImages((prev) => prev.filter((i) => i.id !== img.id));
  };

  const handleRemovePending = (pendingId: string) => {
    setPendingFiles((prev) => {
      const item = prev.find((p) => p.id === pendingId);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((p) => p.id !== pendingId);
    });
  };

  const handleGallerySelect = async (urls: string[]) => {
    setImageError(null);
    if (isEdit && product) {
      // Modo edición: registrar directamente en BD
      setUploadingImages(true);
      try {
        for (const url of urls) {
          const img = await adminService.addProductImage(product.id, { url });
          setImages((prev) => [...prev, img]);
        }
      } catch {
        setImageError('Error al asociar una o más imágenes.');
      } finally {
        setUploadingImages(false);
      }
    } else {
      // Modo crear: guardar las URLs para asociarlas al submit
      setPendingGalleryUrls((prev) => [
        ...(prev ?? []),
        ...urls.map((url) => ({ id: `g-${Date.now()}-${Math.random()}`, url })),
      ]);
    }
  };

  // ── Variantes ────────────────────────────────────────────────────────────────
  const addAttr = () => {
    if (attrKey.trim() && attrVal.trim()) {
      setVariantForm((prev) => ({
        ...prev,
        attributes: { ...prev.attributes, [attrKey.trim()]: attrVal.trim() },
      }));
      setAttrKey('');
      setAttrVal('');
    }
  };

  const removeAttr = (key: string) =>
    setVariantForm((prev) => {
      const a = { ...prev.attributes };
      delete a[key];
      return { ...prev, attributes: a };
    });

  const handleSaveVariant = async () => {
    if (!product || !variantForm.sku.trim()) return;
    setVariantError(null);

    // Flush atributo pendiente si el usuario escribió pero no hizo clic en "+"
    let finalAttrs = { ...variantForm.attributes };
    if (attrKey.trim() && attrVal.trim()) {
      finalAttrs[attrKey.trim()] = attrVal.trim();
    }
    const payload = { ...variantForm, attributes: finalAttrs };

    try {
      if (editingVariantId) {
        // Editar variante existente
        const updated = await updateVariantMut.mutateAsync({
          productId: product.id,
          variantId: editingVariantId,
          payload: payload as UpdateVariantPayload,
        });
        setVariants((prev) => prev.map((v) => v.id === editingVariantId ? updated : v));
      } else {
        // Nueva variante
        const created = await addVariantMut.mutateAsync({
          productId: product.id,
          payload,
        });
        setVariants((prev) => [...prev, created]);
      }
      setShowVariantForm(false);
      setEditingVariantId(null);
      setVariantError(null);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Error al guardar la variante.';
      setVariantError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!product) return;
    try {
      await deleteVariantMut.mutateAsync({ productId: product.id, variantId });
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
    } catch {
      alert('No se pudo eliminar la variante.');
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit && product) {
        await updateMut.mutateAsync({ id: product.id, payload: form });
      } else {
        const created = await createMut.mutateAsync(form);
        for (const pending of pendingFiles) {
          const uploaded = await adminService.uploadMedia(pending.file);
          await adminService.addProductImage(created.id, {
            url: uploaded.url,
            alt: pending.alt || undefined,
          });
          URL.revokeObjectURL(pending.preview);
        }
        for (const gallery of pendingGalleryUrls ?? []) {
          await adminService.addProductImage(created.id, { url: gallery.url });
        }
      }
      navigate('/admin/productos');
    } catch {
      setError('No se pudo guardar el producto. Verificá los datos e intentá de nuevo.');
    }
  };

  const isSaving = createMut.isPending || updateMut.isPending || uploadingImages;

  // Loading skeleton mientras se carga el producto por ID
  if (isEdit && !formReady && loadingProduct) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  // Si el ID no existe y ya terminó de cargar sin resultado
  if (isEdit && !formReady && !loadingProduct && !product) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          Producto no encontrado.{' '}
          <Alert.Link onClick={() => navigate('/admin/productos')}>Volver al listado</Alert.Link>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 px-3 px-lg-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="d-flex align-items-start justify-content-between mb-4 flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            className="d-flex align-items-center gap-1"
            onClick={() => navigate('/admin/productos')}
          >
            <ArrowLeft size={14} /> Volver
          </Button>
          <div>
            <h1 className="h5 fw-bold mb-0">
              {isEdit ? `Editar producto` : 'Nuevo producto'}
            </h1>
            {isEdit && product && (
              <span className="small text-muted">{product.name}</span>
            )}
          </div>
        </div>

        <Button
          form="product-form"
          type="submit"
          variant="primary"
          size="sm"
          className="d-flex align-items-center gap-2"
          disabled={isSaving}
        >
          {isSaving
            ? <><Spinner size="sm" className="me-1" /> Guardando…</>
            : <><Save size={14} /> {isEdit ? 'Guardar cambios' : 'Crear producto'}</>}
        </Button>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      <Form id="product-form" onSubmit={handleSubmit}>
        <div className="row g-4">

          {/* ── Columna principal (izquierda) ─────────────────────────────── */}
          <div className="col-lg-8">

            {/* Información básica */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white fw-semibold border-bottom py-3">
                Información del producto
              </Card.Header>
              <Card.Body className="p-4">

                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium small">
                    Nombre <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    placeholder="Ej: Zapatillas Nike Air Max 90"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium small">
                    Slug (URL) <span className="text-danger">*</span>
                    <span className="text-muted fw-normal ms-2" style={{ fontSize: '0.75rem' }}>
                      /productos/{form.slug || '…'}
                    </span>
                  </Form.Label>
                  <Form.Control
                    value={form.slug}
                    onChange={(e) => set({ slug: e.target.value })}
                    required
                    pattern="[a-z0-9\-]+"
                    placeholder="zapatillas-nike-air-max-90"
                  />
                  <Form.Text className="text-muted">
                    Solo minúsculas, números y guiones. Se auto-genera desde el nombre.
                  </Form.Text>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="fw-medium small">
                    Descripción <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={form.description}
                    onChange={(e) => set({ description: e.target.value })}
                    required
                    placeholder="Resumen breve del producto (se muestra en la ficha y tarjetas)…"
                    style={{ whiteSpace: 'pre-wrap' }}
                  />
                  <Form.Text className="text-muted">Los saltos de línea se conservarán al mostrar el producto.</Form.Text>
                </Form.Group>

                <Form.Group className="mt-3">
                  <Form.Label className="fw-medium small">Detalles técnicos / especificaciones</Form.Label>
                  <RichTextEditor
                    value={form.details ?? ''}
                    onChange={(html) => set({ details: html })}
                    placeholder="Especificaciones técnicas, materiales, dimensiones, instrucciones…"
                    minHeight={280}
                  />
                  <Form.Text className="text-muted">Se mostrará en una sección separada en la página del producto.</Form.Text>
                </Form.Group>

              </Card.Body>
            </Card>

            {/* Imágenes */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white fw-semibold border-bottom py-3 d-flex align-items-center gap-2">
                <Image size={15} /> Imágenes del producto
                {images.length > 0 && (
                  <Badge bg="secondary" className="ms-auto fw-normal">{images.length}</Badge>
                )}
              </Card.Header>
              <Card.Body className="p-4">

                {imageError && (
                  <Alert variant="danger" className="py-2 small mb-3">{imageError}</Alert>
                )}

                {/* Grid de imágenes */}
                {(images.length > 0 || pendingFiles.length > 0 || (pendingGalleryUrls ?? []).length > 0) && (
                  <div className="d-flex flex-wrap gap-3 mb-3">
                    {images.map((img, i) => (
                      <div key={img.id} className="position-relative">
                        <div
                          style={{
                            width: 100, height: 100, borderRadius: 8, overflow: 'hidden',
                            border: '1px solid #dee2e6', background: '#f8f9fa',
                          }}
                        >
                          <img
                            src={img.url}
                            alt={img.alt ?? `imagen ${i + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=?';
                            }}
                          />
                        </div>
                        {i === 0 && (
                          <Badge
                            bg="primary"
                            className="position-absolute"
                            style={{ top: 4, left: 4, fontSize: '0.6rem' }}
                          >
                            Principal
                          </Badge>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img)}
                          disabled={deleteVariantMut.isPending}
                          className="position-absolute d-flex align-items-center justify-content-center"
                          style={{
                            top: 4, right: 4, width: 22, height: 22, padding: 0,
                            background: 'rgba(220,53,69,0.85)', border: 'none',
                            borderRadius: 5, cursor: 'pointer',
                          }}
                          title="Eliminar imagen"
                        >
                          <X size={12} color="#fff" />
                        </button>
                      </div>
                    ))}

                    {/* Archivos pendientes (solo modo crear) */}
                    {pendingFiles.map((p) => (
                      <div key={p.id} className="position-relative">
                        <div
                          style={{
                            width: 100, height: 100, borderRadius: 8, overflow: 'hidden',
                            border: '2px dashed #0d6efd', background: '#f0f5ff',
                          }}
                          title={p.file.name}
                        >
                          <img
                            src={p.preview}
                            alt={p.file.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <Badge
                          bg="info"
                          className="position-absolute"
                          style={{ bottom: 4, left: 4, fontSize: '0.6rem' }}
                        >
                          pendiente
                        </Badge>
                        <button
                          type="button"
                          onClick={() => handleRemovePending(p.id)}
                          className="position-absolute d-flex align-items-center justify-content-center"
                          style={{
                            top: 4, right: 4, width: 22, height: 22, padding: 0,
                            background: 'rgba(220,53,69,0.85)', border: 'none',
                            borderRadius: 5, cursor: 'pointer',
                          }}
                          title="Quitar"
                        >
                          <X size={12} color="#fff" />
                        </button>
                      </div>
                    ))}

                    {/* URLs de galería pendientes (solo modo crear) */}
                    {(pendingGalleryUrls ?? []).map((g) => (
                      <div key={g.id} className="position-relative">
                        <div
                          style={{
                            width: 100, height: 100, borderRadius: 8, overflow: 'hidden',
                            border: '2px dashed #198754', background: '#f0fff4',
                          }}
                        >
                          <img
                            src={g.url}
                            alt={g.url}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <Badge
                          bg="success"
                          className="position-absolute"
                          style={{ bottom: 4, left: 4, fontSize: '0.6rem' }}
                        >
                          galería
                        </Badge>
                        <button
                          type="button"
                          onClick={() =>
                            setPendingGalleryUrls((prev) =>
                              (prev ?? []).filter((x) => x.id !== g.id),
                            )
                          }
                          className="position-absolute d-flex align-items-center justify-content-center"
                          style={{
                            top: 4, right: 4, width: 22, height: 22, padding: 0,
                            background: 'rgba(220,53,69,0.85)', border: 'none',
                            borderRadius: 5, cursor: 'pointer',
                          }}
                          title="Quitar"
                        >
                          <X size={12} color="#fff" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline-primary"
                    size="sm"
                    className="d-flex align-items-center gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImages}
                  >
                    {uploadingImages
                      ? <><Spinner size="sm" /> Subiendo…</>
                      : <><Image size={14} /> Subir imágenes</>}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-success"
                    size="sm"
                    className="d-flex align-items-center gap-2"
                    onClick={() => setShowGallery(true)}
                    disabled={uploadingImages}
                  >
                    <Images size={14} /> Desde galería
                  </Button>
                </div>
                <div className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>
                  JPG, PNG, WebP o GIF · máx. 5 MB por archivo · La primera imagen es la principal
                  {!isEdit && (pendingFiles.length > 0 || (pendingGalleryUrls ?? []).length > 0) && (
                    <strong className="text-primary ms-1">
                      · {pendingFiles.length + (pendingGalleryUrls ?? []).length} imagen{(pendingFiles.length + (pendingGalleryUrls ?? []).length) > 1 ? 'es' : ''} lista{(pendingFiles.length + (pendingGalleryUrls ?? []).length) > 1 ? 's' : ''}
                    </strong>
                  )}
                </div>

                <MediaGalleryPicker
                  show={showGallery}
                  onHide={() => setShowGallery(false)}
                  onSelect={handleGallerySelect}
                  multiple
                />
              </Card.Body>
            </Card>

            {/* Variantes */}
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white fw-semibold border-bottom py-3 d-flex align-items-center justify-content-between">
                <span className="d-flex align-items-center gap-2">
                  <Package size={15} /> Variantes
                  <Badge bg="secondary" className="fw-normal">{variants.length}</Badge>
                </span>
                {isEdit ? (
                  <Button
                    type="button"
                    variant="outline-primary"
                    size="sm"
                    className="d-flex align-items-center gap-1"
                    onClick={() => {
                      if (showVariantForm && !editingVariantId) {
                        setShowVariantForm(false);
                      } else {
                        openVariantForm();
                      }
                    }}
                  >
                    <Plus size={13} /> Agregar variante
                  </Button>
                ) : (
                  <span className="small text-muted fw-normal">
                    Disponible luego de crear el producto
                  </span>
                )}
              </Card.Header>

              {/* Formulario inline nueva/editar variante */}
              {showVariantForm && isEdit && (
                <div className="p-3 border-bottom" style={{ background: '#f8f9fa' }}>
                  <div className="small fw-semibold mb-3 text-muted">
                    {editingVariantId ? '✏️ Editando variante' : '➕ Nueva variante'}
                  </div>
                  {variantError && (
                    <Alert variant="danger" className="py-2 small mb-3">{variantError}</Alert>
                  )}
                  <div className="row g-2 mb-3">
                    <div className="col-12 col-sm-4">
                      <Form.Label className="small fw-medium mb-1">SKU *</Form.Label>
                      <InputGroup size="sm">
                        <Form.Control
                          value={variantForm.sku}
                          onChange={(e) => setVariantForm((prev) => ({ ...prev, sku: e.target.value }))}
                          placeholder="PROD-NEGRO-M"
                        />
                      <Button
                          type="button"
                          variant="outline-secondary"
                          title="Regenerar SKU automático"
                          disabled={!!editingVariantId}
                          onClick={() => setVariantForm((prev) => ({ ...prev, sku: buildAutoSku(variants) }))}
                        >
                          ↺
                        </Button>
                      </InputGroup>
                    </div>
                    <div className="col-6 col-sm-4">
                      <Form.Label className="small fw-medium mb-1">Precio (₲) *</Form.Label>
                      <Form.Control
                        type="number"
                        size="sm"
                        min={0}
                        value={variantForm.price}
                        onChange={(e) => setVariantForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="col-6 col-sm-4">
                      <Form.Label className="small fw-medium mb-1">Stock *</Form.Label>
                      <Form.Control
                        type="number"
                        size="sm"
                        min={0}
                        value={variantForm.stock}
                        onChange={(e) => setVariantForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <Form.Label className="small fw-medium mb-1">
                    Atributos <span className="text-muted fw-normal">(ej: Color → Negro, Talle → M)</span>
                  </Form.Label>
                  <div className="d-flex gap-2 mb-2">
                    <Form.Control
                      size="sm"
                      placeholder="Atributo (Color)"
                      value={attrKey}
                      onChange={(e) => setAttrKey(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAttr())}
                    />
                    <Form.Control
                      size="sm"
                      placeholder="Valor (Negro)"
                      value={attrVal}
                      onChange={(e) => setAttrVal(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAttr())}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline-secondary"
                      onClick={addAttr}
                    >
                      +
                    </Button>
                  </div>

                  {Object.entries(variantForm.attributes).length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mb-3">
                      {Object.entries(variantForm.attributes).map(([k, v]) => (
                        <Badge
                          key={k}
                          bg="secondary"
                          role="button"
                          style={{ cursor: 'pointer', fontSize: '0.72rem' }}
                          onClick={() => removeAttr(k)}
                          title="Click para eliminar"
                        >
                          {k}: {v} ×
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleSaveVariant}
                      disabled={!variantForm.sku.trim() || addVariantMut.isPending || updateVariantMut.isPending}
                    >
                      {(addVariantMut.isPending || updateVariantMut.isPending)
                        ? <><Spinner size="sm" className="me-1" /> Guardando…</>
                        : editingVariantId ? 'Actualizar variante' : 'Guardar variante'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => {
                        setShowVariantForm(false);
                        setEditingVariantId(null);
                        setVariantError(null);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Tabla de variantes */}
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0 small">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">SKU</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Atributos</th>
                      {isEdit && <th className="pe-3 text-end">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {variants.length === 0 ? (
                      <tr>
                        <td colSpan={isEdit ? 5 : 4} className="text-center py-5 text-muted">
                          {isEdit
                            ? 'Sin variantes. Hacé clic en "Agregar variante" para comenzar.'
                            : 'Podés agregar variantes después de crear el producto.'}
                        </td>
                      </tr>
                    ) : variants.map((v) => (
                      <tr
                          key={v.id}
                          style={editingVariantId === v.id ? { background: '#fff8e1' } : undefined}
                        >
                        <td className="ps-3 font-monospace fw-medium">{v.sku}</td>
                        <td className="fw-semibold">{formatPrice(v.price)}</td>
                        <td>
                          <Badge
                            bg={v.stock > 10 ? 'success' : v.stock > 0 ? 'warning' : 'danger'}
                            className="fw-normal"
                          >
                            {v.stock} uds.
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {Object.entries(v.attributes ?? {}).map(([k, val]) => (
                              <Badge
                                key={k}
                                bg="light"
                                text="dark"
                                style={{ fontSize: '0.7rem', border: '1px solid #dee2e6' }}
                              >
                                {k}: {val as string}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        {isEdit && (
                          <td className="pe-3 text-end">
                            <div className="d-flex gap-1 justify-content-end">
                              <Button
                                type="button"
                                variant="outline-secondary"
                                size="sm"
                                style={{ padding: '2px 7px' }}
                                onClick={() => openEditVariantForm(v)}
                                title="Editar variante"
                              >
                                <Pencil size={12} />
                              </Button>
                              <Button
                                type="button"
                                variant="outline-danger"
                                size="sm"
                                style={{ padding: '2px 7px' }}
                                disabled={deleteVariantMut.isPending}
                                onClick={() => handleDeleteVariant(v.id)}
                                title="Eliminar variante"
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

          </div>

          {/* ── Columna lateral (derecha) ──────────────────────────────────── */}
          <div className="col-lg-4">

            {/* Precio */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white fw-semibold border-bottom py-3">
                Precio
              </Card.Header>
              <Card.Body className="p-4">
                <Form.Group>
                  <Form.Label className="fw-medium small">
                    Precio base <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text>₲</InputGroup.Text>
                    <Form.Control
                      type="number"
                      min={0}
                      value={form.basePrice}
                      onChange={(e) => set({ basePrice: Number(e.target.value) })}
                      required
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Precio de referencia del producto. Cada variante puede tener su propio precio.
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Categoría */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white fw-semibold border-bottom py-3">
                Organización
              </Card.Header>
              <Card.Body className="p-4">
                <Form.Group>
                  <Form.Label className="fw-medium small">
                    Categoría <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={form.categoryId}
                    onChange={(e) => set({ categoryId: e.target.value })}
                    required
                  >
                    <option value="">Seleccioná una categoría</option>
                    {categories.map((cat) =>
                      cat.children && cat.children.length > 0 ? (
                        <optgroup key={cat.id} label={cat.name}>
                          <option value={cat.id}>{cat.name} (general)</option>
                          {cat.children.map((child) => (
                            <option key={child.id} value={child.id}>
                                {child.name}
                            </option>
                          ))}
                        </optgroup>
                      ) : (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      )
                    )}
                  </Form.Select>
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Estado */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white fw-semibold border-bottom py-3">
                Visibilidad
              </Card.Header>
              <Card.Body className="p-4">
                <Form.Check
                  type="switch"
                  id="product-active"
                  label={
                    <span>
                      <span className="fw-medium small">Producto activo</span>
                      <br />
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {form.isActive
                          ? 'Visible en el catálogo público'
                          : 'Oculto — no aparece en la tienda'}
                      </span>
                    </span>
                  }
                  checked={form.isActive ?? true}
                  onChange={(e) => set({ isActive: e.target.checked })}
                />
                <hr className="my-3" />
                <Form.Check
                  type="switch"
                  id="product-featured"
                  label={
                    <span>
                      <span className="fw-medium small">Producto destacado</span>
                      <br />
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {form.isFeatured
                          ? 'Aparece en el slider de destacados'
                          : 'No aparece en destacados'}
                      </span>
                    </span>
                  }
                  checked={form.isFeatured ?? false}
                  onChange={(e) => set({ isFeatured: e.target.checked })}
                />
              </Card.Body>
            </Card>

            {/* Metadata — solo en edición */}
            {isEdit && product && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white fw-semibold border-bottom py-3">
                  Información
                </Card.Header>
                <Card.Body className="p-4">
                  <dl className="mb-0 small">
                    <dt className="text-muted fw-normal mb-1">ID del producto</dt>
                    <dd
                      className="font-monospace text-break mb-3 p-2 rounded"
                      style={{ fontSize: '0.7rem', background: '#f8f9fa', border: '1px solid #dee2e6' }}
                    >
                      {product.id}
                    </dd>
                    <dt className="text-muted fw-normal mb-1">Slug actual</dt>
                    <dd className="mb-3 text-muted" style={{ fontSize: '0.8rem' }}>
                      /productos/{product.slug}
                    </dd>
                    <dt className="text-muted fw-normal mb-1">Creado</dt>
                    <dd className="mb-0">
                      {new Date(product.createdAt).toLocaleString('es-PY', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </dd>
                  </dl>
                </Card.Body>
              </Card>
            )}

          </div>
        </div>
      </Form>
    </Container>
  );
}
