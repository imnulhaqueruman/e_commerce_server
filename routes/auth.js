const express = require('express')

const router = express.Router();

// middleWares

const {authCheck} = require('../middlewares/auth')

// controller
const {createOrUpdateUser,currentUser} = require('../controllers/auth')



router.post('/create-or-update-user', authCheck, createOrUpdateUser)
router.post('/current-user', authCheck, currentUser)


module.exports = router