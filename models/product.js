const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema;

const ProductSchema = new mongoose.Schema({
    title:{
        type:String,
        trim:true,
        required:true,
        maxlength:32,
        text:true,
    },
    slug:{
        type:String,
        unique:true,
        // `lowercase: 32` was invalid -- the option takes a boolean, so the
        // value was truthy but the intended maxlength was silently dropped.
        lowercase:true,
        maxlength:64,
        index:true,
    },
    description:{
        type: String,
        required:true,
        maxlength:2000,
        text:true
    },
    price:{
        // A Number, not a String. Storing prices as strings made range
        // filters and sorts lexicographic ("5" sorted after "100.00").
        // Run `node scripts/migrate-price-to-number.js` after upgrading an
        // existing database.
        type: Number,
        required:true,
        trim:true,
        min:0,
    },
    category:{
        type:ObjectId,
        ref:"Category",
    },
    subs:[{
        type: ObjectId, 
        ref:"Sub",
     },
   ],
   quantity:Number,
   sold:{
       type:Number,
       default:0
   },
   images:{
       type: Array,
   },
   shipping:{
       type:String,
       enum:["Yes","No"],

   },
   color:{
       type: String,
       enum:["Black","Brown","Silver","White","Blue"],
   },
   brand:{
    type: String,
    enum:["Apple","Samsung","Microsoft","Lenovo","ASUS"],
  },
  ratings:[
      {
          star: Number,
          postedBy :{type: ObjectId, ref:"User"}
      },
  ],

},
{timestamps:true},
)
module.exports = mongoose.model('Product',ProductSchema)