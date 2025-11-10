
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, "..",'.env') });
const { Pool } = require('pg');

// Resolve CSV file paths
const DATA_DIR = path.join(__dirname, '..', 'seed_data');

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const cols = line.split(',');
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = cols[idx] ? cols[idx].trim() : '';
    });
    return obj;
  });
}

async function loadCsv(name) {
  const file = path.join(DATA_DIR, name);
  const text = fs.readFileSync(file, 'utf8');
  return parseCsv(text);
}

const userPool = new Pool({ connectionString: process.env.USER_DB_URL || process.env.DATABASE_URL });
const catalogPool = new Pool({ connectionString: process.env.CATALOG_DB_URL || process.env.DATABASE_URL });
const seatingPool = new Pool({ connectionString: process.env.SEATING_DB_URL || process.env.DATABASE_URL });
const orderPool = new Pool({ connectionString: process.env.ORDER_DB_URL || process.env.DATABASE_URL });
const paymentPool = new Pool({ connectionString: process.env.PAYMENT_DB_URL || process.env.DATABASE_URL });

async function seedUsers(records) {
  await userPool.query('DELETE FROM event_user.etsr_users');
  await orderPool.query('DELETE FROM event_order.etsr_users');
  await orderPool.query('DELETE FROM event_tickets.etsr_users');
  await paymentPool.query('DELETE FROM event_payments.etsr_users');
  for (const u of records) {
    const cols = [parseInt(u.user_id, 10), u.name, u.email, u.phone || null, u.created_at];
    await userPool.query(
      'INSERT INTO event_user.etsr_users (userid, name, email, phone, createdat) VALUES ($1,$2,$3,$4,$5)',
      cols
    );
    await orderPool.query(
      'INSERT INTO event_order.etsr_users (userid, name, email, phone, createdat) VALUES ($1,$2,$3,$4,$5)',
      cols
    );
    await orderPool.query(
      'INSERT INTO event_tickets.etsr_users (userid, name, email, phone, createdat) VALUES ($1,$2,$3,$4,$5)',
      cols
    );
    await paymentPool.query(
      'INSERT INTO event_payments.etsr_users (userid, name, email, phone, createdat) VALUES ($1,$2,$3,$4,$5)',
      cols
    );
  }
}

async function seedVenues(records) {
  await catalogPool.query('DELETE FROM event_venue.etsr_venues');
  await catalogPool.query('DELETE FROM event_event.etsr_venues');
  await seatingPool.query('DELETE FROM event_seats.etsr_venues');
  await orderPool.query('DELETE FROM event_order.etsr_venues');
  await orderPool.query('DELETE FROM event_tickets.etsr_venues');
  await paymentPool.query('DELETE FROM event_payments.etsr_venues');
  for (const v of records) {
    const cols = [parseInt(v.venue_id, 10), v.name, v.city, parseInt(v.capacity, 10)];
    await catalogPool.query(
      'INSERT INTO event_venue.etsr_venues (venueid, name, city, capacity) VALUES ($1,$2,$3,$4)',
      cols
    );
    await catalogPool.query(
      'INSERT INTO event_event.etsr_venues (venueid, name, city, capacity) VALUES ($1,$2,$3,$4)',
      cols
    );
    await seatingPool.query(
      'INSERT INTO event_seats.etsr_venues (venueid, name, city, capacity) VALUES ($1,$2,$3,$4)',
      cols
    );
    await orderPool.query(
      'INSERT INTO event_order.etsr_venues (venueid, name, city, capacity) VALUES ($1,$2,$3,$4)',
      cols
    );
    await orderPool.query(
      'INSERT INTO event_tickets.etsr_venues (venueid, name, city, capacity) VALUES ($1,$2,$3,$4)',
      cols
    );
    await paymentPool.query(
      'INSERT INTO event_payments.etsr_venues (venueid, name, city, capacity) VALUES ($1,$2,$3,$4)',
      cols
    );
  }
}

