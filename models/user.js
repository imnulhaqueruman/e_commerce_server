const mongoose = require('mongoose')

const{ObjectId} = mongoose.Schema;

const userSchema = new mongoose.Schema
    {
        name:String,
        email: {
            type:String,
            required: true,
            index: true,
        },
        password: {
            type: String,
            // Never included in a query result by default. `login` uses
            // `.select('+password')` to opt back in for comparison, and
            // `controllers/auth.js#sanitizeUser` strips it from responses.
            select: false,
        role:{
            type:String,
            default:'subscribe',
        },
        cart:{
            type:Array,
            default:[],
        },
        address:String,
        wishlist:[{type:ObjectId, ref:'Product'}],
    },
    {timestamps:true}
);

module.exports = mongoose.model('User', userSchema);