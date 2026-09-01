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
 * Body: `{ sort, order, page? }`. Hardcoded `perPage = 3` -- bump this
 * when the product grid moves beyond the demo data set; consider
 * making it part of the request body once you do.
 *
 * Returns `perPage` products starting at `(page-1) * perPage`, sorted
 * by `[[sort, order]]` (e.g. `[['createdAt', 'desc']]`).
 */
// with pagination
// with pagination
exports.list = async(req,res) =>{
   console.table(req.body)
   try{
      // createdAt updated at desc/asc , 3
      const{sort,order,page} = req.body;
      const currentPage = page || 1
      const perPage = 3

      const products = await Product.find({})
      .skip((currentPage - 1) * perPage)
      .populate('category')
      .populate('subs')
      .sort([[sort,order]])
      .limit(perPage)
      .exec();
      res.json(products);
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
 * product. Comparison uses `product.category.name` (a populated string),
 * not the ObjectId -- relies on `category` being populated upstream.
 * Has no try/catch; hangs on DB error.
 */
exports.listRelated = async(req,res) =>{
   const product = await Product.findById(req.params.productId).exec();
   const related = await Product.find({
      _id:{$ne : product._id},
      category:product.category.name,

   })
      .limit(3)
      .populate("category")
      .populate("subs")
      .populate("postedBy")
      .exec()
   res.json(related)

}
// The 7 `handle*` helpers below are dispatched by `searchFilters` based
// on which keys are present in `req.body`. They all `.populate()` the
// same three references (`category`, `subs`, `postedBy`) -- keep that
// shape consistent when adding new handlers so the client doesn't have
// to defend against missing fields.
// search // Filter

 // Free-text search via Mongo's `$text` index. Requires the Product
// schema to declare a text index -- see `models/product.js`. Returns
// results sorted by relevance (the default for $text queries).
 const handleQuery = async(req,res,query) =>{
   const products = await Product.find({$text: { $search: query}})
      .populate('category','_id name')
      .populate('subs','_id name')
      .populate('postedBy', '_id name')
      .exec();
   res.json(products);
}

// `price` is `[min, max]` (inclusive on both ends). Uses `$gte`/`$lte`.
// Because Product.price is a String in the schema, the comparison is
// lexicographic -- works for fixed-decimal strings (e.g. "12.99") but
// not for unsorted formats ("5", "100.00" -> "5" sorts after "100").
// Acceptable for this app's price entry pattern; document the
// assumption if you change the input format.
const handlePrice = async(req,res,price) =>{
    try{
       let products = await Product.find({
          price:{
             $gte:price[0], 
             $lte:price[1],
          }
          })
            .populate('category','_id name')
            .populate('subs','_id name')
            .populate('postedBy', '_id name')
            .exec();
         res.json(products)

    } catch (err){
       console.log(err)
    }
}
// Filters by `category` ObjectId directly (no populate here). The
// client must send the ObjectId, not the slug, for this handler.
const handleCategory = async(req,res,category) =>{
   try{
      let products = await Product.find({category})
         .populate('category','_id name')
         .populate('subs','_id name')
         .populate('postedBy', '_id name')
         .exec();
      res.json(products)


   }catch(err){
      console.log(err)
   }
}
// Filters products whose *floor-average* rating equals `stars`. Uses
// `$project` + `$floor` + `$avg` aggregation, then a second `find` to
// hydrate the matching ids. Callback-style API (mongoose@5) -- fine
// here, but consider migrating to await for any new handlers.
//
// Limit 12 keeps the second-stage `Product.find` cheap.
const  handleStars = (req,res,stars) =>{
   Product.aggregate([
      {
         $project:{
            document: "$$ROOT",
            floorAverage:{
               $floor:{$avg: "$ratings.star"}
            }
         },
      },
      {$match : {floorAverage: stars} }
   ])
   .limit(12)
   .exec((err,aggregates) =>{
      if(err) console.log('AGGREGATES ERROR', err)
      Product.find({_id:aggregates})
      .populate('category','_id name')
      .populate('subs','_id name')
      .populate('postedBy', '_id name')
      .exec((err,products) =>{
         if(err) console.log('product aggregates error', err)
         res.json(products)
      });

   });

};
// Filters by `subs` ObjectId membership (`subs` is an array on the
// schema). Client must send the sub ObjectId.
const handleSub = async(req,res,sub) =>{
   const products = await Product.find({subs:sub})
   .populate('category','_id name')
   .populate('subs','_id name')
   .populate('postedBy', '_id name')
   .exec();
   res.json(products);
}
// Boolean filter on the `shipping` field (e.g. "Yes"/"No" depending on
// what the admin form stores).
const handleShipping = async(req,res,shipping) =>{
  const products = await Product.find({shipping})
  .populate('category','_id name')
  .populate('subs','_id name')
  .populate('postedBy', '_id name')
  .exec();
  res.json(products)
}
// Exact-match filter on the `color` field.
const handleColor = async(req,res,color) =>{
   const products = await Product.find({color})
  .populate('category','_id name')
  .populate('subs','_id name')
  .populate('postedBy', '_id name')
  .exec();
  res.json(products)
}
// Exact-match filter on the `brand` field.
const handleBrand = async(req,res,brand) =>{
   const products = await Product.find({brand})
  .populate('category','_id name')
  .populate('subs','_id name')
  .populate('postedBy', '_id name')
  .exec();
  res.json(products)
}
/**
 * POST /api/search/filters -- public.
 * Body: any subset of `{ query, price, category, stars, sub, shipping, color, brand }`.
 *
 * IMPORTANT -- the dispatch is sequential `await` calls, and only the
 * FIRST matching handler responds to the client. If `query` and `price`
 * are both present, `query` wins and `price` is ignored. This is a known
 * limitation of the current shape; combine filters by either composing
 * a single Mongo `$and` here or by orchestrating on the client.
 */
exports.searchFilters = async(req,res) =>{
          const {query,price,category,stars,sub,shipping,color, brand} = req.body;

          if(query){
             console.log('query',query)
             await handleQuery(req,res,query);
          }

          // price[20,200]
          if(price !== undefined){
               console.log('price--->', price)
               await handlePrice(req,res,price);
          }

          if(category){
             console.log('category-->', category)
             await handleCategory(req,res,category)
          }
          if(stars){
            console.log('stars-->', stars)
            await handleStars(req,res,stars)
          }

          if(sub){
            console.log('sub-->', sub)
            await handleSub(req,res,sub)
          }
          if(shipping){
            console.log('shipping-->', shipping)
            await handleShipping(req,res,shipping)
          }
          if(color){
            console.log('color-->', color)
            await handleColor(req,res,color)
          }
          if(brand){
            console.log('brand-->',brand)
            await handleBrand(req,res,brand)
          }
}
