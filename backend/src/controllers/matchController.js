import pool from '../config/db.js';

export const getAllMatches = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, title, team1, team2, date_time, venue FROM matches ORDER BY id ASC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching matches:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getMatchById = async (req, res) => {
    try {
        const matchId = req.params.id;
        const [rows] = await pool.execute('SELECT * FROM matches WHERE id = ?', [matchId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Match not found' });
        }

        const match = rows[0];
        
        // Parse highlights JSON back to object
        try {
            if (match.highlights) {
                match.highlights = JSON.parse(match.highlights);
            }
        } catch (e) {
            console.error('Error parsing highlights:', e);
            match.highlights = [];
        }

        res.status(200).json(match);
    } catch (error) {
        console.error('Error fetching match details:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getStandsByCity = async (req, res) => {
    try {
        const cityKey = req.params.cityKey;
        const [rows] = await pool.execute('SELECT name, price FROM stands WHERE city_key = ?', [cityKey]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching stands:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getStandsByMatchId = async (req, res) => {
    try {
        const matchId = req.params.id;
        
        // 1. Get the match venue
        const [matchRows] = await pool.execute('SELECT venue FROM matches WHERE id = ?', [matchId]);
        if (matchRows.length === 0) {
            return res.status(404).json({ message: 'Match not found' });
        }
        
        const venue = matchRows[0].venue;
        const parts = venue.split(',');
        const cityKey = parts[parts.length - 1].trim();

        // 2. Get stands for that city
        const [standRows] = await pool.execute('SELECT name, price FROM stands WHERE city_key = ?', [cityKey]);
        
        res.status(200).json(standRows);
    } catch (error) {
        console.error('Error fetching stands by match ID:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
