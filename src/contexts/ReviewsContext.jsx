import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useCustomerProfile } from './CustomerContext';
import { supabase } from '../supabaseClient';
import * as api from '../services/reviewsApi';
const ReviewsContext = createContext(null);
export const ReviewsPreviewProvider = ({children,value}) => <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
export function ReviewsProvider({children}) {
  const { authenticatedCustomer, isAdmin } = useCustomerProfile();
  const userId = authenticatedCustomer?.id;
  const identityKey = userId ? userId + ':' + Boolean(isAdmin) : '';
  const [snapshot,setSnapshot] = useState({ identity:'', reviews:[] });
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(false);
  const identity = useRef(identityKey), revision = useRef(0), channels = useRef({});
  identity.current = identityKey;
  const refresh = useCallback(async () => {
    if (!userId) return;
    const version = revision.current;
    try {
      const data = await api.listReviews();
      if (identity.current === identityKey && version === revision.current) {
        setSnapshot({identity:identityKey,reviews:data.reviews || []});setError('');
      }
    } catch (e) { if(identity.current===identityKey && version===revision.current)setError(e.message); }
    finally { if(identity.current===identityKey)setLoading(false); }
  }, [userId,identityKey]);
  useEffect(() => {
    setError('');setLoading(Boolean(userId));revision.current++;
    if (!userId) return;
    refresh();
    const timer = setInterval(refresh,15000);
    window.addEventListener('focus',refresh);
    const onPush = event => { if(event.data?.type==='mvn-push-received')refresh(); };
    navigator.serviceWorker?.addEventListener('message',onPush);
    const local = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('mvn-review-changes') : null;
    if(local)local.onmessage=refresh;
    // Only an invalidation signal is broadcast; the API scopes returned data to the signed-in user.
    const cloud = supabase.channel('mvn-review-changes').on('broadcast',{event:'changed'},refresh).subscribe();
    channels.current={local,cloud};
    return () => {
      clearInterval(timer);window.removeEventListener('focus',refresh);
      navigator.serviceWorker?.removeEventListener('message',onPush);
      local?.close();supabase.removeChannel(cloud);channels.current={};
    };
  }, [userId,refresh]);
  const publishChange = () => {
    channels.current.local?.postMessage({type:'changed'});
    const request = channels.current.cloud?.send({type:'broadcast',event:'changed',payload:{}});
    request?.catch(()=>{});
  };
  const upsert = review => setSnapshot(previous => ({identity:identityKey,reviews:[review,...(previous.identity===identityKey?previous.reviews:[]).filter(r=>r.bookingCode!==review.bookingCode)]}));
  const mutate = async (call,code,value) => {
    revision.current++;
    try {
      const {review} = await call(code,value);revision.current++;
      if(identity.current===identityKey){upsert(review);setError('');publishChange();}
      return review;
    } finally { revision.current++; }
  };
  const reviews = snapshot.identity===identityKey ? snapshot.reviews : [];
  return <ReviewsContext.Provider value={{reviews,error,loading,refresh,saveReview:(code,value)=>mutate(api.submitReview,code,value),moderateReview:(code,value)=>mutate(api.moderateReview,code,value)}}>{children}</ReviewsContext.Provider>;
}
export const useReviews = () => useContext(ReviewsContext);
