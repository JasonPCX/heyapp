const TOKEN_KEY = "auth_token";

export function saveAuthToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_KEY);
  return token;
}

export function removeAuthToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}
