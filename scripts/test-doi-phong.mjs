import { createClient } from '@supabase/supabase-js';

const TEST_ROOM_ID = 'TEST-ROOM';
const ITERATIONS = 10;
const bookingCodes = process.argv.slice(2);
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (bookingCodes.length !== 3 && bookingCodes.length !== 4) {
  throw new Error('Cách dùng: node --env-file=.env.local scripts/test-doi-phong.mjs MVN-AAAAA MVN-BBBBB MVN-CCCCC [MVN-DDDDD]');
}
if (new Set(bookingCodes).size !== bookingCodes.length) {
  throw new Error('Mỗi mã booking phải khác nhau.');
}
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Thiếu SUPABASE_URL (hoặc VITE_SUPABASE_URL) và SUPABASE_SERVICE_ROLE_KEY trong process.env.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const throwIfError = (error, action) => {
  if (error) throw new Error(`${action}: ${error.message || 'lỗi Supabase'}`);
};

const readBookings = async () => {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, code, data')
    .in('code', bookingCodes);
  throwIfError(error, 'Không đọc được booking');

  const byCode = new Map((data || []).map((row) => [row.code, row]));
  return bookingCodes.map((code) => {
    const row = byCode.get(code);
    if (!row) throw new Error(`Không tìm thấy booking ${code}.`);
    if ((data || []).filter((item) => item.code === code).length !== 1) {
      throw new Error(`Mã booking ${code} không duy nhất; dừng để tránh sửa nhầm đơn.`);
    }

    const booking = row.data || {};
    const status = String(booking.status || '').trim().toLowerCase();
    if (['cancelled', 'canceled', 'check-out', 'đã hủy', 'đã huỷ', 'đã hoàn tất', 'hoàn tất', 'completed'].includes(status)) {
      throw new Error(`Booking ${code} đã hủy hoặc hoàn tất; dừng kiểm thử.`);
    }
    if (booking.roomId === TEST_ROOM_ID) {
      throw new Error(`Booking ${code} đã nằm trong TEST-ROOM; dừng để tránh bỏ qua kiểm tra sức chứa.`);
    }
    if (
      typeof booking.roomId !== 'string'
      || !/^\d{4}-\d{2}-\d{2}$/.test(booking.checkIn || '')
      || !/^\d{4}-\d{2}-\d{2}$/.test(booking.checkOut || '')
      || booking.checkOut <= booking.checkIn
      || !Number.isInteger(Number(booking.cats))
      || Number(booking.cats) < 1
    ) {
      throw new Error(`Booking ${code} thiếu roomId, ngày hợp lệ YYYY-MM-DD hoặc cats hợp lệ.`);
    }

    return {
      id: row.id,
      code: row.code,
      roomId: booking.roomId,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      cats: Number(booking.cats),
    };
  });
};

const restoreBookings = async (backups) => {
  for (const backup of backups) {
    const { data: row, error: readError } = await supabase
      .from('bookings')
      .select('id, data')
      .eq('id', backup.id)
      .maybeSingle();
    throwIfError(readError, `Không đọc được booking ${backup.code} khi khôi phục`);
    if (!row) throw new Error(`Không tìm thấy booking ${backup.code} khi khôi phục.`);

    const currentRoomId = row.data?.roomId;
    if (currentRoomId === backup.roomId) continue;
    if (currentRoomId !== TEST_ROOM_ID) {
      throw new Error(`Booking ${backup.code} không còn ở TEST-ROOM; từ chối ghi đè thay đổi khác khi khôi phục.`);
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ data: { ...row.data, roomId: backup.roomId } })
      .eq('id', backup.id)
      .select('id');
    throwIfError(error, `Không khôi phục được roomId của ${backup.code}`);
    if (!data?.some((item) => item.id === backup.id)) {
      throw new Error(`Không xác nhận được việc khôi phục roomId của ${backup.code}.`);
    }
  }
};

const hasDateOverlap = (a, b) => a.checkIn < b.checkOut && b.checkIn < a.checkOut;
const commonDateOverlap = (bookings) => {
  const latestCheckIn = bookings.reduce((latest, booking) => (booking.checkIn > latest ? booking.checkIn : latest), bookings[0].checkIn);
  const earliestCheckOut = bookings.reduce((earliest, booking) => (booking.checkOut < earliest ? booking.checkOut : earliest), bookings[0].checkOut);
  return latestCheckIn < earliestCheckOut;
};

