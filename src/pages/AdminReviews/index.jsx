import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, MessageSquare, Tag, AlertTriangle, RefreshCw, Globe, EyeOff, Search, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useReviews } from '../../contexts/ReviewsContext';
import { reviewInsights, needsReviewAttention } from '../../utils/reviewInsights';
import { ReviewOverview, ReviewTopics } from '../../components/ReviewAnalytics';
const TABS = [['overview','Tổng quan',Star],['list','Danh sách đánh giá',MessageSquare],['topics','Chủ đề',Tag],['urgent','Cần xử lý',AlertTriangle]];
const initials = name => (name || 'Khách').split(' ').filter(Boolean).map(n=>n[0]).slice(-2).join('');
export default function AdminReviews() {
  const { reviews, error, loading, refresh, moderateReview } = useReviews();
  const [params,setParams] = useSearchParams();
  const focus = params.get('focus');
  const requestedTab = focus ? 'list' : params.get('tab') || 'overview';
  const tab = TABS.some(([key])=>key===requestedTab) ? requestedTab : 'overview';
  const [query,setQuery] = useState(''), [stars,setStars] = useState(''), [status,setStatus] = useState('');
  const [replyCode,setReplyCode] = useState(''), [reply,setReply] = useState(''), [busy,setBusy] = useState(''), [actionError,setActionError] = useState('');
  const insights = useMemo(()=>reviewInsights(reviews),[reviews]);
  const selectTab = key => { const next=new URLSearchParams(params);next.set('tab',key);next.delete('focus');setParams(next); };
  useEffect(()=>{if(!focus)return;const timer=setTimeout(()=>document.getElementById('review-'+focus)?.scrollIntoView({behavior:'smooth',block:'center'}),100);return()=>clearTimeout(timer);},[focus,reviews]);
  const normalizedQuery = query.trim().toLocaleLowerCase('vi');
  const filtered = reviews.filter(review => {
    if(tab==='urgent')return needsReviewAttention(review);
    return (!stars || review.rating===Number(stars))
      && (!status || (status==='pending'?!review.reply?.trim():status==='replied'?Boolean(review.reply?.trim()):status==='published'?review.published:!review.published))
      && [review.authorName,review.comment,review.bookingCode,review.petNames].join(' ').toLocaleLowerCase('vi').includes(normalizedQuery);
  });
  async function update(code,value) {
    if(busy)return;setBusy(code);setActionError('');
    try {await moderateReview(code,value);if(value.reply)setReplyCode('');toast.success(value.reply?'Đã gửi câu trả lời cho khách.':value.published?'Đã duyệt hiển thị trên trang chủ.':'Đã gỡ đánh giá khỏi trang chủ.');}
    catch(e){setActionError(e.message);}finally{setBusy('');}
  }
  return <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
    <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase mb-2">Lắng nghe khách hàng</p><h1 className="text-2xl sm:text-3xl font-extrabold">Đánh giá & Phản hồi</h1><p className="text-sm text-gray-500 mt-2 max-w-2xl">Đánh giá sau check-out, phản hồi khách và duyệt những chia sẻ được phép hiển thị trên trang chủ.</p></div><button disabled={loading} onClick={refresh} className="shrink-0 inline-flex items-center gap-2 border border-gray-200 rounded-xl bg-white px-3 py-2.5 text-xs font-semibold disabled:opacity-50"><RefreshCw className={'w-4 h-4 '+(loading?'animate-spin':'')}/>Tải lại</button></div>
    <nav aria-label="Mục đánh giá" className="flex flex-wrap bg-white border border-gray-100 shadow-sm rounded-2xl p-2 gap-1">{TABS.map(([key,label,Icon])=><button key={key} aria-current={tab===key?'page':undefined} onClick={()=>selectTab(key)} className={'inline-flex items-center gap-2 px-4 py-3 text-xs font-bold rounded-xl transition-colors '+(tab===key?'bg-orange-50 text-orange-600':'text-gray-500 hover:bg-gray-50')}><Icon className="w-4 h-4"/>{label}{key==='urgent' && insights.urgent.length>0 && <span className="bg-rose-500 rounded-full text-white px-1.5 py-0.5">{insights.urgent.length}</span>}</button>)}</nav>
    {(error || actionError) && <div role="alert" className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-sm">{actionError || error}</div>}
    {loading && !reviews.length ? <p role="status" className="text-center py-12 text-gray-400">Đang tải đánh giá…</p> : tab==='overview' ? <ReviewOverview insights={insights}/> : tab==='topics' ? <ReviewTopics topics={insights.topics}/> : <>
      {tab==='urgent' ? <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-sm text-rose-800">Các đánh giá từ 2 sao trở xuống và chưa trả lời. Khi gửi câu trả lời, đánh giá sẽ tự rời khỏi danh sách này.</div> : <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-wrap gap-3"><div className="relative flex-1 basis-60 min-w-0"><Search className="absolute left-3 top-3 w-4 h-4 text-gray-400"/><input aria-label="Tìm đánh giá" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm theo tên, nhận xét, mã đơn…" className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm"/></div><select aria-label="Lọc số sao" value={stars} onChange={e=>setStars(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm"><option value="">Tất cả số sao</option>{[5,4,3,2,1].map(v=><option key={v} value={v}>{v} sao</option>)}</select><select aria-label="Lọc trạng thái" value={status} onChange={e=>setStatus(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm"><option value="">Tất cả trạng thái</option><option value="pending">Chờ trả lời</option><option value="replied">Đã trả lời</option><option value="published">Đang hiển thị trang chủ</option><option value="unpublished">Chưa hiển thị trang chủ</option></select></div>}
      <p className="text-xs text-gray-400">{filtered.length} đánh giá{tab==='urgent'?' cần xử lý':''}</p>
      {!filtered.length && <div className="p-12 text-center bg-white border border-gray-100 rounded-2xl"><CheckCircle2 className="w-9 h-9 mx-auto text-emerald-400 mb-3"/><p className="text-sm text-gray-500">{tab==='urgent'?'Không còn đánh giá cần xử lý.':'Chưa có đánh giá phù hợp.'}</p></div>}
      {filtered.map(review=><article id={'review-'+review.bookingCode} key={review.bookingCode} data-testid={'review-card-'+review.bookingCode} className={'bg-white rounded-2xl border p-5 sm:p-6 shadow-sm scroll-mt-24 '+(review.bookingCode===focus?'border-orange-300 ring-2 ring-orange-100':'border-gray-100')}>
        <div className="flex items-start gap-3"><div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center text-sm font-bold">{initials(review.authorName)}</div><div className="min-w-0 flex-1">
          <div className="flex flex-wrap justify-between items-center gap-2"><h2 className="text-sm font-bold">{review.authorName}</h2><div className="flex flex-wrap items-center gap-2"><span aria-label={review.rating+' trên 5 sao'} className="flex items-center gap-0.5 text-amber-500">{[1,2,3,4,5].map(v=><Star key={v} className={'w-3.5 h-3.5 '+(v<=review.rating?'fill-current':'text-gray-200')}/>)}</span><span className={'inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg '+(review.reply?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700')}>{review.reply?<CheckCircle2 className="w-3 h-3"/>:<Clock className="w-3 h-3"/>}{review.reply?'Đã trả lời':'Chờ trả lời'}</span></div></div>
          <p className="text-xs text-gray-400 mt-1 break-words">Bé {review.petNames} · Phòng {review.roomName || '—'} · Đơn #{review.bookingCode} · {new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
          {review.editedAt && <p className="text-[11px] text-gray-400 mt-1">Khách đã cập nhật: {new Date(review.editedAt).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}</p>}
          <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap break-words">{review.comment || 'Khách chỉ chấm sao.'}</p><div className="flex flex-wrap gap-2 mt-3">{review.tags?.map(tag=><span key={tag} className="text-[11px] text-orange-600 bg-orange-50 rounded-full px-2 py-1">◇ {tag}</span>)}</div>
          {review.reply && <div className="bg-emerald-50 rounded-xl p-3 mt-3 text-xs text-emerald-800"><p className="whitespace-pre-wrap break-words"><strong>Mèo Vắng Nhà trả lời: </strong>{review.reply}</p>{review.replyAt && <p className="text-[10px] opacity-70 mt-2">{new Date(review.replyAt).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}</p>}</div>}
          {replyCode===review.bookingCode ? <form className="mt-4 space-y-2" onSubmit={e=>{e.preventDefault();update(review.bookingCode,{reply});}}><textarea autoFocus disabled={Boolean(busy)} aria-label="Nội dung trả lời" maxLength={2000} rows={3} value={reply} onChange={e=>setReply(e.target.value)} className="w-full border border-orange-200 rounded-xl p-3 text-sm focus:outline-orange-400" placeholder="Nhập phản hồi cho khách…"/><div className="flex gap-2"><button disabled={!reply.trim() || Boolean(busy)} className="bg-orange-500 text-white rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-40">{busy?'Đang lưu…':'Gửi trả lời'}</button><button type="button" disabled={Boolean(busy)} onClick={()=>setReplyCode('')} className="text-xs px-3">Hủy</button></div></form> : <div className="flex flex-wrap items-center gap-2 mt-4"><button disabled={Boolean(busy)} onClick={()=>{setReplyCode(review.bookingCode);setReply(review.reply || '');}} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg text-orange-600 bg-orange-50"><MessageSquare className="w-3 h-3"/>{review.reply?'Sửa câu trả lời':'Trả lời'}</button>{review.publicConsent && <button disabled={Boolean(busy)} onClick={()=>update(review.bookingCode,{published:!review.published})} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg text-emerald-700 bg-emerald-50 disabled:opacity-40">{review.published?<EyeOff className="w-3 h-3"/>:<Globe className="w-3 h-3"/>}{review.published?'Gỡ khỏi trang chủ':'Duyệt hiển thị trên trang chủ'}</button>}<span className="text-[11px] text-gray-400">{!review.publicConsent?'Khách chưa đồng ý hiển thị':review.published?'● Đang hiện trên trang chủ':'Chờ duyệt hiển thị'}</span></div>}
        </div></div>
      </article>)}
    </>}
  </div>;
}
