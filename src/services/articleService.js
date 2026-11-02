/**
 * articleService.js
 * Quản lý CRUD bài viết SEO tự động qua Supabase.
 * Hỗ trợ workflow: draft → review → published | rejected
 */
import { supabase } from '../supabaseClient';

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * Tạo slug từ tiêu đề tiếng Việt
 */
export function generateSlug(title) {
  const map = {
    à:'a',á:'a',ả:'a',ã:'a',ạ:'a',ă:'a',ằ:'a',ắ:'a',ẳ:'a',ẵ:'a',ặ:'a',
    â:'a',ầ:'a',ấ:'a',ẩ:'a',ẫ:'a',ậ:'a',
    è:'e',é:'e',ẻ:'e',ẽ:'e',ẹ:'e',ê:'e',ề:'e',ế:'e',ể:'e',ễ:'e',ệ:'e',
    ì:'i',í:'i',ỉ:'i',ĩ:'i',ị:'i',
    ò:'o',ó:'o',ỏ:'o',õ:'o',ọ:'o',ô:'o',ồ:'o',ố:'o',ổ:'o',ỗ:'o',ộ:'o',
    ơ:'o',ờ:'o',ớ:'o',ở:'o',ỡ:'o',ợ:'o',
    ù:'u',ú:'u',ủ:'u',ũ:'u',ụ:'u',ư:'u',ừ:'u',ứ:'u',ử:'u',ữ:'u',ự:'u',
    ỳ:'y',ý:'y',ỷ:'y',ỹ:'y',ỵ:'y',đ:'d',
  };
  return title
    .toLowerCase()
    .split('')
    .map(c => map[c] || c)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80)
    + '-' + Date.now().toString(36);
}

const LOCAL_STORAGE_KEY = 'seo_articles_store';

// Helper kiểm tra lỗi bảng chưa tồn tại trong Supabase
function isTableMissingError(error) {
  if (!error) return false;
  const msg = error.message || error.details || '';
  return (
    error.code === 'PGRST200' ||
    msg.includes('Could not find the table') ||
    msg.includes('schema cache') ||
    msg.includes('relation "public.seo_articles" does not exist') ||
    msg.includes('relation "seo_articles" does not exist')
  );
}

// Dữ liệu mẫu khởi tạo khi chưa có Supabase
const INITIAL_SEED_ARTICLES = [
  {
    id: 'seed-1',
    title: 'Top 7 Tiêu chí vàng chọn Khách sạn mèo cao cấp tại TP.HCM năm 2026',
    slug: 'top-7-tieu-chi-vang-chon-khach-san-meo-cao-cap-tphcm-2026',
    excerpt: 'Hướng dẫn lựa chọn khách sạn mèo an toàn, phòng riêng biệt, camera 24/7 và đội ngũ bác sĩ thú y tận tâm tại TP.HCM.',
    cover_image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=1000&q=80',
    category: 'boarding',
    category_name: 'Kinh nghiệm lưu trú',
    tags: ['Khách sạn mèo', 'Giữ mèo HCM', 'Mèo Vắng Nhà'],
    target_keyword: 'khách sạn mèo',
    meta_title: 'Top 7 Tiêu chí vàng chọn Khách sạn mèo cao cấp tại TP.HCM',
    meta_description: 'Hướng dẫn chọn khách sạn mèo uy tín tại TP.HCM với phòng riêng, camera 24/7 và bác sĩ chăm sóc.',
    seo_score: 92,
    author: 'SEO Radar AI (Mèo Vắng Nhà)',
    read_time: '5 phút đọc',
    status: 'review',
    featured: true,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    doctor_note: 'Trước khi gửi mèo, hãy kiểm tra sổ tiêm phòng 4 bệnh và dại còn hạn trong 12 tháng.',
    sections: [
      {
        heading: '1. Không gian phòng riêng biệt, khử trùng định kỳ',
        content: 'Mèo là động vật nhạy cảm về lãnh thổ. Khách sạn chuẩn cần có phòng kính riêng biệt, thông gió khử mùi độc lập thay vì nhốt chuồng sắt sát nhau.'
      },
      {
        heading: '2. Camera trực tiếp 24/7 qua điện thoại',
        content: 'Chủ nuôi có thể mở app xem Boss đang làm gì, ăn uống ngủ nghỉ ra sao vào bất cứ thời điểm nào trong ngày.'
      },
      {
        heading: '3. Quy trình chăm sóc và dinh dưỡng chuẩn thú y',
        content: 'Thực đơn pate tươi, hạt cao cấp theo khẩu vị riêng của từng bé, kết hợp giờ chơi xả stress cùng bảo mẫu.'
      }
    ]
  },
  {
    id: 'seed-2',
    title: 'Cẩm nang tiêm phòng vắc-xin cho mèo: Phác đồ chuẩn WSAVA và chi phí',
    slug: 'cam-nang-tiem-phong-vac-xin-cho-meo-phac-do-chuan-wsava',
    excerpt: 'Tổng hợp phác đồ tiêm 4 bệnh, dại cho mèo con và mèo trưởng thành theo tiêu chuẩn Hiệp hội Thú y Thế giới.',
    cover_image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1000&q=80',
    category: 'health',
    category_name: 'Sức khỏe & Tiêm phòng',
    tags: ['Tiêm phòng mèo', 'Vắc-xin', 'Sức khỏe'],
    target_keyword: 'tiêm phòng mèo',
    meta_title: 'Cẩm nang tiêm phòng vắc-xin cho mèo chuẩn thú y',
    meta_description: 'Lịch tiêm phòng vắc-xin 4 bệnh và dại đầy đủ cho mèo mọi độ tuổi.',
    seo_score: 88,
    author: 'SEO Radar AI (Mèo Vắng Nhà)',
    read_time: '6 phút đọc',
    status: 'draft',
    featured: false,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    doctor_note: 'Tẩy giun trước 5-7 ngày và không tắm mèo trong 7 ngày sau khi tiêm chủng.',
    sections: [
      {
        heading: '1. Mèo ở nhà có cần tiêm phòng không?',
        content: 'Dù ở nhà 100%, virus FPV (giảm bạch cầu) có thể bám vào đế giày, quần áo của người mang vào nhà và lây nhiễm.'
      },
      {
        heading: '2. Phác đồ 3 mũi cơ bản cho mèo con',
        content: 'Mũi 1 lúc 6-8 tuần tuổi, mũi 2 nhắc lại sau 3-4 tuần, mũi 3 kèm phòng dại lúc 14-16 tuần tuổi.'
      }
    ]
  }
];

