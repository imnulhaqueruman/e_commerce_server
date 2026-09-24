/**
 * User-domain controllers — cart, orders, coupons, wishlist, address.
 *
 * ⚠️  Almost every handler here is missing `try/catch`. A DB error
 * causes the request to hang until the client times out, exactly like
 * the pre-fix `controllers/coupon.js` did (see tests/routes/coupon.test.js
 * for the failure mode). Fix each handler before adding new behavior.
 *
 * ⚠️  `createOrder` and `applyCouponToUserCart` are coupled to the
 * Stripe payment flow:
 *   - `applyCouponToUserCart` reads the `Cart.totalAfterDiscount` that
 *     `controllers/stripe.js` later charges against.
 *   - `createOrder` reads `req.body.stripeResponse.paymentIntent` —
 *     this client-shaped field name will need to rename when the
 *     Stripe → bKash swap lands (`req.body.paymentResponse.payment`).
 */
const User = require('../models/user')
const Product = require('../models/product')
const Cart = require('../models/cart')
const Coupon = require ('../models/coupon')
const Order = require('../models/order')

/**
 * POST /api/user/cart (logged-in user)
 * Body: `{ cart: [{ _id, count, color }, …] }` — line items as the
 * client currently holds them.
 *
 * Replaces any existing cart for the user (one-per-user invariant) and
 * re-derives line prices from the DB so the client can't sneak in a
 * discounted price. The `Cart.totalAfterDiscount` is NOT set here; that
 * happens via `applyCouponToUserCart`.
 *
 * No `try/catch`. Side-effect: every successful save also deletes any
 * previous cart for the user, even if the new save later fails — wrap
 * this in a transaction before tightening the invariants.
 */
exports.userCart = async(req,res) =>{
    console.log(req.body) // {Cart:[]}
    const {cart} = req.body;
    
    let products= []

    const user = await User.findOne({email:req.user.email}).exec()
    // check if cart with logged in user id already exist 
    let cartExistByThisUser = await Cart.findOne({orderedBy:user._id}).exec();
    if (cartExistByThisUser){
        cartExistByThisUser.remove()
        console.log('removed old cart')
    }

    for(let i = 0; i < cart.length; i++){
        let object ={}
        object.product = cart[i]._id;
        object.count = cart[i].count
        object.color = cart[i].color
        // get price for creating total 
        let {price} = await Product.findById(cart[i]._id).select('price').exec();
        object.price = price

        products.push(object);

    }
    //console.log('products', products)

    let cartTotal = 0
    for (let i = 0; i < products.length; i++){
        cartTotal = cartTotal + products[i].price * products[i].count
    }

    //console.log('cartTotal', cartTotal);

    let newCart = await new Cart({
        products,
        cartTotal,
        orderedBy: user._id
    }).save();

    console.log('new cart--->', newCart);
    res.json({ok : true});
};

/**
 * GET /api/user/cart (logged-in user)
 * Returns the populated cart. NOTE: the destructure
 * `const {products,cartTotal,totalAfterDiscount} = cart;` will throw
 * if the user has no cart (cart is null), which Express 4 turns into a
 * 500. Defend against that here, or always run `userCart` before this
 * on first login.
 */
exports.getUserCart = async(req,res) =>{
    const user = await User.findOne({email:req.user.email}).exec();
    let cart = await Cart.findOne({orderedBy: user._id})
    .populate(
        'products.product', 
        "_id title price totalAfterDiscount"
        ).exec();
    const {products,cartTotal,totalAfterDiscount} = cart;
    res.json({products,cartTotal,totalAfterDiscount}) // req data
};
/**
 * DELETE /api/user/cart (logged-in user)
 * `findOneAndRemove` returns the removed doc, or null if none
 * existed — no try/catch. Returns the (possibly null) doc to the client.
 */
exports.emptyCart = async(req,res) =>{
    const user = await User.findOne({email:req.user.email}).exec();
    const cart = await Cart.findOneAndRemove({orderedBy: user._id}).exec();
    res.json(cart);
}

/**
 * POST /api/user/address (logged-in user)
 * Body: `{ address }`. Stores on the User document.
 * No `findOneAndUpdate` options — uses defaults. No error handling.
 */
exports.saveAddress = async(req,res) =>{
    const userAddress = await User.findOneAndUpdate(
        {email:req.user.email},
        {address:req.body.address}
        ).exec();
        res.json({ok : true});
}

/**
 * POST /api/user/cart/coupon (logged-in user)
 * Body: `{ coupon: "SUMMER25" }`. Looks up the coupon by its
 * uppercased name, computes `totalAfterDiscount = cartTotal * (1 -
 * discount/100)`, and writes it onto the Cart doc.
 *
 * `discount` is treated as a percentage (not a fraction). Schema
 * validation lives in `models/coupon.js` (`discount: Number`).
 *
 * The `findOneAndUpdate` is fire-and-forget — no `await`, so the
 * response can race with the DB write. Currently tolerated; tighten
 * before scaling.
 *
 * No `try/catch`. `Coupon.findOne` returning null responds with
 * `{err: 'Invalid Coupon'}` (200 OK — see item in your cleanup list
 * to make this a 4xx).
 */
