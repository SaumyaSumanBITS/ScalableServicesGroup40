exports.getTicketsByOrderId = async (req,res)=>{
  try{
    const { tickets } = req.repositories;
    const id = +req.params.id;
    const out = await tickets.getByOrderId(id);
    res.json(out);
  }catch(e){ res.status(500).json({error:String(e.message||e)}); }
};
