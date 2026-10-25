// Chuyển dữ liệu admin nhập (cho 1 bé) thành các dòng nhật ký lưu trú.
// Dùng chung cho cập nhật từng bé và cập nhật hàng loạt để nhật ký luôn cùng định dạng.

const BAD_STOOL = ['Tiêu chảy', 'Táo bón'];
const WATCH_STOOL = ['Hơi lỏng', 'Chưa đi vệ sinh'];

/**
 * @param {object} cat       Bé mèo trên trang Tổng quan (có bookingId, id, catName, booking)
 * @param {object} formData  { foodAmount, played, stool, health }
 * @returns {Array<{bookingId, petId, petName, notifyUserId, log}>}
 */
export function buildCareLogEntries(cat, formData) {
  const now = new Date();
  const base = {
    rawDate: now.toLocaleDateString('vi-VN'),
    date: `Hôm nay, ${now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`,
    time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    petName: cat.catName,
  };
  const logs = [];

  if (formData.foodAmount) {
    logs.push({
      ...base,
      type: 'eating',
      label: 'Cho ăn',
      detail: `Đã cho ăn ${formData.foodAmount}g thức ăn.`,
      status: 'normal',
      tag: 'Bình thường',
      icon: 'Utensils',
    });
  }

  if (formData.played) {
    logs.push({
      ...base,
      type: 'mood',
      label: 'Vui chơi',
      detail: 'Bé đã chơi đùa và vận động.',
      status: 'normal',
      tag: 'Bình thường',
      icon: 'Smile',
    });
  }

  if (formData.stool) {
    const isBad = BAD_STOOL.includes(formData.stool);
    const needsWatch = isBad || WATCH_STOOL.includes(formData.stool);
    logs.push({
      ...base,
      type: 'hygiene',
      label: 'Vệ sinh',
      detail: `Tình trạng: ${formData.stool}`,
      status: needsWatch ? 'watch' : 'normal',
      tag: needsWatch ? 'Cần theo dõi' : 'Bình thường',
      icon: 'Droplets',
    });
  }

  if (formData.health && formData.health.trim()) {
    logs.push({
      ...base,
      type: 'health',
      label: 'Sức khỏe',
      detail: formData.health.trim(),
      status: 'watch',
      tag: 'Cần theo dõi',
      icon: 'HeartPulse',
    });
  }

  const booking = cat.booking || {};
  const notifyUserId = booking.customerId || booking.customerPhone || null;

  return logs.map((log) => ({
    bookingId: cat.bookingId,
    petId: cat.id,
    petName: cat.catName,
    notifyUserId,
    log,
  }));
}
