exports.createUser = async (req,res)=>{
  try{
    const { users } = req.repositories;
    const { name, email, phone } = req.body || {};
    if(!name || !email) return res.status(400).json({error:'name and email required'});
    const out = await users.create({ name, email, phone });
    res.status(201).json(out);
  }catch(e){ res.status(500).json({error:String(e.message||e)}); }
};
exports.listUsers = async (req,res)=>{
  try{
    const { users } = req.repositories;
    res.json(await users.list());
  }catch(e){ res.status(500).json({error:String(e.message||e)}); }
};
exports.getUserById = async (req,res)=>{
  try{
    const { users } = req.repositories;
    const id = +req.params.id;
    const u = await users.getById(id);
    if(!u) return res.status(404).json({error:'not_found'});
    res.json(u);
  }catch(e){ res.status(500).json({error:String(e.message||e)}); }
};
exports.updateUser = async (req,res)=>{
  try{
    const { users } = req.repositories;
    const id = +req.params.id;
    const out = await users.update(id, req.body||{});
    if(!out) return res.status(404).json({error:'not_found'});
    res.json(out);
  }catch(e){ res.status(500).json({error:String(e.message||e)}); }
};
exports.deleteUser = async (req,res)=>{
  try{
    const { users } = req.repositories;
    const id = +req.params.id;
    const ok = await users.remove(id);
    if(!ok) return res.status(404).json({error:'not_found'});
    res.json({ok:true});
  }catch(e){ res.status(500).json({error:String(e.message||e)}); }
};
