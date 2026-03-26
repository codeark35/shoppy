import { useState } from 'react';
import { Badge, Form, Spinner, Button } from 'react-bootstrap';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useAdminUsers, useUpdateUserRole } from '..';

const ROLES = ['CUSTOMER', 'ADMIN', 'WAREHOUSE'];

const ROLE_BADGE: Record<string, { bg: string; label: string }> = {
  CUSTOMER:  { bg: 'secondary', label: 'Cliente' },
  ADMIN:     { bg: 'primary',   label: 'Admin' },
  WAREHOUSE: { bg: 'warning',   label: 'Almacén' },
};

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useAdminUsers(page, 20);
  const updateRole = useUpdateUserRole();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      await updateRole.mutateAsync({ id: userId, role: newRole });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="admin-page-header d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div>
          <h1>Usuarios</h1>
          <p>Gestión de cuentas y roles</p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
          onClick={() => refetch()}
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        {data && (
          <div className="card-header bg-transparent border-bottom py-2 px-3">
            <span className="small text-muted">{data.total} usuario{data.total !== 1 ? 's' : ''} registrado{data.total !== 1 ? 's' : ''}</span>
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th className="ps-3">Nombre</th>
                <th>Email</th>
                <th className="text-center">Pedidos</th>
                <th>Rol</th>
                <th>Registrado</th>
                <th className="pe-3">Cambiar rol</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <Spinner animation="border" variant="primary" size="sm" />
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-danger">
                    Error al cargar los usuarios.
                  </td>
                </tr>
              )}
              {data?.items.map((user) => {
                const roleMeta = ROLE_BADGE[user.role] ?? { bg: 'secondary', label: user.role };
                return (
                  <tr key={user.id}>
                    <td className="ps-3 fw-medium text-dark">{user.name}</td>
                    <td className="text-muted">{user.email}</td>
                    <td className="text-center">
                      <Badge bg="light" text="dark">{user._count?.orders ?? 0}</Badge>
                    </td>
                    <td>
                      <Badge bg={roleMeta.bg} className="fw-normal">{roleMeta.label}</Badge>
                    </td>
                    <td className="text-muted">
                      {new Date(user.createdAt).toLocaleDateString('es-PY', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="pe-3">
                      {updatingId === user.id ? (
                        <Spinner size="sm" />
                      ) : (
                        <Form.Select
                          size="sm"
                          style={{ maxWidth: 140 }}
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_BADGE[r]?.label ?? r}</option>
                          ))}
                        </Form.Select>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!isLoading && !isError && data?.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {data && data.totalPages > 1 && (
          <div className="card-footer bg-transparent border-top d-flex align-items-center justify-content-between px-3 py-2">
            <span className="small text-muted">Página {data.page} de {data.totalPages}</span>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={14} />
              </Button>
              <Button variant="outline-secondary" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
