import React from 'react';
import { usePermission, useAnyPermission, usePermissions } from '../../hooks/usePermission';
import type { Permission } from '../../../core/types/auth';

interface Props {
  children: React.ReactNode;
  /** Renderizar si el usuario tiene ESTE permiso. */
  permission?: Permission;
  /** Renderizar si el usuario tiene TODOS estos permisos. */
  all?: Permission[];
  /** Renderizar si el usuario tiene AL MENOS UNO de estos permisos. */
  any?: Permission[];
  /** Qué renderizar cuando el usuario NO tiene el permiso. Por defecto null. */
  fallback?: React.ReactNode;
}

/**
 * Renderiza `children` solo si el usuario tiene los permisos requeridos.
 * Usar para ocultar botones, secciones o acciones según el rol del usuario.
 *
 * @example
 * // Requiere un permiso específico
 * <PermissionGate permission="products:delete">
 *   <Button variant="danger">Eliminar</Button>
 * </PermissionGate>
 *
 * @example
 * // Requiere cualquiera de varios permisos
 * <PermissionGate any={['orders:write', 'orders:cancel']} fallback={<span>Sin acceso</span>}>
 *   <OrderActions />
 * </PermissionGate>
 */
export function PermissionGate({ children, permission, all, any, fallback = null }: Props) {
  const hasSingle    = usePermission(permission ?? ('' as Permission));
  const hasAll       = usePermissions(all ?? []);
  const hasAny       = useAnyPermission(any ?? []);

  let allowed = false;

  if (permission) allowed = hasSingle;
  else if (all?.length)  allowed = hasAll;
  else if (any?.length)  allowed = hasAny;
  else allowed = true; // Sin restricción declarada

  return allowed ? <>{children}</> : <>{fallback}</>;
}