// Lấy danh sách từ localStorage
function getLocalArticles() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      saveLocalArticles(INITIAL_SEED_ARTICLES);
      return INITIAL_SEED_ARTICLES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[articleService] Error reading from localStorage:', e);
    return INITIAL_SEED_ARTICLES;
  }
}

// Lưu danh sách vào localStorage
function saveLocalArticles(articles) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(articles));
  } catch (e) {
    console.warn('[articleService] Error saving to localStorage:', e);
  }
}

let tableStatusChecked = false;
let isTableAvailableInSupabase = true;

export function getIsTableAvailable() {
  return isTableAvailableInSupabase;
}

/**
 * Lấy tất cả bài viết (admin) - bao gồm mọi trạng thái
 * Tự động fallback sang localStorage nếu Supabase chưa tạo bảng
 */
export async function fetchAllArticles({ status, limit = 50, offset = 0 } = {}) {
  try {
    let query = supabase
      .from('seo_articles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      if (isTableMissingError(error)) {
        isTableAvailableInSupabase = false;
        console.info('[articleService] Table public.seo_articles not found in Supabase. Using localStorage fallback.');
        const local = getLocalArticles();
        const filtered = status ? local.filter(a => a.status === status) : local;
        return filtered.slice(offset, offset + limit);
      }
      throw error;
    }
    isTableAvailableInSupabase = true;
    return data || [];
  } catch (err) {
    if (isTableMissingError(err)) {
      isTableAvailableInSupabase = false;
      const local = getLocalArticles();
      const filtered = status ? local.filter(a => a.status === status) : local;
      return filtered.slice(offset, offset + limit);
    }
    // Fallback sang localStorage nếu có lỗi mạng
    console.warn('[articleService] Supabase error, falling back to local:', err.message);
    const local = getLocalArticles();
    return status ? local.filter(a => a.status === status) : local;
  }
}

/**
 * Lấy bài viết đã published (cho trang Tin tức khách hàng)
 */
export async function fetchPublishedArticles({ limit = 20 } = {}) {
  try {
    const { data, error } = await supabase
      .from('seo_articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (isTableMissingError(error)) {
        isTableAvailableInSupabase = false;
        const local = getLocalArticles();
        return local
          .filter(a => a.status === 'published')
          .sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at))
          .slice(0, limit);
      }
      throw error;
    }
    isTableAvailableInSupabase = true;
    return data || [];
  } catch (err) {
    if (isTableMissingError(err)) {
      isTableAvailableInSupabase = false;
    }
    const local = getLocalArticles();
    return local
      .filter(a => a.status === 'published')
      .sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at))
      .slice(0, limit);
  }
}

