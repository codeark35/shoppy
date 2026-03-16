export default function AdminAuditPage() {
  return (
    <div>
      <div className="admin-page-header">
        <h1>Auditoría</h1>
        <p>Registro de actividad del sistema</p>
      </div>
      <div className="admin-placeholder">
        <div className="admin-placeholder__icon">🔍</div>
        <h2>Auditoría del sistema</h2>
        <p>
          Accedé al registro de acciones de los administradores,
          cambios críticos y eventos de seguridad.
        </p>
        <span className="admin-placeholder__badge">Próximamente</span>
      </div>
    </div>
  );
}
