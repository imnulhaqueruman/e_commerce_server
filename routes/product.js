const express = require('express')

const router = express.Router();

// middleWares

const {authCheck,adminCheck} = require('../middlewares/auth')

// controller
const {create,listAll} = require('../controllers/product');



//routes
router.post('/product',authCheck,adminCheck,create);
router.get('/products/:count',listAll); //products/100


module.exports = router