/**
 * Lấy chi tiết bài viết theo slug
 */
export async function fetchArticleBySlug(slug) {
  try {
    const { data, error } = await supabase
      .from('seo_articles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        isTableAvailableInSupabase = false;
        const local = getLocalArticles();
        return local.find(a => a.slug === slug) || null;
      }
      throw error;
    }
    isTableAvailableInSupabase = true;
    return data;
  } catch (err) {
    const local = getLocalArticles();
    return local.find(a => a.slug === slug) || null;
  }
}

/**
 * Tạo bài viết mới (trạng thái draft)
 */
export async function createArticle(articleData) {
  const slug = generateSlug(articleData.title);
  const now = new Date().toISOString();
  const newArticle = {
    id: 'local-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7),
    ...articleData,
    slug,
    status: 'draft',
    created_at: now,
    updated_at: now,
  };

  try {
    const { data, error } = await supabase
      .from('seo_articles')
      .insert({
        ...articleData,
        slug,
        status: 'draft',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        isTableAvailableInSupabase = false;
        const local = getLocalArticles();
        saveLocalArticles([newArticle, ...local]);
        return newArticle;
      }
      throw error;
    }
    isTableAvailableInSupabase = true;
    return data;
  } catch (err) {
    if (isTableMissingError(err)) {
      isTableAvailableInSupabase = false;
    }
    const local = getLocalArticles();
    saveLocalArticles([newArticle, ...local]);
    return newArticle;
  }
}

/**
 * Cập nhật nội dung bài viết
 */
export async function updateArticle(id, updates) {
  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('seo_articles')
      .update({
        ...updates,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        isTableAvailableInSupabase = false;
        const local = getLocalArticles();
        const index = local.findIndex(a => a.id === id);
        if (index !== -1) {
          local[index] = { ...local[index], ...updates, updated_at: now };
          saveLocalArticles(local);
          return local[index];
        }
      }
      throw error;
    }
    isTableAvailableInSupabase = true;
    return data;
  } catch (err) {
    const local = getLocalArticles();
    const index = local.findIndex(a => a.id === id);
    if (index !== -1) {
      local[index] = { ...local[index], ...updates, updated_at: now };
      saveLocalArticles(local);
      return local[index];
    }
    throw err;
  }
}

/**
 * Chuyển trạng thái: draft → review
 */
export async function submitForReview(id) {
  return updateArticle(id, { status: 'review' });
}

/**
 * Duyệt bài viết: review → published
 */
export async function publishArticle(id, reviewerName = 'Admin') {
  return updateArticle(id, {
    status: 'published',
    published_at: new Date().toISOString(),
    reviewed_by: reviewerName,
  });
}

/**
 * Từ chối bài viết: review → rejected
 */
export async function rejectArticle(id, reviewNote = '', reviewerName = 'Admin') {
  return updateArticle(id, {
    status: 'rejected',
    review_note: reviewNote,
    reviewed_by: reviewerName,
  });
}

/**
 * Xóa bài viết
 */
export async function deleteArticle(id) {
  try {
    const { error } = await supabase
      .from('seo_articles')
      .delete()
      .eq('id', id);

    if (error && !isTableMissingError(error)) throw error;
  } catch (err) {
    if (!isTableMissingError(err)) {
      console.warn('[articleService] Delete failed on Supabase, removing locally:', err.message);
    }
  }

  // Luôn dọn dẹp trong localStorage
  const local = getLocalArticles();
  saveLocalArticles(local.filter(a => a.id !== id));
}

/**
 * Đếm số bài theo trạng thái
 */
export async function getArticleCounts() {
  const all = await fetchAllArticles({ limit: 1000 });
  return {
    total: all.length,
    draft: all.filter(a => a.status === 'draft').length,
    review: all.filter(a => a.status === 'review').length,
    published: all.filter(a => a.status === 'published').length,
    rejected: all.filter(a => a.status === 'rejected').length,
  };
}

// ─── AI Content Generation (mô phỏng) ────────────────────────────────────────

/**
 * Danh sách chủ đề mẫu theo nhóm từ khóa phổ biến
 */
