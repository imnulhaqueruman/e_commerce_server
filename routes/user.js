const express = require('express')

const router = express.Router()
// middlewares
const {authCheck} = require('../middlewares/auth')
const {requireAuth} = require('../middlewares/jwt')

// controllers

const {userCart,getUserCart,emptyCart,saveAddress, applyCouponToUserCart,createOrder,orders,addToWishList,wishlist,removeFromWishList} = require("../controllers/user")

router.post('/user/cart', requireAuth, userCart); // save Cart
router.get('/user/cart', requireAuth, getUserCart)  // get cart
router.delete('/user/cart', requireAuth, emptyCart); // empty cart
router.post('/user/address', requireAuth, saveAddress)

router.post('/user/order', requireAuth, createOrder);
router.get('/user/orders', requireAuth, orders)
// coupon
router.post('/user/cart/coupon', requireAuth, applyCouponToUserCart)
// wishlist
router.post('/user/wishlist', requireAuth, addToWishList)
router.get('/user/wishlist', requireAuth, wishlist)
router.put('/user/wishlist/:productId', requireAuth, removeFromWishList)


module.exports = router