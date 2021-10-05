const express = require('express')

const router = express.Router()
// middlewares
const {authCheck} = require('../middlewares/auth')

// controllers

const {userCart,getUserCart,emptyCart} = require("../controllers/user")

router.post('/user/cart', authCheck,userCart); // save Cart
router.get('/user/cart', authCheck,getUserCart)  // get cart
router.put('/user/cart', authCheck,emptyCart); // empty cart

// router.get('/user', (req,res) =>{
//     res.json({
//        data:'hey you hate user api'
//     })
// });


module.exports = router