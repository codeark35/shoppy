import { useAuthStore } from '../../features/auth/store/authStore';
import { ROLE_PERMISSIONS } from '../../core/constants/permissions';
import type { Permission } from '../../core/types/auth';

/**
 * Verifica si el usuario autenticado tiene un permiso específico.
 *
 * La verificación sigue este orden de precedencia:
 * 1. Permisos explícitos del usuario (cuando el backend los envíe en el JWT)
 * 2. Permisos derivados del rol del usuario
 *
 * @example
 * const canDelete = usePermission('products:delete');
 * <Button disabled={!canDelete}>Eliminar</Button>
 */
export function usePermission(permission: Permission): boolean {
  const user = useAuthStore((s) => s.user);

  if (!user) return false;

  // Fase futura: si el backend envía permisos explícitos, usar esos primero
  // if (user.permissions?.includes(permission)) return true;

  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
}

/**
 * Verifica si el usuario tiene TODOS los permisos indicados.
 */
export function usePermissions(permissions: Permission[]): boolean {
  const user = useAuthStore((s) => s.user);

  if (!user) return false;

  const rolePerms = ROLE_PERMISSIONS[user.role] ?? [];
  return permissions.every((p) => rolePerms.includes(p));
}

/**
 * Verifica si el usuario tiene AL MENOS UNO de los permisos indicados.
 */
export function useAnyPermission(permissions: Permission[]): boolean {
  const user = useAuthStore((s) => s.user);

  if (!user) return false;

  const rolePerms = ROLE_PERMISSIONS[user.role] ?? [];
  return permissions.some((p) => rolePerms.includes(p));
}
