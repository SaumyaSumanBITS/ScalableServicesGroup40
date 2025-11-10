const { test, beforeEach } = require('node:test');
const assert = require('node:assert');

// Import controllers from each microservice
const userController = require('../user-service/src/controllers/userController');
const eventController = require('../catalog-service/src/controllers/eventController');
const venueController = require('../catalog-service/src/controllers/venueController');
const seatingController = require('../seating-service/src/controllers/seatingController');
const orderController = require('../order-service/src/controllers/orderController');
const ticketController = require('../order-service/src/controllers/ticketController');
const paymentController = require('../payment-service/src/controllers/paymentController');

// Import idempotency middlewares
const {
  idempotentRoute: idempotentOrder,
  _store: orderStore,
} = require('../order-service/src/middleware/idempotency');
const {
  idempotentRoute: idempotentPayment,
  _store: paymentStore,
} = require('../payment-service/src/middleware/idempotency');

// Helpers to build req and res objects similar to Express
function makeReq(options = {}) {
  const req = {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: {},
    repositories: options.repositories || {},
  };
  for (const [key, val] of Object.entries(options.headers || {})) {
    req.headers[key.toLowerCase()] = val;
  }
  req.header = function (name) {
    return this.headers[(name || '').toLowerCase()];
  };
  return req;
}

function makeRes() {
  return {
    statusCode: 200,
    body: undefined,
    ended: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
  };
}

// Clear idempotency stores before each test
beforeEach(() => {
  orderStore.clear();
  paymentStore.clear();
});

/* User service tests */
test('user create succeeds and fails on invalid input', async () => {
  const repo = {
    users: {
      create: async (data) => ({ id: 'u1', ...data }),
      getById: async () => null,
      getAll: async () => [],
      update: async () => null,
      delete: async () => false,
    },
  };
  // valid
  let req = makeReq({ body: { name: 'Alice', email: 'alice@example.com' }, repositories: repo });
  let res = makeRes();
  await userController.createUser(req, res);
  assert.equal(res.statusCode, 201);
  // invalid
  req = makeReq({ body: { name: '', email: 'bad' }, repositories: repo });
  res = makeRes();
  await userController.createUser(req, res);
  assert.equal(res.statusCode, 400);
});

/* Catalog service tests */
test('catalog lists and creates events', async () => {
  const repo = {
    events: {
      getAll: async (filters) => [],
      getById: async () => ({ id: 'e1', status: 'ON_SALE' }),
      create: async (data) => ({ id: 'e2', ...data }),
    },
    venues: {
      getAll: async () => [],
      getById: async () => null,
    },
  };
  // list events
  let req = makeReq({ query: { city: 'Jaipur' }, repositories: repo });
  let res = makeRes();
  await eventController.listEvents(req, res);
  assert.equal(res.statusCode, 200);
  // create event
  req = makeReq({ body: { name: 'Gig', city: 'Delhi', date: new Date().toISOString(), venueId: 'v1' }, repositories: repo });
  res = makeRes();
  await eventController.createEvent(req, res);
  assert.equal(res.statusCode, 201);
});

/* Seating service tests */
test('seating reserves and allocates seats', async () => {
  const repo = {
    seats: {
      getSeats: async (eventId) => [],
      reserve: async () => ({ reservationId: 'r1' }),
      release: async () => true,
      allocate: async () => ({ tickets: ['t1'] }),
    },
  };
  // reserve seats
  let req = makeReq({ body: { eventId: 'e1', userId: 'u1', seatIds: ['s1'] }, repositories: repo });
  let res = makeRes();
  await seatingController.reserveSeats(req, res);
  assert.equal(res.statusCode, 201);
  // allocate seats
  req = makeReq({ body: { eventId: 'e1', userId: 'u1', seatIds: ['s1'] }, repositories: repo });
  res = makeRes();
  await seatingController.allocateSeats(req, res);
  assert.equal(res.statusCode, 201);
});

/* Order service tests */
test('order creation computes total and idempotency works', async () => {
  let createCount = 0;
  const repo = {
    events: { getById: async () => ({ id: 'e1', status: 'ON_SALE' }) },
    seats: { getByIds: async () => [{ id: 's1', price: 100 }] },
    orders: {
      create: async (data) => {
        createCount++;
        return { id: `o${createCount}`, ...data };
      },
      getById: async () => ({ id: 'o1', total: 105 }),
      cancel: async () => true,
    },
  };
  const wrapped = idempotentOrder(orderController.createOrder);
  // first call
  let req = makeReq({ body: { eventId: 'e1', userId: 'u1', seatIds: ['s1'] }, headers: { 'Idempotency-Key': 'abc' }, repositories: repo });
  let res = makeRes();
  await wrapped(req, res);
  assert.equal(res.statusCode, 201);
  assert.equal(createCount, 1);
  // second call with same key
  req = makeReq({ body: { eventId: 'e1', userId: 'u1', seatIds: ['s1'] }, headers: { 'Idempotency-Key': 'abc' }, repositories: repo });
  res = makeRes();
  await wrapped(req, res);
  assert.equal(res.statusCode, 201);
  assert.equal(createCount, 1);
});

/* Payment service tests */
test('payment charge respects idempotency and amount matching', async () => {
  let chargeCount = 0;
  const repo = {
    orders: { getById: async () => ({ id: 'o1', total: 105 }) },
    payments: {
      charge: async () => {
        chargeCount++;
        return { id: `p${chargeCount}`, amount: 105 };
      },
      refund: async () => ({ id: 'r1' }),
    },
  };
  const wrapped = idempotentPayment(paymentController.chargePayment);
  // first call
  let req = makeReq({ body: { orderId: 'o1', userId: 'u1', amount: 105 }, headers: { 'Idempotency-Key': 'pay' }, repositories: repo });
  let res = makeRes();
  await wrapped(req, res);
  assert.equal(res.statusCode, 201);
  assert.equal(chargeCount, 1);
  // mismatched amount
  req = makeReq({ body: { orderId: 'o1', userId: 'u1', amount: 100 }, headers: { 'Idempotency-Key': 'mismatch' }, repositories: repo });
  res = makeRes();
  await wrapped(req, res);
  assert.equal(res.statusCode, 400);
  // second call with same idempotency key should not re‑charge
  req = makeReq({ body: { orderId: 'o1', userId: 'u1', amount: 105 }, headers: { 'Idempotency-Key': 'pay' }, repositories: repo });
  res = makeRes();
  await wrapped(req, res);
  assert.equal(res.statusCode, 201);
  assert.equal(chargeCount, 1);
});

/* Ticket controller test */
test('ticket retrieval returns array or empty', async () => {
  const repo = { tickets: { getByOrderId: async () => [{ id: 't1' }, { id: 't2' }] } };
  let req = makeReq({ params: { orderId: 'o1' }, repositories: repo });
  let res = makeRes();
  await ticketController.getTicketsByOrderId(req, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, [{ id: 't1' }, { id: 't2' }]);
  // no tickets
  repo.tickets.getByOrderId = async () => null;
  req = makeReq({ params: { orderId: 'o2' }, repositories: repo });
  res = makeRes();
  await ticketController.getTicketsByOrderId(req, res);
  assert.deepEqual(res.body, []);
});