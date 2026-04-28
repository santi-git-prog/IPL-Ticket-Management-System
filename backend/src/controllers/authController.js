import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { sendOTPEmail } from '../services/otpService.js';

// Helper to generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const otp = generateOTP();
    // Valid for 20 minutes
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

    // Save/Update OTP in database
    await pool.execute(
      'INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = VALUES(expires_at)',
      [email, otp, expiresAt]
    );

    // Send Email
    await sendOTPEmail(email, otp);

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ message: 'Error sending OTP' });
  }
};

export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM otps WHERE email = ? AND otp = ? AND expires_at > NOW()',
      [email, otp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ message: 'Error verifying OTP' });
  }
};

export const signup = async (req, res) => {
  const { username, email, password, otp } = req.body;

  try {
    // 1. Verify OTP one last time during signup
    const [otpCheck] = await pool.execute(
      'SELECT * FROM otps WHERE email = ? AND otp = ? AND expires_at > NOW()',
      [email, otp]
    );

    if (otpCheck.length === 0) {
      return res.status(400).json({ message: 'Account verification failed. Get a new OTP.' });
    }

    // 2. Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create user
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    // 5. Delete OTP after successful signup
    await pool.execute('DELETE FROM otps WHERE email = ?', [email]);

    res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    // 1. Verify OTP
    const [otpCheck] = await pool.execute(
      'SELECT * FROM otps WHERE email = ? AND otp = ? AND expires_at > NOW()',
      [email, otp]
    );

    if (otpCheck.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // 2. Update Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

    // 3. Delete OTP
    await pool.execute('DELETE FROM otps WHERE email = ?', [email]);

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};
