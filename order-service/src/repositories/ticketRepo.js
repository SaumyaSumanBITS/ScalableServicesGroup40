const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.ORDER_DB_URL || process.env.DATABASE_URL,
  ssl: (process.env.ORDER_DB_URL||process.env.DATABASE_URL||'').includes('neon.tech') ? { rejectUnauthorized: false } : undefined
});
module.exports = {
  async getByOrderId(orderId){
    const { rows } = await pool.query(
      `SELECT ticketid, orderid, eventid, seatid, pricepaid
       FROM event_tickets.etsr_tickets WHERE orderid=$1 ORDER BY ticketid ASC`, [orderId]);
    return rows;
  }
};
