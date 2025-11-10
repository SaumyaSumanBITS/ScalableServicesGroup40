exports.listSeatsByEvent = async (req,res)=>{
  try{
    const { seats } = req.repositories;
    const eventId = +(req.query.eventId || req.query.eventid);
    if(!eventId) return res.status(400).json({error:'eventId required'});
    res.json(await seats.listByEvent(eventId));
  }catch(e){ res.status(500).json({error:String(e.message||e)}); }
};
exports.reserveSeats = async (req,res)=>{
  try{
    const { seats } = req.repositories;
    const { eventId, seatIds, ttlMinutes=15 } = req.body||{};
    if(!eventId || !Array.isArray(seatIds) || !seatIds.length)
      return res.status(400).json({error:'eventId and seatIds[] required'});
    const out = await seats.reserve(eventId, seatIds, ttlMinutes);
    res.status(201).json(out);
  }catch(e){ res.status(500).json({error:String(e.message||e)}); }
};
exports.releaseHold = async (req,res)=>{
  try{
    const { seats } = req.repositories;
    const { holdId } = req.body||{};
    if(!holdId) return res.status(400).json({error:'holdId required'});
    await seats.release(holdId);
    res.json({ok:true});
  }catch(e){ res.status(500).json({error:String(e.message||e)}); }
};
exports.allocateHold = async (req,res)=>{
  try{
    const { seats } = req.repositories;
    const { holdId, orderId } = req.body||{};
    if(!holdId || !orderId) return res.status(400).json({error:'holdId and orderId required'});
    await seats.allocate(holdId, orderId);
    res.json({ok:true});
  }catch(e){ res.status(500).json({error:String(e.message||e)}); }
};
