/**
 * Sub-category CRUD. Mirror of `controllers/category.js` but the slug
 * is namespaced by an additional required `parent` ObjectId pointing at
 * the parent Category.
 *
 * `routes/sub.js` mounts mutating endpoints behind
 * `requireAuth, requireAdmin`; reads are public.
 */
const Sub = require('../models/sub');
const slugify = require('slugify')
const Product = require('../models/product')
/**
 * POST /api/sub (admin)
 * Body: `{ name, parent }` — `parent` is the parent Category's ObjectId.
 * Slug is auto-generated from `name` and is unique only within the
 * schema (see `models/sub.js`); two subs in different parents can share
 * a slug today — keep that in mind if you ever add a sub-by-slug route.
 */
exports.create = async(req,res) =>{
    try{
        const {name,parent} = req.body
        const sub = await new Sub({name,parent, slug: slugify(name)}).save();
        res.json(sub);
    }catch(err){
        console.log(err)
        res.status(400).send('Sub Category failed')
    }   
}

/**
 * GET /api/subs — public. Newest first, no pagination.
 */
exports.list = async(req,res) =>{
    res.json(await Sub.find({}).sort({createdAt:-1}).exec());
}

/**
 * GET /api/sub/:slug — public.
 * Returns the sub doc and all products whose `subs` array includes it.
 * Same caveat as `category.read`: no try/catch — failures will hang
 * the request. Wrap before this becomes a hot path.
 */
exports.read = async(req,res) =>{
    let sub = await Sub.findOne({slug: req.params.slug}).exec();
    const products = await Product.find({subs:sub})
    .populate('category')
    .exec()
    res.json({
        sub,
        products
    })
}

/**
 * PUT /api/sub/:slug (admin)
 * Body: `{ name, parent }`. Both fields are updated; slug is regenerated
 * from the new name. Switching parents is allowed — useful for taxonomy
 * reorganizations, but be aware it changes which products show up under
 * the sub via the `subs` reference array on the Product.
 */
exports.update = async(req,res) =>{
    const {name,parent} = req.body; 
    try{
          const updated = await Sub.findOneAndUpdate(
              {slug:req.params.slug},
              {name,parent, slug:slugify(name)},
              {new:true}
            );
            res.json(updated)
    } catch(err){
        res.status(400).send('Sub Update failed')
    }
}

/**
 * DELETE /api/sub/:slug (admin)
 * No cascade; products keep a reference to this sub's ObjectId in their
 * `subs` array until manually cleaned up.
 */
exports.remove = async(req,res) =>{
    try{
       const deleted = await Sub.findOneAndDelete({slug: req.params.slug});
       res.json(deleted);
    }catch(err){
        res.status(400).send('Sub delete failed')
    }
}