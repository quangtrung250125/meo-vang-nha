// src/utils/membership.js

export const TIER_BRONZE = 'HẠNG ĐỒNG';
export const TIER_GOLD = 'HẠNG VÀNG';
export const TIER_DIAMOND = 'HẠNG KIM CƯƠNG';

export const GOLD_THRESHOLD = 3000000; // 3,000,000 VNĐ
export const DIAMOND_THRESHOLD = 8000000; // 8,000,000 VNĐ

export const calculateMembership = (bookings = []) => {
  // Chỉ tính các đơn hàng đã thanh toán
  const paidBookings = bookings.filter(b => b.paymentStatus === 'Đã thanh toán');
  
  const totalSpent = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  
  let tier = TIER_BRONZE;
  let nextTier = TIER_GOLD;
  let nextTierAmount = GOLD_THRESHOLD;
  let points = Math.floor(totalSpent / 10000); // 10,000 VNĐ = 1 điểm

  if (totalSpent >= DIAMOND_THRESHOLD) {
    tier = TIER_DIAMOND;
    nextTier = null;
    nextTierAmount = null;
  } else if (totalSpent >= GOLD_THRESHOLD) {
    tier = TIER_GOLD;
    nextTier = TIER_DIAMOND;
    nextTierAmount = DIAMOND_THRESHOLD;
  }

  return { 
    totalSpent, 
    tier, 
    nextTier, 
    nextTierAmount, 
    points 
  };
};
