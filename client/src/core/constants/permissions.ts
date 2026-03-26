import type { UserRole, Permission } from '../types/auth';

/**
 * Mapa de permisos por rol.
 * Cuando el backend envíe permisos explícitos por usuario, este mapa
 * servirá como fallback y referencia. Los permisos explícitos del usuario
 * tienen precedencia sobre los del rol.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  CUSTOMER: [],

  WAREHOUSE: [
    'products:read',
    'inventory:read',
    'inventory:adjust',
    'orders:read',
    'orders:write',
    'categories:read',
  ],

  ADMIN: [
    'products:read',    'products:write',    'products:delete',
    'orders:read',      'orders:write',      'orders:cancel',
    'users:read',       'users:write',
    'inventory:read',   'inventory:adjust',
    'categories:read',  'categories:write',
    'promotions:read',  'promotions:write',
    'banners:read',     'banners:write',
    'analytics:read',
    'audit:read',
  ],
};
