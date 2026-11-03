// Kiểm tra nhanh khoá Imou: liệt kê camera của tài khoản và lấy thử link xem trực tiếp.
// Cách chạy (khoá chỉ nằm trên máy bạn, không gửi cho ai):
//   IMOU_APP_ID=xxx IMOU_APP_SECRET=yyy node scripts/imou-check.js
// hoặc ghi 2 biến vào file .env.local rồi chạy: node --env-file=.env.local scripts/imou-check.js
import { getImouConfig, listImouCameras, getImouLiveStream } from '../api/_lib/imouService.js';

const config = getImouConfig();
if (!config.configured) {
  console.error('❌ Thiếu IMOU_APP_ID hoặc IMOU_APP_SECRET');
  process.exit(1);
}
try {
  const cams = await listImouCameras(config);
  if (cams.length === 0) {
    console.log('⚠️  Khoá đúng, nhưng tài khoản chưa có camera nào. Kiểm tra camera đã được gắn vào đúng tài khoản Imou chưa.');
    process.exit(1);
  }
  console.log('✅ Khoá đúng. Camera của tài khoản:');
  cams.forEach((c) => console.log(`   - ${c.name} | serial ${c.deviceId} | kênh ${c.channelId} | ${c.online ? 'online' : 'OFFLINE'}`));
  const stream = await getImouLiveStream({}, config);
  console.log(`✅ Lấy được link xem trực tiếp của camera ${stream.deviceId}:\n   ${stream.hls}`);
} catch (e) {
  console.error(`❌ Imou báo lỗi ${e.code || ''}: ${e.message}`);
  if (e.code === 'SN1001') console.error('   Sai AppSecret.');
  if (e.code === 'OP1009') console.error('   Khoá không có quyền với camera (camera chưa gắn vào tài khoản này).');
  if (e.code === 'DV1007') console.error('   Camera đang offline.');
  process.exit(1);
}
