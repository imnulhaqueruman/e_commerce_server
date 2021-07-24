const express = require('express')

const router = express.Router();

// middleWares

const {authCheck,adminCheck} = require('../middlewares/auth')

// controller
const {upload,remove} = require('../controllers/cloudinary');



//routes
router.post('/uploadimages',authCheck,adminCheck,upload);
router.post('/removeimages',authCheck,adminCheck,remove);

module.exports = router;