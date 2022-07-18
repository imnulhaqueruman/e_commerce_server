const Order = require('../models/order')

exports.orders = async(req,res) =>{
    try{
        let AllOrders  = await Order.find({})
        //console.log(AllOrders)
        .sort('-createdAt')
        .populate('products.product')
        .exec()
        res.send(AllOrders)
    } catch(err){
        res.status(400).send('Orders failed')
    }
   
};

exports.orderStatus = async(req,res) =>{
    try{
        const{orderId,orderStatus} = req.body;
        let updated = await Order.findByIdAndUpdate(orderId,{orderStatus},{new:true}).exec();
        //console.log(updated)
        res.json(updated)
    } catch(err){
          res.status(400).send('Order Status Failed')
    }
   

}