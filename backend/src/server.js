import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

import pool from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/payments', paymentRoutes);


// Root route
app.get('/', (req, res) => {
  res.send('IPL Ticket Management System API is running...');
});

// Initialization: Create users table if not exists
const initDb = async () => {
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS matches (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                team1 VARCHAR(255) NOT NULL,
                team2 VARCHAR(255) NOT NULL,
                date_time VARCHAR(255) NOT NULL,
                venue VARCHAR(255) NOT NULL,
                about_text TEXT,
                highlights TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS stands (
                id INT AUTO_INCREMENT PRIMARY KEY,
                city_key VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                price INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                match_id INT NOT NULL,
                match_title VARCHAR(255) NOT NULL,
                stand_name VARCHAR(255) NOT NULL,
                quantity INT NOT NULL,
                total_amount INT NOT NULL,
                payment_id VARCHAR(255) NOT NULL,
                order_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS otps (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                otp VARCHAR(6) NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);


        await pool.execute(`
            CREATE TABLE IF NOT EXISTS stadiums (
                stadium_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                city VARCHAR(100) NOT NULL,
                capacity INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS audit_log (
                log_id INT AUTO_INCREMENT PRIMARY KEY,
                action_type VARCHAR(50),
                table_name VARCHAR(50),
                record_id INT,
                user_email VARCHAR(255),
                action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                details TEXT
            )
        `);

        // --- SQL CONCEPTS INTEGRATION ---

        // 1. VIEW: Detailed booking summary
        await pool.execute(`
            CREATE OR REPLACE VIEW vw_booking_details AS
            SELECT 
                b.id, b.user_email, m.title as match_name, b.stand_name, 
                b.quantity, b.total_amount, b.created_at 
            FROM bookings b
            JOIN matches m ON b.match_id = m.id
        `);

        // 2. FUNCTIONS (Week 6)
        try {
            await pool.query(`DROP FUNCTION IF EXISTS fn_calculate_gst`);
            await pool.query(`
                CREATE FUNCTION fn_calculate_gst(amount DECIMAL(10,2)) 
                RETURNS DECIMAL(10,2)
                DETERMINISTIC
                BEGIN
                    RETURN amount * 0.18;
                END
            `);
        } catch (e) { console.log('❌ Function fn_calculate_gst creation failed:', e.message); }

        // 3. STORED PROCEDURE: Handle Booking Workflow
        try {
            await pool.query("DROP PROCEDURE IF EXISTS sp_process_booking");
            await pool.query(`
                CREATE PROCEDURE sp_process_booking(
                    IN p_user_email VARCHAR(255),
                    IN p_match_id INT,
                    IN p_match_title VARCHAR(255),
                    IN p_stand_name VARCHAR(255),
                    IN p_quantity INT,
                    IN p_total_amount DECIMAL(10,2),
                    IN p_payment_id VARCHAR(255),
                    IN p_order_id VARCHAR(255)
                )
                BEGIN
                    INSERT INTO bookings (user_email, match_id, match_title, stand_name, quantity, total_amount, payment_id, order_id)
                    VALUES (p_user_email, p_match_id, p_match_title, p_stand_name, p_quantity, p_total_amount, p_payment_id, p_order_id);
                    
                    INSERT INTO audit_log (action_type, table_name, record_id, user_email, details)
                    VALUES ('BOOKING', 'bookings', LAST_INSERT_ID(), p_user_email, CONCAT('Booked ', p_quantity, ' tickets for ', p_match_title));
                END
            `);
            console.log('✅ Stored Procedure sp_process_booking created');
        } catch (e) { console.log("❌ Procedure sp_process_booking creation failed:", e.message); }

        // 4. TRIGGER: Audit Match Updates
        try {
            await pool.query("DROP TRIGGER IF EXISTS tr_audit_match_update");
            await pool.query(`
                CREATE TRIGGER tr_audit_match_update
                AFTER UPDATE ON matches
                FOR EACH ROW
                BEGIN
                    INSERT INTO audit_log (action_type, table_name, record_id, details)
                    VALUES ('UPDATE', 'matches', NEW.id, CONCAT('Match venue changed from ', OLD.venue, ' to ', NEW.venue));
                END
            `);
        } catch (e) { console.log("❌ Trigger tr_audit_match_update creation failed:", e.message); }
        console.log('✅ All DB concepts checked/created');


        // Seed Bangalore stands if empty
        const checkStands = await pool.execute('SELECT count(*) as count FROM stands WHERE city_key = "Bangalore"');
        if (checkStands[0][0].count === 0) {
            const bangaloreStands = [
                ['Bangalore', 'Sun Pharma A Stand', 2300],
                ['Bangalore', 'Confirmtkt H Upper Stand', 3300],
                ['Bangalore', 'D Corporate Stand', 3300],
                ['Bangalore', 'Puma B Stand', 3300],
                ['Bangalore', 'Boat C Stand', 3300],
                ['Bangalore', 'E Stand', 3300],
                ['Bangalore', 'R Rahul Dravid Platinum Lounge', 4000],
                ['Bangalore', 'Javagal Srinath Stand P1 Annexe', 6000],
                ['Bangalore', 'Venkatesh Prasad Stand P4', 6000],
                ['Bangalore', 'BKT Tyres Executive Lounge', 10000],
                ['Bangalore', 'Sun Pharma Grand Terrace', 10000],
                ['Bangalore', 'BS Chandrashekhar Stand P Terrace', 15000],
                ['Bangalore', 'Syed Kirmani Stand P Corporate', 25000],
                ['Bangalore', 'GR Vishwanath Stand P2', 42000],
            ];
            
            for (const stand of bangaloreStands) {
                await pool.execute(
                    'INSERT INTO stands (city_key, name, price) VALUES (?, ?, ?)',
                    stand
                );
            }
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization failed:', error.message);
    }
};

app.listen(PORT, async () => {
  await initDb();
  console.log(`Server running on http://localhost:${PORT}`);
});
