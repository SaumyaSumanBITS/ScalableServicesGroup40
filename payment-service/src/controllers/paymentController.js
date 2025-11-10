exports.charge = async (req,res)=>{
  try{
    const { payments } = req.repositories;
    const { orderId, amount, method='CARD' } = req.body||{};
    if(!orderId || !amount) return res.status(400).json({error:'orderId and amount required'});
    const out = await payments.create({ orderId, amount, method });
    res.status(201).json(out);
  }catch(e){ res.status(500).json({error:String(e.message||e)}); }
};
exports.refund = async (req,res)=>{
  try{
    const { payments } = req.repositories;
    const { orderId } = req.body||{};
    if(!orderId) return res.status(400).json({error:'orderId required'});
    const out = await payments.refund(orderId);
    res.json(out);
  }catch(e){ res.status(500).json({error:String(e.message||e)}); }
};
