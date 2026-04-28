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
