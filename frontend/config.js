// Central configuration for backend API URLs
const API_URLS = [
  'http://192.168.1.67:8080',
  'http://192.168.1.180:8080'
];

export const config = {
  apiUrl: API_URLS[0]
};

export async function detectActiveApiUrl() {
  for (const url of API_URLS) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 800); // 800ms timeout
      const res = await fetch(`${url}/api/auth/verifica-email?email=ping@mondopt.com`, {
        signal: controller.signal
      });
      clearTimeout(id);
      
      // If the server responds with 200 or 409, it means it is active and reachable
      if (res.status === 200 || res.status === 409) {
        config.apiUrl = url;
        console.log('[Config] Detected active API URL:', url);
        return url;
      }
    } catch (e) {
      // Ignore network errors and check the next URL
    }
  }
  console.log('[Config] Fallback to default API URL:', config.apiUrl);
  return config.apiUrl;
}
