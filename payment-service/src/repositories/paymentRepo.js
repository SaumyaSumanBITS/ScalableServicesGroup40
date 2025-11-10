const { Pool } = require('pg');
const { v4: uuid } = require('uuid');
const pool = new Pool({
  connectionString: process.env.PAYMENT_DB_URL || process.env.DATABASE_URL,
  ssl: (process.env.PAYMENT_DB_URL||process.env.DATABASE_URL||'').includes('neon.tech') ? { rejectUnauthorized: false } : undefined
});

module.exports = {
  async create({ orderId, amount, method }){
    const ref = uuid();
    const { rows } = await pool.query(
      `INSERT INTO event_payments.etsr_payments (paymentid, orderid, amount, method, status, reference, createdat)
       VALUES ((SELECT COALESCE(MAX(paymentid),0)+1 FROM event_payments.etsr_payments), $1,$2,$3,'SUCCESS',$4,NOW())
       RETURNING *`, [orderId, amount, method, ref]
    );
    await pool.query(`UPDATE event_payments.etsr_orders SET paymentstatus='SUCCESS' WHERE orderid=$1`, [orderId]).catch(()=>{});
    return { status: 'SUCCESS', reference: ref, payment: rows[0] };
  },
  async refund(orderId){
    await pool.query(`UPDATE event_payments.etsr_payments SET status='REFUNDED' WHERE orderid=$1`, [orderId]);
    await pool.query(`UPDATE event_payments.etsr_orders SET paymentstatus='REFUNDED' WHERE orderid=$1`, [orderId]).catch(()=>{});
    return { status: 'REFUNDED' };
  }
};
