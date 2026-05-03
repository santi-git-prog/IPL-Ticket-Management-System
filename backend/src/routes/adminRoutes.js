import express from 'express';
import { 
    getBookingSummary, 
    getBookingDetails, 
    getAuditLogs, 
    getBookingsByMatch, 
    deleteBooking 
} from '../controllers/adminController.js';

const router = express.Router();

router.get('/booking-summary', getBookingSummary);
router.get('/booking-details', getBookingDetails);
router.get('/audit-logs', getAuditLogs);
router.get('/match-bookings/:matchId', getBookingsByMatch);
router.delete('/bookings/:id', deleteBooking);

export default router;
