const express = require('express')

const router = express.Router()
// middlewares
const {authCheck} = require('../middlewares/auth')

// controllers

const {userCart,getUserCart,emptyCart,saveAddress} = require("../controllers/user")

router.post('/user/cart', authCheck,userCart); // save Cart
router.get('/user/cart', authCheck,getUserCart)  // get cart
router.delete('/user/cart', authCheck,emptyCart); // empty cart
router.post('/user/address', authCheck,saveAddress)
// router.get('/user', (req,res) =>{
//     res.json({
//        data:'hey you hate user api'
//     })
// });


module.exports = router