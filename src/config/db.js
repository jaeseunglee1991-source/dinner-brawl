const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initDB() {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS users (id VARCHAR(50) PRIMARY KEY, pw VARCHAR(100) NOT NULL, nickname VARCHAR(50) NOT NULL, is_admin BOOLEAN DEFAULT FALSE)`);
        await pool.query(`INSERT INTO users (id, pw, nickname, is_admin) VALUES ('root', 'secret', '시스템관리자', TRUE) ON CONFLICT (id) DO NOTHING`);
        console.log("✅ PostgreSQL DB 연결 및 초기화 완료!");
    } catch (err) { console.error("❌ DB 초기화 에러:", err); }
}

module.exports = { pool, initDB };
