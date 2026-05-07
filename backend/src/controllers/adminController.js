import pool from '../config/db.js';

export const getBookingSummary = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM vw_booking_summary');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching booking summary:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getBookingDetails = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM vw_booking_details ORDER BY created_at DESC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching booking details:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getAuditLogs = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM audit_log ORDER BY action_timestamp DESC LIMIT 100');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching audit logs:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getBookingsByMatch = async (req, res) => {
    try {
        const { matchId } = req.params;
        const [rows] = await pool.execute(
            'SELECT * FROM vw_booking_details WHERE booking_id IN (SELECT booking_id FROM bookings WHERE match_id = ?) ORDER BY created_at DESC',
            [matchId]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching match bookings:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

