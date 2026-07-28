const express = require('express')
const router= express.Router()

const {createPaymentIntent} = require('../controllers/stripe')

// middleware

const {authCheck} = require('../middlewares/auth')
const {requireAuth} = require('../middlewares/jwt')

router.post('/create-payment-intent',requireAuth,createPaymentIntent);

module.exports = router;

