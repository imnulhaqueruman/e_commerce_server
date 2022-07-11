const Order = require('../models/order')

exports.orders = async(req,res) =>{
    let AllOrders  = await Order.find({})
    .sort('createdAt')
    .populate('products.product')
    .exec()
    res.send(AllOrders)
};

exports.orderStatus = async(req,res) =>{
    const{orderId,orderStatus} = req.body;
    let updated = await Order.findByIdAndUpdate(orderId,{orderStatus},{new:true}).exec();
    res.json(updated)

}