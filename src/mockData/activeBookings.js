export const activeBookings = [
  {
    id: 1,
    catName: 'Mimi',
    ownerName: 'Nguyễn Văn A',
    room: 'P101',
    checkIn: '2023-10-20',
    checkOut: '2023-10-25',
    feedingSchedule: '08:00, 18:00',
    playSchedule: '16:00',
    status: 'Đang lưu trú',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
    diary: {
      foodAmount: 50,
      played: true,
      stool: 'Bình thường',
      health: 'Năng động, khỏe mạnh'
    }
  },
  {
    id: 2,
    catName: 'Bông',
    ownerName: 'Trần Thị B',
    room: 'P102',
    checkIn: '2023-10-21',
    checkOut: '2023-10-23',
    feedingSchedule: '07:30, 17:30',
    playSchedule: '15:00',
    status: 'Đang lưu trú',
    image: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
    diary: {
      foodAmount: null,
      played: false,
      stool: null,
      health: null
    }
  },
  {
    id: 3,
    catName: 'Lu',
    ownerName: 'Lê Văn C',
    room: 'P201',
    checkIn: '2023-10-18',
    checkOut: '2023-10-22',
    feedingSchedule: '08:30, 19:00',
    playSchedule: '17:00',
    status: 'Đang lưu trú',
    image: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
    diary: {
      foodAmount: 40,
      played: true,
      stool: 'Hơi lỏng',
      health: 'Lười vận động hôm nay'
    }
  }
];
