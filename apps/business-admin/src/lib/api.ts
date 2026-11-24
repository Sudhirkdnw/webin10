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
        // e.g. app.domain.com -> api.domain.com
        const rootDomain = parts.slice(-2).join('.');
        return `${protocol}//api.${rootDomain}/api/v1`;
      }
    }
  }

  // 3. Local development fallback
  return 'http://localhost:4000/api/v1';
}
