const { postJSON } = require('../lib/http');
const { v4: uuid } = require('uuid');

exports.createOrder = async (req,res)=>{
  try{
    const { orders, tickets } = req.repositories;
    const { userId, eventId, seatIds } = req.body||{};
    console.log("recieving");
    
    if(!userId || !eventId || !Array.isArray(seatIds) || !seatIds.length){
      return res.status(400).json({error:'userId, eventId, seatIds[] required'});
    }

    const SEATING_URL = process.env.SEATING_URL;
    const PAYMENT_URL = process.env.PAYMENT_URL;

    const reserve = await postJSON(`${SEATING_URL}/v1/seats/reserve`, { eventId, seatIds, ttlMinutes: 15 });
    const holdId = reserve.holdId;

    const prices = await orders.getSeatPrices(eventId, seatIds);
    const subtotal = prices.reduce((a,b)=>a+b, 0);
    const tax = +(subtotal * 0.05).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);

    const order = await orders.createPending({ userId, eventId, seatIds, subtotal, tax, total, holdId });

    const idemKey = req.headers['idempotency-key'] || uuid();
    const charge = await postJSON(`${PAYMENT_URL}/v1/payments/charge`, {
      orderId: order.id, amount: total, method: 'CARD'
    }, { headers: { 'Idempotency-Key': idemKey } });

    if (charge.status !== 'SUCCESS') throw new Error('Payment failed');

    await postJSON(`${SEATING_URL}/v1/seats/allocate`, { holdId, orderId: order.id });
    await orders.markPaid(order.id);
    const issued = await orders.issueTickets(order.id, eventId, seatIds);

    res.status(201).json({ ...order, status: 'CONFIRMED', paymentstatus: 'SUCCESS', tickets: issued });
  }catch(e){
    try{
      if (e.holdId && process.env.SEATING_URL) {
        await postJSON(`${process.env.SEATING_URL}/v1/seats/release`, { holdId });
      }
    }catch{}
    res.status(502).json({ error: 'checkout_failed', detail: String(e.message||e) });
  }
};

exports.getOrderById = async (req,res)=>{
  try{
    const { orders } = req.repositories;
    const id = +req.params.id;
    const out = await orders.getOrderById(id);
    if(!out) return res.status(404).json({error:'not_found'});
    res.json(out);
  }catch(e){ res.status(500).json({error:String(e.message||e)}); }
};

exports.cancelOrder = async (req,res)=>{
  try{
    const { orders } = req.repositories;
    const id = +req.params.id;
    const order = await orders.getOrderById(id);
    if(!order) return res.status(404).json({error:'not_found'});
    if(order.status === 'CANCELLED') return res.json(order);

    const PAYMENT_URL = process.env.PAYMENT_URL;
    await postJSON(`${PAYMENT_URL}/v1/payments/refund`, { orderId: id });

    const holdId = await orders.getHoldId(id);
    if(holdId && process.env.SEATING_URL){
      await postJSON(`${process.env.SEATING_URL}/v1/seats/release`, { holdId });
    }

    const cancelled = await orders.markCancelled(id);
    res.json(cancelled);
  }catch(e){ res.status(502).json({error:'cancel_failed', detail:String(e.message||e)}); }
};
