// Re-exporta desde core/types para mantener compatibilidad con imports existentes.
// Nuevos features deben importar directamente desde '../../core/types/api'.
export type { ApiResponse, PaginatedResult, ApiError, BaseEntity } from '../../core/types/api';
