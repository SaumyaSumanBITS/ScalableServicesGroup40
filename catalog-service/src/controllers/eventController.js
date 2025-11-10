exports.searchEvents = async (req,res)=>{
  try{
    const { events } = req.repositories;
    const { city, type, status, q } = req.query;
    const out = await events.search({ city, eventtype: type, status, q });
    res.json(out);
  }catch(e){ res.status(500).json({error:String(e.message||e)}); }
};
exports.getEventById = async (req,res)=>{
  try{
    const { events } = req.repositories;
    const id = +req.params.id;
    const out = await events.getById(id);
    if(!out) return res.status(404).json({error:'not_found'});
    res.json(out);
  }catch(e){ res.status(500).json({error:String(e.message||e)}); }
};
exports.createEvent = async (req,res)=>{
  try{
    const { events } = req.repositories;
    const data = req.body||{};
    if(!data.venueid || !data.title) return res.status(400).json({error:'venueid and title required'});
    const out = await events.create(data);
    res.status(201).json(out);
  }catch(e){ res.status(500).json({error:String(e.message||e)}); }
};
