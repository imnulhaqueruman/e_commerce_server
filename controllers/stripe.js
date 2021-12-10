const User = require('../models/user')
const Cart = require('../models/cart')
const Product = require ('../models/product')
const Coupon = require ('../models/coupon')
const stripe = require('stripe')(process.env.Stripe_Secret)

exports.createPaymentIntent = async(req,res) =>{
    // later apply coupon 
    // later calculate price 

    const paymentIntent = await stripe.paymentIntent.create({
        amount:100,
        currency:'usd',
    });

    res.send({
        clientSecret:paymentIntent.client_secret,
    })
}