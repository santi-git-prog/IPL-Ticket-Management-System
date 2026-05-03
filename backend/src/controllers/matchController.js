import pool from '../config/db.js';

export const getAllMatches = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT m.id, m.title, m.team1, m.team2, m.date_time, 
                   COALESCE(s.name, SUBSTRING_INDEX(m.venue, ',', 1)) as venue,
                   COALESCE(s.city, SUBSTRING_INDEX(m.venue, ',', -1)) as city
            FROM matches m 
            LEFT JOIN stadiums s ON (m.venue LIKE CONCAT('%', s.name, '%') OR m.venue = s.city)
            ORDER BY m.id ASC
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching matches:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getMatchById = async (req, res) => {
    try {
        const matchId = req.params.id;
        const [rows] = await pool.execute(`
            SELECT m.*, 
                   COALESCE(s.name, SUBSTRING_INDEX(m.venue, ',', 1)) as venue_name, 
                   COALESCE(s.city, SUBSTRING_INDEX(m.venue, ',', -1)) as city, 
                   s.capacity
            FROM matches m 
            LEFT JOIN stadiums s ON (m.venue LIKE CONCAT('%', s.name, '%') OR m.venue = s.city)
            WHERE m.id = ?
        `, [matchId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Match not found' });
        }

        const match = rows[0];
        // Ensure the frontend gets 'venue' as the stadium name
        match.venue = match.venue_name || match.venue;
        
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
        
        // 1. Get the match venue and try to join with stadiums table
        const [matchRows] = await pool.execute(`
            SELECT m.venue, s.city 
            FROM matches m 
            LEFT JOIN stadiums s ON m.venue LIKE CONCAT('%', s.name, '%')
            WHERE m.id = ?
        `, [matchId]);

        if (matchRows.length === 0) {
            return res.status(404).json({ message: 'Match not found' });
        }
        
        let cityKey;
        if (matchRows[0].city) {
            cityKey = matchRows[0].city;
        } else {
            // Fallback to string splitting if stadium not found in table
            const venue = matchRows[0].venue;
            const parts = venue.split(',');
            cityKey = parts[parts.length - 1].trim();
        }

        // 2. Get stands for that city
        const [standRows] = await pool.execute('SELECT name, price FROM stands WHERE city_key = ?', [cityKey]);
        
        res.status(200).json(standRows);
    } catch (error) {
        console.error('Error fetching stands by match ID:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
