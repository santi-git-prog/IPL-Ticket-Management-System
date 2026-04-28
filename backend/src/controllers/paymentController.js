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

    const query = `
      INSERT INTO bookings (user_email, match_id, match_title, stand_name, quantity, total_amount, payment_id, order_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.execute(query, [
      userEmail, 
      matchId, 
      matchTitle, 
      standName, 
      quantity, 
      totalAmount, 
      paymentId, 
      orderId
    ]);

    res.status(201).json({ message: 'Booking saved successfully' });
  } catch (error) {
    console.error('Save Booking Error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM bookings WHERE user_email = ? ORDER BY created_at DESC', 
      [email]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error('Fetch Bookings Error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};
