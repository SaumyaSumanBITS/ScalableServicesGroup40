const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.ORDER_DB_URL || process.env.DATABASE_URL,
  ssl: (process.env.ORDER_DB_URL||process.env.DATABASE_URL||'').includes('neon.tech') ? { rejectUnauthorized: false } : undefined
});
module.exports = {
  async getSeatPrices(eventId, seatIds){
    const params = seatIds.map((_,i)=> `$${i+2}`).join(',');
    const { rows } = await pool.query(
      `SELECT price FROM event_tickets.etsr_seats WHERE eventid=$1 AND seatid IN (${params})`,
      [eventId, ...seatIds]
    );
    return rows.map(r => Number(r.price));
  },
  async createPending({ userId, eventId, seatIds, subtotal, tax, total, holdId }){
    const { rows } = await pool.query(
      `INSERT INTO event_order.etsr_orders (orderid, userid, eventid, status, paymentstatus, ordertotal, createdat)
       VALUES ((SELECT COALESCE(MAX(orderid),0)+1 FROM event_order.etsr_orders), $1,$2,'PENDING','PENDING',$3,NOW())
       RETURNING orderid AS id, userid, eventid, status, paymentstatus, ordertotal, createdat`,
      [userId, eventId, total]
    );
    const order = rows[0];
    await pool.query('CREATE TABLE IF NOT EXISTS event_order.etsr_holds(orderid INT, holdid TEXT)');
    await pool.query('INSERT INTO event_order.etsr_holds(orderid,holdid) VALUES ($1,$2)', [order.id, holdId]);
    return order;
  },
  async markPaid(orderId){
    await pool.query('UPDATE event_order.etsr_orders SET paymentstatus=\'SUCCESS\', status=\'CONFIRMED\' WHERE orderid=$1', [orderId]);
  },
  async issueTickets(orderId, eventId, seatIds){
    const values = []; const params=[]; let p=1;
    for(const sid of seatIds){
      params.push(`((SELECT COALESCE(MAX(ticketid),0)+${p} FROM event_tickets.etsr_tickets), $${p++}, $${p++}, $${p++}, (SELECT price FROM event_tickets.etsr_seats WHERE seatid=$${p-1}))`);
      values.push(orderId, eventId, sid);
    }
    const sql = `INSERT INTO event_tickets.etsr_tickets(ticketid,orderid,eventid,seatid,pricepaid) VALUES ${params.join(',')} RETURNING *`;
    const { rows } = await pool.query(sql, values);
    return rows;
  },
  async getOrderById(id){
    const { rows } = await pool.query('SELECT * FROM event_order.etsr_orders WHERE orderid=$1', [id]);
    return rows[0]||null;
  },
  async getHoldId(orderId){
    const { rows } = await pool.query('SELECT holdid FROM event_order.etsr_holds WHERE orderid=$1', [orderId]);
    return rows[0]?.holdid || null;
  },
  async markCancelled(orderId){
    const { rows } = await pool.query(
      'UPDATE event_order.etsr_orders SET status=\'CANCELLED\' WHERE orderid=$1 RETURNING *', [orderId]);
    return rows[0];
  }
};
