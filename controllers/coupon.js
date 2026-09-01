/**
 * Coupon CRUD. Coupons are addressed by their uppercase `name` (e.g.
 * `SUMMER25`), which is the string the client sends at
 * `POST /api/user/cart/coupon` to apply a discount.
 *
 * The `discount` is a percentage (0–100), not an absolute amount — see
 * `controllers/user.js#applyCouponToUserCart` for the math.
 *
 * `routes/coupon.js` mounts mutating endpoints behind
 * `requireAuth, requireAdmin`; the read endpoint (`list`) is public so
 * the checkout page can show "available coupons" without auth.
 */
const Coupon = require('../models/coupon')

// The three handlers below were the original "swallow errors" bug
// surface: the catch blocks used to be empty, which made Jest hang on
// the malformed-payload test (see tests/routes/coupon.test.js). They now
// always respond with 500 on failure so the client never waits forever.

// create list remove

/**
 * POST /api/coupon (admin)
 * Body: `{ coupon: { name, expiry, discount } }` — the inner `coupon`
 * object is required; the wrapper shape is intentional so we can later
 * accept metadata like `{ coupon: { name, … }, notes: '' }` without a
 * breaking change.
 *
 * Returns the saved coupon doc. `name` is uppercased by the schema
 * (`models/coupon.js`).
 */
exports.create = async(req,res) =>{
 try{
     //console.log(req.body)
     //return;
    const {name, expiry, discount} = req.body.coupon;
    res.json(await new Coupon({name, expiry, discount}).save());
 } catch (err) {
    console.log(err)
    return res.status(500).json({ err: 'Failed to create coupon' })
}
}

/**
 * DELETE /api/coupon/:couponId (admin)
 * Returns the deleted doc, or `null` if no matching id exists — note that
 * `findByIdAndDelete` does not throw on missing id, it just resolves
 * to null. Consider upgrading to 404 if you ever see callers confused by
 * the null response.
 */
exports.remove = async(req,res) =>{
   try{
     res.json(await Coupon.findByIdAndDelete(req.params.couponId).exec());
   } catch(err){
      console.log(err)
      return res.status(500).json({ err: 'Failed to remove coupon' })
  }
}

/**
 * GET /api/coupons — public.
 * Returns every coupon, newest first. No filtering by `expiry` — the
 * client decides whether to display expired ones. If coupon volume ever
 * grows, add a `?active=true` query param that filters
 * `expiry: { $gte: new Date() }`.
 */
exports.list = async(req,res) =>{
 try{
    res.json(await Coupon.find({}).sort({createdAt:-1}).exec())
}catch (err) {
    console.log(err)
    res.status(500).json({err: 'Failed to list coupons'})
}
}