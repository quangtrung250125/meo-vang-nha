import { pushAuthHeaders } from './pushNotificationService';
async function call(action, body) {
 const response=await fetch('/api/reviews/'+action,{method:body?'POST':'GET',headers:{...(await pushAuthHeaders()),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();if(!response.ok)throw new Error(data.error || 'Chưa lưu được đánh giá.');return data;
}
export const listReviews = () => call('list');
export const submitReview = (bookingCode,review) => call('submit',{bookingCode,...review});
export const moderateReview = (bookingCode,changes) => call('moderate',{bookingCode,...changes});
export const publicReviews = () => call('public');
