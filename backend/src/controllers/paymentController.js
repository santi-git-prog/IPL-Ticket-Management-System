import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

export const createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt = 'receipt_' + Date.now() } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);
    
    if (!order) {
      return res.status(500).json({ message: 'Error creating Razorpay order' });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error('Razorpay Order Error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

export const saveBooking = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { 
      userEmail, 
      matchId, 
      matchTitle, 
      standName, 
      quantity, 
      totalAmount, 
      paymentId, 
      orderId 
    } = req.body;

    // USE STORED PROCEDURE (Week 5) to process booking
    // This handles the insert into bookings AND audit_log in one call
    const query = 'CALL sp_process_booking(?, ?, ?, ?, ?, ?, ?, ?)';

    // START TRANSACTION (Week 3 - TCL)
    await connection.beginTransaction();

    await connection.execute(query, [
      userEmail, 
      matchId, 
      matchTitle, 
      standName, 
      quantity, 
      totalAmount, 
      paymentId, 
      orderId
    ]);

    // COMMIT TRANSACTION (Week 3 - TCL)
    await connection.commit();

    res.status(201).json({ message: 'Booking saved successfully (Processed via Stored Procedure)' });
  } catch (error) {
    // ROLLBACK TRANSACTION on error (Week 3 - TCL)
    await connection.rollback();
    console.error('Save Booking Error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  } finally {
    connection.release();
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // USE VIEW (Week 4) and FUNCTION (Week 6) to fetch user bookings with calculated GST
    const [rows] = await pool.execute(
      'SELECT *, fn_calculate_gst(total_amount) as gst_amount FROM vw_booking_details WHERE user_email = ? ORDER BY created_at DESC', 
      [email]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error('Fetch Bookings Error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};
