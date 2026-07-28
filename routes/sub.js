const express = require('express')

const router = express.Router();

// middleWares

const {authCheck,adminCheck} = require('../middlewares/auth')
const {requireAuth,requireAdmin} = require('../middlewares/jwt')

// controller
const {create, remove, list, read, update} = require('../controllers/sub')



//routes
router.post('/sub',requireAuth,requireAdmin,create);
router.get('/subs',list);
router.get('/sub/:slug',read);
router.put('/sub/:slug',requireAuth,requireAdmin,update);
router.delete('/sub/:slug',requireAuth,requireAdmin,remove);


module.exports = router