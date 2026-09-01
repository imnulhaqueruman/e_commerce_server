/**
 * Category CRUD + a `getSubs` helper used by the category detail page.
 *
 * Categories are addressed by `slug` (auto-generated from `name` via
 * `slugify`) — see `models/category.js`. The slug is the URL-friendly
 * identifier; the ObjectId is only used internally.
 *
 * `routes/category.js` mounts mutating endpoints behind
 * `requireAuth, requireAdmin`; reads are public.
 */
const Category = require('../models/category');
const Product = require('../models/product')
const Sub = require('../models/sub');
const slugify = require('slugify')
/**
 * POST /api/category (admin)
 * Body: `{ name }`. The slug is derived server-side — never trust a
 * client-supplied slug.
 */
exports.create = async(req,res) =>{
    try{
        const {name} = req.body
        const category = await new Category({name, slug: slugify(name)}).save();
        res.json(category);
    }catch(err){
        console.log(err)
        res.status(400).send('Create Category failed')
    }   
}

/**
 * GET /api/categories — public. Newest first.
 * No pagination; if you ever exceed ~hundreds of categories, add a
 * cursor or page param here before adding one to the client.
 */
exports.list = async(req,res) =>{
    res.json(await Category.find({}).sort({createdAt:-1}).exec());
}

/**
 * GET /api/category/:slug — public.
 * Returns the category doc plus all products whose `category` ObjectId
 * points at it. Each product is `.populate('category')` so the client
 * can render breadcrumb navigation.
 *
 * NOTE: this handler has no `try/catch`. If Mongo throws, the request
 * hangs (same pattern the coupon controller had before this commit).
 * Wrap with try/catch if you start seeing H12 timeouts on this path.
 */
exports.read = async(req,res) =>{
    let category = await Category.findOne({slug: req.params.slug}).exec();
    const products = await Product.find({category})
    .populate('category')
    .exec()
    res.json({category,products})
}

/**
 * PUT /api/category/:slug (admin)
 * Body: `{ name }`. Reslugifies on rename so URLs stay in sync with the
 * new display name. Existing product `category` ObjectIds are unaffected
 * — products track the category by `_id`, not slug.
 */
exports.update = async(req,res) =>{
    const {name} = req.body; 
    try{
          const updated = await Category.findOneAndUpdate(
              {slug:req.params.slug},
              {name,slug:slugify(name)},
              {new:true}
            );
            res.json(updated)
    } catch(err){
        res.status(400).send('Category Update failed')
    }
}

/**
 * DELETE /api/category/:slug (admin)
 * Cascading: any product still pointing at this category will keep the
 * (now-dangling) ObjectId. There's no on-delete hook; if you need one,
 * add it via a Mongoose `pre('remove')` middleware on the model.
 */
exports.remove = async(req,res) =>{
    try{
       const deleted = await Category.findOneAndDelete({slug: req.params.slug});
       res.json(deleted);
    }catch(err){
        res.status(400).send('create delete failed')
    }
};
/**
 * GET /api/category/subs/:_id — public.
 * Lists the `Sub` documents whose `parent` ObjectId matches the URL param.
 * Note the param name `_id` (with underscore) — kept for back-compat with
 * the original client; renaming it would require updating the SPA.
 *
 * Uses the Mongoose callback API (mongoose@5), unlike the rest of the
 * file which uses await/async. Mixed style is fine here since the query
 * is trivial, but prefer the async style for any new code.
 */
exports.getSubs = (req,res) =>{
  Sub.find({parent: req.params._id}).exec((err,subs) =>{
      if(err) console.log(err);
      res.json(subs);
  })
}

