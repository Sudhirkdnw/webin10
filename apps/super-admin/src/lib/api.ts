export function getApiBaseUrl(): string {
  // 1. Strictly read from environment variable (.env)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 2. Client-side fallback without hardcoding any domain name:
  // If running in browser on a custom domain (not localhost / 127.0.0.1), dynamically use api subdomain
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        // e.g. admin.domain.com -> api.domain.com
        const rootDomain = parts.slice(-2).join('.');
        return `${protocol}//api.${rootDomain}/api/v1`;
      }
    }
  }

  // 3. Local development fallback
  return 'http://localhost:4000/api/v1';
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data: T; error?: any }> {
  const API_BASE_URL = getApiBaseUrl();
  const token = typeof window !== 'undefined' ? localStorage.getItem('webin10_admin_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await res.json();

    if (!res.ok) {
      if (res.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/login')) {
        localStorage.removeItem('webin10_admin_token');
        localStorage.removeItem('webin10_admin_user');
        window.location.href = '/login';
      }
      return {
        success: false,
        data: null as any,
        error: json.error?.message || json.message || 'API request failed',
      };
    }

    return {
      success: true,
      data: json.data !== undefined ? json.data : json,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null as any,
      error: err.message || 'Network connection error',
    };
  }
}
