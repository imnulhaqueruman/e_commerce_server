const express = require('express')

const router = express.Router();

// middleWares

const {authCheck,adminCheck} = require('../middlewares/auth')
const {requireAuth,requireAdmin} = require('../middlewares/jwt')

// controller
const {create,read,update,remove,list,getSubs} = require('../controllers/category')



//routes
router.post('/category',requireAuth,requireAdmin,create);
router.get('/categories',list);
router.get('/category/:slug',read);
router.put('/category/:slug',requireAuth,requireAdmin,update);
router.delete('/category/:slug',requireAuth,requireAdmin,remove);
router.get('/category/subs/:_id', getSubs)


module.exports = router