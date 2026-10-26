/**
 * gscService.js
 * Tích hợp Google Search Console API v3 qua Google Identity Services (OAuth 2.0).
 * Cho phép người dùng đăng nhập tài khoản Google và xem từ khóa, thứ hạng, click thật.
 */

const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const GSC_API_BASE = 'https://www.googleapis.com/webmasters/v3';

export const getGSCClientId = () => import.meta.env.VITE_GSC_CLIENT_ID || '';

/**
 * Tải script Google Identity Services SDK nếu chưa có
 */
export function loadGISScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      return resolve(window.google);
    }
    const existingScript = document.getElementById('google-gis-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google));
      existingScript.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Không thể tải Google Identity Services SDK'));
    document.body.appendChild(script);
  });
}

/**
 * Mở popup đăng nhập OAuth để xin quyền đọc Search Console
 */
export async function requestGSCToken() {
  const clientId = getGSCClientId();
  if (!clientId) {
    throw new Error('Chưa cấu hình VITE_GSC_CLIENT_ID trong file .env');
  }

  await loadGISScript();

  return new Promise((resolve, reject) => {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GSC_SCOPE,
        callback: (response) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (response.access_token) {
            sessionStorage.setItem('gsc_access_token', response.access_token);
            sessionStorage.setItem('gsc_token_expires', String(Date.now() + (response.expires_in || 3600) * 1000));
            resolve(response.access_token);
          } else {
            reject(new Error('Không nhận được access_token từ Google'));
          }
        },
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Lấy token hiện tại từ sessionStorage nếu còn hạn
 */
export function getSavedGSCToken() {
  const token = sessionStorage.getItem('gsc_access_token');
  const exp = sessionStorage.getItem('gsc_token_expires');
  if (token && exp && Date.now() < Number(exp) - 60000) {
    return token;
  }
  return null;
}

/**
 * Xóa token khi đăng xuất
 */
export function clearGSCToken() {
  sessionStorage.removeItem('gsc_access_token');
  sessionStorage.removeItem('gsc_token_expires');
  sessionStorage.removeItem('gsc_selected_site');
}

/**
 * Lấy danh sách website (properties) đã xác minh trong Google Search Console
 */
export async function fetchGSCSites(token) {
  const res = await fetch(`${GSC_API_BASE}/sites`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Lỗi tải danh sách site (${res.status})`);
  }

  const data = await res.json();
  return data.siteEntry || [];
}

/**
 * Lấy dữ liệu phân tích tìm kiếm (Queries, Clicks, Impressions, CTR, Position)
 * @param {string} token
 * @param {string} siteUrl Ví dụ: "sc-domain:meovangnha.com" hoặc "https://meovangnha.com/"
 * @param {number} days Mặc định 28 ngày
 */
export async function fetchGSCKeywords(token, siteUrl, days = 28) {
  // GSC có độ trễ 2-3 ngày, lấy từ hôm nay - (days + 2) đến hôm nay - 2 ngày
  const end = new Date();
  end.setDate(end.getDate() - 2);
  const start = new Date(end);
  start.setDate(start.getDate() - days);

  const formatDate = (d) => d.toISOString().split('T')[0];

  const body = {
    startDate: formatDate(start),
    endDate: formatDate(end),
    dimensions: ['query'],
    rowLimit: 50,
  };

  const res = await fetch(
    `${GSC_API_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Lỗi tải từ khóa GSC (${res.status})`);
  }

  const data = await res.json();
  const rows = data.rows || [];

  return rows.map((r, index) => ({
    id: index + 1,
    keyword: r.keys?.[0] || 'N/A',
    rank: Math.round(r.position * 10) / 10,
    clicks: r.clicks || 0,
    impressions: r.impressions || 0,
    ctr: Math.round((r.ctr || 0) * 1000) / 10, // phần trăm ví dụ 5.2%
    change: 0,
    trend: r.position <= 5 ? 'up' : r.position <= 10 ? 'neutral' : 'down',
  }));
}
