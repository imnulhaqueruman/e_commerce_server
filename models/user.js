const mongoose = require('mongoose')

const{ObjectId} = mongoose.Schema;

const userSchema = new mongoose.Schema(
    {
        name:String,
        email: {
            type:String,
            required: true,
            index: true,
        },
        password: {
            type: String,
            // The credential is kept exactly as the client sent it so that
            // `login` can match it with a straight equality check.
        },
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