exports.applyCouponToUserCart = async(req,res) =>{
     const {coupon} = req.body
     console.log('Coupon', coupon)

     const validCoupon = await Coupon.findOne({name:coupon}).exec()
     if(validCoupon === null){
         return res.json({
             err:'Invalid Coupon',
         });
     }
     console.log('Valid COUPON', validCoupon)

     const user = await User.findOne({email:req.user.email}).exec();
     let{products, cartTotal} = await Cart.findOne({orderedBy: user._id})
                       .populate('products.product',"_id title price").exec()

     console.log('cartTotal', cartTotal, 'discount', validCoupon.discount);
     // calculate the total after discount
     let totalAfterDiscount = (cartTotal - (cartTotal * validCoupon.discount)/100).toFixed(2);
     console.log("---------->",totalAfterDiscount)
     Cart.findOneAndUpdate(
         {orderedBy: user._id},
         {totalAfterDiscount},
         {new:true}
        ).exec()
    res.json(totalAfterDiscount)

};

/**
 * POST /api/user/order (logged-in user) — called after Stripe confirms.
 * Reads `req.body.stripeResponse.paymentIntent` and stuffs it into
 * `Order.paymentIntent` (Mixed). Each cart line becomes an Order line.
 *
 * `Product.bulkWrite` then decrements `quantity` and increments `sold`
 * per product. NOTE: the filter uses `item.product._id` which assumes
 * the cart embedded docs are populated — `Cart.findOne` above does
 * NOT `.populate('products.product')`, so this currently breaks on
 * real carts. Treat this handler as broken until the populate is
 * added.
 *
 * No `try/catch`. No idempotency — re-clicking "Place Order" can
 * double-decrement stock. Stripe webhooks should drive this path,
 * not a direct client POST.
 */
exports.createOrder = async(req,res) =>{
    const {paymentIntent} = req.body.stripeResponse;
    console.log(req.body)
    
    const user = await User.findOne({email:req.user.email}).exec();
    
    let {products} = await Cart.findOne({orderedBy: user._id}).exec()
    let newOrder = await new Order({
        products,
        paymentIntent,
        orderedBy: user._id,

    }).save();
    // decrement quantity increment sold 
    let bulkOption = products.map((item) =>{
        return{
            updateOne:{
             filter:{_id:item.product._id}, // important item.product 
             update:{$inc:{quantity: -item.count, sold: +item.count}},
            }
        }
    })
   let updated = await  Product.bulkWrite(bulkOption, {new:true})
   console.log('Product quantity -- and sold +++', updated)

   console.log('New order saved', newOrder)
    res.json({ok:true});

};

/**
 * GET /api/user/orders (logged-in user)
 * Returns every order the user has, with `products.product` populated.
 * No `try/catch`. The trailing `console.log` on the response path
 * is harmless but should be removed when you next touch this file.
 */
exports.orders = async(req,res) =>{
    let user = await User.findOne({email:req.user.email}).exec()
    let userOrders = await Order.find({orderedBy:user._id}).populate('products.product').exec();
    res.json(userOrders)
    console.log("_______>>", userOrders)
}

// wishlist 
/**
 * POST /api/user/wishlist (logged-in user)
 * Body: `{ productId }`. `$addToSet` keeps the wishlist unique.
 * Always responds `{ ok: true }` regardless of whether the product
 * was already on the list — by design.
 */
exports.addToWishList = async(req,res) =>{
     const{productId} = req.body
     const user = await User.findOneAndUpdate(
        {email:req.user.email}, 
        {$addToSet:{wishlist: productId}},
        {new:true}
        ).exec();
    res.json({ok: true})
}
/**
 * GET /api/user/wishlist (logged-in user)
 * Returns the user's wishlist with product docs populated. The
 * `.select('wishlist')` projection keeps the payload small.
 * Returns the full Mongoose doc (with the `wishlist` array) — strip
 * any extra fields client-side.
 */
exports.wishlist = async(req,res) =>{
    const list = await User.findOne({email:req.user.email})
    .select("wishlist")
    .populate("wishlist")
    .exec();

 res.json(list);
}
/**
 * PUT /api/user/wishlist/:productId (logged-in user)
 * `$pull` removes the entry. URL param is the productId, not the
 * wishlist subdocument id. No `try/catch`.
 */
exports.removeFromWishList = async(req,res) =>{
    const {productId} = req.params;
    const user = await User.findOneAndUpdate({email:req.user.email},
        {$pull:{wishlist:productId}})
        .exec();
    res.json({ok : true})

}