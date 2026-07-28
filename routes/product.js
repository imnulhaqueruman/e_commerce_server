const express = require('express')

const router = express.Router();

// middleWares

const {authCheck,adminCheck} = require('../middlewares/auth')
const {requireAuth,requireAdmin} = require('../middlewares/jwt')

// controller
const {create,listAll,remove,read,update,list,productsCount,productStar,listRelated,searchFilters} = require('../controllers/product');



//routes
router.post('/product',requireAuth,requireAdmin,create);
router.get('/products/total', productsCount)
router.get('/products/:count',listAll); //products/100
router.delete('/product/:slug', requireAuth,requireAdmin,remove);
router.get('/product/:slug', read);
router.put('/product/:slug',requireAuth,requireAdmin,update)

router.post('/products', list)

// rating
router.put('/product/star/:productId',requireAuth,productStar)

// related 
router.get('/product/related/:productId', listRelated);
// search 
router.post('/search/filters', searchFilters)

module.exports = router