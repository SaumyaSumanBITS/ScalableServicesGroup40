const { Pool } = require('pg');
const { v4: uuid } = require('uuid');
const pool = new Pool({
  connectionString: process.env.SEATING_DB_URL || process.env.DATABASE_URL,
  ssl: (process.env.SEATING_DB_URL||process.env.DATABASE_URL||'').includes('neon.tech') ? { rejectUnauthorized: false } : undefined
});
const holds = new Map();
module.exports = {
  async listByEvent(eventId){
    const { rows } = await pool.query(
      `SELECT seatid, eventid, section, row_num AS row, seatnumber, price
       FROM event_seats.etsr_seats WHERE eventid=$1 ORDER BY section, row_num, seatnumber`, [eventId]);
    return rows;
  },
  async reserve(eventId, seatIds, ttlMinutes){
    const holdId = uuid();
    const expiresAt = Date.now() + (ttlMinutes*60*1000);
    holds.set(holdId, { eventId, seatIds:[...seatIds], expiresAt });
    return { holdId, expiresAt };
  },
  async release(holdId){
    holds.delete(holdId);
  },
  async allocate(holdId, orderId){
    holds.delete(holdId);
    return true;
  }
};
