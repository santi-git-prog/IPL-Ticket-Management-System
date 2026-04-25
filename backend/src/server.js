import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
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

        // Insert mock data for Delhi Capitals vs Punjab Kings
        const mockAbout = "It’s Delhi Capitals up against Punjab Kings in a clash that could swing either way. Led by Axar Patel with an experienced batting core stacked with firepower. You’ve got KL Rahul doing his thing with the bat, backed by power hitters like Pathum Nissanka, Ben Duckett, and David Miller. The bowling pack packs a punch too, with Kuldeep Yadav, and Lungi Ngidi ready to take the shine off any big total.\\n\\nPunjab Kings aren’t here to make up the numbers. With Shreyas Iyer steering the ship, and big threats like Prabhsimran Singh, Marcus Stoinis, and Arshdeep Singh in their ranks, they can shake DC early and keep the scoreboard pressure on. If DC lose early wickets it opens the door for PBKS to pounce. But if Delhi’s experience shows and they dominate the middle overs with Axar and company, this one could tilt their way.";
        
        const mockHighlights = JSON.stringify([
            { title: "Why this event stands out", description: "DC vs PBKS in TATA IPL 2026—pure adrenaline, pure madness!" },
            { title: "What you’ll experience", description: "Sixes, chants, goosebumps—feel the stadium come ALIVE!" },
            { title: "Get ready to", description: "Experience thunderous cheers, massive hits, and an atmosphere that sends chills through the crowd!" }
        ]);

        const checkMatch = await pool.execute('SELECT count(*) as count FROM matches WHERE id = 1');
        if (checkMatch[0][0].count === 0) {
            await pool.execute(`
                INSERT INTO matches (id, title, team1, team2, date_time, venue, about_text, highlights)
                VALUES (
                    1, 
                    'TATA IPL 2026: Match 35', 
                    'Delhi Capitals', 
                    'Punjab Kings', 
                    'Sat, 25 Apr, 3:30 PM', 
                    'Arun Jaitley Stadium, New Delhi',
                    ?,
                    ?
                )
            `, [mockAbout, mockHighlights]);
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
