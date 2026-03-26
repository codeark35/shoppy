// Tipos base para todas las respuestas de API.
// Globales — aplican a todos los features.

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}
