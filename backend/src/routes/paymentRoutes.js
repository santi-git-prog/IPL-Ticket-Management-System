import express from 'express';
import { createOrder, saveBooking, getUserBookings } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-order', createOrder);
router.post('/save-booking', saveBooking);
router.get('/my-bookings', getUserBookings);

export default router;
