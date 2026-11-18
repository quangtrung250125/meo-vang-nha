import { getRequestUser } from './auth.js';
import { notifyReviewReply } from './reviewNotifications.js';
import { createReviewService } from './reviewsService.js';
import { reviewsStore, findReviewBooking } from './reviewsDb.js';
const service=createReviewService({store:reviewsStore,findBooking:findReviewBooking,notifyReply:notifyReviewReply});
export async function handleReviews(req,res,action = new URL(req.url || '/', 'http://localhost').pathname.split('/').pop()) {
 res.setHeader('Cache-Control','no-store');
 try {
  if(action==='public' && req.method==='GET')return res.status(200).json({reviews:await service.published()});
  const user=await getRequestUser(req);
  if(!user)return res.status(401).json({error:'Vui lòng đăng nhập.'});
  if(action==='list' && req.method==='GET')return res.status(200).json({reviews:await service.list(user)});
  if(['submit','moderate'].includes(action) && req.method==='POST') {
   const {bookingCode,...input}=req.body || {};
   if(typeof bookingCode!=='string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(bookingCode))return res.status(400).json({error:'Mã đơn không hợp lệ.'});
   return res.status(200).json({review:await service[action](user,bookingCode,input)});
  }
  return res.status(405).json({error:'Thao tác không được hỗ trợ.'});
 }catch(e){console.warn('[Reviews]',e.message);return res.status(e.status || 503).json({error:e.status ? e.message : 'Chưa kết nối được kho đánh giá. Vui lòng thử lại.'});}
}
