const admin = require('../firebase/index')
const User = require('../models/user');
exports.authCheck = async(req,res,next) =>{
    //console.log(req.headers);//token
    try{
          const firebaseUser = await admin
          .auth()
          .verifyIdToken(req.headers.authtoken);
          //console.log('Firebase User in authCheck',firebaseUser)
          req.user=firebaseUser;
          next();
    }
    catch(err){
        res.status(401).json({
            err:'Invalid or expired token'
        })
    }
};

exports.adminCheck = async(req,res,next) =>{
    const{email} = req.user;
    console.log(req.user)
    try {
        const adminUser = await User.findOne({email}).exec()
        if(!adminUser || adminUser.role !== 'admin'){
            return res.status(403).json({
                err:'Admin resource. Access denied'
            })
        }
        next();
    } catch (err) {
        console.log(err);
        res.status(500).json({err: 'Failed to verify admin'});
    }
}