import pool from '../config/db.js';

export const getAllMatches = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, title, team1, team2, date_time, venue FROM matches ORDER BY date_time ASC');
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
