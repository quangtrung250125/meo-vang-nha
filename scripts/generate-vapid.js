import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('====================================');
console.log('🔑 CẶP KHÓA VAPID MỚI:');
console.log('====================================');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:contact@meovangnha.com');
console.log('VITE_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('====================================');
console.log('👉 Hãy dán các giá trị trên vào file .env và biến môi trường trên Vercel!');
