const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'ipl_ticket_db'
        });

        console.log('Updating matches table...');
        
        // Update Bengaluru to Bangalore
        await pool.execute('UPDATE matches SET venue = "Bangalore" WHERE venue = "Bengaluru" OR venue LIKE "%, Bengaluru"');
        
        // Update Delhi to New Delhi
        await pool.execute('UPDATE matches SET venue = "New Delhi" WHERE venue = "Delhi" OR venue LIKE "%, Delhi"');

        console.log('Update complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
