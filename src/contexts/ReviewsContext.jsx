import React,{createContext,useCallback,useContext,useEffect,useRef,useState} from 'react';
import { useCustomerProfile } from './CustomerContext';
import * as api from '../services/reviewsApi';
const ReviewsContext=createContext(null);
export const ReviewsPreviewProvider=({children,value})=><ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
export function ReviewsProvider({children}) {
 const {authenticatedCustomer}=useCustomerProfile();const [reviews,setReviews]=useState([]),[error,setError]=useState('');
 const userId=authenticatedCustomer?.id;
 const identity=useRef(userId),revision=useRef(0);identity.current=userId;
 const refresh=useCallback(async()=>{if(!userId)return;const version=revision.current;try{const data=await api.listReviews();if(identity.current===userId && version===revision.current){setReviews(data.reviews || []);setError('');}}catch(e){if(identity.current===userId)setError(e.message);}},[userId]);
 useEffect(()=>{setReviews([]);setError('');if(!userId)return;refresh();const timer=setInterval(refresh,15000);window.addEventListener('focus',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};},[userId,refresh]);
 const upsert=r=>setReviews(previous=>[r,...previous.filter(item=>item.bookingCode!==r.bookingCode)]);
 const saveReview=async(code,value)=>{revision.current++;const {review}=await api.submitReview(code,value);revision.current++;if(identity.current===userId)upsert(review);return review;};
 const moderateReview=async(code,value)=>{revision.current++;const {review}=await api.moderateReview(code,value);revision.current++;if(identity.current===userId)upsert(review);return review;};
 return <ReviewsContext.Provider value={{reviews,error,refresh,saveReview,moderateReview}}>{children}</ReviewsContext.Provider>;
}
export const useReviews=()=>useContext(ReviewsContext);
