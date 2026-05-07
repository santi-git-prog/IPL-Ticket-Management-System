import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

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
app.use('/api/admin', adminRoutes);


// Root route
app.get('/', (req, res) => {
    res.send('IPL Ticket Management System API is running...');
});

// Initialization: Create tables with new primary key names
const initDb = async () => {
    try {
        // Migration: Rename columns if they exist as 'id'
        const renameColumn = async (table, oldName, newName) => {
            try {
                // 1. Check if table and column exist using INFORMATION_SCHEMA (more reliable with placeholders)
                const [cols] = await pool.execute(
                    `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA, COLUMN_TYPE 
                     FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_NAME = ? AND COLUMN_NAME = ? AND TABLE_SCHEMA = DATABASE()`,
                    [table, oldName]
                );

                if (cols.length > 0) {
                    console.log(`🔄 Attempting to rename ${table}.${oldName} to ${newName}...`);
                    try {
                        // Try standard RENAME COLUMN (MySQL 8.0+)
                        await pool.execute(`ALTER TABLE ${table} RENAME COLUMN ${oldName} TO ${newName}`);
                        console.log(`✅ Success: Renamed ${table}.${oldName} to ${newName}`);
                    } catch (renameErr) {
                        // Fallback: Use CHANGE for older MySQL versions (5.7 and below)
                        const col = cols[0];
                        const definition = `${col.COLUMN_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : ''} ${col.EXTRA}`;
                        await pool.execute(`ALTER TABLE ${table} CHANGE ${oldName} ${newName} ${definition}`);
                        console.log(`✅ Success (via CHANGE): Renamed ${table}.${oldName} to ${newName}`);
                    }
                }
            } catch (err) {
                console.error(`❌ Migration failed for ${table}:`, err.message);
            }
        };

        console.log('🚀 Starting Database Migrations...');
        // Note: Run these sequentially and wait for each to finish
        await renameColumn('users', 'id', 'user_id');
        await renameColumn('matches', 'id', 'match_id');
        await renameColumn('stands', 'id', 'stand_id');
        await renameColumn('bookings', 'id', 'booking_id');
        await renameColumn('otps', 'id', 'otp_id');
        await renameColumn('audit_log', 'log_id', 'audit_log_id');
        console.log('🏁 Migrations Checked.');

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ensure is_admin exists for existing tables
        try {
            await pool.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE AFTER password");
        } catch (err) { /* ignore */ }

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS matches (
                match_id INT AUTO_INCREMENT PRIMARY KEY,
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
                stand_id INT AUTO_INCREMENT PRIMARY KEY,
                city_key VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                price INT NOT NULL,
                capacity INT DEFAULT 500,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ensure capacity column exists for existing tables
        try {
            await pool.execute("ALTER TABLE stands ADD COLUMN capacity INT DEFAULT 500 AFTER price");
        } catch (err) { /* ignore */ }

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS bookings (
                booking_id INT AUTO_INCREMENT PRIMARY KEY,
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
                otp_id INT AUTO_INCREMENT PRIMARY KEY,
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
                audit_log_id INT AUTO_INCREMENT PRIMARY KEY,
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
                b.booking_id, 
                b.user_email, 
                b.match_title, 
                b.stand_name, 
                b.quantity, 
                b.total_amount, 
                b.payment_id,
                b.order_id,
                s.name as stadium_name,
                s.city as stadium_city,
                b.created_at 
            FROM bookings b
            JOIN matches m ON b.match_id = m.match_id
            LEFT JOIN stadiums s ON (m.venue LIKE CONCAT('%', s.name, '%') OR m.venue = s.city)
        `);

        // 2. VIEW: Aggregated booking summary
        await pool.execute(`
            CREATE OR REPLACE VIEW vw_booking_summary AS
            SELECT 
                m.match_id,
                m.title as match_title,
                s.name as stadium_name,
                s.city as stadium_city,
                COUNT(b.booking_id) as total_bookings,
                IFNULL(SUM(b.quantity), 0) as total_tickets_sold,
                IFNULL(SUM(b.total_amount), 0) as total_revenue
            FROM matches m
            LEFT JOIN stadiums s ON (m.venue LIKE CONCAT('%', s.name, '%') OR m.venue = s.city)
            LEFT JOIN bookings b ON m.match_id = b.match_id
            GROUP BY m.match_id, m.title, s.name, s.city
        `);

        // 3. FUNCTIONS
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
        } catch (e) { console.log('❌ Function fn_calculate_gst failed:', e.message); }

        // 4. STORED PROCEDURE: Handle Booking Workflow
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
        } catch (e) { console.log("❌ Procedure sp_process_booking failed:", e.message); }

        // 5. TRIGGER: Audit Match Updates
        try {
            await pool.query("DROP TRIGGER IF EXISTS tr_audit_match_update");
            await pool.query(`
                CREATE TRIGGER tr_audit_match_update
                AFTER UPDATE ON matches
                FOR EACH ROW
                BEGIN
                    INSERT INTO audit_log (action_type, table_name, record_id, details)
                    VALUES ('UPDATE', 'matches', NEW.match_id, CONCAT('Match venue changed from ', OLD.venue, ' to ', NEW.venue));
                END
            `);
        } catch (e) { console.log("❌ Trigger tr_audit_match_update failed:", e.message); }

        // 6. TRIGGER: Audit Booking Deletion
        try {
            await pool.query("DROP TRIGGER IF EXISTS tr_audit_booking_delete");
            await pool.query(`
                CREATE TRIGGER tr_audit_booking_delete
                AFTER DELETE ON bookings
                FOR EACH ROW
                BEGIN
                    INSERT INTO audit_log (action_type, table_name, record_id, user_email, details)
                    VALUES ('DELETE_BOOKING', 'bookings', OLD.booking_id, OLD.user_email, CONCAT('Deleted booking for ', OLD.match_title));
                END
            `);
        } catch (e) { console.log("❌ Trigger tr_audit_booking_delete failed:", e.message); }

        console.log('✅ All DB concepts updated with new PK names');

        // Set Default Admin
        try {
            await pool.execute('UPDATE users SET is_admin = TRUE WHERE email = ?', ['sanjithsvpm@gmail.com']);
            console.log('👑 Admin privileges checked');
        } catch (e) { console.log("⚠️ Could not set admin status:", e.message); }


        // Seed Stadiums
        const stadiumsList = [
            ['M. Chinnaswamy Stadium', 'Bangalore', 35000],
            ['MA Chidambaram Stadium', 'Chennai', 38000],
            ['Wankhede Stadium', 'Mumbai', 33000],
            ['Arun Jaitley Stadium', 'Delhi', 35000],
            ['Eden Gardens', 'Kolkata', 66000],
            ['Narendra Modi Stadium', 'Ahmedabad', 132000],
            ['Rajiv Gandhi International Stadium', 'Hyderabad', 39000],
            ['BRSABV Ekana Cricket Stadium', 'Lucknow', 50000],
            ['Sawai Mansingh Stadium', 'Jaipur', 30000],
            ['HPCA Stadium', 'Dharamshala', 23000],
            ['Barsapara Cricket Stadium', 'Guwahati', 40000],
            ['Maharaja Yadavindra Singh Cricket Stadium', 'New Chandigarh', 38000],
            ['Shaheed Veer Narayan Singh International Stadium', 'Raipur', 65000]
        ];

        for (const stadium of stadiumsList) {
            const [exists] = await pool.execute('SELECT stadium_id FROM stadiums WHERE name = ?', [stadium[0]]);
            if (exists.length === 0) {
                await pool.execute('INSERT INTO stadiums (name, city, capacity) VALUES (?, ?, ?)', stadium);
            }
        }

        // Seed Bangalore stands if empty
        const [checkStands] = await pool.execute('SELECT count(*) as count FROM stands WHERE city_key = "Bangalore"');
        if (checkStands[0].count === 0) {
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
                await pool.execute('INSERT INTO stands (city_key, name, price) VALUES (?, ?, ?)', stand);
            }
        }

        console.log('Database initialized successfully with new Primary Key naming convention');
    } catch (error) {
        console.error('Database initialization failed:', error.message);
    }
};

app.listen(PORT, async () => {
    await initDb();
    console.log(`Server running on http://localhost:${PORT}`);
});
