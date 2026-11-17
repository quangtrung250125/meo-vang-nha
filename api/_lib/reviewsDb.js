import { supabaseAdmin, hasServiceRole } from './db.js';
const table = 'booking_reviews';
const checked = (result) => { if(result.error) throw result.error; return result.data; };
export const reviewsStore = {
 async find(code) { const row=checked(await supabaseAdmin.from(table).select('data').eq('booking_code',code).maybeSingle()); return row?.data || null; },
 async list(customerId) { let q=supabaseAdmin.from(table).select('data').order('updated_at',{ascending:false});if(customerId)q=q.eq('customer_id',customerId);return (checked(await q)||[]).map(r=>r.data); },
 async published() { return (checked(await supabaseAdmin.from(table).select('data').eq('published',true).order('updated_at',{ascending:false}).limit(12))||[]).map(r=>r.data); },
 async save(review, previous) {
  if(!hasServiceRole){const e=new Error('Máy chủ chưa cấu hình quyền lưu đánh giá.');e.status=503;throw e;}
  const row={booking_code:review.bookingCode,customer_id:review.customerId,data:review,published:review.published && review.publicConsent,updated_at:review.updatedAt};
  const q=previous ? supabaseAdmin.from(table).update(row).eq('booking_code',review.bookingCode).eq('data',JSON.stringify(previous)) : supabaseAdmin.from(table).insert(row);
  const saved=checked(await q.select('booking_code'));if(saved?.length!==1){const e=new Error('Đánh giá vừa được cập nhật. Vui lòng tải lại.');e.status=409;throw e;}
 },
};
export async function findReviewBooking(code) {
 const rows=checked(await supabaseAdmin.from('bookings').select('customer_id,data').eq('code',code));
 if(!rows?.length)return null;
 return {...rows[0].data,customerId:rows[0].customer_id || rows[0].data?.customerId};
}
