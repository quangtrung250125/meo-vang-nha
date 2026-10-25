import {
  handleGetBookings,
  handleAddBooking,
  handleUpdateBooking,
  handleRemoveBooking,
} from '../_lib/bookingsService.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return handleGetBookings(req, res);
  }

  if (req.method === 'POST') {
    return handleAddBooking(req, res);
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    return handleUpdateBooking(req, res);
  }

  if (req.method === 'DELETE') {
    return handleRemoveBooking(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
