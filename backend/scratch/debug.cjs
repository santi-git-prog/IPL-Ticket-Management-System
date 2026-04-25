const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'ipl'
        });

        console.log('--- Matches ---');
        const [matches] = await pool.execute('SELECT id, venue FROM matches LIMIT 5');
        console.log(matches);

        console.log('\n--- Stands Sample ---');
        const [stands] = await pool.execute('SELECT city_key, name, price FROM stands LIMIT 5');
        console.log(stands);

        console.log('\n--- Checking New Delhi Specifically ---');
        const [newDelhi] = await pool.execute('SELECT count(*) as count FROM stands WHERE city_key = "New Delhi"');
        console.log('Count for New Delhi:', newDelhi[0].count);

        console.log('\n--- Checking Bangalore Specifically ---');
        const [bangalore] = await pool.execute('SELECT count(*) as count FROM stands WHERE city_key = "Bangalore"');
        console.log('Count for Bangalore:', bangalore[0].count);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
