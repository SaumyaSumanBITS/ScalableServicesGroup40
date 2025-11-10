const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.CATALOG_DB_URL || process.env.DATABASE_URL,
  ssl: (process.env.CATALOG_DB_URL||process.env.DATABASE_URL||'').includes('neon.tech') ? { rejectUnauthorized: false } : undefined
});
module.exports = {
  async search({ city, q }){
    const where=[]; const vals=[];
    if(city){ vals.push(city); where.push(`LOWER(city)=LOWER($${vals.length})`); }
    if(q){ vals.push(`%${q}%`); where.push(`LOWER(name) LIKE LOWER($${vals.length})`); }
    const { rows } = await pool.query(
      `SELECT venueid, name, city, capacity FROM event_event.etsr_venues
       ${where.length? 'WHERE '+where.join(' AND '): ''}
       ORDER BY name ASC`, vals);
    return rows;
  },
  async getById(id){
    const { rows } = await pool.query(
      `SELECT venueid, name, city, capacity FROM event_event.etsr_venues WHERE venueid=$1`, [id]);
    return rows[0]||null;
  }
};
