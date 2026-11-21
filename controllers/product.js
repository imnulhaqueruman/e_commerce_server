/**
 * Product CRUD + paginated list + per-field filter dispatch.
 *
 * IMPORTANT -- `price` is stored as a **String** in the schema, not a
 * Number. Any code path that does price math must `parseFloat(price)`
 * (or `Number()`) before arithmetic. The shopping-cart controller
 * (`controllers/user.js#userCart`) handles that conversion; this file
 * generally treats price as opaque text on read paths and lets the
 * client format it.
 *
 * Products are addressed by `slug` (URL-friendly), not `_id`. `slug` is
 * derived server-side from `title` on create/update; never trust a
 * client-supplied slug.
 */
const Product = require('../models/product');
const slugify = require('slugify');
const User = require('../models/user')

/**
 * POST /api/product (admin)
 * Body: full product document (title, description, price, quantity, ...).
 * - Slug is auto-generated from `title` via `slugify`.
 * - On validation error, returns 400 with `{ err: <mongoose-message> }`
 *   so the admin form can surface the specific failure.
 */
exports.create = async(req,res) =>{
   try{
      console.log(req.body);
      req.body.slug = slugify(req.body.title);
      const newProduct = await new Product(req.body).save()
      res.json(newProduct);
   }catch(err){
    console.log(err)
    //res.status(400).send('Create Product failed')  ;
    res.status(400).json({
       err:err.message,
    });
   }
};

/**
 * GET /api/products/:count
 * Returns the most recent `count` products (default ordering by createdAt
 * desc). `:count` is parsed as `parseInt` -- anything non-numeric becomes
 * `NaN`, which Mongoose treats as "no limit". Prefer the paginated
 * `exports.list` for any UI that needs predictable page sizes.
 */
exports.listAll = async(req,res) =>{
   let products = await Product.find({})
   .limit(parseInt(req.params.count))
   .populate('category')
   .populate('subs')
   .sort([['createdAt', 'desc']])
   .exec()
   res.json(products);
}

/**
 * DELETE /api/product/:slug (admin)
 * Note: `findOneAndRemove` is the legacy Mongoose 5 name; in Mongoose 7+
 * it's `findOneAndDelete`. This codebase pins mongoose@5 so both work,
 * but new code should use the `*AndDelete` form.
 */
exports.remove = async(req,res) =>{
   try{
        const deleted = await Product.findOneAndRemove({
           slug:req.params.slug,
         }).exec();
         res.json(deleted);
   }catch (err) {
      console.log(err)
      return res.status(400).send('Product delete failed')
   }
};
/**
 * GET /api/product/:slug -- public.
 * Returns the product doc with `category` and `subs` populated. No
 * `try/catch` here -- if Mongo throws, the request hangs (see CLAUDE.md
 * for the broader pattern in this codebase).
 */
exports.read = async(req,res) =>{
   const product = await Product.findOne({ slug: req.params.slug})
   .populate('category')
   .populate('subs')
   .exec();
   res.json(product);
};

/**
 * PUT /api/product/:slug (admin)
 * Body: any subset of product fields. If `title` is included, the slug
 * is regenerated. Be aware that changing the slug here will 404 any
 * open client tab still pointing at the old slug -- admin form should
 * warn before submitting a title change.
 */
exports.update= async(req,res) =>{
   try{
       if(req.body.title){
          req.body.slug = slugify(req.body.title)
       }
       const updated = await Product.findOneAndUpdate(
          {slug:req.params.slug}, 
           req.body,
           {new:true}
         ).exec();
         res.json(updated);
   }catch(err){
      console.log('Product Update error', err)
      //return res.status(400).send('Product update Failed')
      res.status(400).json({
         err:err.message,
      });
   }
};

// The `exports.list` handler below is the paginated variant. The
// unpaginated version is preserved above for reference but is no
// longer wired up by `routes/product.js`. If you need an
// unpaginated "show me everything" endpoint, mount this commented
// variant under a new route -- do not uncomment it here without
// updating the route file too.
// without pagination 
/*exports.list = async(req,res) =>{
   try{
      // createdAt updated at desc/asc , 3
      const{sort,order,limit} = req.body
      const products = await Product.find({})
      .populate('category')
      .populate('subs')
      .sort([[sort,order]])
      .limit(limit)
      .exec();
      res.json(products);
   }
   catch(err){
      console.log(err)
   }
}*/

/**
 * POST /api/products
 * Body: `{ sort?, order?, page?, perPage? }`.
 *
 * Returns `{ items, page, perPage, total }` so the client can render a
 * real pager. `perPage` defaults to 24 (it used to be hardcoded to 3,
 * which made the catalogue impossible to page through). `page` defaults
 * to 1.
 *
 * `sort` defaults to `createdAt` and `order` to `desc`, so the endpoint
 * behaves like "newest first" when called with an empty body.
 */
exports.list = async(req,res) =>{
   try{
      const{sort,order,page,perPage} = req.body || {};
      const currentPage = Math.max(1, parseInt(page,10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(perPage,10) || 24));
      const sortField = sort || 'createdAt';
      const sortOrder = order === 'asc' ? 1 : -1;

      const [items, total] = await Promise.all([
         Product.find({})
         .skip((currentPage - 1) * pageSize)
         .populate('category','_id name')
         .populate('subs','_id name')
         .sort([[sortField, sortOrder]])
         .limit(pageSize)
         .exec(),
         Product.countDocuments({}),
      ]);

      res.json({
         items,
         page: currentPage,
         perPage: pageSize,
         total,
         totalPages: Math.max(1, Math.ceil(total / pageSize)),
      });
   }
   catch(err){
      console.log(err)
   }
}

