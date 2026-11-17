import React,{useState,useEffect,useRef} from 'react';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import AdminLayout from '../../../Chi/AdminLayout';
import {CustomerPreviewProvider} from '../../contexts/CustomerContext';
import {BookingHistoryPreviewProvider} from '../../contexts/BookingHistoryContext';
import {ReviewsPreviewProvider} from '../../contexts/ReviewsContext';
import {validateReview,canEditReview} from '../../utils/bookingReview';
const KEY='mvn-review-video-demo-v1';
const customer={id:'preview-customer',isDemo:true,fullName:'Nguyễn Thị Lan',email:'lan@example.com',phone:'0900000001'};
const sample=()=>({bookings:[{id:'MVN-DEMO',code:'MVN-DEMO',customerId:customer.id,customerPhone:customer.phone,ownerName:customer.fullName,status:'check-out',isDemo:true,checkIn:'2026-11-14',checkOut:'2026-11-17',checkedOutAt:new Date().toISOString(),paymentStatus:'Đã thanh toán',paidAmount:450000,totalPrice:450000,totalAmount:450000,depositAmount:150000,cats:1,selectedRoom:{name:'VIP-01',id:'VIP-01'},selectedPackage:{name:'Gói chăm sóc tiêu chuẩn'},petProfiles:[{id:'preview-bo',name:'Bơ',imagePreview:'/images/review-demo-miu.svg'}]}],reviews:[]});
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)) || sample();}catch{return sample();}};
export default function ReviewDemo(){const [data,setData]=useState(read),ref=useRef(data),location=useLocation(),navigate=useNavigate();ref.current=data;const admin=location.pathname.startsWith('/review-demo/admin');
 const commit=next=>{ref.current=next;setData(next);localStorage.setItem(KEY,JSON.stringify(next));};
 useEffect(()=>{const sync=e=>{if(e.key===KEY){const next=read();ref.current=next;setData(next);}};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
 async function saveReview(code,input){const state=ref.current,booking=state.bookings.find(b=>b.code===code),previous=state.reviews.find(r=>r.bookingCode===code);if(admin || !booking || booking.status!=='check-out')throw new Error('Chỉ đánh giá sau khi check out.');if(previous && !canEditReview(previous))throw new Error('Đã hết hạn sửa.');const at=new Date().toISOString();const review={...previous,...validateReview(input),bookingCode:code,customerId:customer.id,authorName:customer.fullName,petNames:'Bơ',roomName:'VIP-01',createdAt:previous?.createdAt || at,updatedAt:at,published:false};commit({...state,reviews:[review,...state.reviews.filter(r=>r.bookingCode!==code)]});return review;}
 async function moderateReview(code,input){if(!admin)throw new Error('Chỉ admin được xử lý.');const state=ref.current,previous=state.reviews.find(r=>r.bookingCode===code);if(!previous)throw new Error('Không có đánh giá.');if(input.published && !previous.publicConsent)throw new Error('Khách chưa cho phép hiển thị.');const review={...previous,...input,updatedAt:new Date().toISOString()};commit({...state,reviews:state.reviews.map(r=>r===previous?review:r)});return review;}
 function checkOut(code){const state=ref.current;commit({...state,bookings:state.bookings.map(b=>b.code===code?{...b,status:'check-out',checkedOutAt:new Date().toISOString()}:b)});return true;}
 const identity=admin?{...customer,id:'preview-admin',fullName:'Quản trị viên',phone:'0962606249'}:customer;
 return <CustomerPreviewProvider value={{authenticatedCustomer:identity,customerProfile:identity,isAuthenticated:true,hasCustomerProfile:true,isAdmin:admin,authLoading:false,registerCustomer:()=>{},logoutCustomer:()=>{}}}><BookingHistoryPreviewProvider value={{globalBookingList:data.bookings,adminCheckOut:checkOut,updateBooking:()=>{}}}><ReviewsPreviewProvider value={{isDemo:true,reviews:data.reviews,error:'',refresh:async()=>{},saveReview,moderateReview}}>
 <div className="bg-[#2d1a0e] text-white px-4 py-2 text-xs flex flex-wrap justify-center gap-4 items-center"><span>Demo theo video</span><Link className="underline" to="/review-demo">Khách hàng</Link><Link className="underline" to="/review-demo/admin/bookings">Admin check out</Link><Link className="underline" to="/review-demo/admin">Admin đánh giá</Link><Link className="underline" to="/review-demo/home">Trang chủ</Link><button className="border border-white/40 rounded-lg px-2 py-1" onClick={()=>{commit(sample());navigate('/review-demo');}}>Làm lại demo</button><button className="border border-white/40 rounded-lg px-2 py-1" onClick={()=>{const next=sample();next.bookings[0].status='đang ở';delete next.bookings[0].checkedOutAt;commit(next);navigate('/review-demo/admin/bookings');}}>Thử từ bước check out</button></div>
 {admin?<AdminLayout/>:<MainLayout/>}
 </ReviewsPreviewProvider></BookingHistoryPreviewProvider></CustomerPreviewProvider>;
}