const TOPIC_TEMPLATES = {
  'khách sạn mèo': {
    title: 'Top {n} Tiêu chí vàng chọn Khách sạn mèo cao cấp tại TP.HCM năm {year}',
    category: 'boarding',
    categoryName: 'Kinh nghiệm lưu trú',
    sections: [
      {
        heading: '1. Không gian riêng biệt – Tiêu chuẩn an toàn hàng đầu',
        content: `Khách sạn mèo chuyên nghiệp phải đảm bảo phòng lưu trú cách ly hoàn toàn giữa các bé mèo:\n- **Phòng riêng có cửa kính** thay vì lồng sắt chật hẹp: giúp bé có không gian vận động thoải mái.\n- **Hệ thống thông gió độc lập**: ngăn ngừa lây nhiễm bệnh đường hô hấp giữa các bé.\n- **Giường ngủ êm, cào móng và đồ chơi**: tái tạo cảm giác quen thuộc như ở nhà.\n- **Camera trực tiếp 24/7**: Sen theo dõi bé yêu mọi lúc qua app điện thoại.`
      },
      {
        heading: '2. Đội ngũ nhân viên có chuyên môn thú y',
        content: `Yếu tố con người quyết định đến 70% chất lượng dịch vụ:\n- Nhân viên phải được đào tạo bài bản về hành vi học mèo (Feline Behavior).\n- Có bác sĩ thú y túc trực hoặc hợp tác với phòng khám gần nhất.\n- Biết cách phát hiện sớm dấu hiệu stress: bỏ ăn, trốn liên tục, liếm lông quá mức.\n- Ghi chép nhật ký chăm sóc hàng ngày gửi về cho Sen.`
      },
      {
        heading: '3. Quy trình nhận & trả mèo chuyên nghiệp',
        content: `Một khách sạn mèo uy tín sẽ có quy trình bài bản:\n- **Check-in**: Kiểm tra sức khỏe tổng quát, xác nhận lịch tiêm phòng còn hiệu lực.\n- **Ghi nhận thói quen ăn uống, vệ sinh** của từng bé để chăm sóc cá nhân hóa.\n- **Check-out**: Tóm tắt báo cáo sức khỏe và hành vi trong suốt thời gian lưu trú.\n- **Vệ sinh khử khuẩn toàn bộ phòng** sau mỗi lượt khách.`
      }
    ],
    tags: ['Khách sạn mèo', 'Giữ mèo HCM', 'Lưu trú thú cưng', 'Mèo Vắng Nhà'],
    doctorNote: 'Lời khuyên: Trước khi gửi mèo, hãy chắc chắn bé đã tiêm vắc-xin 4 bệnh và dại đầy đủ. Mang theo chăn/áo có mùi quen thuộc để giảm stress cho bé trong những ngày đầu.',
    coverImage: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=1000&q=80',
  },
  'chăm sóc mèo': {
    title: '{n} Bí quyết chăm sóc mèo khoa học giúp Boss khỏe mạnh, lông bóng mượt',
    category: 'health',
    categoryName: 'Sức khỏe & Tiêm phòng',
    sections: [
      {
        heading: '1. Chế độ dinh dưỡng cân bằng theo độ tuổi',
        content: `Mỗi giai đoạn phát triển của mèo cần khẩu phần riêng:\n- **Mèo con (2-12 tháng)**: Cần thức ăn giàu protein và DHA hỗ trợ phát triển não bộ. Cho ăn 4-5 bữa/ngày.\n- **Mèo trưởng thành (1-7 tuổi)**: Duy trì 2-3 bữa/ngày, kết hợp hạt khô (30%) và pate/thức ăn ướt (70%).\n- **Mèo lão (trên 7 tuổi)**: Chọn thức ăn dễ tiêu, bổ sung Glucosamine cho xương khớp.\n- **Luôn có nước sạch**: Sử dụng đài phun nước tự động để kích thích mèo uống nhiều hơn.`
      },
      {
        heading: '2. Vệ sinh và chăm sóc lông định kỳ',
        content: `Bộ lông là tấm gương phản chiếu sức khỏe tổng thể:\n- **Chải lông mỗi ngày 5-10 phút** bằng lược Furminator để loại bỏ lông chết, ngăn búi lông ruột.\n- **Tắm 1-2 tháng/lần** bằng sữa tắm chuyên dụng cho mèo (pH 6.5-7.0).\n- **Kiểm tra tai mỗi tuần**: Vệ sinh bằng dung dịch chuyên dụng, phát hiện sớm rận tai.\n- **Cắt móng 2 tuần/lần**: Chỉ bấm phần móng trong suốt, tránh phạm tủy hồng.`
      },
      {
        heading: '3. Tạo môi trường sống lý tưởng cho mèo',
        content: `Mèo cần không gian riêng tư và kích thích tinh thần:\n- **Kệ leo trèo, cây cào móng**: Đáp ứng bản năng leo trèo và mài vuốt tự nhiên.\n- **Góc ẩn nấp yên tĩnh**: Mèo cần nơi trú ẩn khi cảm thấy lo âu hoặc muốn nghỉ ngơi.\n- **Đồ chơi tương tác**: Cần câu lông vũ, bóng lăn, đồ chơi có catnip kích thích vận động.\n- **Khay cát sạch sẽ**: Áp dụng quy tắc "số mèo + 1" và dọn 2 lần/ngày.`
      }
    ],
    tags: ['Chăm sóc mèo', 'Sức khỏe mèo', 'Dinh dưỡng', 'Thú y'],
    doctorNote: 'Khám sức khỏe tổng quát 6 tháng/lần là cách tốt nhất để phát hiện sớm các bệnh lý tiềm ẩn. Mèo rất giỏi che giấu cơn đau, nên đừng đợi đến khi có triệu chứng rõ ràng mới đưa bé đi khám.',
    coverImage: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=1000&q=80',
  },
  'giữ mèo': {
    title: 'Hướng dẫn A-Z chuẩn bị cho lần đầu gửi mèo tại khách sạn thú cưng',
    category: 'boarding',
    categoryName: 'Kinh nghiệm lưu trú',
    sections: [
      {
        heading: '1. Checklist chuẩn bị trước khi gửi mèo',
        content: `Để chuyến lưu trú đầu tiên diễn ra suôn sẻ, Sen cần chuẩn bị:\n- ✅ **Sổ tiêm phòng**: Đảm bảo vắc-xin 4 bệnh và dại còn hiệu lực (tiêm trong vòng 12 tháng).\n- ✅ **Thức ăn quen thuộc**: Mang theo hạt/pate bé đang ăn hàng ngày, đủ cho số ngày gửi + 2 ngày dự phòng.\n- ✅ **Vật dụng mang mùi nhà**: Áo cũ của Sen, chăn ngủ, đồ chơi yêu thích.\n- ✅ **Thuốc (nếu có)**: Ghi rõ tên thuốc, liều lượng và lịch uống.\n- ✅ **Balo/lồng vận chuyển**: Cho bé làm quen từ 3-5 ngày trước.`
      },
      {
        heading: '2. Cách giúp mèo giảm stress khi xa nhà',
        content: `Mèo là loài có tính lãnh thổ rất cao, thay đổi môi trường sẽ gây lo âu:\n- **Pheromone nhân tạo (Feliway)**: Xịt vào balo vận chuyển và phòng lưu trú 15 phút trước.\n- **Giữ nguyên thói quen ăn uống**: Không đổi khẩu phần trong 3 ngày đầu lưu trú.\n- **Yêu cầu nhân viên chơi đùa**: 15-20 phút/ngày giúp bé xả stress và làm quen nhanh.\n- **Xem camera trực tiếp**: Theo dõi bé nhưng hạn chế gọi/nói qua loa vì giọng nói quen thuộc nhưng không thấy người sẽ làm bé hoang mang hơn.`
      },
      {
        heading: '3. Dấu hiệu nhận biết mèo đang thích ứng tốt',
        content: `Sau 24-48 giờ, quan sát các dấu hiệu tích cực:\n- Bé bắt đầu ăn uống bình thường và đi vệ sinh đều đặn.\n- Bé chủ động khám phá phòng, chơi với đồ chơi hoặc nhìn ra ngoài cửa kính.\n- Bé để nhân viên vuốt ve và không có phản ứng hung dữ.\n- Bé nằm ngủ ở tư thế thoải mái (cuộn tròn hoặc nằm ngửa bụng).`
      }
    ],
    tags: ['Gửi mèo', 'Khách sạn thú cưng', 'Lần đầu gửi mèo', 'Kinh nghiệm'],
    doctorNote: 'Đối với mèo nhút nhát hoặc có tiền sử stress nặng, bác sĩ có thể kê đơn thuốc an thần nhẹ (như Gabapentin) trước ngày check-in. Luôn tham khảo ý kiến bác sĩ thú y trước khi cho bé uống bất kỳ loại thuốc nào.',
    coverImage: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=1000&q=80',
  },
  'thú cưng': {
    title: 'Xu hướng chăm sóc thú cưng {year}: Công nghệ và dịch vụ mới nhất dành cho Sen',
    category: 'boarding',
    categoryName: 'Kinh nghiệm lưu trú',
    sections: [
      {
        heading: '1. Smart Pet Hotel – Khách sạn thú cưng thông minh',
        content: `Ngành dịch vụ thú cưng đang bùng nổ với nhiều công nghệ ấn tượng:\n- **Camera AI nhận diện hành vi**: Tự động cảnh báo khi phát hiện mèo bỏ ăn, nằm một chỗ quá lâu.\n- **Hệ thống quản lý phòng số hóa**: Theo dõi nhiệt độ, độ ẩm, lịch ăn và vệ sinh tự động.\n- **App di động cho Sen**: Đặt phòng, xem camera, nhận báo cáo sức khỏe hàng ngày.\n- **Thanh toán không tiếp xúc**: QR code, ví điện tử tiện lợi.`
      },
      {
        heading: '2. Dịch vụ Spa & Grooming chuyên biệt cho mèo',
        content: `Mèo không phải chó – quy trình chăm sóc hoàn toàn khác biệt:\n- **Tắm nước ấm với sữa tắm pH chuyên mèo**: Không gây kích ứng da nhạy cảm.\n- **Sấy khô nhẹ nhàng**: Dùng máy sấy tiếng ồn thấp, tránh làm bé hoảng sợ.\n- **Cắt tỉa lông chuyên nghiệp**: Phù hợp cho giống mèo lông dài như Persian, Ragdoll.\n- **Massage thư giãn**: Giúp bé giảm căng thẳng và tăng cường lưu thông máu.`
      },
      {
        heading: '3. Dinh dưỡng cá nhân hóa theo nhu cầu',
        content: `Xu hướng "custom diet" đang được nhiều Sen quan tâm:\n- **Thức ăn tươi đông lạnh (Raw Food)**: Giàu protein tự nhiên, không chất bảo quản.\n- **Thực đơn theo bệnh lý**: Dành cho mèo tiểu đường, sỏi thận, dị ứng thực phẩm.\n- **Probiotics và Prebiotics**: Hỗ trợ hệ tiêu hóa khỏe mạnh, giảm mùi phân.\n- **Thức ăn côn trùng (Insect-based)**: Bền vững, ít gây dị ứng, giàu dinh dưỡng.`
      }
    ],
    tags: ['Xu hướng thú cưng', 'Công nghệ', 'Dịch vụ mới', 'Năm ' + new Date().getFullYear()],
    doctorNote: 'Dù công nghệ phát triển đến đâu, sự quan tâm và tình yêu thương của Sen vẫn là yếu tố quan trọng nhất. Hãy dành thời gian chơi đùa và vuốt ve bé mỗi ngày!',
    coverImage: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1000&q=80',
  },
  'mèo biếng ăn': {
    title: 'Mèo bỏ ăn đột ngột? Phân tích {n} nguyên nhân thường gặp và cách xử lý tại nhà',
    category: 'nutrition',
    categoryName: 'Dinh dưỡng & Biếng ăn',
    sections: [
      {
        heading: '1. Nguyên nhân sinh lý khiến mèo biếng ăn',
        content: `Có nhiều lý do hoàn toàn bình thường khiến mèo ăn ít hơn:\n- **Thay đổi thời tiết**: Mùa hè nóng nực, nhu cầu năng lượng giảm tự nhiên 15-20%.\n- **Mèo đang thay lông theo mùa**: Búi lông trong dạ dày gây cảm giác no ảo.\n- **Mèo cái đang động dục**: Hormone thay đổi khiến bé mất tập trung vào ăn uống.\n- **Mèo vừa mới triệt sản**: Cần 24-48 giờ để thuốc mê đào thải hết, bé sẽ ăn lại bình thường.`
      },
      {
        heading: '2. Nguyên nhân bệnh lý cần lưu ý',
        content: `Nếu mèo bỏ ăn kèm các triệu chứng sau, cần đưa đi khám ngay:\n- **Nôn ói liên tục**: Có thể do tắc ruột, ngộ độc hoặc viêm tụy.\n- **Sốt cao, chảy nước mũi mắt**: Nghi ngờ nhiễm virus FHV hoặc Calicivirus.\n- **Chảy nước dãi, khó nuốt**: Dấu hiệu viêm nướu, loét miệng hoặc dị vật mắc cổ họng.\n- **Phân lỏng, phân có máu**: Viêm đường ruột, giun sán hoặc bệnh lý nghiêm trọng hơn.\n- **Nhịn ăn hoàn toàn trên 24 giờ**: Nguy cơ cao bị Gan nhiễm mỡ (Hepatic Lipidosis).`
      },
      {
        heading: '3. Mẹo kích thích vị giác hiệu quả tại nhà',
        content: `Thử áp dụng các phương pháp an toàn sau:\n- **Hâm ấm pate 5-10 giây**: Nhiệt độ ấm giải phóng mùi thơm hấp dẫn.\n- **Rắc bột thịt gà/cá freeze-dried**: Kích thích khứu giác tự nhiên.\n- **Thay bát ăn rộng miệng bằng sứ**: Tránh hội chứng mỏi râu (Whisker Fatigue).\n- **Chia nhỏ 4-5 bữa/ngày**: Thay vì để một bát đầy cả ngày bị ỉu mất mùi.\n- **Tách biệt bát ăn và khay cát**: Mèo bản năng không ăn gần nơi đi vệ sinh.`
      }
    ],
    tags: ['Mèo biếng ăn', 'Dinh dưỡng mèo', 'Chăm sóc mèo', 'Sức khỏe'],
    doctorNote: 'Tuyệt đối không ép mèo ăn bằng cách nhét thức ăn vào miệng khi chưa có chỉ định của bác sĩ. Theo dõi cân nặng hàng tuần và lượng nước uống hàng ngày để phát hiện sớm bất thường.',
    coverImage: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1000&q=80',
  },
  'tiêm phòng mèo': {
    title: 'Cẩm nang tiêm phòng vắc-xin cho mèo {year}: Phác đồ chuẩn, chi phí và lưu ý',
    category: 'health',
    categoryName: 'Sức khỏe & Tiêm phòng',
    sections: [
      {
        heading: '1. Tại sao mèo nuôi trong nhà vẫn cần tiêm phòng?',
        content: `Nhiều Sen lầm tưởng mèo ở trong nhà 100% thì không cần tiêm phòng. Thực tế:\n- **Virus FPV (giảm bạch cầu)** cực kỳ dai, tồn tại trên bề mặt đến 1 năm.\n- **Virus có thể bám trên đế giày, quần áo** của Sen mang từ ngoài đường vào.\n- **Khách đến nhà** có thể mang mầm bệnh từ thú cưng khác.\n- **Khi cần gửi mèo tại khách sạn**, hầu hết cơ sở uy tín đều yêu cầu sổ tiêm phòng.\n- **Bệnh Dại** là bệnh truyền nhiễm nguy hiểm chết người, bắt buộc phải phòng ngừa.`
      },
      {
        heading: '2. Phác đồ tiêm phòng chuẩn theo Hiệp hội Thú y Thế giới (WSAVA)',
        content: `Lịch tiêm được khuyến cáo cho mèo con và mèo trưởng thành:\n\n| Mốc tuổi | Vắc-xin | Ghi chú |\n|---|---|---|\n| 6-8 tuần | Mũi 1: Vắc-xin 4 bệnh | Kháng thể mẹ bắt đầu giảm |\n| 10-12 tuần | Mũi 2: Nhắc lại 4 bệnh | Cách mũi 1 từ 3-4 tuần |\n| 14-16 tuần | Mũi 3: Hoàn thành 4 bệnh + Dại | Hoàn thiện miễn dịch nền tảng |\n| Mỗi năm | Nhắc lại 4 bệnh + Dại | Duy trì kháng thể bảo vệ |\n\n*Tẩy giun 5-7 ngày trước mỗi mũi tiêm để cơ thể hấp thu vắc-xin tốt nhất.*`
      },
      {
        heading: '3. Lưu ý trước, trong và sau khi tiêm',
        content: `**Trước tiêm:**\n- Bé phải khỏe mạnh, không sốt, không tiêu chảy hay sổ mũi.\n- Đã tẩy giun trước 5-7 ngày.\n- Không tắm trong vòng 3 ngày trước tiêm.\n\n**Trong khi tiêm:**\n- Ôm bé nhẹ nhàng, giữ bình tĩnh (mèo cảm nhận được lo lắng của Sen).\n- Ở lại phòng khám 30 phút để theo dõi phản ứng dị ứng.\n\n**Sau tiêm:**\n- Giữ ấm cơ thể, không tắm trong 7 ngày.\n- Bé có thể hơi mệt, ngủ nhiều trong 24-48 giờ đầu – điều này bình thường.\n- Nếu bé sưng mặt, khó thở, nổi mẩn – đưa đi cấp cứu ngay.`
      }
    ],
    tags: ['Tiêm phòng mèo', 'Vắc-xin', 'Sức khỏe mèo', 'Phác đồ tiêm chủng'],
    doctorNote: 'Chi phí tiêm phòng 4 bệnh hiện nay khoảng 200.000 - 350.000đ/mũi, Dại khoảng 100.000 - 200.000đ/mũi tùy loại vắc-xin và phòng khám. Đây là khoản đầu tư nhỏ nhưng bảo vệ sức khỏe Boss suốt cả năm.',
    coverImage: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1000&q=80',
  },
};