const runScenario = async ({ label, bookings, capacity, expectedSuccesses, expectedRoomFull }) => {
  let totalSuccesses = 0;
  let totalFailures = 0;
  let passed = true;

  for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
    try {
      const results = await Promise.all(bookings.map(async (booking) => {
        try {
          const { error } = await supabase.rpc('change_room_safe', {
            p_booking_code: booking.code,
            p_target_room_id: TEST_ROOM_ID,
            p_capacity: capacity,
            p_patch: {},
          });
          const message = error
            ? [error.message, error.details, error.hint].filter(Boolean).join(' ')
            : '';
          return { success: !error, roomFull: message.includes('ROOM_FULL') };
        } catch (error) {
          return { success: false, roomFull: String(error?.message || error).includes('ROOM_FULL') };
        }
      }));

      const successes = results.filter((result) => result.success).length;
      const roomFull = results.filter((result) => result.roomFull).length;
      const failures = results.length - successes;
      totalSuccesses += successes;
      totalFailures += failures;
      if (successes !== expectedSuccesses || roomFull !== expectedRoomFull) passed = false;
    } finally {
      await restoreBookings(backups);
    }
  }

  const expectedCalls = bookings.length * ITERATIONS;
  console.log(
    `${passed ? 'PASS' : 'FAIL'} | ${label} | thành công ${totalSuccesses}/${expectedCalls}, thất bại ${totalFailures}/${expectedCalls}, ROOM_FULL dự kiến ${expectedRoomFull * ITERATIONS}`,
  );
  return passed;
};

let backups = [];
let restorationFailed = false;
let allPassed = true;

try {
  backups = await readBookings();
  const firstThree = backups.slice(0, 3);
  if (!commonDateOverlap(firstThree)) {
    throw new Error('Ba booking đầu phải có ít nhất một ngày cùng lưu trú để kiểm thử sức chứa đồng thời.');
  }
  if (firstThree.some((booking) => booking.cats !== 1)) {
    throw new Error('Ba booking đầu phải có cats = 1 để kỳ vọng capacity 3/2/1 tương ứng 3/2/1 thành công.');
  }

  if (backups[3] && !hasDateOverlap(backups[0], backups[3]) && backups[3].cats !== 1) {
    throw new Error('Booking thứ tư phải có cats = 1 để kiểm thử capacity 1.');
  }

  allPassed = await runScenario({
    label: 'Kịch bản 1 (capacity 3, ba đơn đầu)',
    bookings: firstThree,
    capacity: 3,
    expectedSuccesses: 3,
    expectedRoomFull: 0,
  }) && allPassed;
  allPassed = await runScenario({
    label: 'Kịch bản 2 (capacity 2, ba đơn đầu)',
    bookings: firstThree,
    capacity: 2,
    expectedSuccesses: 2,
    expectedRoomFull: 1,
  }) && allPassed;
  allPassed = await runScenario({
    label: 'Kịch bản 3 (capacity 1, ba đơn đầu)',
    bookings: firstThree,
    capacity: 1,
    expectedSuccesses: 1,
    expectedRoomFull: 2,
  }) && allPassed;

  if (backups[3] && !hasDateOverlap(backups[0], backups[3])) {
    allPassed = await runScenario({
      label: 'Kịch bản 4 (capacity 1, đơn 1 và đơn 4 không trùng ngày)',
      bookings: [backups[0], backups[3]],
      capacity: 1,
      expectedSuccesses: 2,
      expectedRoomFull: 0,
    }) && allPassed;
  } else if (backups[3]) {
    console.log('SKIP | Kịch bản 4 | Ngày lưu trú của đơn thứ tư trùng với đơn đầu.');
  } else {
    console.log('SKIP | Kịch bản 4 | Không truyền đơn thứ tư.');
  }
} finally {
  if (backups.length > 0) {
    try {
      await restoreBookings(backups);
      console.log('Đã khôi phục roomId gốc cho tất cả booking được truyền vào.');
    } catch (error) {
      restorationFailed = true;
      console.error(`KHÔNG KHÔI PHỤC ĐẦY ĐỦ: ${error.message}`);
    }
  }
}

if (restorationFailed) process.exitCode = 1;
else if (!allPassed) process.exitCode = 1;
else console.log('Tất cả kịch bản đã đạt kỳ vọng.');
