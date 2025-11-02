/**
 * API Response Types
 * Tipos genéricos para las respuestas de la API
 */

export interface SuccessResponse<T> {
  data: T;
  message?: string;
}

export interface ErrorResponse {
  message: string;
  cause?: string;
  errors?: string[];
  instance?: string;
  context?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}