/**
 * GET /api/products/total -- public.
 * Returns the estimated document count for the Product collection.
 * Uses `estimatedDocumentCount` (fast, uses collection metadata) rather
 * than `countDocuments` (accurate but slow) -- fine for the dashboard's
 * "N products" label. Switch to `countDocuments` if you ever need exact
 * numbers after concurrent inserts/deletes.
 */
exports.productsCount = async(req,res) =>{
   let total = await Product.find({}).estimatedDocumentCount().exec();
   res.json(total);
}

/**
 * PUT /api/product/star/:productId (logged-in user)
 * Body: `{ star }` (1-5). Inserts a new rating if the user has none on
 * this product yet; otherwise updates their existing rating in place.
 *
 * Identifies the user by `req.user.email` (set by `requireAuth`). The
 * lookup via `Product.findById` + `product.ratings.find(...)` is O(ratings)
 * per call -- fine at the demo scale, but if ratings grow past hundreds
 * per product, switch to `Product.findOneAndUpdate({_id, 'ratings.postedBy': user._id}, ...)`.
 */
exports.productStar = async(req,res) =>{
   try{
      const product = await Product.findById(req.params.productId).exec()
      const user = await User.findOne({email:req.user.email}).exec()
      const{star} = req.body
   
      // who is updating ?
      // check if currently logged in user have already added rating to this product?
      
      let existingRatingObject = await product.ratings.find((e)=> e.postedBy.toString() === user._id.toString());
   
      // if user haven't left rating yet, push it
      if(existingRatingObject === undefined){
        let ratingAdded = await Product.findByIdAndUpdate(product._id,{
           $push:{ ratings: {star:star, postedBy: user._id} },
        },
        {
           new:true
        }).exec();
        console.log('ratings added',ratingAdded)
        res.json(ratingAdded)
   
      } else{
      // if user have already left rating , update it
       const ratingUpdated = await Product.updateOne(
          {ratings : {$elemMatch: existingRatingObject},},
          { $set: {'ratings.$.star': star} },
          {new:true}
       ).exec();
       console.log('ratingUpdated', ratingUpdated)
       res.json(ratingUpdated)
      }
   } catch(err){
      console.log(err)
   }

};
/**
 * GET /api/product/related/:productId -- public.
 * Returns up to 3 products in the same category, excluding the source
 * product. The category is matched by ObjectId -- the source product's
 * `category` field holds an ObjectId, not a populated name, so comparing
 * against `product.category.name` (as this used to) compared against
 * `undefined` and matched nothing meaningful.
 */
exports.listRelated = async(req,res) =>{
   try{
      const product = await Product.findById(req.params.productId).exec();

      if (!product) {
         return res.status(404).json({ err: 'Product not found' });
      }

      const related = await Product.find({
         _id:{$ne : product._id},
         category:product.category,

      })
         .limit(3)
         .populate("category",'_id name')
         .populate("subs",'_id name')
         .populate("postedBy",'_id name')
         .exec()
      return res.json(related)
   } catch(err){
      console.log(err)
      return res.status(500).json({ err: 'Failed to load related products' })
   }

}
// The `handle*` helpers that used to live here were dispatched one-by-one
// by `searchFilters`, and only the FIRST matching handler responded -- so a
// request carrying both `query` and `price` silently ignored the price
// filter. `searchFilters` now composes every supplied filter into a single
// `$and` query instead, so filters narrow each other.

/**
 * POST /api/search/filters -- public.
 * Body: any subset of `{ query, price, category, stars, sub, shipping, color, brand }`.
 *
 * Every supplied filter is combined into ONE Mongo query (`$and`), so
 * filters narrow each other instead of overriding one another.
 *
 * `stars` is special: it matches products whose *floor-average* rating
 * equals the requested value. That needs an aggregation, so it runs first
 * to resolve a set of matching ids, and the remaining filters are then
 * applied to those ids.
 */
exports.searchFilters = async(req,res) =>{
  const {query,price,category,stars,sub,shipping,color, brand} = req.body || {};

  const clauses = [];

  if (query) {
    clauses.push({$text: { $search: query}});
  }

  // price[20,200] -- guard against a malformed or inverted range.
  if (price !== undefined && Array.isArray(price) && price.length === 2) {
    const [min, max] = price;
    if (Number.isFinite(Number(min)) && Number.isFinite(Number(max))) {
      clauses.push({price: {$gte: Number(min), $lte: Number(max)}});
    }
  }

  if (category) {
    clauses.push({category});
  }

  if (sub) {
    clauses.push({subs: sub});
  }

  if (shipping) {
    clauses.push({shipping});
  }

  if (color) {
    clauses.push({color});
  }

  if (brand) {
    clauses.push({brand});
  }

  try {
    // `stars` needs an aggregation to compute the floor-average, so it
    // resolves to a set of product ids that the main query then filters.
    if (stars !== undefined && stars !== null) {
      const aggregates = await Product.aggregate([
         {
            $project:{
               document: "$$ROOT",
               floorAverage:{
                  $floor:{$avg: "$ratings.star"}
               }
            },
         },
         {$match : {floorAverage: Number(stars)} },
         {$project: {_id: 1}},
      ]);

      const starIds = aggregates.map((a) => a._id);

      // No product matches this rating. An empty `$in` set would match
      // nothing, but short-circuiting is clearer and avoids the query.
      if (starIds.length === 0) {
        return res.json([]);
      }

      clauses.push({_id: {$in: starIds}});
    }

    const filter = clauses.length > 0 ? {$and: clauses} : {};

    const products = await Product.find(filter)
       .populate('category','_id name')
       .populate('subs','_id name')
       .populate('postedBy', '_id name')
       .exec();

    return res.json(products);
  } catch (err) {
    console.log('searchFilters error', err);
    return res.status(500).json({ err: 'Search failed' });
  }
}

