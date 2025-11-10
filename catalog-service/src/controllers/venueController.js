exports.searchVenues = async (req,res)=>{
  try{
    const { venues } = req.repositories;
    const { city, q } = req.query;
    res.json(await venues.search({ city, q }));
  }catch(e){ res.status(500).json({error:String(e.message||e)}); }
};
exports.getVenueById = async (req,res)=>{
  try{
    const { venues } = req.repositories;
    const id = +req.params.id;
    const v = await venues.getById(id);
    if(!v) return res.status(404).json({error:'not_found'});
    res.json(v);
  }catch(e){ res.status(500).json({error:String(e.message||e)}); }
};
