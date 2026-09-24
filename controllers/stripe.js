/**
 * ⚠️  LEGACY — STRIPE. This file will be replaced by
 * `controllers/payment.js` (bKash tokenized PGW) as part of the pending
 * payment-provider swap. Keep the route mounting working until the
 * replacement lands, but add NEW payment integration to
 * `controllers/payment.js` instead of here.
 *
 * The route mounted at `POST /api/create-payment-intent` is the only
 * Stripe-facing endpoint. The `refundOrder` admin flow lives in
 * `controllers/admin.js` and also references Stripe — that one will
 * need a `payment.refund()` call in the bKash controller.
 *
 * Env var: `Stripe_Secret` (note the capital-S casing — that exact
 * string is referenced by the deploy templates and CI workflow).
 */
const User = require('../models/user')
const Cart = require('../models/cart')
const Product = require ('../models/product')
const Coupon = require ('../models/coupon')
// Stripe SDK instance bound to the secret env var at module-load time.
// If `Stripe_Secret` is missing, the constructor will throw at
// require-time, which crashes the server — keep the CI deploy templates
// in lockstep with this name.
const stripe = require('stripe')(process.env.Stripe_Secret)

/**
 * POST /api/create-payment-intent (logged-in user via `requireAuth`)
 * Body: `{ couponApplied: boolean }` — the client tells us whether a
 * coupon was already applied via `POST /api/user/cart/coupon`, which
 * sets `Cart.totalAfterDiscount`. We read either `totalAfterDiscount`
 * or fall back to the raw `cartTotal`.
 *
 * Stripe amounts are in the **smallest currency unit** (cents for USD),
 * so we multiply dollars by 100 here. `parseInt` is used rather than
 * `Math.round` — fractional cents get truncated, which can shave up to
 * 0.99¢ off a payment. Acceptable for demo data; switch to
 * `Math.round(... * 100)` before any real-money go-live.
 *
 * Returns `{ clientSecret, cartTotal, totalAfterDiscount, payable }`
 * — `clientSecret` is what the Stripe.js client SDK consumes to
 * complete payment. The bKash replacement will return a
 * `bkashPaymentID` (or a redirect URL) here instead.
 *
 * NOTE — the catch block logs but does not respond. Mongoose 5 quirks
 * aside, every other controller returns 500 on error so clients don't
 * time out. Fix that as part of the bKash rewrite.
 */
exports.createPaymentIntent = async(req,res) =>{
    try{
        const {couponApplied} = req.body
        // later apply coupon 
        // later calculate price 
        // 1 find user 
          const user = await User.findOne({email:req.user.email}).exec()
          // get user cart total
          const {cartTotal,totalAfterDiscount} = await Cart.findOne({orderedBy: user._id}).exec()
          console.log('Cart total', cartTotal,'after discount',totalAfterDiscount)
    
          let finalAmount = 0
          if(couponApplied && totalAfterDiscount){
              finalAmount = parseInt(totalAfterDiscount *100)
          }else{
              finalAmount = (cartTotal * 100)
          }
          // create paymentIntent with order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount:finalAmount,
            currency:'usd',
        });
    
        res.send({
            clientSecret:paymentIntent.client_secret,
            cartTotal,
            totalAfterDiscount,
            payable:finalAmount,
        })
    } catch(err){
      console.log(err)
    }
    
}