/**
 * Tìm template gần nhất với keyword
 */
function findBestTemplate(keyword) {
  const kw = keyword.toLowerCase().trim();
  
  // Exact match hoặc chứa keyword
  for (const [key, template] of Object.entries(TOPIC_TEMPLATES)) {
    if (kw.includes(key) || key.includes(kw)) {
      return { ...template };
    }
  }
  
  // Partial match – tách từ
  const words = kw.split(/\s+/);
  for (const [key, template] of Object.entries(TOPIC_TEMPLATES)) {
    if (words.some(w => key.includes(w) && w.length > 2)) {
      return { ...template };
    }
  }
  
  // Default template
  return {
    title: `Hướng dẫn chi tiết về "${keyword}" cho người nuôi mèo tại TP.HCM`,
    category: 'health',
    categoryName: 'Sức khỏe & Tiêm phòng',
    sections: [
      {
        heading: `1. Tổng quan về ${keyword}`,
        content: `Chủ đề "${keyword}" là một trong những mối quan tâm hàng đầu của các Sen nuôi mèo hiện nay. Bài viết này sẽ cung cấp thông tin chi tiết, khoa học và thực tế để giúp bạn chăm sóc Boss tốt nhất.\n\n- Hiểu đúng về "${keyword}" giúp phòng tránh các vấn đề sức khỏe phổ biến.\n- Áp dụng kiến thức này vào thực tế chăm sóc hàng ngày.\n- Biết khi nào cần tham khảo ý kiến bác sĩ thú y.`
      },
      {
        heading: `2. Những điều cần biết khi tìm hiểu về ${keyword}`,
        content: `Để hiểu rõ hơn về chủ đề này, Sen cần nắm vững:\n- Các yếu tố ảnh hưởng đến sức khỏe và hành vi của mèo liên quan.\n- Cách nhận biết dấu hiệu bất thường sớm nhất.\n- Phương pháp xử lý phù hợp tại nhà và khi nào cần đưa bé đi khám.\n- Các sản phẩm và dịch vụ hỗ trợ uy tín tại TP.HCM.`
      },
      {
        heading: `3. Lời khuyên từ chuyên gia Mèo Vắng Nhà`,
        content: `Đội ngũ bác sĩ và chuyên viên tại Mèo Vắng Nhà luôn sẵn sàng tư vấn:\n- Hotline tư vấn 24/7 cho mọi thắc mắc về sức khỏe mèo.\n- Dịch vụ khám sức khỏe tổng quát định kỳ.\n- Chương trình chăm sóc cá nhân hóa theo nhu cầu của từng bé.\n- Đội ngũ bảo mẫu được đào tạo chuyên nghiệp về hành vi học mèo.`
      }
    ],
    tags: [keyword, 'Mèo Vắng Nhà', 'Chăm sóc mèo', 'TP.HCM'],
    doctorNote: `Nếu bạn có bất kỳ câu hỏi nào về "${keyword}", đừng ngại liên hệ đội ngũ chuyên gia tại Mèo Vắng Nhà để được tư vấn miễn phí.`,
    coverImage: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1000&q=80',
  };
}

