const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.CATALOG_DB_URL || process.env.DATABASE_URL,
  ssl: (process.env.CATALOG_DB_URL||process.env.DATABASE_URL||'').includes('neon.tech') ? { rejectUnauthorized: false } : undefined
});
module.exports = {
  async search({ city, eventtype, status, q }){
    const where = []; const vals=[];
    if(city){ vals.push(city); where.push(`LOWER(v.city)=LOWER($${vals.length})`); }
    if(eventtype){ vals.push(eventtype); where.push(`LOWER(e.eventtype)=LOWER($${vals.length})`); }
    if(status){ vals.push(status); where.push(`LOWER(e.status)=LOWER($${vals.length})`); }
    if(q){ vals.push(`%${q}%`); where.push(`(LOWER(e.title) LIKE LOWER($${vals.length}))`); }
    const sql = `SELECT e.eventid, e.venueid, e.title, e.eventtype, e.eventdate, e.baseprice, e.status,
                        v.name AS venuename, v.city
                 FROM event_event.etsr_events e
                 LEFT JOIN event_event.etsr_venues v ON v.venueid=e.venueid
                 ${where.length? 'WHERE '+where.join(' AND '):''}
                 ORDER BY e.eventdate ASC`;
    const { rows } = await pool.query(sql, vals);
    return rows;
  },
  async getById(id){
    const { rows } = await pool.query(
      `SELECT e.eventid, e.venueid, e.title, e.eventtype, e.eventdate, e.baseprice, e.status
       FROM event_event.etsr_events e WHERE e.eventid=$1`, [id]);
    return rows[0]||null;
  },
  async create(data){
    const vals=[data.venueid, data.title, data.eventtype||null, data.eventdate||new Date(),
                data.baseprice||0, data.status||'ON_SALE'];
    const { rows } = await pool.query(
      `INSERT INTO event_event.etsr_events (eventid, venueid, title, eventtype, eventdate, baseprice, status)
       VALUES ((SELECT COALESCE(MAX(eventid),0)+1 FROM event_event.etsr_events), $1,$2,$3,$4,$5,$6)
       RETURNING *`, vals);
    return rows[0];
  }
};
