const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema

const cartSchema = new mongoose.Schema({
    products:[
        {
            product:{
                type:ObjectId,
                ref:'Product'
            },
            count:Number ,
            color:String,
            price:Number,
        }
       
    ],
    cartTotal:Number,
    totalAfterDiscount:Number,
    // Snapshot of the coupon that was applied to this cart. Persisted so the
    // discount survives a cart re-save (POST /api/user/cart replaces the
    // whole document) and so the client can render the applied code.
    couponApplied:{
        name:String,
        discount:Number,
        expiry:Date,
    },
    orderedBy:{type:ObjectId, ref:"User"},

},{timestamps:true});

module.exports = mongoose.model('Cart',cartSchema)