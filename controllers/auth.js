const User = require('../models/user')

exports.createOrUpdateUser = async(req,res) =>{
    const {name, email,picture} = req.user
    const user = await User.findOneAndUpdate({email},
        {name:email.split("@")[0], picture},
        {new:true},

        );
    if(user){
        console.log('User Updated', user)
        res.json(user);
    }else{
        const newUser = await new User({
            email,
            name:email.split("@")[0],
            picture
        }).save();
        console.log('User Created', newUser)
        res.json(newUser)
    }
}
exports.currentUser = async(req,res) =>{
    User.findOne({email:req.user.email})
    .exec((err,user)=> {
        if(err) throw new Error(err)
        res.json(user);
    })
}