async function seedEvents(records) {
  await catalogPool.query('DELETE FROM event_event.etsr_events');
  await seatingPool.query('DELETE FROM event_seats.etsr_events');
  await orderPool.query('DELETE FROM event_order.etsr_events');
  await orderPool.query('DELETE FROM event_tickets.etsr_events');
  await paymentPool.query('DELETE FROM event_payments.etsr_events');
  for (const e of records) {
    const cols = [
      parseInt(e.event_id, 10),
      parseInt(e.venue_id, 10),
      e.title,
      e.event_type,
      e.event_date,
      parseFloat(e.base_price),
      e.status,
    ];
    await catalogPool.query(
      'INSERT INTO event_event.etsr_events (eventid, venueid, title, eventtype, eventdate, baseprice, status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      cols
    );
    // replicate to other domains
    await seatingPool.query(
      'INSERT INTO event_seats.etsr_events (eventid, venueid, title, eventtype, eventdate, baseprice, status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      cols
    );
    await orderPool.query(
      'INSERT INTO event_order.etsr_events (eventid, venueid, title, eventtype, eventdate, baseprice, status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      cols
    );
    await orderPool.query(
      'INSERT INTO event_tickets.etsr_events (eventid, venueid, title, eventtype, eventdate, baseprice, status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      cols
    );
    await paymentPool.query(
      'INSERT INTO event_payments.etsr_events (eventid, venueid, title, eventtype, eventdate, baseprice, status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      cols
    );
  }
}

async function seedSeats(records) {
  await seatingPool.query('DELETE FROM event_seats.etsr_seats');
  await orderPool.query('DELETE FROM event_tickets.etsr_seats');
  for (const s of records) {
    const cols = [
      parseInt(s.seat_id, 10),
      parseInt(s.event_id, 10),
      s.section,
      s.row,
      parseInt(s.seat_number, 10),
      parseFloat(s.price),
    ];
    await seatingPool.query(
      'INSERT INTO event_seats.etsr_seats (seatid, eventid, section, row_num, seatnumber, price) VALUES ($1,$2,$3,$4,$5,$6)',
      cols
    );
    await orderPool.query(
      'INSERT INTO event_tickets.etsr_seats (seatid, eventid, section, row_num, seatnumber, price) VALUES ($1,$2,$3,$4,$5,$6)',
      cols
    );
  }
}

async function seedOrders(records) {
  await orderPool.query('DELETE FROM event_order.etsr_orders');
  await orderPool.query('DELETE FROM event_tickets.etsr_orders');
  await paymentPool.query('DELETE FROM event_payments.etsr_orders');
  for (const o of records) {
    const cols = [
      parseInt(o.order_id, 10),
      parseInt(o.user_id, 10),
      parseInt(o.event_id, 10),
      o.status,
      o.payment_status,
      parseFloat(o.order_total),
      o.created_at,
    ];
    await orderPool.query(
      'INSERT INTO event_order.etsr_orders (orderid, userid, eventid, status, paymentstatus, ordertotal, createdat) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      cols
    );
    await orderPool.query(
      'INSERT INTO event_tickets.etsr_orders (orderid, userid, eventid, status, paymentstatus, ordertotal, createdat) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      cols
    );
    await paymentPool.query(
      'INSERT INTO event_payments.etsr_orders (orderid, userid, eventid, status, paymentstatus, ordertotal, createdat) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      cols
    );
  }
}

async function seedTickets(records) {
  await orderPool.query('DELETE FROM event_tickets.etsr_tickets');
  for (const t of records) {
    const cols = [
      parseInt(t.ticket_id, 10),
      parseInt(t.order_id, 10),
      parseInt(t.event_id, 10),
      parseInt(t.seat_id, 10),
      parseFloat(t.price_paid),
    ];
    await orderPool.query(
      'INSERT INTO event_tickets.etsr_tickets (ticketid, orderid, eventid, seatid, pricepaid) VALUES ($1,$2,$3,$4,$5)',
      cols
    );
  }
}

async function seedPayments(records) {
  await paymentPool.query('DELETE FROM event_payments.etsr_payments');
  for (const p of records) {
    const cols = [
      parseInt(p.payment_id, 10),
      parseInt(p.order_id, 10),
      parseFloat(p.amount),
      p.method,
      p.status,
      p.reference,
      p.created_at,
    ];
    await paymentPool.query(
      'INSERT INTO event_payments.etsr_payments (paymentid, orderid, amount, method, status, reference, createdat) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      cols
    );
  }
}

async function run() {
  console.log('Loading CSV data...');
  const [users, venues, events, seats, orders, tickets, payments] = await Promise.all([
    loadCsv('etsr_users.csv'),
    loadCsv('etsr_venues.csv'),
    loadCsv('etsr_events.csv'),
    loadCsv('etsr_seats.csv'),
    loadCsv('etsr_orders.csv'),
    loadCsv('etsr_tickets.csv'),
    loadCsv('etsr_payments.csv'),
  ]);
  console.log('Seeding databases...');
  await seedUsers(users);
  await seedVenues(venues);
  await seedEvents(events);
  await seedSeats(seats);
  await seedOrders(orders);
  await seedTickets(tickets);
  await seedPayments(payments);
  console.log('Seeding complete.');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});