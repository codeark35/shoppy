import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthStore } from '../../features/auth/store/authStore';
import { usePermission, usePermissions, useAnyPermission } from './usePermission';
import type { User } from '../../features/auth/types/auth.types';

const ADMIN_USER: User = {
  id: '1', email: 'admin@test.com', name: 'Admin',
  role: 'ADMIN', createdAt: '2024-01-01',
};

const WAREHOUSE_USER: User = {
  id: '2', email: 'wh@test.com', name: 'Warehouse',
  role: 'WAREHOUSE', createdAt: '2024-01-01',
};

const CUSTOMER_USER: User = {
  id: '3', email: 'customer@test.com', name: 'Customer',
  role: 'CUSTOMER', createdAt: '2024-01-01',
};

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false, isInitializing: false });
});

describe('usePermission', () => {
  it('returns false when no user is authenticated', () => {
    const { result } = renderHook(() => usePermission('products:read'));
    expect(result.current).toBe(false);
  });

  it('ADMIN has products:delete permission', () => {
    useAuthStore.setState({ user: ADMIN_USER, isAuthenticated: true, accessToken: 'tok', isInitializing: false });
    const { result } = renderHook(() => usePermission('products:delete'));
    expect(result.current).toBe(true);
  });

  it('WAREHOUSE does not have products:delete permission', () => {
    useAuthStore.setState({ user: WAREHOUSE_USER, isAuthenticated: true, accessToken: 'tok', isInitializing: false });
    const { result } = renderHook(() => usePermission('products:delete'));
    expect(result.current).toBe(false);
  });

  it('WAREHOUSE has inventory:adjust permission', () => {
    useAuthStore.setState({ user: WAREHOUSE_USER, isAuthenticated: true, accessToken: 'tok', isInitializing: false });
    const { result } = renderHook(() => usePermission('inventory:adjust'));
    expect(result.current).toBe(true);
  });

  it('CUSTOMER has no permissions', () => {
    useAuthStore.setState({ user: CUSTOMER_USER, isAuthenticated: true, accessToken: 'tok', isInitializing: false });
    const { result } = renderHook(() => usePermission('products:read'));
    expect(result.current).toBe(false);
  });
});

describe('usePermissions (ALL required)', () => {
  it('returns true when user has all requested permissions', () => {
    useAuthStore.setState({ user: ADMIN_USER, isAuthenticated: true, accessToken: 'tok', isInitializing: false });
    const { result } = renderHook(() => usePermissions(['products:read', 'products:write']));
    expect(result.current).toBe(true);
  });

  it('returns false when user is missing one permission', () => {
    useAuthStore.setState({ user: WAREHOUSE_USER, isAuthenticated: true, accessToken: 'tok', isInitializing: false });
    const { result } = renderHook(() => usePermissions(['products:read', 'products:delete']));
    expect(result.current).toBe(false);
  });
});

describe('useAnyPermission', () => {
  it('returns true when user has at least one permission', () => {
    useAuthStore.setState({ user: WAREHOUSE_USER, isAuthenticated: true, accessToken: 'tok', isInitializing: false });
    const { result } = renderHook(() => useAnyPermission(['products:delete', 'inventory:adjust']));
    expect(result.current).toBe(true);
  });

  it('returns false when user has none of the permissions', () => {
    useAuthStore.setState({ user: WAREHOUSE_USER, isAuthenticated: true, accessToken: 'tok', isInitializing: false });
    const { result } = renderHook(() => useAnyPermission(['audit:read', 'users:write']));
    expect(result.current).toBe(false);
  });
});
