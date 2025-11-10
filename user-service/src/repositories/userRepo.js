const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.USER_DB_URL || process.env.DATABASE_URL,
  ssl: (process.env.USER_DB_URL||process.env.DATABASE_URL||'').includes('neon.tech') ? { rejectUnauthorized: false } : undefined
});
module.exports = {
  async create({ name, email, phone }){
    const { rows } = await pool.query(
      `INSERT INTO event_user.etsr_users (userid, name, email, phone, createdat)
       VALUES ( (SELECT COALESCE(MAX(userid),0)+1 FROM event_user.etsr_users), $1,$2,$3, NOW())
       RETURNING userid AS id, name, email, phone, createdat`,
      [name, email, phone ?? null]
    );
    return rows[0];
  },
  async list(){
    const { rows } = await pool.query(
      `SELECT userid AS id, name, email, phone, createdat
       FROM event_user.etsr_users ORDER BY userid DESC`
    );
    return rows;
  },
  async getById(id){
    const { rows } = await pool.query(
      `SELECT userid AS id, name, email, phone, createdat
       FROM event_user.etsr_users WHERE userid=$1`, [id]
    );
    return rows[0] || null;
  },
  async update(id, patch){
    const fields = [];
    const vals = []; let i=1;
    for(const [k,v] of Object.entries(patch)){
      if(!['name','email','phone'].includes(k)) continue;
      fields.push(`${k}=$${i++}`); vals.push(v);
    }
    if(!fields.length) return this.getById(id);
    vals.push(id);
    const { rows } = await pool.query(
      `UPDATE event_user.etsr_users SET ${fields.join(',')} WHERE userid=$${i}
       RETURNING userid AS id, name, email, phone, createdat`, vals
    );
    return rows[0] || null;
  },
  async remove(id){
    const r = await pool.query(`DELETE FROM event_user.etsr_users WHERE userid=$1`, [id]);
    return r.rowCount>0;
  }
};
