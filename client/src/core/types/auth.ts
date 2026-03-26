// Tipos de dominio de autenticación usados globalmente.
// Importar de aquí para evitar dependencias de features/ en shared/ o core/.

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'WAREHOUSE';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  googleId?: string;
  role: UserRole;
  createdAt: string;
}

// Permisos granulares — Fase 3: usados por usePermission y PermissionGate
export type Permission =
  | 'products:read'    | 'products:write'    | 'products:delete'
  | 'orders:read'      | 'orders:write'      | 'orders:cancel'
  | 'users:read'       | 'users:write'
  | 'inventory:read'   | 'inventory:adjust'
  | 'categories:read'  | 'categories:write'
  | 'promotions:read'  | 'promotions:write'
  | 'banners:read'     | 'banners:write'
  | 'analytics:read'
  | 'audit:read';
