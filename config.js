// =============================================================================
// MRS CRACKERS — SUPABASE BACKEND CONFIGURATION
// Connects your Cloudflare Pages Frontend to your live Supabase Database
// =============================================================================

const SUPABASE_CONFIG = {
  // Your Supabase Project URL
  url: 'https://fbescqnzgjwhsteylrnl.supabase.co',

  // Your Supabase Publishable / Public Anon Key
  anonKey: 'sb_publishable_DFNKyba8_NlIEkWTTHisuQ_-0XLkWiP'
};

// Helper to resolve backend server endpoints seamlessly across localhost, Cloudflare Pages, file://, and Live Server
function getBackendApiUrl(endpoint) {
  if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;
  if (typeof window !== 'undefined') {
    if (window.BACKEND_API_BASE) {
      return window.BACKEND_API_BASE.replace(/\/$/, '') + endpoint;
    }
    // If running on Cloudflare Pages (e.g. mrscrackers.pages.dev) or any HTTPS production domain,
    // use relative URL directly to hit Cloudflare Pages Functions (/api/...)
    const host = window.location.hostname || '';
    if (host.includes('pages.dev') || host.includes('mrscrackers') || window.location.protocol === 'https:') {
      return endpoint;
    }
    // If running directly on backend server port 8080, use relative URL
    if (window.location.port === '8080') {
      return endpoint;
    }
    // If loaded on local LAN / Live Server port (e.g. 5500), hit port 8080 on the same host
    if (window.location.protocol.startsWith('http')) {
      const devHost = host || '127.0.0.1';
      return `${window.location.protocol}//${devHost}:8080${endpoint}`;
    }
  }
  // Otherwise, fallback to the local Node backend server
  return 'http://127.0.0.1:8080' + endpoint;
}

// Expose globally for browser runtime
if (typeof window !== 'undefined') {
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
  window.getBackendApiUrl = getBackendApiUrl;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SUPABASE_CONFIG, getBackendApiUrl };
}
