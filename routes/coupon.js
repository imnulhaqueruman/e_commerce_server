const express = require('express')

const router = express.Router();

// middleWares

const {authCheck,adminCheck} = require('../middlewares/auth')
const {requireAuth,requireAdmin} = require('../middlewares/jwt')

// controller
const {create,remove,list} = require('../controllers/coupon')



//routes
router.post('/coupon',requireAuth,requireAdmin,create);
router.get('/coupons',list);
router.delete('/coupon/:couponId',requireAuth,requireAdmin,remove);


module.exports = router