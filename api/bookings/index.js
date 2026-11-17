import {
  handleGetBookings,
  handleAddBooking,
  handleUpdateBooking,
  handleRemoveBooking,
} from '../_lib/bookingsService.js';
import { handleReviews } from '../_lib/reviewsHandler.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url || '/api/bookings', 'http://localhost');
  const reviewAction = req.query?.reviewAction ?? url.searchParams.get('reviewAction')
    ?? (url.pathname.startsWith('/api/reviews/') ? url.pathname.split('/').pop() : null);
  if (reviewAction !== null) {
    return handleReviews(req, res, reviewAction);
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
