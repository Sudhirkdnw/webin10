export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('sudhirkdnw.in')) {
      return 'https://api.sudhirkdnw.in/api/v1';
    }
    if (host.includes('webin10.com')) {
      return 'https://api.webin10.com/api/v1';
    }
  }
  return 'http://localhost:4000/api/v1';
}