/**
 * Tạo bài viết SEO tự động từ keyword phân tích
 * @param {string} keyword - Từ khóa mục tiêu
 * @param {object} keywordData - Dữ liệu SEO (rank, volume, clicks)
 * @returns {object} Article data ready to insert
 */
export function generateArticleFromKeyword(keyword, keywordData = {}) {
  const year = new Date().getFullYear();
  const n = Math.floor(Math.random() * 5) + 5; // 5-9
  const template = findBestTemplate(keyword);
  
  // Replace placeholders
  const title = template.title
    .replace('{year}', String(year))
    .replace('{n}', String(n));
  
  const metaDescription = `${title} - Bài viết chuyên sâu từ đội ngũ thú y Mèo Vắng Nhà. Cập nhật ${year}.`;
  
  // Estimate read time
  const totalWords = template.sections.reduce((sum, s) => sum + s.content.split(/\s+/).length, 0);
  const readTime = `${Math.max(3, Math.ceil(totalWords / 200))} phút đọc`;
  
  // Tính SEO score dựa trên keyword data
  let seoScore = 70;
  if (keywordData.rank) {
    if (keywordData.rank <= 3) seoScore = 95;
    else if (keywordData.rank <= 10) seoScore = 85;
    else if (keywordData.rank <= 20) seoScore = 75;
    else seoScore = 65;
  }
  
  return {
    title,
    excerpt: metaDescription.substring(0, 200),
    cover_image: template.coverImage,
    category: template.category,
    category_name: template.categoryName,
    tags: template.tags,
    sections: template.sections,
    doctor_note: template.doctorNote,
    target_keyword: keyword,
    meta_title: title,
    meta_description: metaDescription,
    seo_score: seoScore,
    author: 'SEO Radar AI (Mèo Vắng Nhà)',
    read_time: readTime,
  };
}
