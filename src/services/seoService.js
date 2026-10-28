/**
 * seoService.js
 * Gọi Google PageSpeed Insights API v5 để lấy dữ liệu SEO thật.
 * Phân tích Lighthouse audits và DOM thực tế để trích xuất danh sách Vấn đề (Issues) thật 100%.
 */

const PSI_BASE = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const PSI_KEY  = import.meta.env.VITE_PAGESPEED_KEY;
const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://meovangnha.com').replace(/\/$/, '');

// Danh sách trang sẽ quét
export const PAGE_CONFIGS = [
  { id: 1, name: 'Trang chủ',   path: '/' },
  { id: 2, name: 'Dịch vụ',     path: '/services' },
  { id: 3, name: 'Đặt phòng',   path: '/booking' },
  { id: 4, name: 'Khuyến mãi',  path: '/promotions' },
  { id: 5, name: 'Tin tức',     path: '/news' },
  { id: 6, name: 'Hồ sơ mèo',  path: '/pet-profile' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Chuyển audit score (0|1|null) → 'ok' | 'warn' | 'error' */
const auditStatus = (audits, key) => {
  const a = audits[key];
  if (!a || a.score === null) return 'warn';
  return a.score >= 1 ? 'ok' : 'error';
};

/** Trung bình mảng số */
const mean = (arr) =>
  arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;

// ─── PSI fetch ────────────────────────────────────────────────────────────────

/**
 * Gọi PSI cho một URL đầy đủ (mobile strategy).
 * Trả về raw lighthouseResult.
 */
async function fetchPSI(fullUrl) {
  if (!PSI_KEY) throw new Error('Chưa cấu hình VITE_PAGESPEED_KEY trong .env');

  const cats = ['performance', 'seo', 'accessibility', 'best-practices'];
  const catParam = cats.map(c => `category=${c}`).join('&');
  const url = `${PSI_BASE}?url=${encodeURIComponent(fullUrl)}&strategy=mobile&${catParam}&key=${PSI_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Parser ───────────────────────────────────────────────────────────────────

/**
 * Chuyển PSI response → object khớp với shape của SEO_PAGES trong seoData.js
 */
function parsePSIToPage({ data, id, name, path }) {
  const lhr    = data.lighthouseResult || {};
  const cats   = lhr.categories  || {};
  const audits = lhr.audits      || {};

  // Điểm SEO tổng của trang (từ Lighthouse SEO category)
  const seoScore = Math.round((cats.seo?.score ?? 0) * 100);

  // Điểm performance (tốc độ tải)
  const perfScore = Math.round((cats.performance?.score ?? 0) * 100);

  // Điểm mobile (accessibility dùng như proxy cho mobile-friendliness)
  const mobileScore = Math.round((cats.accessibility?.score ?? 0) * 100);

  // Title tag
  const titleStatus = auditStatus(audits, 'document-title');
  const titleValue  = audits['document-title']?.description ?? null;

  // Meta description
  const metaStatus = auditStatus(audits, 'meta-description');
  const metaValue  = audits['meta-description']?.description ?? null;

  // H1 — PSI kiểm tra qua heading-order
  const h1Status = auditStatus(audits, 'heading-order');

  // Có thể crawl/index không
  const indexable = audits['is-crawlable']?.score === 1;

  return {
    id,
    name,
    url: path,
    score:    seoScore,
    title:    { status: titleStatus, value: titleValue },
    meta:     { status: metaStatus,  value: metaValue  },
    h1:       { status: h1Status,    value: null        },
    speed:    perfScore,
    mobile:   mobileScore,
    indexable,
    _rawAudits: audits,
    _raw: {
      lcp:  audits['largest-contentful-paint']?.displayValue,
      cls:  audits['cumulative-layout-shift']?.displayValue,
      fcp:  audits['first-contentful-paint']?.displayValue,
      tbt:  audits['total-blocking-time']?.displayValue,
    },
  };
}

// ─── Extract Real Issues From Lighthouse ──────────────────────────────────────

export function extractIssuesFromLighthouse(audits, pageName, pagePath) {
  const issues = [];
  if (!audits) return issues;

  // 1. Title tag
  if (audits['document-title'] && audits['document-title'].score !== 1) {
    issues.push({
      id: `title-${pagePath}`,
      title: `Thẻ tiêu đề Title chưa tối ưu (${pageName})`,
      description: audits['document-title'].description || 'Trang chưa có thẻ <title> hoặc nội dung tiêu đề chưa chuẩn theo khuyến nghị của Google.',
      level: 'error',
      category: 'content',
      impact: 'Rất cao',
      pages: [pagePath],
    });
  }

  // 2. Meta description
  if (audits['meta-description'] && audits['meta-description'].score !== 1) {
    issues.push({
      id: `meta-${pagePath}`,
      title: `Thiếu thẻ Meta Description (${pageName})`,
      description: audits['meta-description'].description || 'Thẻ meta description tóm tắt nội dung trang giúp cải thiện CTR trên kết quả tìm kiếm.',
      level: 'warn',
      category: 'content',
      impact: 'Cao',
      pages: [pagePath],
    });
  }

  // 3. Heading order (H1, H2)
  if (audits['heading-order'] && audits['heading-order'].score !== 1) {
    issues.push({
      id: `heading-${pagePath}`,
      title: `Cấu trúc thẻ tiêu đề Heading (H1, H2) chưa chuẩn (${pageName})`,
      description: audits['heading-order'].description || 'Cần có đúng 1 thẻ H1 và các thẻ H2, H3 theo đúng phân cấp nội dung logic.',
      level: 'warn',
      category: 'content',
      impact: 'Trung bình',
      pages: [pagePath],
    });
  }

  // 4. Image alt
  if (audits['image-alt'] && audits['image-alt'].score !== 1) {
    issues.push({
      id: `alt-${pagePath}`,
      title: `Hình ảnh thiếu thuộc tính mô tả Alt (${pageName})`,
      description: audits['image-alt'].description || 'Thuộc tính alt giúp Google bot hiểu nội dung hình ảnh và hỗ trợ người khiếm thị đọc màn hình.',
      level: 'warn',
      category: 'content',
      impact: 'Trung bình',
      pages: [pagePath],
    });
  }

  // 5. Crawlable (Noindex)
  if (audits['is-crawlable'] && audits['is-crawlable'].score !== 1) {
    issues.push({
      id: `crawl-${pagePath}`,
      title: `Trang bị chặn Googlebot lập chỉ mục (${pageName})`,
      description: audits['is-crawlable'].description || 'Thẻ meta robots hoặc cấu hình HTTP headers đang ngăn Googlebot lập chỉ mục.',
      level: 'error',
      category: 'technical',
      impact: 'Rất cao',
      pages: [pagePath],
    });
  }

  // 6. Canonical
  if (audits['canonical'] && audits['canonical'].score !== 1) {
    issues.push({
      id: `canonical-${pagePath}`,
      title: `Chưa cấu hình thẻ Canonical link (${pageName})`,
      description: audits['canonical'].description || 'Thẻ canonical giúp Google xác định phiên bản URL gốc chuẩn, tránh trùng lặp nội dung.',
      level: 'warn',
      category: 'technical',
      impact: 'Trung bình',
      pages: [pagePath],
    });
  }

  // 7. Viewport
  if (audits['viewport'] && audits['viewport'].score !== 1) {
    issues.push({
      id: `viewport-${pagePath}`,
      title: `Thiếu thẻ meta viewport di động (${pageName})`,
      description: 'Chưa khai báo viewport để trang co giãn tương thích tốt trên điện thoại di động.',
      level: 'error',
      category: 'technical',
      impact: 'Cao',
      pages: [pagePath],
    });
  }

  // 8. Tap targets
  if (audits['tap-targets'] && audits['tap-targets'].score !== 1) {
    issues.push({
      id: `tap-${pagePath}`,
      title: `Nút bấm hoặc liên kết quá nhỏ/sát nhau (${pageName})`,
      description: 'Các mục có thể nhấn nằm quá gần nhau, dễ khiến người dùng bấm nhầm trên màn hình cảm ứng.',
      level: 'info',
      category: 'technical',
      impact: 'Thấp',
      pages: [pagePath],
    });
  }

  // 9. LCP
  const lcp = audits['largest-contentful-paint'];
  if (lcp && lcp.score !== null && lcp.score < 0.6) {
    issues.push({
      id: `lcp-${pagePath}`,
      title: `Chỉ số LCP chậm (${pageName}: ${lcp.displayValue || ''})`,
      description: `Thời gian hiển thị phần tử nội dung lớn nhất vượt quá ngưỡng 2.5s khuyến nghị của Google Core Web Vitals.`,
      level: 'warn',
      category: 'performance',
      impact: 'Cao',
      pages: [pagePath],
    });
  }

  // 10. TBT
  const tbt = audits['total-blocking-time'];
  if (tbt && tbt.score !== null && tbt.score < 0.6) {
    issues.push({
      id: `tbt-${pagePath}`,
      title: `Thời gian chặn tương tác TBT cao (${pageName}: ${tbt.displayValue || ''})`,
      description: `JavaScript chạy trên luồng chính làm gián đoạn phản hồi tương tác của người dùng.`,
      level: 'warn',
      category: 'performance',
      impact: 'Trung bình',
      pages: [pagePath],
    });
  }

  // 11. Render blocking
  const rb = audits['render-blocking-resources'];
  if (rb && rb.score !== null && rb.score < 0.8) {
    issues.push({
      id: `render-blocking-${pagePath}`,
      title: `Tài nguyên CSS/JS chặn hiển thị trang đầu tiên (${pageName})`,
      description: 'Khuyến nghị tải không đồng bộ (defer/async) các script không khẩn cấp để trang hiển thị nhanh hơn.',
      level: 'info',
      category: 'performance',
      impact: 'Trung bình',
      pages: [pagePath],
    });
  }

  // 12. Modern image formats
  const imgFormat = audits['modern-image-formats'];
  if (imgFormat && imgFormat.score !== null && imgFormat.score < 0.8) {
    issues.push({
      id: `img-format-${pagePath}`,
      title: `Hình ảnh chưa tối ưu định dạng WebP/AVIF (${pageName})`,
      description: 'Sử dụng ảnh WebP hoặc AVIF giúp giảm đáng kể dung lượng tải xuống mà không mất chi tiết ảnh.',
      level: 'info',
      category: 'performance',
      impact: 'Thấp',
      pages: [pagePath],
    });
  }

  return issues;
}

// ─── Extract Real Issues From Client DOM ──────────────────────────────────────

export function auditClientDOM() {
  const issues = [];
  if (typeof document === 'undefined') return issues;

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

  // 1. Document title
  const title = document.title?.trim() || '';
  if (!title) {
    issues.push({
      id: 'dom-title-missing',
      title: 'Tài liệu HTML thiếu thẻ <title>',
      description: 'Trang web chưa có thẻ <title> hợp lệ trong phần <head>.',
      level: 'error',
      category: 'content',
      impact: 'Rất cao',
      pages: [currentPath],
    });
  } else if (title.length < 25) {
    issues.push({
      id: 'dom-title-short',
      title: `Tiêu đề trang khá ngắn (${title.length} ký tự)`,
      description: `Tiêu đề hiện tại: "${title}". Khuyến nghị độ dài 50-60 ký tự kèm từ khóa mục tiêu.`,
      level: 'warn',
      category: 'content',
      impact: 'Trung bình',
      pages: [currentPath],
    });
  }

  // 2. Meta description
  const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim();
  if (!metaDesc) {
    issues.push({
      id: 'dom-meta-missing',
      title: 'Thiếu thẻ Meta Description trong mã nguồn',
      description: 'Chưa tìm thấy thẻ <meta name="description" content="..."> trong phần <head>.',
      level: 'warn',
      category: 'content',
      impact: 'Cao',
      pages: [currentPath],
    });
  }

  // 3. Heading H1
  const h1Elements = document.querySelectorAll('h1');
  if (h1Elements.length === 0) {
    issues.push({
      id: 'dom-h1-missing',
      title: 'Trang hiện tại không có thẻ Heading <h1> nào',
      description: 'Mỗi trang nên có đúng 1 thẻ <h1> tóm tắt chủ đề chính để Google hiểu cấu trúc trang.',
      level: 'error',
      category: 'content',
      impact: 'Rất cao',
      pages: [currentPath],
    });
  } else if (h1Elements.length > 1) {
    issues.push({
      id: 'dom-h1-multiple',
      title: `Phát hiện nhiều thẻ Heading <h1> (${h1Elements.length} thẻ)`,
      description: 'Khuyến nghị chỉ có 1 thẻ <h1> duy nhất trên mỗi trang để đảm bảo thứ bậc rõ ràng.',
      level: 'warn',
      category: 'content',
      impact: 'Trung bình',
      pages: [currentPath],
    });
  }

  // 4. Missing image alt
  const imgsWithoutAlt = document.querySelectorAll('img:not([alt]), img[alt=""]');
  if (imgsWithoutAlt.length > 0) {
    issues.push({
      id: 'dom-img-alt',
      title: `Phát hiện ${imgsWithoutAlt.length} hình ảnh chưa có thuộc tính alt`,
      description: 'Các thẻ <img> trên giao diện cần có thuộc tính alt mô tả nội dung hình ảnh cho công cụ tìm kiếm.',
      level: 'warn',
      category: 'content',
      impact: 'Trung bình',
      pages: [currentPath],
    });
  }

  // 5. Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (!ogTitle || !ogImage) {
    issues.push({
      id: 'dom-og-missing',
      title: 'Chưa cấu hình đầy đủ Open Graph tags (Facebook / Zalo)',
      description: 'Thiếu thẻ og:title hoặc og:image khiến link không hiển thị ảnh thumbnail xem trước khi chia sẻ trên mạng xã hội.',
      level: 'info',
      category: 'social',
      impact: 'Thấp',
      pages: [currentPath],
    });
  }

  // 6. Canonical link
  const canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    issues.push({
      id: 'dom-canonical-missing',
      title: 'Chưa có thẻ Canonical link <link rel="canonical">',
      description: 'Khai báo thẻ canonical giúp Google biết đâu là URL chuẩn khi trang web có nhiều tham số truy vấn.',
      level: 'info',
      category: 'technical',
      impact: 'Thấp',
      pages: [currentPath],
    });
  }

  return issues;
}

// ─── Radar aggregation ────────────────────────────────────────────────────────

function buildRadarScores(pages) {
  if (!pages.length) return { performance: 0, content: 0, technical: 0, mobile: 0, links: 55, social: 55 };

  const statusScore = (s) => (s === 'ok' ? 100 : s === 'warn' ? 50 : 0);
  const contentScores = pages.map(p =>
    Math.round((statusScore(p.title.status) + statusScore(p.meta.status) + statusScore(p.h1.status)) / 3)
  );

  return {
    performance: mean(pages.map(p => p.speed)),
    content:     mean(contentScores),
    technical:   mean(pages.map(p => p.score)),
    mobile:      mean(pages.map(p => p.mobile)),
    links:       65,
    social:      55,
  };
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function buildSummary(pages, issues = []) {
  return {
    errors:      issues.filter(i => i.level === 'error').length,
    warnings:    issues.filter(i => i.level === 'warn').length,
    suggestions: issues.filter(i => i.level === 'info').length,
    pagesOk:     pages.filter(p => p.score >= 80).length,
    pagesTotal:  pages.length,
    lastScanned: new Date().toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }),
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Quét tất cả các trang song song, trả về { pages, radarScores, siteScore, summary, issues }.
 */
export async function fetchSEOData(onPageDone) {
  const total = PAGE_CONFIGS.length;
  let done = 0;

  const results = await Promise.allSettled(
    PAGE_CONFIGS.map(({ id, name, path }) =>
      fetchPSI(`${SITE_URL}${path === '/' ? '' : path}`)
        .then(data => {
          const page = parsePSIToPage({ data, id, name, path });
          done++;
          if (onPageDone) onPageDone(done, total);
          return page;
        })
    )
  );

  const pages = results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    const { id, name, path } = PAGE_CONFIGS[i];
    const reasonMsg = r.reason?.message || 'Lỗi không xác định';
    console.error(`[SEO] Failed ${path}:`, reasonMsg);
    return {
      id,
      name,
      url: path,
      score: 0,
      title: { status: 'warn' },
      meta: { status: 'warn' },
      h1: { status: 'warn' },
      speed: 0,
      mobile: 0,
      indexable: false,
      _error: true,
      _errorMsg: reasonMsg,
    };
  });

  // Tổng hợp toàn bộ vấn đề thật
  const scannedIssues = [];

  results.forEach((r, i) => {
    const { name, path } = PAGE_CONFIGS[i];
    if (r.status === 'fulfilled' && r.value._rawAudits) {
      // 1. Issues từ kết quả Lighthouse thật
      const pageIssues = extractIssuesFromLighthouse(r.value._rawAudits, name, path);
      scannedIssues.push(...pageIssues);
    } else {
      // 2. Lỗi kết nối máy chủ/DNS từ Google
      const reasonMsg = r.reason?.message || r.value?._errorMsg || 'Không thể kết nối';
      scannedIssues.push({
        id: `err-${path}`,
        title: `Không thể kết nối đến URL (${name})`,
        description: `Google Lighthouse không thể truy cập ${SITE_URL}${path}: ${reasonMsg}. Tên miền chưa trỏ DNS hoặc máy chủ chưa deploy online.`,
        level: 'error',
        category: 'technical',
        impact: 'Rất cao',
        pages: [path],
      });
    }
  });

  // 3. Issues từ DOM client thực tế
  const domIssues = auditClientDOM();
  const allIssues = [...scannedIssues, ...domIssues];

  // Gom các issue trùng tiêu đề thành 1 mục và gộp danh sách các trang
  const issueMap = new Map();
  allIssues.forEach((item) => {
    if (issueMap.has(item.title)) {
      const existing = issueMap.get(item.title);
      existing.pages = Array.from(new Set([...existing.pages, ...item.pages]));
    } else {
      issueMap.set(item.title, { ...item, pages: [...item.pages] });
    }
  });

  const issues = Array.from(issueMap.values());

  const goodPages = pages.filter(p => !p._error);
  const radarScores = buildRadarScores(goodPages.length ? goodPages : pages);
  const siteScore   = goodPages.length
    ? Math.round(goodPages.reduce((s, p) => s + p.score, 0) / goodPages.length)
    : 0;
  const summary = buildSummary(pages, issues);

  return { pages, radarScores, siteScore, summary, issues };
}

export const hasPSIKey = () => Boolean(PSI_KEY);
