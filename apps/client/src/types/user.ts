/**
 * User Types
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface LogInResponse {
  message: string;
  token: string;
  user: User;
}

// Keep this for backward compatibility if needed elsewhere
export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}
