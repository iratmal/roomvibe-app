/**
 * Centralized API helper with authentication error handling
 * Automatically handles 401/403 responses by redirecting to login
 */

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

export class AuthenticationError extends Error {
  constructor(message: string = 'Session expired. Please sign in again.') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'You do not have permission to perform this action.') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Check if response status indicates authentication error
 */
export function isAuthenticationError(status: number): boolean {
  return status === 401;
}

/**
 * Check if an error is an authentication error that should trigger logout
 */
export function isAuthError(error: unknown): boolean {
  return error instanceof AuthenticationError;
}

/**
 * Handle authentication errors by clearing session storage and redirecting to login.
 * Note: Components should also call logout() from AuthContext to clear React state.
 */
export function handleAuthError(): void {
  // Clear any stored auth state
  sessionStorage.removeItem('impersonatedRole');
  // Redirect to login page
  window.location.hash = '#/login';
}

/**
 * Wrapper around fetch that handles authentication errors
 * Returns the response for successful requests
 * Throws AuthenticationError for 401 responses
 * Throws AuthorizationError for 403 subscription-related responses
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  if (response.status === 401) {
    // Try to get error message from response
    let message = 'Session expired. Please sign in again.';
    try {
      const data = await response.json();
      if (data.error?.includes('token') || data.error?.includes('authenticated')) {
        message = 'Session expired. Please sign in again.';
      }
    } catch {
      // Ignore JSON parse errors
    }
    throw new AuthenticationError(message);
  }

  if (response.status === 403) {
    // Check if this is a subscription-related error
    try {
      const data = await response.clone().json();
      if (data.error === 'Subscription required' || data.upgrade_url) {
        throw new AuthorizationError(data.message || 'Subscription required for this feature.');
      }
    } catch (e) {
      if (e instanceof AuthorizationError) throw e;
      // Ignore JSON parse errors
    }
  }

  return response;
}

/**
 * Fetch JSON data with authentication error handling
 * Returns the parsed JSON for successful requests
 */
export async function apiFetchJson<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await apiFetch(endpoint, options);
  
  if (!response.ok) {
    let errorMessage = 'Request failed';
    try {
      const data = await response.json();
      errorMessage = data.error || data.message || errorMessage;
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export { API_URL };
